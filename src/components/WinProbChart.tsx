// src/components/WinProbChart.tsx
// PDX-26: Recharts LineChart of win probability over game timeline.
// Shares ['timeline', gameId] query key with TimelineScrubber — zero extra fetches.
// Filters out plays with null win_prob to avoid line discontinuities.
// Cursor is a CSS overlay (not a Recharts ReferenceLine) so it moves without SVG re-render.

import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
} from 'recharts'
import { getTimeline } from '../api/client'

interface WinProbChartProps {
  gameId: string
  homeTeam: string
  awayTeam: string
  currentTick: number
}

function tickToMMSS(tick: number): string {
  const m = Math.floor(tick / 60)
  const s = tick % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const QUARTER_TICKS = [900, 1800, 2700, 3600]
const QUARTER_LABELS = ['Q1', 'Q2', 'Q3', 'Q4']

// Must match the Recharts config below so the CSS overlay lands on the plot area.
const YAXIS_WIDTH = 40      // <YAxis width={40} />
const RIGHT_MARGIN = 16     // <LineChart margin={{ right: 16 }} />
const PLOT_OFFSET = YAXIS_WIDTH + RIGHT_MARGIN  // total horizontal overhead

// Binary search: nearest wp value at or before targetTick.
function findNearestWp(data: { tick: number; wp: number }[], targetTick: number): number | null {
  if (data.length === 0) return null
  let lo = 0, hi = data.length - 1, result = data[0]
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (data[mid].tick <= targetTick) { result = data[mid]; lo = mid + 1 }
    else hi = mid - 1
  }
  return result.wp
}

export function WinProbChart({ gameId, homeTeam, awayTeam, currentTick }: WinProbChartProps) {
  const query = useQuery({
    queryKey: ['timeline', gameId],
    queryFn: () => getTimeline(gameId),
  })

  if (query.isLoading) {
    return (
      <div className="border-t border-gray-800 p-4 animate-pulse">
        <div className="h-48 bg-gray-800 rounded" />
      </div>
    )
  }

  if (query.isError || !query.data) {
    return null
  }

  const data = query.data.plays
    .filter((p) => p.win_prob !== null)
    .map((p) => ({ tick: p.tick, wp: p.win_prob as number }))

  const maxTick = query.data.max_tick

  // Cursor geometry: left = YAXIS_WIDTH + xPct*(100% - PLOT_OFFSET)
  // Written as calc() so no JS measurement of container width is needed.
  const xPct = maxTick > 0 ? currentTick / maxTick : 0
  const cursorLeft = `calc(${YAXIS_WIDTH}px + ${(xPct * 100).toFixed(4)}% - ${(xPct * PLOT_OFFSET).toFixed(4)}px)`

  const nearestWp = findNearestWp(data, currentTick)
  const wpLabel = nearestWp !== null ? `${Math.round(nearestWp * 100)}%` : null
  const awayWpLabel = nearestWp !== null ? `${Math.round((1 - nearestWp) * 100)}%` : null

  // Flip badge to the left when cursor is in the rightmost 15% to avoid overflow.
  const badgeOnLeft = xPct > 0.85

  return (
    <div className="border-t border-gray-800 p-4">
      <div className="flex justify-between items-baseline text-xs mb-2">
        <span className="text-blue-400 font-mono font-semibold">{homeTeam} {wpLabel ?? 'Win %'}</span>
        <span className="text-gray-500 font-mono">{awayTeam} {awayWpLabel ?? '—'}</span>
      </div>

      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 4, right: RIGHT_MARGIN, left: 0, bottom: 4 }}>
            <XAxis
              dataKey="tick"
              domain={[0, maxTick]}
              tickFormatter={tickToMMSS}
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#374151' }}
            />
            <YAxis
              domain={[0, 1]}
              tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={YAXIS_WIDTH}
            />
            <Tooltip
              formatter={(value: unknown) => [`${((value as number) * 100).toFixed(1)}%`, `${homeTeam} Win`]}
              labelFormatter={(label: unknown) => tickToMMSS(label as number)}
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 6 }}
              labelStyle={{ color: '#d1d5db' }}
              itemStyle={{ color: '#93c5fd' }}
            />
            {/* 50% baseline */}
            <ReferenceLine y={0.5} stroke="#6b7280" strokeDasharray="3 3" />
            {/* Quarter boundary lines */}
            {QUARTER_TICKS.filter((qt) => qt <= maxTick).map((qt, i) => (
              <ReferenceLine
                key={qt}
                x={qt}
                stroke="#374151"
                strokeDasharray="4 2"
                label={{ value: QUARTER_LABELS[i], fill: '#6b7280', fontSize: 10, position: 'top' }}
              />
            ))}
            <Line
              type="monotone"
              dataKey="wp"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* CSS cursor overlay — updates left only, no SVG re-render */}
        <div
          className="absolute inset-y-0 pointer-events-none"
          style={{ left: cursorLeft }}
        >
          {/* Dashed vertical line */}
          <div
            className="absolute inset-y-[4px] w-0"
            style={{ borderLeft: '1.5px dashed #ef4444' }}
          />
          {/* Win % badge */}
          {wpLabel && (
            <div
              className={`absolute top-[6px] flex items-center ${badgeOnLeft ? 'right-2' : 'left-2'}`}
            >
              <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5 leading-none shadow-md tabular-nums">
                {wpLabel}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
