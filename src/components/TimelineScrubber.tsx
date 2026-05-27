// src/components/TimelineScrubber.tsx
// PDX-24: Range slider over 0..maxTick with quarter markers.
// PDX-50: Play type filter buttons (All/Run/Pass/Scoring) + Prev/Next navigation.
// PDX-56: Play tick dots on timeline bar update when filter changes (visual feedback).
// PDX-85: Read-only Q+clock badge replaces elapsed-time text input.
// PDX-90: isPreGameRef tracks whether user has navigated at all. nextTick() returns plays[0]
//          (kickoff) from pre-game state instead of skipping to first play at tick>0.
//          Slider drag to tick=0 resets to pre-game (null play) so GameView hides stats.
// Full timeline loaded once via TanStack Query. All scrubbing is local — no HTTP.

import { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTimeline } from '../api/client'
import type { PlaySnapshot } from '../api/schemas'

interface TimelineScrubberProps {
  gameId: string
  value?: number  // optional controlled tick — set externally (e.g. chart click)
  onTickChange: (tick: number, play: PlaySnapshot | null) => void
}

// O(log N) binary search: largest play.tick <= targetTick (floor).
// Returns null when targetTick is before the first play — no state has occurred yet.
function findNearestPlay(plays: PlaySnapshot[], targetTick: number): PlaySnapshot | null {
  if (plays.length === 0) return null
  let lo = 0
  let hi = plays.length - 1
  let result: PlaySnapshot | null = null
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (plays[mid].tick <= targetTick) {
      result = plays[mid]
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return result
}

// Closest play by absolute distance — used for slider snapping so a click
// slightly before a dot's tick (due to range input thumb offset) still snaps
// to the correct dot rather than the previous one.
function findClosestPlay(plays: PlaySnapshot[], targetTick: number): PlaySnapshot | null {
  if (plays.length === 0) return null
  const floor = findNearestPlay(plays, targetTick)
  // Find the ceiling: first play with tick > targetTick
  let ceiling: PlaySnapshot | null = null
  if (floor) {
    const idx = plays.indexOf(floor)
    if (idx + 1 < plays.length) ceiling = plays[idx + 1]
  } else {
    ceiling = plays[0]
  }
  if (!floor) return ceiling
  if (!ceiling) return floor
  return Math.abs(ceiling.tick - targetTick) < Math.abs(floor.tick - targetTick) ? ceiling : floor
}

// Quarter clock remaining: counts down from 15:00 per quarter, matching play description (MM:SS) prefix.
function tickToQtrClock(quarter: number, tick: number): string {
  const remaining = Math.max(0, quarter * 900 - tick)
  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// PDX-50: Filter predicate for Scoring plays.
// Matches play_type 'touchdown' | 'field_goal', OR description containing TOUCHDOWN / FIELD GOAL
// as a fallback for plays typed as 'run'/'pass' that resulted in a score.
function isScoringPlay(play: PlaySnapshot): boolean {
  const pt = play.play_type.toLowerCase()
  if (pt === 'touchdown' || pt === 'field_goal') return true
  const desc = play.description.toUpperCase()
  return desc.includes('TOUCHDOWN') || desc.includes('FIELD GOAL')
}

type FilterKey = 'all' | 'run' | 'pass' | 'scoring'

const FILTER_LABELS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'run', label: 'Run' },
  { key: 'pass', label: 'Pass' },
  { key: 'scoring', label: 'Scoring' },
]

const FILTER_ACTIVE_CLASS: Record<FilterKey, string> = {
  all: 'bg-blue-600 text-white',
  run: 'bg-green-700 text-white',
  pass: 'bg-sky-700 text-white',
  scoring: 'bg-amber-600 text-white',
}

const QUARTER_TICKS = [900, 1800, 2700, 3600]
const QUARTER_LABELS = ['Q1', 'Q2', 'Q3', 'Q4']

