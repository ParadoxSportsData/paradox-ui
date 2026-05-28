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
// win_prob from backend is already home-team perspective (compiler normalizes at build time).

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
import { pickChartColors } from '../lib/nflTeams'
import { REGULATION_TICKS, QUARTER_TICKS as SECONDS_PER_QTR, OT1_TICKS } from '../lib/nfl2011'
import { tickToQtrClockFromTick } from '../lib/tickUtils'

interface WinProbChartProps {
  gameId: string
  homeTeam: string
  awayTeam: string
  currentTick: number
  onTickChange?: (tick: number) => void
}

const QUARTER_TICK_MARKS = [SECONDS_PER_QTR, SECONDS_PER_QTR * 2, SECONDS_PER_QTR * 3, REGULATION_TICKS]

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
  homeColor: string
  awayColor: string
}

function WpTooltip({ active, payload, homeTeam, awayTeam, homeColor, awayColor }: WpTooltipProps) {
  if (!active || !payload?.length) return null
  const pt = payload.find(p => p.payload?.wp !== undefined)?.payload
  if (!pt) return null
  return (
    <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 6, padding: '8px 10px' }}>
      <div style={{ color: '#d1d5db', fontSize: 11 }}>{tickToQtrClockFromTick(pt.tick)}</div>
      <div style={{ color: awayColor, fontSize: 12 }}>{awayTeam} Win {((1 - pt.wp) * 100).toFixed(1)}%</div>
      <div style={{ color: homeColor, fontSize: 12 }}>{homeTeam} Win {(pt.wp * 100).toFixed(1)}%</div>
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
      const wp = p.win_prob as number  // backend normalizes to home-team perspective at compile time
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
  const [homeColor, awayColor] = pickChartColors(homeTeam, awayTeam)

  const xPct = maxTick > 0 ? currentTick / maxTick : 0
  const cursorLeft = `calc(${YAXIS_WIDTH}px + ${(xPct * 100).toFixed(4)}% - ${(xPct * PLOT_OFFSET).toFixed(4)}px)`

  const nearestWp = findNearestWp(data, currentTick)
  const homeWpLabel = nearestWp !== null ? `${Math.round(nearestWp * 100)}%` : null
  const awayWpLabel = nearestWp !== null ? `${Math.round((1 - nearestWp) * 100)}%` : null

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
        <span className="font-mono font-semibold" style={{ color: awayColor }}>{awayTeam} {awayWpLabel ?? 'Win %'}</span>
        <span className="font-mono font-semibold" style={{ color: homeColor }}>{homeTeam} {homeWpLabel ?? 'Win %'}</span>
      </div>

      <div
        role={onTickChange ? 'button' : undefined}
        tabIndex={onTickChange ? 0 : undefined}
        aria-label={onTickChange ? 'Win probability chart — click to seek to that game moment' : undefined}
        className={`relative${onTickChange ? ' cursor-crosshair focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-sm' : ''}`}
        onClick={handlePlotClick}
        onKeyDown={onTickChange ? (e: React.KeyboardEvent<HTMLDivElement>) => {
          // Left/Right arrow keys seek by 60s increments
          if (e.key === 'ArrowRight') { e.preventDefault(); onTickChange(Math.min(maxTick, currentTick + 60)) }
          if (e.key === 'ArrowLeft') { e.preventDefault(); onTickChange(Math.max(0, currentTick - 60)) }
        } : undefined}
      >
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data} margin={{ top: 4, right: RIGHT_MARGIN, left: 0, bottom: 4 }}>
            <XAxis
              dataKey="tick"
              domain={[0, maxTick]}
              type="number"
              ticks={[0, SECONDS_PER_QTR, SECONDS_PER_QTR * 2, SECONDS_PER_QTR * 3, REGULATION_TICKS, ...(maxTick > REGULATION_TICKS ? [OT1_TICKS] : [])].filter(t => t <= maxTick)}
              tickFormatter={(t: number) => {
                if (t === 0) return 'KO'
                if (t === SECONDS_PER_QTR) return 'Q2'
                if (t === SECONDS_PER_QTR * 2) return 'Q3'
                if (t === SECONDS_PER_QTR * 3) return 'Q4'
                if (t === REGULATION_TICKS) return maxTick > REGULATION_TICKS ? 'OT' : 'Final'
                if (t === OT1_TICKS) return 'Final'
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
            <Tooltip content={<WpTooltip homeTeam={homeTeam} awayTeam={awayTeam} homeColor={homeColor} awayColor={awayColor} />} />
            {/* 50% midline */}
            <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
            {/* Quarter boundary lines */}
            {QUARTER_TICK_MARKS.filter(qt => qt <= maxTick).map((qt) => (
              <ReferenceLine key={qt} x={qt} stroke="#374151" strokeDasharray="4 2" />
            ))}
            {/* Home fill: below midline (home winning) */}
            <Area
              dataKey="homeY"
              fill={homeColor}
              fillOpacity={0.35}
              stroke="none"
              baseValue={0}
              isAnimationActive={false}
            />
            {/* Away fill: above midline (away winning) */}
            <Area
              dataKey="awayY"
              fill={awayColor}
              fillOpacity={0.35}
              stroke="none"
              baseValue={0}
              isAnimationActive={false}
            />
            {/* Solid line — home winning segments (chartY ≤ 0) */}
            <Line
              dataKey="solidY"
              stroke={homeColor}
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
            {/* Dotted line — away winning segments (chartY ≥ 0) */}
            <Line
              dataKey="dottedY"
              stroke={awayColor}
              strokeWidth={2.5}
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
            <div className="absolute top-[6px] flex items-center left-2">
              <span className="text-white text-xs font-semibold rounded-full px-2 py-0.5 leading-none shadow-md tabular-nums" style={{ backgroundColor: awayColor }}>
                {awayWpLabel}
              </span>
            </div>
          )}
          {homeWpLabel && (
            <div className="absolute bottom-[6px] flex items-center left-2">
              <span className="text-white text-xs font-semibold rounded-full px-2 py-0.5 leading-none shadow-md tabular-nums" style={{ backgroundColor: homeColor }}>
                {homeWpLabel}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
