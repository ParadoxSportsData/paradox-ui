// src/components/WinProbChart.tsx
// PDX-26: Win probability chart over game timeline.
// PDX-51: Area fill.
// PDX-52: Custom tooltip showing time, win %, and score.
// PDX-71: Broadcast-style split chart. Home fills bottom (blue), away fills top (red).
//          Solid blue line when home winning, dotted red line when away winning.
//          Y-axis symmetric [-1,1]: away 100% top, 50% center, home 100% bottom.
//          Home label right, away label left. YAXIS_WIDTH=40 and RIGHT_MARGIN=16 unchanged.
// PDX-74: X-axis shows clean quarter-boundary labels (KO/Q2/Q3/Q4/Final) not dense elapsed ticks.
//          Tooltip shows quarter + clock remaining matching game state bar convention.

import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
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
  onTickChange?: (tick: number) => void
}

// Quarter + clock-remaining format matching game state bar convention.
function tickToQtrClock(tick: number): string {
  const quarter = Math.min(Math.ceil((tick + 1) / 900), 5)
  const remaining = quarter * 900 - tick
  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  const label = quarter === 5 ? 'OT' : `Q${quarter}`
  return `${label} ${m}:${String(s).padStart(2, '0')}`
}

const QUARTER_TICKS = [900, 1800, 2700, 3600]

// Must match Recharts config — CSS cursor overlay depends on these exact values.
const YAXIS_WIDTH = 40
const RIGHT_MARGIN = 16
const PLOT_OFFSET = YAXIS_WIDTH + RIGHT_MARGIN

interface ChartPoint {
  tick: number
  wp: number
  // chartY = 1 - 2*wp: maps wp=1(home dominates)→-1(bottom), wp=0.5→0(center), wp=0(away dominates)→+1(top)
  chartY: number
  homeY: number        // Math.min(chartY, 0) — home fill area, below center
  awayY: number        // Math.max(chartY, 0) — away fill area, above center
  solidY: number | null   // chartY when ≤0 (home winning) → solid blue line segment
  dottedY: number | null  // chartY when ≥0 (away winning) → dotted red line segment
  homeScore: number
  awayScore: number
}

interface WpTooltipProps {
  active?: boolean
  payload?: Array<{ payload: ChartPoint }>
  homeTeam: string
  awayTeam: string
}

function WpTooltip({ active, payload, homeTeam, awayTeam }: WpTooltipProps) {
  if (!active || !payload?.length) return null
  const pt = payload.find(p => p.payload?.wp !== undefined)?.payload
  if (!pt) return null
  return (
    <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 6, padding: '8px 10px' }}>
      <div style={{ color: '#d1d5db', fontSize: 11 }}>{tickToQtrClock(pt.tick)}</div>
      <div style={{ color: '#f87171', fontSize: 12 }}>{awayTeam} Win {((1 - pt.wp) * 100).toFixed(1)}%</div>
      <div style={{ color: '#93c5fd', fontSize: 12 }}>{homeTeam} Win {(pt.wp * 100).toFixed(1)}%</div>
      <div style={{ color: '#9ca3af', fontSize: 11 }}>{homeTeam} {pt.homeScore} – {awayTeam} {pt.awayScore}</div>
    </div>
  )
}

