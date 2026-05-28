// src/components/WinProbGauge.tsx
// PDX-120: Circular SVG win probability gauge extracted from Lab.tsx.

interface WinProbGaugeProps {
  winProbability: number | null
  loading?: boolean
  error?: string | null
}

const GAUGE_RADIUS = 100
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS

function getGaugeColor(wp: number | null): string {
  if (wp === null) return '#374151'
  if (wp >= 0.7) return '#10b981'
  if (wp >= 0.5) return '#3b82f6'
  if (wp >= 0.3) return '#f59e0b'
  return '#ef4444'
}

function getWpLabel(wp: number): string {
  if (wp >= 0.7) return 'Highly Favored'
  if (wp >= 0.5) return 'Favored'
  if (wp >= 0.3) return 'Underdog'
  return 'Long Shot'
}

export function WinProbGauge({ winProbability, loading = false, error = null }: WinProbGaugeProps) {
  const gaugeColor = getGaugeColor(winProbability)

  return (
    <div className="relative w-64 h-64 mx-auto mb-6">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 256 256">
        <circle cx="128" cy="128" r={GAUGE_RADIUS} stroke="#374151" strokeWidth="20" fill="none" />
        {winProbability !== null && (
          <circle
            cx="128"
            cy="128"
            r={GAUGE_RADIUS}
            stroke={gaugeColor}
            strokeWidth="20"
            fill="none"
            strokeDasharray={GAUGE_CIRCUMFERENCE}
            strokeDashoffset={GAUGE_CIRCUMFERENCE * (1 - winProbability)}
            className="transition-all duration-700 ease-out"
            strokeLinecap="round"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {loading ? (
          <div className="text-blue-400 text-lg animate-pulse">Calculating…</div>
        ) : error ? (
          <div className="text-red-400 text-xs text-center px-4">{error}</div>
        ) : winProbability !== null ? (
          <>
            <div className="text-5xl font-bold text-white">{(winProbability * 100).toFixed(1)}%</div>
            <div className="text-sm text-gray-400 mt-1">{getWpLabel(winProbability)}</div>
          </>
        ) : (
          <div className="text-gray-500 text-sm">Adjust scenario</div>
        )}
      </div>
    </div>
  )
}
