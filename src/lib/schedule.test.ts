// src/lib/schedule.test.ts
// PDX-98: Tests for season-aware schedule functions.

import { describe, it, expect } from 'vitest'
import {
  getSeasonFromGame,
  getSeasonsForTeam,
  buildTeamSchedule,
} from './schedule'
import type { GameSummary } from '../api/schemas'

function makeGame(
  game_id: string,
  home_team: string,
  away_team: string,
  overrides: Partial<GameSummary> = {}
): GameSummary {
  return {
    game_id,
    home_team,
    away_team,
    home_score: 0,
    away_score: 0,
    duration: 3600,
    ...overrides,
  }
}

const GAME_2011_W1 = makeGame('2011_01_NO_GB',  'GB', 'NO', { season: 2011, week: 1 })
const GAME_2011_W2 = makeGame('2011_02_GB_CHI', 'CHI', 'GB', { season: 2011, week: 2 })
const GAME_2012_W1 = makeGame('2012_01_GB_SF',  'SF', 'GB', { season: 2012, week: 1 })

describe('getSeasonFromGame', () => {
  it('returns season field when present', () => {
    const game = makeGame('2011_01_NO_GB', 'GB', 'NO', { season: 2011 })
    expect(getSeasonFromGame(game)).toBe(2011)
  })

  it('parses season from game_id when season field absent', () => {
    const game = makeGame('2014_03_DAL_SF', 'SF', 'DAL')
    expect(getSeasonFromGame(game)).toBe(2014)
  })

  it('returns null for unparseable game_id with no season field', () => {
    const game = makeGame('invalid-id', 'GB', 'NO')
    expect(getSeasonFromGame(game)).toBeNull()
  })
})

describe('getSeasonsForTeam', () => {
  it('returns single season when team appears only in 2011', () => {
    const games = [GAME_2011_W1, GAME_2011_W2]
    expect(getSeasonsForTeam(games, 'GB')).toEqual([2011])
  })

  it('returns sorted seasons when team spans multiple years', () => {
    const games = [GAME_2012_W1, GAME_2011_W1, GAME_2011_W2]
    expect(getSeasonsForTeam(games, 'GB')).toEqual([2011, 2012])
  })

  it('returns empty array for team not in game list', () => {
    const games = [GAME_2011_W1]
    expect(getSeasonsForTeam(games, 'DAL')).toEqual([])
  })

  it('deduplicates seasons (team appears multiple times in same season)', () => {
    const games = [GAME_2011_W1, GAME_2011_W2]
    const seasons = getSeasonsForTeam(games, 'GB')
    expect(seasons).toEqual([2011])
  })

  it('resolves historical aliases (SD resolves to same canonical as LAC)', () => {
    const sdGame = makeGame('2011_05_GB_SD', 'SD', 'GB', { season: 2011, week: 5 })
    const seasons = getSeasonsForTeam([sdGame], 'LAC')
    expect(seasons).toEqual([2011])
  })
})

describe('buildTeamSchedule with season filter', () => {
  it('includes games from the specified season', () => {
    const games = [GAME_2011_W1, GAME_2011_W2, GAME_2012_W1]
    const schedule = buildTeamSchedule(games, 'GB', 2011)
    const gameIds = schedule.filter(e => e.game).map(e => e.game!.game_id)
    expect(gameIds).toContain('2011_01_NO_GB')
    expect(gameIds).toContain('2011_02_GB_CHI')
  })

  it('excludes games from other seasons', () => {
    const games = [GAME_2011_W1, GAME_2012_W1]
    const schedule = buildTeamSchedule(games, 'GB', 2011)
    const gameIds = schedule.filter(e => e.game).map(e => e.game!.game_id)
    expect(gameIds).not.toContain('2012_01_GB_SF')
  })

  it('returns empty array when team has no games in the requested season', () => {
    const games = [GAME_2011_W1]
    const schedule = buildTeamSchedule(games, 'GB', 2012)
    expect(schedule).toEqual([])
  })

  it('isHome is true when team is home_team', () => {
    const games = [GAME_2011_W1] // GB is home
    const schedule = buildTeamSchedule(games, 'GB', 2011)
    const entry = schedule.find(e => e.game?.game_id === '2011_01_NO_GB')
    expect(entry).toBeDefined()
    expect(entry!.isHome).toBe(true)
    expect(entry!.opponent).toBe('NO')
  })

  it('isHome is false when team is away_team', () => {
    const games = [GAME_2011_W2] // GB is away at CHI
    const schedule = buildTeamSchedule(games, 'GB', 2011)
    const entry = schedule.find(e => e.game?.game_id === '2011_02_GB_CHI')
    expect(entry).toBeDefined()
    expect(entry!.isHome).toBe(false)
  })
})
