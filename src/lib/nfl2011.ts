// src/lib/nfl2011.ts
// 2011 NFL conference membership and playoff week constants.
// Uses canonical abbreviations from nflTeams.ts — no historical aliases here.

export const AFC_TEAMS = new Set([
  'BUF', 'MIA', 'NE',  'NYJ',  // AFC East
  'BAL', 'CIN', 'CLE', 'PIT',  // AFC North
  'HOU', 'IND', 'JAX', 'TEN',  // AFC South
  'DEN', 'KC',  'LV',  'LAC',  // AFC West
])

export const NFC_TEAMS = new Set([
  'DAL', 'NYG', 'PHI', 'WAS',  // NFC East
  'CHI', 'DET', 'GB',  'MIN',  // NFC North
  'ATL', 'CAR', 'NO',  'TB',   // NFC South
  'ARI', 'LA',  'SF',  'SEA',  // NFC West
])

// nflfastR week numbers for the 2011 postseason
export const PLAYOFF_WEEK = {
  WILD_CARD:  18,
  DIVISIONAL: 19,
  CONF_CHAMP: 20,
  SUPER_BOWL: 21,
} as const

export const REGULAR_SEASON_WEEKS = 17

// getConference accepts canonical abbreviations only.
export function getConference(canonicalAbbr: string): 'AFC' | 'NFC' | null {
  if (AFC_TEAMS.has(canonicalAbbr)) return 'AFC'
  if (NFC_TEAMS.has(canonicalAbbr)) return 'NFC'
  return null
}