// Binary search: nearest wp at or before targetTick.
function findNearestWp(data: ChartPoint[], targetTick: number): number | null {
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
    return (
      <div className="border-t border-gray-800 p-4">
        <div className="h-48 flex items-center justify-center text-gray-500 text-xs">
          Win probability unavailable
        </div>
      </div>
    )
  }

  const data: ChartPoint[] = query.data.plays
    .filter(p => p.win_prob !== null)
    .map(p => {
      const wp = p.win_prob as number
      const chartY = 1 - 2 * wp
      return {
        tick: p.tick,
        wp,
        chartY,
        homeY: Math.min(chartY, 0),
        awayY: Math.max(chartY, 0),
        solidY: chartY <= 0 ? chartY : null,
        dottedY: chartY >= 0 ? chartY : null,
        homeScore: p.home_score,
        awayScore: p.away_score,
      }
    })

  const maxTick = query.data.max_tick

  const xPct = maxTick > 0 ? currentTick / maxTick : 0
  const cursorLeft = `calc(${YAXIS_WIDTH}px + ${(xPct * 100).toFixed(4)}% - ${(xPct * PLOT_OFFSET).toFixed(4)}px)`

  const nearestWp = findNearestWp(data, currentTick)
  const homeWpLabel = nearestWp !== null ? `${Math.round(nearestWp * 100)}%` : null
  const awayWpLabel = nearestWp !== null ? `${Math.round((1 - nearestWp) * 100)}%` : null
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
      {/* Away on left, home on right — broadcast convention */}
      <div className="flex justify-between items-baseline text-xs mb-2">
        <span className="text-red-400 font-mono font-semibold">{awayTeam} {awayWpLabel ?? 'Win %'}</span>
        <span className="text-blue-400 font-mono font-semibold">{homeTeam} {homeWpLabel ?? 'Win %'}</span>
      </div>

      <div
        className={`relative${onTickChange ? ' cursor-crosshair' : ''}`}
        onClick={handlePlotClick}
      >
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data} margin={{ top: 4, right: RIGHT_MARGIN, left: 0, bottom: 4 }}>
            <XAxis
              dataKey="tick"
              domain={[0, maxTick]}
              type="number"
              ticks={[0, 900, 1800, 2700, 3600, ...(maxTick > 3600 ? [4500] : [])].filter(t => t <= maxTick)}
              tickFormatter={(t: number) => {
                if (t === 0) return 'KO'
                if (t === 900) return 'Q2'
                if (t === 1800) return 'Q3'
                if (t === 2700) return 'Q4'
                if (t === 3600) return maxTick > 3600 ? 'OT' : 'Final'
                if (t === 4500) return 'Final'
                return ''
              }}
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#374151' }}
            />
            <YAxis
              domain={[-1, 1]}
              ticks={[-1, 0, 1]}
              tickFormatter={(v: number) => v === 0 ? '50%' : '100%'}
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={YAXIS_WIDTH}
            />
            <Tooltip content={<WpTooltip homeTeam={homeTeam} awayTeam={awayTeam} />} />
            {/* 50% midline */}
            <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
            {/* Quarter boundary lines */}
            {QUARTER_TICKS.filter(qt => qt <= maxTick).map((qt) => (
              <ReferenceLine key={qt} x={qt} stroke="#374151" strokeDasharray="4 2" />
            ))}
            {/* Home fill: below midline (home winning), blue */}
            <Area
              dataKey="homeY"
              fill="rgba(59,130,246,0.18)"
              stroke="none"
              baseValue={0}
              isAnimationActive={false}
            />
            {/* Away fill: above midline (away winning), red */}
            <Area
              dataKey="awayY"
              fill="rgba(239,68,68,0.18)"
              stroke="none"
              baseValue={0}
              isAnimationActive={false}
            />
            {/* Solid blue line — home winning segments (chartY ≤ 0) */}
            <Line
              dataKey="solidY"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
            {/* Dotted red line — away winning segments (chartY ≥ 0) */}
            <Line
              dataKey="dottedY"
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* CSS cursor overlay — x position computation unchanged (YAXIS_WIDTH=40, RIGHT_MARGIN=16 preserved) */}
        <div
          className="absolute inset-y-0 pointer-events-none"
          style={{ left: cursorLeft }}
        >
          <div
            className="absolute inset-y-[4px] w-0"
            style={{ borderLeft: '1.5px dashed #9ca3af' }}
          />
          {awayWpLabel && (
            <div className={`absolute top-[6px] flex items-center ${badgeOnLeft ? 'right-2' : 'left-2'}`}>
              <span className="bg-red-600 text-white text-xs font-semibold rounded-full px-2 py-0.5 leading-none shadow-md tabular-nums">
                {awayWpLabel}
              </span>
            </div>
          )}
          {homeWpLabel && (
            <div className={`absolute bottom-[6px] flex items-center ${badgeOnLeft ? 'right-2' : 'left-2'}`}>
              <span className="bg-blue-600 text-white text-xs font-semibold rounded-full px-2 py-0.5 leading-none shadow-md tabular-nums">
                {homeWpLabel}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
