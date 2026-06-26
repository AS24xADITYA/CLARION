import { useState } from 'react'
import { Link2, AlertTriangle, CheckCircle, AlertOctagon, ExternalLink, Phone, X, Clock } from 'lucide-react'
import SkeletonCard from '../components/SkeletonCard'
import { downloadReport } from '../services/reportExport'

const API = 'http://localhost:8000'

const VERDICT_CONFIG = {
  DANGEROUS: {
    label: 'DANGEROUS LINK',
    icon: AlertOctagon,
    cardClass: 'border-clarion-danger bg-clarion-danger/5',
    badgeClass: 'bg-clarion-danger/20 text-clarion-danger border border-clarion-danger/30',
    textColor: 'text-clarion-danger',
  },
  SUSPICIOUS: {
    label: 'SUSPICIOUS LINK',
    icon: AlertTriangle,
    cardClass: 'border-clarion-warning bg-clarion-warning/5',
    badgeClass: 'bg-clarion-warning/20 text-clarion-warning border border-clarion-warning/30',
    textColor: 'text-clarion-warning',
  },
  LIKELY_SAFE: {
    label: 'LIKELY SAFE',
    icon: CheckCircle,
    cardClass: 'border-clarion-success bg-clarion-success/5',
    badgeClass: 'bg-clarion-success/20 text-clarion-success border border-clarion-success/30',
    textColor: 'text-clarion-success',
  },
}

function CheckRow({ label, passed }) {
  return (
    <div className="flex items-start gap-2 text-sm py-1">
      {passed
        ? <CheckCircle className="w-4 h-4 text-clarion-success flex-shrink-0 mt-0.5" />
        : <X className="w-4 h-4 text-clarion-danger flex-shrink-0 mt-0.5" />
      }
      <span className={passed ? 'text-clarion-success' : 'text-clarion-danger'}>{label}</span>
    </div>
  )
}

function ResultCard({ result, onDownload }) {
  const config = VERDICT_CONFIG[result.verdict] || VERDICT_CONFIG.SUSPICIOUS
  const Icon = config.icon
  const { checks } = result

  return (
    <div className={`glass-card p-6 border-2 ${config.cardClass} space-y-5 animate-fade-in`}>
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${config.badgeClass}`}>
          <Icon className={`w-7 h-7 ${config.textColor}`} />
        </div>
        <div className="flex-1">
          <p className={`text-xl font-outfit font-black ${config.textColor}`}>{config.label}</p>
          <p className="text-xs text-clarion-muted font-mono mt-1 break-all">{result.url}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${config.badgeClass} flex-shrink-0`}>
          {Math.round((result.confidence || 0) * 100)}% confidence
        </div>
      </div>

      {/* Recommended Action */}
      <p className="text-sm text-clarion-muted leading-relaxed border-l-4 border-clarion-border pl-4">
        {result.recommended_action}
      </p>

      {/* Checks list */}
      <div className="p-4 bg-clarion-surface2 rounded-xl border border-clarion-border space-y-1">
        <p className="text-xs font-bold text-clarion-muted uppercase tracking-wider mb-3">Analysis Checks</p>
        <CheckRow label="Uses secure HTTPS connection" passed={checks.is_https} />
        <CheckRow label="Verified government domain" passed={checks.is_known_government_domain} />
        {checks.suspicious_pattern_matched
          ? <CheckRow label={`Domain mimics a government URL — ${checks.suspicious_pattern_matched}`} passed={false} />
          : <CheckRow label="No suspicious domain patterns detected" passed={true} />
        }
        {checks.red_flag_keywords_found?.length > 0
          ? <CheckRow label={`Contains high-risk keywords: ${checks.red_flag_keywords_found.join(', ')}`} passed={false} />
          : <CheckRow label="No high-risk keywords in URL" passed={true} />
        }
        <div className="pt-2 text-xs text-clarion-muted">
          Registered domain: <span className="font-mono text-clarion-text">{checks.registered_domain}</span>
        </div>
      </div>

      {/* LLM Analysis */}
      {result.llm_analysis && (
        <div className="p-4 bg-clarion-surface2 rounded-xl border border-clarion-border">
          <p className="text-xs font-bold text-clarion-muted uppercase tracking-wider mb-2">AI Analysis</p>
          <p className="text-sm text-clarion-text italic leading-relaxed">
            "{result.llm_analysis.reason}"
          </p>
          {result.llm_analysis.impersonating && (
            <p className="text-xs text-clarion-warning mt-2">
              Impersonating: <span className="font-semibold">{result.llm_analysis.impersonating}</span>
            </p>
          )}
          <p className="text-xs text-clarion-muted mt-2">— CLARION AI Engine</p>
        </div>
      )}

      {/* Action Buttons */}
      {result.verdict !== 'LIKELY_SAFE' && (
        <div className="flex flex-wrap gap-3">
          <a
            href={result.report_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-danger flex items-center gap-2 min-h-[44px]"
          >
            <ExternalLink className="w-4 h-4" />
            Report on cybercrime.gov.in
          </a>
          <a href="tel:1930" className="btn-ghost flex items-center gap-2 min-h-[44px]">
            <Phone className="w-4 h-4" />
            Call 1930
          </a>
        </div>
      )}

      <button
        onClick={onDownload}
        className="btn-ghost text-sm w-full min-h-[44px] border border-clarion-border"
      >
        Download Link Analysis Report
      </button>
    </div>
  )
}

