// src/lib/schedule.ts
// Pure functions for building per-team schedule views from the flat /games list.
// No React — safe to import in tests.

import type { GameSummary } from '../api/schemas'
import { getConference, PLAYOFF_WEEK, REGULAR_SEASON_WEEKS } from './nfl2011'
import { getCanonicalAbbr, resolveGameId } from './nflTeams'

export type WeekLabel =
  | { kind: 'regular'; week: number }
  | { kind: 'bye';     week: number }
  | { kind: 'wc' }
  | { kind: 'div' }
  | { kind: 'conf';    conf: 'AFC' | 'NFC' }
  | { kind: 'sb' }

export interface ScheduleEntry {
  weekLabel: WeekLabel
  // null means this is a bye week — no game to click
  game:     GameSummary | null
  isHome:   boolean
  // canonical abbreviation of the opponent; empty string for bye rows
  opponent: string
}

export function formatWeekLabel(label: WeekLabel): string {
  switch (label.kind) {
    case 'regular': return `Wk ${label.week}`
    case 'bye':     return `Wk ${label.week}`
    case 'wc':      return 'Wild Card'
    case 'div':     return 'Divisional'
    case 'conf':    return `${label.conf} Championship`
    case 'sb':      return 'Super Bowl'
  }
}

// gameWeek returns a game's week number, preferring the API field and
// falling back to parsing the game_id (format: YYYY_WW_AWAY_HOME).
function gameWeek(g: GameSummary): number | null {
  if (g.week != null) return g.week
  return resolveGameId(g.game_id)?.week ?? null
}

function weekToLabel(week: number, canonicalAbbr: string): WeekLabel {
  if (week <= REGULAR_SEASON_WEEKS)       return { kind: 'regular', week }
  if (week === PLAYOFF_WEEK.WILD_CARD)    return { kind: 'wc' }
  if (week === PLAYOFF_WEEK.DIVISIONAL)   return { kind: 'div' }
  if (week === PLAYOFF_WEEK.CONF_CHAMP)   return { kind: 'conf', conf: getConference(canonicalAbbr) ?? 'AFC' }
  return { kind: 'sb' }
}

// buildTeamSchedule constructs an ordered list of schedule entries for one team.
// Regular season weeks are filled 1–N with BYE rows for any missing week.
// Playoff games appear after week 17 in ascending week order.
export function buildTeamSchedule(games: GameSummary[], teamAbbr: string): ScheduleEntry[] {
  const canonical = getCanonicalAbbr(teamAbbr) ?? teamAbbr

  const teamGames = games.filter(g => {
    const h = getCanonicalAbbr(g.home_team) ?? g.home_team
    const a = getCanonicalAbbr(g.away_team) ?? g.away_team
    return h === canonical || a === canonical
  })

  const byWeek = new Map<number, GameSummary>()
  for (const g of teamGames) {
    const w = gameWeek(g)
    if (w != null) byWeek.set(w, g)
  }

  const allWeeks    = [...byWeek.keys()].sort((a, b) => a - b)
  const regularWeeks = allWeeks.filter(w => w <= REGULAR_SEASON_WEEKS)
  const playoffWeeks = allWeeks.filter(w => w >  REGULAR_SEASON_WEEKS)

  if (allWeeks.length === 0) return []

  const entries: ScheduleEntry[] = []

  const lastRegular = regularWeeks.length > 0 ? regularWeeks[regularWeeks.length - 1] : 0

  for (let week = 1; week <= lastRegular; week++) {
    const game = byWeek.get(week) ?? null
    if (!game) {
      entries.push({ weekLabel: { kind: 'bye', week }, game: null, isHome: false, opponent: '' })
      continue
    }
    const canonHome = getCanonicalAbbr(game.home_team) ?? game.home_team
    const isHome    = canonHome === canonical
    const opponent  = isHome
      ? (getCanonicalAbbr(game.away_team) ?? game.away_team)
      : canonHome
    entries.push({ weekLabel: { kind: 'regular', week }, game, isHome, opponent })
  }

  for (const week of playoffWeeks) {
    const game      = byWeek.get(week)!
    const canonHome = getCanonicalAbbr(game.home_team) ?? game.home_team
    const isHome    = canonHome === canonical
    const opponent  = isHome
      ? (getCanonicalAbbr(game.away_team) ?? game.away_team)
      : canonHome
    entries.push({ weekLabel: weekToLabel(week, canonical), game, isHome, opponent })
  }

  return entries
}

// getAllTeams returns sorted canonical abbreviations of every team in the game list.
export function getAllTeams(games: GameSummary[]): string[] {
  const seen = new Set<string>()
  for (const g of games) {
    const h = getCanonicalAbbr(g.home_team) ?? g.home_team
    const a = getCanonicalAbbr(g.away_team) ?? g.away_team
    seen.add(h)
    seen.add(a)
  }
  return [...seen].sort()
}
