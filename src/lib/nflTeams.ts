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
  // Most recognizable brand hex color — used for UI differentiation.
  primaryColor: string
}

// All 32 NFL teams. Relocated franchises list both historical and current abbreviations
// in aliases so both variants in raw data resolve to the same team.
const TEAMS: NflTeam[] = [
  // AFC East
  { abbr: 'BUF', displayName: 'Buffalo Bills',           aliases: ['BUF'],              primaryColor: '#00338D' },
  { abbr: 'MIA', displayName: 'Miami Dolphins',           aliases: ['MIA'],              primaryColor: '#008E97' },
  { abbr: 'NE',  displayName: 'New England Patriots',     aliases: ['NE'],               primaryColor: '#002244' },
  { abbr: 'NYJ', displayName: 'New York Jets',            aliases: ['NYJ'],              primaryColor: '#125740' },

  // AFC North
  { abbr: 'BAL', displayName: 'Baltimore Ravens',         aliases: ['BAL'],              primaryColor: '#241773' },
  { abbr: 'CIN', displayName: 'Cincinnati Bengals',       aliases: ['CIN'],              primaryColor: '#FB4F14' },
  { abbr: 'CLE', displayName: 'Cleveland Browns',         aliases: ['CLE'],              primaryColor: '#311D00' },
  { abbr: 'PIT', displayName: 'Pittsburgh Steelers',      aliases: ['PIT'],              primaryColor: '#FFB612' },

  // AFC South
  { abbr: 'HOU', displayName: 'Houston Texans',           aliases: ['HOU'],              primaryColor: '#A71930' },
  { abbr: 'IND', displayName: 'Indianapolis Colts',       aliases: ['IND'],              primaryColor: '#002C5F' },
  { abbr: 'JAX', displayName: 'Jacksonville Jaguars',     aliases: ['JAX', 'JAC'],       primaryColor: '#006778' },
  { abbr: 'TEN', displayName: 'Tennessee Titans',         aliases: ['TEN'],              primaryColor: '#4B92DB' },

  // AFC West
  { abbr: 'DEN', displayName: 'Denver Broncos',           aliases: ['DEN'],              primaryColor: '#FC4C02' },
  { abbr: 'KC',  displayName: 'Kansas City Chiefs',       aliases: ['KC'],               primaryColor: '#E31837' },
  // Raiders: Oakland (2011) → Las Vegas (2020)
  { abbr: 'LV',  displayName: 'Las Vegas Raiders',        aliases: ['LV', 'OAK', 'LVR'], primaryColor: '#A5ACAF' },
  // Chargers: San Diego (2011) → Los Angeles (2017)
  { abbr: 'LAC', displayName: 'Los Angeles Chargers',     aliases: ['LAC', 'SD', 'SDG'], primaryColor: '#0080C6' },

  // NFC East
  { abbr: 'DAL', displayName: 'Dallas Cowboys',           aliases: ['DAL'],              primaryColor: '#003594' },
  { abbr: 'NYG', displayName: 'New York Giants',          aliases: ['NYG'],              primaryColor: '#0B2265' },
  { abbr: 'PHI', displayName: 'Philadelphia Eagles',      aliases: ['PHI'],              primaryColor: '#004C54' },
  { abbr: 'WAS', displayName: 'Washington Commanders',    aliases: ['WAS', 'WSH'],       primaryColor: '#773141' },

  // NFC North
  { abbr: 'CHI', displayName: 'Chicago Bears',            aliases: ['CHI'],              primaryColor: '#C83803' },
  { abbr: 'DET', displayName: 'Detroit Lions',            aliases: ['DET'],              primaryColor: '#0076B6' },
  { abbr: 'GB',  displayName: 'Green Bay Packers',        aliases: ['GB'],               primaryColor: '#FFB612' },
  { abbr: 'MIN', displayName: 'Minnesota Vikings',        aliases: ['MIN'],              primaryColor: '#4F2683' },

  // NFC South
  { abbr: 'ATL', displayName: 'Atlanta Falcons',          aliases: ['ATL'],              primaryColor: '#A71930' },
  { abbr: 'CAR', displayName: 'Carolina Panthers',        aliases: ['CAR'],              primaryColor: '#0085CA' },
  { abbr: 'NO',  displayName: 'New Orleans Saints',       aliases: ['NO'],               primaryColor: '#D3BC8D' },
  { abbr: 'TB',  displayName: 'Tampa Bay Buccaneers',     aliases: ['TB'],               primaryColor: '#D50A0A' },

  // NFC West
  { abbr: 'ARI', displayName: 'Arizona Cardinals',        aliases: ['ARI'],              primaryColor: '#97233F' },
  // Rams: St. Louis (2011) → Los Angeles (2016)
  { abbr: 'LA',  displayName: 'Los Angeles Rams',         aliases: ['LA', 'LAR', 'STL'], primaryColor: '#FFA300' },
  { abbr: 'SF',  displayName: 'San Francisco 49ers',      aliases: ['SF'],               primaryColor: '#AA0000' },
  { abbr: 'SEA', displayName: 'Seattle Seahawks',         aliases: ['SEA'],              primaryColor: '#002244' },
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

// getTeamColor returns the team's primary brand hex color for any alias.
// Falls back to neutral gray when the abbreviation is not recognized.
export function getTeamColor(abbr: string): string {
  return getTeam(abbr)?.primaryColor ?? '#6B7280'
}

// teamLogoUrl returns an ESPN CDN logo URL for any team abbreviation (historical or current).
// Always resolves to the current franchise's canonical abbreviation before constructing
// the URL, so "SD" and "LAC" both return the Los Angeles Chargers logo.
// Returns an empty string for unrecognized abbreviations — callers should hide the image on error.
export function teamLogoUrl(abbr: string): string {
  const canonical = getCanonicalAbbr(abbr)
  if (!canonical) return ''
  return `https://a.espncdn.com/i/teamlogos/nfl/500/${canonical.toLowerCase()}.png`
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