export default function URLScanner() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])

  const handleCheck = async () => {
    const trimmed = url.trim()
    if (!trimmed) { setError('Please paste a URL to check.'); return }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setError('Please include the full URL starting with https://')
      return
    }

    setError(null)
    setResult(null)
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/urlscanner/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Analysis failed')
      setResult(data)
      setHistory(prev => [{
        url: trimmed,
        verdict: data.verdict,
        timestamp: new Date(),
      }, ...prev].slice(0, 5))
    } catch (e) {
      setError(e.message || 'Analysis failed. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    downloadReport({
      report_type: 'url_analysis',
      url_analysed: result.url,
      verdict: result.verdict,
      confidence: result.confidence,
      checks: result.checks,
      llm_analysis: result.llm_analysis,
      recommended_action: result.recommended_action,
      analysis_id: crypto.randomUUID(),
    }, 'CLARION_URLScanner_Report')
  }

  const verdictBadge = (v) => {
    if (v === 'DANGEROUS') return 'bg-clarion-danger/20 text-clarion-danger border border-clarion-danger/30'
    if (v === 'SUSPICIOUS') return 'bg-clarion-warning/20 text-clarion-warning border border-clarion-warning/30'
    return 'bg-clarion-success/20 text-clarion-success border border-clarion-success/30'
  }

  return (
    <div className="min-h-screen pb-20 px-4 py-8 bg-clarion-bg transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-clarion-surface2 border border-clarion-border rounded-xl flex items-center justify-center shadow-sm">
              <Link2 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-outfit font-bold text-clarion-text tracking-tight">Link Scanner</h1>
              <p className="text-clarion-muted text-sm font-medium mt-0.5">URL & Phishing Link Analyser</p>
            </div>
          </div>
          <p className="text-clarion-muted text-sm max-w-xl leading-relaxed">
            Check if a link is safe before opening it. Scammers often send fake government portal links
            to steal personal information. Paste any URL below for an instant risk assessment.
          </p>
        </div>

        {/* Input Section */}
        <div className="glass-card p-6 space-y-4">
          <label className="block text-sm font-semibold text-clarion-text">Suspicious Link</label>
          <div className="flex gap-3 flex-wrap sm:flex-nowrap">
            <input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(null) }}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleCheck()}
              placeholder="Paste the suspicious link here (e.g. https://...)"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-clarion-surface2 border border-clarion-border text-clarion-text placeholder:text-clarion-muted/50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all text-sm min-w-0 min-h-[44px] disabled:opacity-60"
            />
            <button
              onClick={handleCheck}
              disabled={loading || !url.trim()}
              className="min-h-[44px] px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800/50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center gap-2 flex-shrink-0"
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Analysing...</>
                : <><Link2 className="w-4 h-4" />Check This Link</>
              }
            </button>
          </div>
          <p className="text-xs text-clarion-muted">We analyse the link structure only. We do not visit or open the URL.</p>

          {error && (
            <div className="flex items-center gap-2 text-clarion-danger text-sm p-3 bg-clarion-danger/10 border border-clarion-danger/30 rounded-xl">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && <SkeletonCard lines={5} />}

        {/* Result */}
        {!loading && result && (
          <ResultCard result={result} onDownload={handleDownload} />
        )}

        {/* History */}
        {history.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-clarion-muted uppercase tracking-wider">Recent Checks</p>
              <button
                onClick={() => setHistory([])}
                className="text-xs text-clarion-muted hover:text-clarion-danger transition-colors"
              >
                Clear History
              </button>
            </div>
            <div className="glass-card divide-y divide-clarion-border">
              {history.map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <span className="font-mono text-xs text-clarion-muted flex-1 truncate max-w-[200px]" title={item.url}>
                    {item.url.length > 40 ? item.url.slice(0, 40) + '…' : item.url}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${verdictBadge(item.verdict)}`}>
                    {item.verdict}
                  </span>
                  <span className="text-xs text-clarion-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
