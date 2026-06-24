import { AlertTriangle, Package, Phone, Landmark, Wifi, CreditCard, Pill, Truck } from 'lucide-react'

const PATTERN_ICONS = {
  fake_cbi:         { icon: Landmark,     color: 'text-red-400',    bg: 'bg-red-900/20',    border: 'border-red-800/30' },
  fake_ed:          { icon: CreditCard,   color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-800/30' },
  customs_parcel:   { icon: Package,      color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-800/30' },
  court_summons:    { icon: Landmark,     color: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-800/30' },
  trai_suspension:  { icon: Wifi,         color: 'text-blue-400',   bg: 'bg-blue-900/20',   border: 'border-blue-800/30' },
  rbi_freeze:       { icon: CreditCard,   color: 'text-green-400',  bg: 'bg-green-900/20',  border: 'border-green-800/30' },
  narcotics_bureau: { icon: Pill,         color: 'text-pink-400',   bg: 'bg-pink-900/20',   border: 'border-pink-800/30' },
  courier_scam:     { icon: Truck,        color: 'text-indigo-400', bg: 'bg-indigo-900/20', border: 'border-indigo-800/30' },
}

const SEVERITY_COLORS = {
  CRITICAL: 'bg-red-900/50 text-red-300 border-red-700/40',
  HIGH:     'bg-orange-900/50 text-orange-300 border-orange-700/40',
  MEDIUM:   'bg-yellow-900/50 text-yellow-300 border-yellow-700/40',
}

/**
 * ScamPatternBadge — Sidebar badge showing a scam type with icon and severity.
 * Props:
 *   pattern: { pattern_id, name, description, trigger_keywords[], severity }
 *   isActive: bool — highlighted when this matches the current classification
 */
export default function ScamPatternBadge({ pattern, isActive = false }) {
  const meta = PATTERN_ICONS[pattern.class_label || ''] || {
    icon: AlertTriangle,
    color: 'text-clarion-muted',
    bg: 'bg-clarion-surface2',
    border: 'border-clarion-border',
  }
  const Icon = meta.icon

  return (
    <div className={`p-3 rounded-xl border transition-all duration-200
      ${isActive
        ? 'border-clarion-accent/50 bg-clarion-accent/10 shadow-accent'
        : `${meta.border} ${meta.bg} hover:border-clarion-border/60`
      }`}>
      <div className="flex items-start gap-2.5">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
          ${isActive ? 'bg-clarion-accent/20' : meta.bg}`}>
          <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-clarion-accent' : meta.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-clarion-text leading-tight truncate">
            {pattern.name}
          </p>
          <p className="text-[10px] text-clarion-muted mt-0.5 line-clamp-2 leading-relaxed">
            {pattern.description}
          </p>

          {/* Severity badge */}
          {pattern.severity && (
            <span className={`inline-block mt-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold
                              uppercase tracking-wider border
                              ${SEVERITY_COLORS[pattern.severity] || SEVERITY_COLORS.HIGH}`}>
              {pattern.severity}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
