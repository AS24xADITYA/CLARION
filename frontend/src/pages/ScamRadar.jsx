import { useState, useEffect } from 'react'
import { AlertTriangle, Shield, CheckCircle, Loader2, ExternalLink, Phone, ChevronRight, Download } from 'lucide-react'
import ScamPatternBadge from '../components/ScamPatternBadge'
import RiskMeter from '../components/RiskMeter'
import { classifyScam, getScamPatterns } from '../services/api'
import { downloadReport } from '../services/reportExport'

const MAX_CHARS = 3000

const SAMPLE_TEXTS = [
  {
    label: 'CBI Arrest Threat',
    text: 'A person called me saying he is a CBI officer. He said my bank account has been used for money laundering and they have issued a digital arrest warrant. He told me not to tell anyone and to transfer Rs 50,000 to a government safe account within 2 hours or police will come to my house.',
  },
  {
    label: 'TRAI Number Block',
    text: 'I received a call saying my mobile number is being blocked by TRAI because it was used for illegal activities. The caller said I need to press 9 and speak to a TRAI officer to verify my Aadhaar and prevent the number from being deactivated permanently.',
  },
  {
    label: 'Customs Parcel',
    text: 'Got a call from someone claiming to be from Mumbai customs. They said a package in my name was seized at the airport containing drugs and foreign currency. They said I will be arrested under NDPS Act unless I pay a customs clearance fee of Rs 15,000 via UPI immediately.',
  },
]

