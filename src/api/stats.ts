// src/api/stats.ts
// paradox-stats API client — GET /game/{id}/stats?tick={n}
// Mirrors the StatsResponse schema from paradox-stats service (port 8001).

export const STATS_URL = import.meta.env.VITE_STATS_API_URL ?? 'http://localhost:8001'

export interface TeamStats {
  pass_yards: number
  completions: number
  attempts: number
  pass_tds: number
  interceptions: number
  rush_yards: number
  carries: number
  rush_tds: number
  fumbles_lost: number
  turnovers: number
  sacks_allowed: number
  sacks: number
  first_downs: number
  third_down_attempts: number
  third_down_conversions: number
  epa: number
}

export interface QBStats {
  player_id: string
  name: string
  pass_yards: number
  completions: number
  attempts: number
  pass_tds: number
  interceptions: number
}

export interface RBStats {
  player_id: string
  name: string
  rush_yards: number
  carries: number
  rush_tds: number
  fumbles_lost: number
}

export interface WRTEStats {
  player_id: string
  name: string
  receiving_yards: number
  receptions: number
  targets: number
}

export interface KStats {
  player_id: string
  name: string
  fg_made: number
  fg_attempted: number
  xp_made: number
  xp_attempted: number
}

export interface PlayerGroup {
  qb: QBStats[]
  rb: RBStats[]
  wr_te: WRTEStats[]
  k: KStats[]
}

export interface StatsResponse {
  game_id: string
  tick: number
  home_team: string
  away_team: string
  team: {
    home: TeamStats
    away: TeamStats
  }
  players: {
    home: PlayerGroup
    away: PlayerGroup
  }
}

export async function fetchGameStats(gameId: string, tick: number): Promise<StatsResponse> {
  const res = await fetch(
    `${STATS_URL}/game/${encodeURIComponent(gameId)}/stats?tick=${tick}`
  )
  if (!res.ok) {
    throw new Error(`fetchGameStats(${gameId}, ${tick}): ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<StatsResponse>
}
