import { CheckCircle, XCircle, AlertCircle, ExternalLink, Phone } from 'lucide-react'

/**
 * ResultCard — Animated verdict display for ScanShield.
 * Props:
 *   verdict: 'GENUINE' | 'FAKE' | 'UNCERTAIN'
 *   confidence: number (0–1)
 *   confidencePct: string e.g. '94.2%'
 *   denomination: '500' | '2000'
 *   anomalyRegions: array of { label, description, score, severity }
 *   heatmapImage: base64 string | null
 *   processingMs: number
 *   modelType: string
 */
export default function ResultCard({
  verdict,
  confidence,
  confidencePct,
  denomination,
  anomalyRegions = [],
  heatmapImage,
  processingMs,
  modelType,
}) {
  const config = {
    GENUINE: {
      icon: CheckCircle,
      label: 'GENUINE',
      tagClass: 'verdict-genuine',
      borderColor: 'border-clarion-success/30',
      bgColor: 'bg-clarion-success/5',
      textColor: 'text-clarion-success',
      iconColor: 'text-clarion-success',
      headline: 'This note appears GENUINE',
      subtext: 'Security features match expected patterns for this denomination.',
    },
    FAKE: {
      icon: XCircle,
      label: 'LIKELY FAKE',
      tagClass: 'verdict-fake',
      borderColor: 'border-clarion-danger/30',
      bgColor: 'bg-clarion-danger/5',
      textColor: 'text-clarion-danger',
      iconColor: 'text-clarion-danger',
      headline: 'SUSPECTED COUNTERFEIT DETECTED',
      subtext: 'Anomalies detected in security features. Do NOT accept this note.',
    },
    UNCERTAIN: {
      icon: AlertCircle,
      label: 'UNCERTAIN',
      tagClass: 'verdict-uncertain',
      borderColor: 'border-yellow-600/30',
      bgColor: 'bg-yellow-900/10',
      textColor: 'text-yellow-400',
      iconColor: 'text-yellow-400',
      headline: 'Inconclusive Result',
      subtext: 'Image quality or lighting may be affecting accuracy. Please verify manually.',
    },
  }

  const c = config[verdict] || config.UNCERTAIN
  const Icon = c.icon

  return (
    <div className={`glass-card border ${c.borderColor} ${c.bgColor} p-6 animate-slide-up`}>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <Icon className={`w-8 h-8 ${c.iconColor} flex-shrink-0`} />
          <div>
            <span className={c.tagClass}>{c.label}</span>
            <p className={`text-sm mt-1.5 font-medium ${c.textColor}`}>{c.headline}</p>
          </div>
        </div>
        <div className="text-right text-xs text-clarion-muted space-y-1">
          <p>₹{denomination} Note</p>
          <p>{processingMs}ms</p>
          <p className="capitalize opacity-60">{modelType?.replace('_', ' ')}</p>
        </div>
      </div>

      {/* Confidence meter */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-clarion-muted font-medium">Confidence Score</span>
          <span className={`text-xl font-bold ${c.textColor}`}>{confidencePct}</span>
        </div>
        <div className="h-2 bg-clarion-surface2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out
              ${verdict === 'GENUINE' ? 'bg-clarion-success' :
                verdict === 'FAKE' ? 'bg-clarion-danger' : 'bg-yellow-500'}`}
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
      </div>

      {/* Heatmap */}
      {heatmapImage && (
        <div className="mb-6">
          <p className="text-xs text-clarion-muted font-medium mb-2 uppercase tracking-wider">
            Analysis Heatmap — Anomaly Regions Highlighted
          </p>
          <img
            src={`data:image/png;base64,${heatmapImage}`}
            alt="Currency note analysis heatmap"
            className="w-full rounded-xl border border-clarion-border"
          />
        </div>
      )}

      {/* Anomaly regions */}
      {anomalyRegions.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-clarion-muted font-medium mb-3 uppercase tracking-wider">
            Detected Anomalies
          </p>
          <div className="space-y-2">
            {anomalyRegions.map((region, i) => (
              <div key={i}
                   className="flex items-start gap-3 p-3 bg-clarion-surface2 rounded-xl">
                <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0
                  ${region.severity === 'HIGH' ? 'bg-clarion-danger' :
                    region.severity === 'MEDIUM' ? 'bg-yellow-500' : 'bg-blue-400'}`} />
                <div>
                  <p className="text-sm font-semibold text-clarion-text">{region.label}</p>
                  <p className="text-xs text-clarion-muted mt-0.5">{region.description}</p>
                </div>
                <span className="ml-auto text-xs text-clarion-muted font-mono">
                  {(region.score * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {verdict === 'FAKE' && (
          <div className="p-4 bg-clarion-danger/10 border border-clarion-danger/30 rounded-xl">
            <p className="text-clarion-danger font-semibold text-sm mb-2">
              ⚠️ Do NOT accept this note
            </p>
            <p className="text-clarion-muted text-xs">
              Report to your bank or nearest police station. Possession of counterfeit currency is a criminal offence under Section 489A IPC.
            </p>
          </div>
        )}

        {verdict === 'UNCERTAIN' && (
          <div className="p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-xl">
            <p className="text-yellow-400 font-semibold text-sm">
              Please verify manually at your nearest bank branch.
            </p>
          </div>
        )}

        {verdict === 'GENUINE' && anomalyRegions.length === 0 && (
          <div className="p-4 bg-clarion-success/10 border border-clarion-success/30 rounded-xl">
            <p className="text-clarion-success font-semibold text-sm">
              ✓ All checked security features appear consistent with a genuine note.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