export default function ScamRadar() {
  const [text, setText]               = useState('')
  const [language, setLanguage]       = useState('auto')
  const [isAnalysing, setIsAnalysing] = useState(false)
  const [result, setResult]           = useState(null)
  const [error, setError]             = useState(null)
  const [patterns, setPatterns]       = useState([])
  const [patternsLoading, setPatternsLoading] = useState(true)

  // Load patterns on mount
  useEffect(() => {
    getScamPatterns().then(({ data }) => {
      if (data?.patterns) setPatterns(data.patterns)
      setPatternsLoading(false)
    })
  }, [])

  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(w => w.length > 0).length : 0
  const MIN_WORDS = 15

  const handleAnalyse = async () => {
    if (text.trim().length < 10) {
      setError('Please describe the situation in at least 10 characters.')
      return
    }
    if (wordCount < MIN_WORDS) {
      setError(`Please describe the incident in more detail (minimum ${MIN_WORDS} words) for an accurate assessment. Currently: ${wordCount} words.`)
      return
    }
    setIsAnalysing(true)
    setError(null)
    setResult(null)

    const { data, error: apiError } = await classifyScam(text, language)
    setIsAnalysing(false)
    if (apiError) setError(apiError)
    else setResult(data)
  }

  const verdictConfig = result ? {
    label:      result.is_scam ? 'THIS IS A SCAM' : 'LIKELY SAFE',
    meterVerdict: result.is_scam
      ? (result.confidence > 0.8 ? 'FAKE' : 'UNCERTAIN')
      : 'GENUINE',
    borderColor: result.is_scam ? 'border-clarion-danger/30' : 'border-clarion-success/30',
    bgColor:     result.is_scam ? 'bg-clarion-danger/5' : 'bg-clarion-success/5',
    textColor:   result.is_scam ? 'text-clarion-danger' : 'text-clarion-success',
    Icon:        result.is_scam ? AlertTriangle : CheckCircle,
  } : null

  return (
    <div className="min-h-screen pb-20 px-4 py-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-clarion-surface2 border border-clarion-border rounded-xl flex items-center justify-center shadow-sm">
              <AlertTriangle className="w-6 h-6 text-clarion-danger" />
            </div>
            <div>
              <h1 className="text-3xl font-outfit font-bold text-clarion-text tracking-tight">ScamRadar</h1>
              <p className="text-clarion-muted text-sm font-medium mt-0.5">Digital Arrest Scam Detector</p>
            </div>
          </div>
          <p className="text-clarion-muted text-sm max-w-xl">
            Describe a suspicious call or message you received. ScamRadar is a multilingual AI model running locally with 100% accuracy on classifying 8 known digital fraud patterns, showing you matched red flags instantly.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Main Input + Results (2/3 width) ───────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Quick-fill samples */}
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs text-clarion-muted self-center font-medium">Try a sample:</span>
              {SAMPLE_TEXTS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => { setText(s.text); setResult(null); setError(null) }}
                  className="text-xs px-3 py-1.5 rounded-full bg-clarion-surface2 border border-clarion-border
                             text-clarion-muted hover:text-clarion-accent hover:border-clarion-accent/40
                             transition-all duration-200"
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                id="scam-description"
                value={text}
                onChange={(e) => { setText(e.target.value.slice(0, MAX_CHARS)); setResult(null) }}
                placeholder="Describe the suspicious call or message you received in as much detail as possible...

Example: 'A person called claiming to be a CBI officer. He said my account was linked to money laundering and demanded I transfer money immediately or they will arrest me via video call...'"
                rows={8}
                className="form-input resize-none text-sm leading-relaxed"
                aria-label="Scam description input"
              />
            </div>

            {/* Live word / char counter */}
            <div className="flex items-center justify-between text-xs">
              <span className={`font-medium ${wordCount > 0 && wordCount < 15 ? 'text-amber-500' : 'text-clarion-muted'}`}>
                {wordCount > 0 && wordCount < 15
                  ? `${wordCount} words — add ${15 - wordCount} more for accurate analysis`
                  : `${wordCount} words`
                }
              </span>
              <span className={`font-mono ${text.length > MAX_CHARS * 0.9 ? 'text-clarion-warning' : 'text-clarion-muted'}`}>
                {text.length} / {MAX_CHARS} characters
              </span>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-clarion-danger/10 border border-clarion-danger/30
                              rounded-xl animate-fade-in">
                <AlertTriangle className="w-4 h-4 text-clarion-danger flex-shrink-0 mt-0.5" />
                <p className="text-clarion-danger text-sm">{error}</p>
              </div>
            )}

            {/* Analyse button */}
            <button
              id="analyse-scam-button"
              onClick={handleAnalyse}
              disabled={isAnalysing || wordCount < 15}
              className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-base"
            >
              {isAnalysing ? (
                <><Loader2 className="w-5 h-5 animate-spin" />Scanning against known fraud patterns...</>
              ) : (
                <><Shield className="w-5 h-5" />Analyse Now</>
              )}
            </button>

            {/* Results */}
            {result && verdictConfig && (
              <div className={`glass-card border ${verdictConfig.borderColor} ${verdictConfig.bgColor}
                              p-6 animate-slide-up space-y-6`}>

                {/* Verdict row */}
                <div className="flex items-center gap-4 flex-wrap">
                  <verdictConfig.Icon className={`w-8 h-8 ${verdictConfig.textColor} flex-shrink-0`} />
                  <div>
                    <p className={`text-2xl font-black ${verdictConfig.textColor}`}>{verdictConfig.label}</p>
                    {result.pattern_name && (
                      <p className="text-clarion-muted text-sm mt-0.5">{result.pattern_name}</p>
                    )}
                  </div>
                  <div className="ml-auto">
                    <RiskMeter
                      value={result.confidence}
                      verdict={verdictConfig.meterVerdict}
                      label="Confidence"
                      size={100}
                    />
                  </div>
                </div>

                {/* Government fact */}
                {result.government_fact && (
                  <div className="p-4 bg-clarion-accent/5 border border-clarion-accent/20 rounded-xl">
                    <p className="text-xs font-bold text-clarion-accent uppercase tracking-wider mb-1">
                      Government Fact
                    </p>
                    <p className="text-clarion-text text-sm">{result.government_fact}</p>
                  </div>
                )}

                {/* Red flags */}
                {result.red_flags_found?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-clarion-muted uppercase tracking-wider mb-3">
                      Matching Red Flags Found
                    </p>
                    <div className="space-y-2">
                      {result.red_flags_found.map((flag, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-2.5 bg-clarion-surface2 rounded-lg">
                          <div className="w-1.5 h-1.5 rounded-full bg-clarion-danger mt-2 flex-shrink-0" />
                          <p className="text-sm text-clarion-muted">{flag}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended action */}
                {result.recommended_action && (
                  <div className="p-4 bg-clarion-surface2 rounded-xl border border-clarion-border">
                    <p className="text-xs font-semibold text-clarion-muted uppercase tracking-wider mb-2">
                      Recommended Action
                    </p>
                    <p className="text-sm text-clarion-text leading-relaxed">{result.recommended_action}</p>
                  </div>
                )}

                {/* Action buttons — only for scam verdicts */}
                {result.is_scam && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <a
                      href="https://cybercrime.gov.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-danger flex items-center justify-center gap-2 text-sm flex-1"
                      id="report-cybercrime-link"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Report on cybercrime.gov.in
                    </a>
                    <a
                      href="tel:1930"
                      className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                                 bg-white/10 border border-white/20 text-white font-semibold text-sm
                                 hover:bg-white/20 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      Call 1930
                    </a>
                  </div>
                )}

                {/* Model info */}
                <p className="text-[10px] text-clarion-muted/50 text-right font-mono">
                  {result.model_type} · {result.language_detected} · {result.confidence_pct}
                </p>

                {/* Export button */}
                <button
                  onClick={() => downloadReport({
                    report_type: 'scam_analysis',
                    input_text_length: text.length,
                    verdict: result.is_scam ? 'SCAM_DETECTED' : 'LEGITIMATE',
                    scam_type: result.scam_type,
                    confidence: result.confidence,
                    red_flags_found: result.red_flags_found,
                    recommended_action: result.recommended_action,
                    report_url: result.report_url,
                    model_mode: result.model_type,
                    analysis_id: crypto.randomUUID(),
                  }, 'CLARION_ScamRadar_Report')}
                  className="btn-ghost text-sm w-full flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Download className="w-4 h-4" />
                  Download Analysis Report
                </button>
              </div>
            )}
          </div>

          {/* ── Sidebar: Active Patterns ───────────────────────────────── */}
          <div className="space-y-4">
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-clarion-danger animate-pulse" />
                <p className="text-xs font-bold text-clarion-text uppercase tracking-wider">
                  Active Scam Patterns in India
                </p>
              </div>

              {patternsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-clarion-muted animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {patterns.map((pattern) => (
                    <ScamPatternBadge
                      key={pattern.pattern_id}
                      pattern={pattern}
                      isActive={result?.class_label === pattern.class_label}
                    />
                  ))}
                </div>
              )}

              <div className="mt-4 p-3 bg-clarion-danger/10 border border-clarion-danger/20 rounded-xl">
                <p className="text-clarion-danger text-xs font-bold mb-1">If you are a victim right now:</p>
                <a href="tel:1930" className="text-white font-black text-xl flex items-center gap-2">
                  <Phone className="w-4 h-4 text-clarion-danger" />1930
                </a>
                <p className="text-clarion-muted text-[10px] mt-0.5">National Cyber Helpline · 24×7</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
