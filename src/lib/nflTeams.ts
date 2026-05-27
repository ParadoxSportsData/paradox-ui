// src/lib/nflTeams.ts
// Canonical NFL team registry with alias support for relocated franchises.
//
// Problem: nfl_data_py normalizes team abbreviations to current franchise names
// inconsistently across seasons — some 2011 Chargers games use "SD", others "LAC".
// This module provides a single source of truth: getTeam(), getCanonicalAbbr(), and
// getDisplayName() all accept any historical or current alias and resolve to the
// same underlying NflTeam object.

export interface NflTeam {
  // Primary abbreviation — canonical identifier used as map key internally.
  abbr: string
  displayName: string
  // All abbreviations that map to this team (historical + current).
  aliases: string[]
}

// All 32 NFL teams. Relocated franchises list both historical and current abbreviations
// in aliases so both variants in raw data resolve to the same team.
const TEAMS: NflTeam[] = [
  // AFC East
  { abbr: 'BUF', displayName: 'Buffalo Bills', aliases: ['BUF'] },
  { abbr: 'MIA', displayName: 'Miami Dolphins', aliases: ['MIA'] },
  { abbr: 'NE',  displayName: 'New England Patriots', aliases: ['NE'] },
  { abbr: 'NYJ', displayName: 'New York Jets', aliases: ['NYJ'] },

  // AFC North
  { abbr: 'BAL', displayName: 'Baltimore Ravens', aliases: ['BAL'] },
  { abbr: 'CIN', displayName: 'Cincinnati Bengals', aliases: ['CIN'] },
  { abbr: 'CLE', displayName: 'Cleveland Browns', aliases: ['CLE'] },
  { abbr: 'PIT', displayName: 'Pittsburgh Steelers', aliases: ['PIT'] },

  // AFC South
  { abbr: 'HOU', displayName: 'Houston Texans', aliases: ['HOU'] },
  { abbr: 'IND', displayName: 'Indianapolis Colts', aliases: ['IND'] },
  { abbr: 'JAX', displayName: 'Jacksonville Jaguars', aliases: ['JAX', 'JAC'] },
  { abbr: 'TEN', displayName: 'Tennessee Titans', aliases: ['TEN'] },

  // AFC West
  { abbr: 'DEN', displayName: 'Denver Broncos', aliases: ['DEN'] },
  { abbr: 'KC',  displayName: 'Kansas City Chiefs', aliases: ['KC'] },
  // Raiders: Oakland (2011) → Las Vegas (2020)
  { abbr: 'LV',  displayName: 'Las Vegas Raiders', aliases: ['LV', 'OAK', 'LVR'] },
  // Chargers: San Diego (2011) → Los Angeles (2017)
  { abbr: 'LAC', displayName: 'Los Angeles Chargers', aliases: ['LAC', 'SD', 'SDG'] },

  // NFC East
  { abbr: 'DAL', displayName: 'Dallas Cowboys', aliases: ['DAL'] },
  { abbr: 'NYG', displayName: 'New York Giants', aliases: ['NYG'] },
  { abbr: 'PHI', displayName: 'Philadelphia Eagles', aliases: ['PHI'] },
  { abbr: 'WAS', displayName: 'Washington Commanders', aliases: ['WAS', 'WSH'] },

  // NFC North
  { abbr: 'CHI', displayName: 'Chicago Bears', aliases: ['CHI'] },
  { abbr: 'DET', displayName: 'Detroit Lions', aliases: ['DET'] },
  { abbr: 'GB',  displayName: 'Green Bay Packers', aliases: ['GB'] },
  { abbr: 'MIN', displayName: 'Minnesota Vikings', aliases: ['MIN'] },

  // NFC South
  { abbr: 'ATL', displayName: 'Atlanta Falcons', aliases: ['ATL'] },
  { abbr: 'CAR', displayName: 'Carolina Panthers', aliases: ['CAR'] },
  { abbr: 'NO',  displayName: 'New Orleans Saints', aliases: ['NO'] },
  { abbr: 'TB',  displayName: 'Tampa Bay Buccaneers', aliases: ['TB'] },

  // NFC West
  { abbr: 'ARI', displayName: 'Arizona Cardinals', aliases: ['ARI'] },
  // Rams: St. Louis (2011) → Los Angeles (2016)
  { abbr: 'LA',  displayName: 'Los Angeles Rams', aliases: ['LA', 'LAR', 'STL'] },
  { abbr: 'SF',  displayName: 'San Francisco 49ers', aliases: ['SF'] },
  { abbr: 'SEA', displayName: 'Seattle Seahawks', aliases: ['SEA'] },
]

// Build lookup index: every alias (uppercased) → NflTeam. Built once at module load.
const TEAM_BY_ALIAS = new Map<string, NflTeam>()
for (const team of TEAMS) {
  for (const alias of team.aliases) {
    TEAM_BY_ALIAS.set(alias.toUpperCase(), team)
  }
}

// getTeam resolves any abbreviation (historical or current, any case) to an NflTeam.
// Returns null if not recognized.
export function getTeam(abbr: string): NflTeam | null {
  return TEAM_BY_ALIAS.get(abbr.toUpperCase()) ?? null
}

// getCanonicalAbbr returns the primary (current) abbreviation for any alias.
// Returns null if not recognized.
export function getCanonicalAbbr(abbr: string): string | null {
  return getTeam(abbr)?.abbr ?? null
}

// getDisplayName returns the team's display name for any alias.
// Falls back to the provided abbreviation string when not recognized, so
// callers never get an empty label.
export function getDisplayName(abbr: string): string {
  return getTeam(abbr)?.displayName ?? abbr
}

// GameIdParts is the parsed result of a game_id string in the format YYYY_WW_AWAY_HOME.
export interface GameIdParts {
  season: number
  week: number
  awayAbbr: string
  homeAbbr: string
}

// resolveGameId parses a game_id string (e.g. "2011_01_NO_GB") into its components.
// Returns null if the format is not recognized.
export function resolveGameId(gameId: string): GameIdParts | null {
  const parts = gameId.split('_')
  if (parts.length < 4) return null

  const season = parseInt(parts[0], 10)
  const week = parseInt(parts[1], 10)
  if (isNaN(season) || isNaN(week)) return null

  // Away and home are the 3rd and 4th segments. Team abbreviations may be
  // multi-segment (e.g. future formats), but all current data uses 4 parts.
  const awayAbbr = parts[2]
  const homeAbbr = parts[3]

  return { season, week, awayAbbr, homeAbbr }
}
