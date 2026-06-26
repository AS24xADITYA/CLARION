/**
 * SkeletonCard — Animated loading skeleton placeholder.
 * Used in place of loading spinners for a more polished UX.
 *
 * Props:
 *   lines: number     — number of text skeleton lines (default 3)
 *   showHeader: bool  — show a wide header line (default true)
 *   height: string    — Tailwind height class for lines (default "h-4")
 *   className: string — additional wrapper classes
 */
export default function SkeletonCard({ lines = 3, showHeader = true, height = 'h-4', className = '' }) {
  return (
    <div className={`glass-card p-6 animate-pulse space-y-3 ${className}`}>
      {showHeader && (
        <div className={`${height === 'h-4' ? 'h-5' : height} w-2/5 bg-clarion-border rounded-lg`} />
      )}
      <div className="space-y-2 pt-1">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${height} bg-clarion-border rounded-lg`}
            style={{ width: `${100 - i * 12}%` }}
          />
        ))}
      </div>
    </div>
  )
}
