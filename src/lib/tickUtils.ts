// src/lib/tickUtils.ts
// PDX-112: Shared tick/play utility functions extracted from TimelineScrubber and WinProbChart.

import type { PlaySnapshot } from '../api/schemas'
import { SECONDS_PER_QUARTER } from './nfl2011'

// O(log N) binary search: largest play.tick <= targetTick (floor).
// Returns null when targetTick is before the first play — no state has occurred yet.
export function findNearestPlay(plays: PlaySnapshot[], targetTick: number): PlaySnapshot | null {
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
export function findClosestPlay(plays: PlaySnapshot[], targetTick: number): PlaySnapshot | null {
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
// quarter: 1-5 (5 = OT). tick: elapsed seconds from kickoff.
export function tickToQtrClock(quarter: number, tick: number): string {
  const remaining = Math.max(0, quarter * SECONDS_PER_QUARTER - tick)
  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// Derives quarter from elapsed tick and formats as "Q2 7:30" or "OT 14:22".
// Used by WinProbChart where quarter is not separately tracked.
export function tickToQtrClockFromTick(tick: number): string {
  const quarter = Math.min(Math.ceil((tick + 1) / SECONDS_PER_QUARTER), 5)
  const label = quarter === 5 ? 'OT' : `Q${quarter}`
  return `${label} ${tickToQtrClock(quarter, tick)}`
}