export function TimelineScrubber({ gameId, value, onTickChange }: TimelineScrubberProps) {
  const [tick, setTick] = useState(0)
  // PDX-50
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')
  // PDX-72: hover state for clickable dot tooltips
  const [hoveredTick, setHoveredTick] = useState<number | null>(null)
  // PDX-90: tracks pre-game state — true until first navigation; drives nextTick to include tick=0 plays.
  const isPreGameRef = useRef(true)

  const query = useQuery({
    queryKey: ['timeline', gameId],
    queryFn: () => getTimeline(gameId),
  })

  const maxTick = query.data?.max_tick ?? 3600

  // Sync slider when an external caller (e.g. chart click) drives the tick.
  useEffect(() => {
    if (value === undefined || value === tick) return
    if (value === 0) {
      isPreGameRef.current = true
      setTick(0)
      onTickChange(0, null)
      return
    }
    isPreGameRef.current = false
    const play = query.data ? findNearestPlay(query.data.plays, value) : null
    setTick(value)
    onTickChange(value, play)
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  // PDX-50: derive filtered ticks from timeline data + active filter
  const filteredPlays = useMemo<PlaySnapshot[]>(() => {
    const plays = query.data?.plays ?? []
    switch (activeFilter) {
      case 'run':
        return plays.filter((p) => p.play_type.toLowerCase() === 'run')
      case 'pass':
        return plays.filter((p) => p.play_type.toLowerCase() === 'pass')
      case 'scoring':
        return plays.filter(isScoringPlay)
      case 'all':
      default:
        return plays
    }
  }, [query.data?.plays, activeFilter])

  // Sorted tick values for the active filter (plays are already sorted by tick from client.ts)
  const filteredTicks = useMemo(() => filteredPlays.map((p) => p.tick), [filteredPlays])

  // PDX-50: Prev/Next helpers — linear scan is fine for ≤~150 plays
  // PDX-90: isPreGameRef=true means no navigation yet — nextTick goes to plays[0] regardless of tick comparison.
  function prevTick(): { tick: number; play: PlaySnapshot } | null {
    for (let i = filteredPlays.length - 1; i >= 0; i--) {
      if (filteredPlays[i].tick < tick) {
        return { tick: filteredPlays[i].tick, play: filteredPlays[i] }
      }
    }
    return null
  }

  function nextTick(): { tick: number; play: PlaySnapshot } | null {
    if (isPreGameRef.current && filteredPlays.length > 0) {
      return { tick: filteredPlays[0].tick, play: filteredPlays[0] }
    }
    for (let i = 0; i < filteredPlays.length; i++) {
      if (filteredPlays[i].tick > tick) {
        return { tick: filteredPlays[i].tick, play: filteredPlays[i] }
      }
    }
    return null
  }

  function applyTick(newTick: number, play: PlaySnapshot | null) {
    isPreGameRef.current = (play === null)
    setTick(newTick)
    onTickChange(newTick, play)
  }

  function handleSliderChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newTick = Number(e.target.value)
    // When a filter is active, snap to the closest filtered play so the description
    // always matches the filter. Use closest (not floor) so a click slightly before
    // a dot's tick — due to range input thumb offset — still lands on the right dot.
    if (activeFilter !== 'all' && filteredPlays.length > 0) {
      const target = findClosestPlay(filteredPlays, newTick)
      if (target) { applyTick(target.tick, target); return }
    }
    // PDX-90: slider dragged to minimum = pre-game state; pass null so GameView hides stats.
    if (activeFilter === 'all' && newTick === 0) {
      applyTick(0, null)
      return
    }
    const play = query.data ? findNearestPlay(query.data.plays, newTick) : null
    applyTick(newTick, play)
  }

  function handleFilterClick(key: FilterKey) {
    setActiveFilter(key)
    // Don't jump the tick — just change which plays highlight/Prev/Next navigate
  }

  function handlePrev() {
    const target = prevTick()
    if (target) applyTick(target.tick, target.play)
  }

  function handleNext() {
    const target = nextTick()
    if (target) applyTick(target.tick, target.play)
  }

  const nearestPlay = query.data ? findNearestPlay(query.data.plays, tick) : null
  const quarter = nearestPlay?.quarter ?? 1
  const displayTime = tickToQtrClock(quarter, tick)

  const hasPrev = prevTick() !== null
  const hasNext = nextTick() !== null

  if (query.isLoading) {
    return (
      <div className="pl-12 pr-6 py-4">
        <div className="h-8 bg-gray-700 rounded animate-pulse" />
        <div className="text-gray-500 text-sm mt-1">Loading timeline…</div>
      </div>
    )
  }

  if (query.isError) {
    return (
      <div className="pl-12 pr-6 py-2 text-red-400 text-sm">Timeline unavailable</div>
    )
  }

  return (
    <div className="pl-12 pr-6 py-4">
      {/* PDX-50 + PDX-53: Filter buttons + Prev/Next + time input row */}
      <div className="flex items-center gap-2 mb-3">
        {/* Prev arrow */}
        <button
          onClick={handlePrev}
          disabled={!hasPrev}
          className="px-3 py-1 rounded-full text-sm bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
          aria-label="Previous play"
        >
          ←
        </button>

        {/* Filter buttons */}
        {FILTER_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleFilterClick(key)}
            className={[
              'px-4 py-1 rounded-full text-sm font-medium transition-colors',
              activeFilter === key
                ? FILTER_ACTIVE_CLASS[key]
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700',
            ].join(' ')}
          >
            {label}
          </button>
        ))}

        {/* Next arrow */}
        <button
          onClick={handleNext}
          disabled={!hasNext}
          className="px-3 py-1 rounded-full text-sm bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
          aria-label="Next play"
        >
          →
        </button>

        {/* PDX-53: filtered play count */}
        {activeFilter !== 'all' && (
          <span className="text-xs text-gray-500 ml-1">
            {filteredTicks.length} play{filteredTicks.length !== 1 ? 's' : ''}
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* PDX-85: Read-only Q+clock badge */}
        <div className="w-24 px-2 py-1 rounded text-sm bg-gray-800 border border-gray-700 text-gray-200 text-center font-mono select-none">
          {quarter === 5 ? 'OT' : `Q${quarter}`} {displayTime}
        </div>
      </div>

      {/* Slider + quarter markers + play tick dots */}
      <div className="relative">
        <input
          type="range"
          min={0}
          max={maxTick}
          value={tick}
          onChange={handleSliderChange}
          className="w-full h-3 bg-gray-800 rounded-full appearance-none cursor-pointer accent-blue-500"
        />
        {/* PDX-56/72: Play tick dots — clickable hit zone (8px wide) with hover expand and tooltip */}
        {filteredPlays.map((play) => {
          const t = play.tick
          const isHovered = hoveredTick === t
          const dotColorClass = activeFilter === 'scoring'
            ? 'bg-amber-400'
            : activeFilter === 'run'
            ? 'bg-green-400'
            : activeFilter === 'pass'
            ? 'bg-sky-400'
            : 'bg-gray-400'
          const dotOpacityClass = isHovered
            ? 'opacity-100'
            : activeFilter === 'all'
            ? 'opacity-30'
            : 'opacity-70'
          return (
            <div
              key={t}
              className="absolute top-0 h-2 w-2 cursor-pointer z-10"
              style={{ left: `${(t / maxTick) * 100}%`, transform: 'translateX(-50%)' }}
              onClick={() => applyTick(t, play)}
              onMouseEnter={() => setHoveredTick(t)}
              onMouseLeave={() => setHoveredTick(null)}
            >
              {/* Visible dot — pointer-events-none, expands on hover */}
              <div
                className={[
                  'pointer-events-none absolute top-0 h-full left-1/2 -translate-x-1/2 transition-all duration-100',
                  dotColorClass,
                  dotOpacityClass,
                  isHovered ? 'w-[3px]' : 'w-px',
                ].join(' ')}
              />
              {/* Tooltip above dot */}
              {isHovered && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-xs text-gray-200 whitespace-nowrap z-20 pointer-events-none shadow-lg">
                  {`${play.quarter === 5 ? 'OT' : `Q${play.quarter}`} ${tickToQtrClock(play.quarter, t)} · ${play.play_type}`}
                </div>
              )}
            </div>
          )
        })}
        {/* Quarter marker lines */}
        {QUARTER_TICKS.filter((qt) => qt <= maxTick).map((qt, i) => {
          const pct = (qt / maxTick) * 100
          return (
            <div
              key={qt}
              className="absolute top-0 flex flex-col items-center pointer-events-none"
              style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-px h-3 bg-gray-500 mt-0.5" />
              <span className="text-xs text-gray-500 mt-0.5">{QUARTER_LABELS[i]}</span>
            </div>
          )
        })}
        {/* OT marker */}
        {maxTick > 3600 && (
          <div
            className="absolute top-0 flex flex-col items-center pointer-events-none"
            style={{ left: `${(4500 / maxTick) * 100}%`, transform: 'translateX(-50%)' }}
          >
            <div className="w-px h-3 bg-yellow-600 mt-0.5" />
            <span className="text-xs text-yellow-600 mt-0.5">OT</span>
          </div>
        )}
      </div>
    </div>
  )
}
