/**
 * RiskMeter — Animated SVG arc gauge showing confidence percentage.
 * Props:
 *   value: number (0–1)
 *   verdict: 'GENUINE' | 'FAKE' | 'UNCERTAIN' | 'HIGH' | 'MEDIUM' | 'LOW'
 *   label: string (shown below the percentage)
 *   size: number (default 140)
 */
export default function RiskMeter({ value = 0, verdict = 'UNCERTAIN', label = 'Confidence', size = 140 }) {
  const radius    = 52
  const cx        = size / 2
  const cy        = size / 2
  const circumference = 2 * Math.PI * radius
  // Arc is 75% of full circle (270 degrees)
  const arcLength = circumference * 0.75
  const offset    = arcLength * (1 - Math.min(1, Math.max(0, value)))

  const colorMap = {
    GENUINE:  '#16A34A',
    FAKE:     '#DC2626',
    UNCERTAIN:'#D97706',
    HIGH:     '#DC2626',
    MEDIUM:   '#D97706',
    LOW:      '#16A34A',
  }

  const strokeColor = colorMap[verdict] || '#3B82F6'
  const pct = Math.round(value * 100)

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
        aria-label={`Risk meter: ${pct}%`}
        role="img"
      >
        {/* Background track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#1F2937"
          strokeWidth={10}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
        />

        {/* Animated value arc */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={10}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease',
            filter: `drop-shadow(0 0 6px ${strokeColor}80)`,
          }}
        />

        {/* Center text */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={strokeColor}
          fontSize="20"
          fontWeight="700"
          fontFamily="Inter, sans-serif"
        >
          {pct}%
        </text>
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#9CA3AF"
          fontSize="9"
          fontWeight="500"
          fontFamily="Inter, sans-serif"
          textTransform="uppercase"
          letterSpacing="1"
        >
          {label.toUpperCase()}
        </text>
      </svg>
    </div>
  )
}
