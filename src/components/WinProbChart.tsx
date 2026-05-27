// src/components/WinProbChart.tsx
// PDX-26: Recharts LineChart of win probability over game timeline.
// PDX-51: Area fill with green/red linearGradient (green above 50%, red below).
// PDX-52: Custom tooltip showing elapsed time, home Win%, and score.
// Shares ['timeline', gameId] query key with TimelineScrubber — zero extra fetches.
// Filters out plays with null win_prob to avoid line discontinuities.
// Cursor is a CSS overlay (not a Recharts ReferenceLine) so it moves without SVG re-render.

import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
  onTickChange?: (tick: number) => void
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

// PDX-52: Custom tooltip component showing elapsed time, home Win%, and score.
interface WpTooltipProps {
  active?: boolean
  payload?: Array<{ payload: { tick: number; wp: number; homeScore: number; awayScore: number } }>
  label?: number
  homeTeam: string
  awayTeam: string
}

function WpTooltip({ active, payload, label, homeTeam, awayTeam }: WpTooltipProps) {
  if (!active || !payload?.length) return null
  const { wp, homeScore, awayScore } = payload[0].payload
  return (
    <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 6, padding: '8px 10px' }}>
      <div style={{ color: '#d1d5db', fontSize: 11 }}>{tickToMMSS(label ?? 0)}</div>
      <div style={{ color: '#93c5fd', fontSize: 12 }}>{homeTeam} Win {(wp * 100).toFixed(1)}%</div>
      <div style={{ color: '#9ca3af', fontSize: 11 }}>{homeTeam} {homeScore} – {awayTeam} {awayScore}</div>
    </div>
  )
}

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

export function WinProbChart({ gameId, homeTeam, awayTeam, currentTick, onTickChange }: WinProbChartProps) {
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

  // PDX-52: include homeScore and awayScore per tick for tooltip display.
  const data = query.data.plays
    .filter((p) => p.win_prob !== null)
    .map((p) => ({ tick: p.tick, wp: p.win_prob as number, homeScore: p.home_score, awayScore: p.away_score }))

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

  function handlePlotClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!onTickChange || maxTick === 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const plotWidth = rect.width - YAXIS_WIDTH - RIGHT_MARGIN
    const clickX = e.clientX - rect.left - YAXIS_WIDTH
    const clicked = Math.round(Math.max(0, Math.min(1, clickX / plotWidth)) * maxTick)
    onTickChange(clicked)
  }

  return (
    <div className="border-t border-gray-800 p-4">
      <div className="flex justify-between items-baseline text-xs mb-2">
        <span className="text-blue-400 font-mono font-semibold">{homeTeam} {wpLabel ?? 'Win %'}</span>
        <span className="text-gray-500 font-mono">{awayTeam} {awayWpLabel ?? '—'}</span>
      </div>

      <div
        className={`relative${onTickChange ? ' cursor-crosshair' : ''}`}
        onClick={handlePlotClick}
      >
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 4, right: RIGHT_MARGIN, left: 0, bottom: 4 }}>
            {/*
              PDX-51: Green/red linearGradient anchored to Y-axis domain [0,1].
              gradientUnits="userSpaceOnUse" with y1/y2 as percentage strings is not
              supported in all browsers, so we use objectBoundingBox percentages:
                0%   → top of chart = WP 1.0 → green
                50%  → midpoint    = WP 0.5 → transition
                100% → bottom      = WP 0.0 → red
              This maps exactly to the [0,1] domain since Recharts fills the plot top-to-bottom.
            */}
            <defs>
              <linearGradient id="wpGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="rgba(34,197,94,0.35)" />
                <stop offset="50%"  stopColor="rgba(156,163,175,0.15)" />
                <stop offset="100%" stopColor="rgba(239,68,68,0.35)" />
              </linearGradient>
            </defs>
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
            {/* PDX-52: Custom tooltip showing time, home Win%, and score */}
            <Tooltip content={<WpTooltip homeTeam={homeTeam} awayTeam={awayTeam} />} />
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
            {/* PDX-51: Area replaces Line; fill uses green/red gradient */}
            <Area
              type="monotone"
              dataKey="wp"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#wpGradient)"
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
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
