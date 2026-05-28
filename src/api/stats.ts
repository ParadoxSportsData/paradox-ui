// src/api/stats.ts
// PDX-110: Add Zod validation to stats API client.
// paradox-stats API client — GET /game/{id}/stats?tick={n}
// Mirrors the StatsResponse schema from paradox-stats service (port 8001).

import { z } from 'zod'

export const STATS_URL = import.meta.env.VITE_STATS_API_URL ?? 'http://localhost:8001'

export const TeamStatsSchema = z.object({
  pass_yards: z.number(),
  completions: z.number(),
  attempts: z.number(),
  pass_tds: z.number(),
  interceptions: z.number(),
  rush_yards: z.number(),
  carries: z.number(),
  rush_tds: z.number(),
  fumbles_lost: z.number(),
  turnovers: z.number(),
  sacks_allowed: z.number(),
  sacks: z.number(),
  first_downs: z.number(),
  third_down_attempts: z.number(),
  third_down_conversions: z.number(),
  epa: z.number(),
})

export const QBStatsSchema = z.object({
  player_id: z.string(),
  name: z.string(),
  pass_yards: z.number(),
  completions: z.number(),
  attempts: z.number(),
  pass_tds: z.number(),
  interceptions: z.number(),
  passer_rating: z.number().nullable(),
  sacks_taken: z.number(),
  rush_yards: z.number(),
  rush_attempts: z.number(),
})

export const RBStatsSchema = z.object({
  player_id: z.string(),
  name: z.string(),
  carries: z.number(),
  rush_yards: z.number(),
  rush_tds: z.number(),
  receptions: z.number(),
  rec_yards: z.number(),
  rec_tds: z.number(),
})

export const WRTEStatsSchema = z.object({
  player_id: z.string(),
  name: z.string(),
  targets: z.number(),
  receptions: z.number(),
  rec_yards: z.number(),
  rec_tds: z.number(),
})

export const KStatsSchema = z.object({
  player_id: z.string(),
  name: z.string(),
  fg_made: z.number(),
  fg_att: z.number(),
  fg_long: z.number(),
  xp_made: z.number(),
  xp_att: z.number(),
})

export const PlayerGroupSchema = z.object({
  qb: z.array(QBStatsSchema),
  rb: z.array(RBStatsSchema),
  wr_te: z.array(WRTEStatsSchema),
  k: z.array(KStatsSchema),
})

export const StatsResponseSchema = z.object({
  game_id: z.string(),
  tick: z.number(),
  home_team: z.string(),
  away_team: z.string(),
  team: z.object({
    home: TeamStatsSchema,
    away: TeamStatsSchema,
  }),
  players: z.object({
    home: PlayerGroupSchema,
    away: PlayerGroupSchema,
  }),
})

// Inferred types — replaces the hand-written interfaces above
export type TeamStats = z.infer<typeof TeamStatsSchema>
export type QBStats = z.infer<typeof QBStatsSchema>
export type RBStats = z.infer<typeof RBStatsSchema>
export type WRTEStats = z.infer<typeof WRTEStatsSchema>
export type KStats = z.infer<typeof KStatsSchema>
export type PlayerGroup = z.infer<typeof PlayerGroupSchema>
export type StatsResponse = z.infer<typeof StatsResponseSchema>

export async function fetchGameStats(
  gameId: string,
  tick: number,
  signal?: AbortSignal,
): Promise<StatsResponse> {
  const res = await fetch(
    `${STATS_URL}/game/${encodeURIComponent(gameId)}/stats?tick=${tick}`,
    { signal },
  )
  if (!res.ok) {
    throw new Error(`fetchGameStats(${gameId}, ${tick}): ${res.status} ${res.statusText}`)
  }
  return StatsResponseSchema.parse(await res.json())
}
