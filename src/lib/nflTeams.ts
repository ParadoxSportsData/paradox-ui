// src/lib/nflTeams.ts
// Canonical NFL team registry with alias support for relocated franchises.
//
// Problem: nfl_data_py normalizes team abbreviations to current franchise names
// inconsistently across seasons — some 2011 Chargers games use "SD", others "LAC".
// This module provides a single source of truth: getTeam(), getCanonicalAbbr(), and
// getDisplayName() all accept any historical or current alias and resolve to the
// same underlying NflTeam object.
//
// Color strategy:
//   primaryColor — visible on dark background. Teams whose brand primary is very dark
//     (navy, dark purple, forest green) use their secondary brand color as primaryColor here.
//   chartColor — alternate for win-probability chart. When home and away teams both resolve
//     to a similar primaryColor (e.g. two red teams), the away team falls back to chartColor
//     so the two series are always visually distinguishable.

export type Conference = 'AFC' | 'NFC'
export type Division   = 'East' | 'North' | 'South' | 'West'

export interface NflTeam {
  abbr: string
  displayName: string
  aliases: string[]
  conference: Conference
  division: Division
  primaryColor: string
  chartColor: string  // alternate color for win-prob chart when two teams share a primary
}

// All 32 NFL teams. Relocated franchises list both historical and current abbreviations.
const TEAMS: NflTeam[] = [
  // AFC East
  { abbr: 'BUF', displayName: 'Buffalo Bills',         aliases: ['BUF'],               conference: 'AFC', division: 'East',  primaryColor: '#C60C30', chartColor: '#4169E1' }, // red; alt royal blue
  { abbr: 'MIA', displayName: 'Miami Dolphins',         aliases: ['MIA'],               conference: 'AFC', division: 'East',  primaryColor: '#008E97', chartColor: '#FC4A1A' }, // teal; alt orange
  { abbr: 'NE',  displayName: 'New England Patriots',   aliases: ['NE'],                conference: 'AFC', division: 'East',  primaryColor: '#C60C30', chartColor: '#B0B7BC' }, // red; alt silver
  { abbr: 'NYJ', displayName: 'New York Jets',          aliases: ['NYJ'],               conference: 'AFC', division: 'East',  primaryColor: '#3CB24C', chartColor: '#D4D4D4' }, // green; alt light gray

  // AFC North
  { abbr: 'BAL', displayName: 'Baltimore Ravens',       aliases: ['BAL'],               conference: 'AFC', division: 'North', primaryColor: '#9E7C0C', chartColor: '#7B3FBE' }, // gold; alt visible purple
  { abbr: 'CIN', displayName: 'Cincinnati Bengals',     aliases: ['CIN'],               conference: 'AFC', division: 'North', primaryColor: '#FB4F14', chartColor: '#8B8B8B' }, // orange; alt neutral gray
  { abbr: 'CLE', displayName: 'Cleveland Browns',       aliases: ['CLE'],               conference: 'AFC', division: 'North', primaryColor: '#FF3C00', chartColor: '#D4855E' }, // orange; alt tan/bone
  { abbr: 'PIT', displayName: 'Pittsburgh Steelers',    aliases: ['PIT'],               conference: 'AFC', division: 'North', primaryColor: '#FFB612', chartColor: '#B7BAC0' }, // gold; alt silver

  // AFC South
  { abbr: 'HOU', displayName: 'Houston Texans',         aliases: ['HOU'],               conference: 'AFC', division: 'South', primaryColor: '#A71930', chartColor: '#5B8DD9' }, // red; alt steel blue
  { abbr: 'IND', displayName: 'Indianapolis Colts',     aliases: ['IND'],               conference: 'AFC', division: 'South', primaryColor: '#A2AAAD', chartColor: '#4169E1' }, // silver; alt royal blue
  { abbr: 'JAX', displayName: 'Jacksonville Jaguars',   aliases: ['JAX', 'JAC'],        conference: 'AFC', division: 'South', primaryColor: '#D7A22A', chartColor: '#00C0C8' }, // gold; alt bright teal
  { abbr: 'TEN', displayName: 'Tennessee Titans',       aliases: ['TEN'],               conference: 'AFC', division: 'South', primaryColor: '#4B92DB', chartColor: '#C8102E' }, // light blue; alt red

  // AFC West
  { abbr: 'DEN', displayName: 'Denver Broncos',         aliases: ['DEN'],               conference: 'AFC', division: 'West',  primaryColor: '#FC4C02', chartColor: '#4FC2F7' }, // orange; alt sky blue
  { abbr: 'KC',  displayName: 'Kansas City Chiefs',     aliases: ['KC'],                conference: 'AFC', division: 'West',  primaryColor: '#E31837', chartColor: '#FFB612' }, // red; alt gold
  { abbr: 'LV',  displayName: 'Las Vegas Raiders',      aliases: ['LV', 'OAK', 'LVR'], conference: 'AFC', division: 'West',  primaryColor: '#A5ACAF', chartColor: '#666666' }, // silver; alt dark gray
  { abbr: 'LAC', displayName: 'Los Angeles Chargers',   aliases: ['LAC', 'SD', 'SDG'], conference: 'AFC', division: 'West',  primaryColor: '#0080C6', chartColor: '#FFC20E' }, // blue; alt gold

  // NFC East
  { abbr: 'DAL', displayName: 'Dallas Cowboys',         aliases: ['DAL'],               conference: 'NFC', division: 'East',  primaryColor: '#869397', chartColor: '#4682B4' }, // silver; alt steel blue
  { abbr: 'NYG', displayName: 'New York Giants',        aliases: ['NYG'],               conference: 'NFC', division: 'East',  primaryColor: '#CF2028', chartColor: '#4682B4' }, // red; alt steel blue
  { abbr: 'PHI', displayName: 'Philadelphia Eagles',    aliases: ['PHI'],               conference: 'NFC', division: 'East',  primaryColor: '#A5ACAF', chartColor: '#4CAF50' }, // silver; alt green
  { abbr: 'WAS', displayName: 'Washington Commanders',  aliases: ['WAS', 'WSH'],        conference: 'NFC', division: 'East',  primaryColor: '#FFB612', chartColor: '#A04060' }, // gold; alt burgundy

  // NFC North
  { abbr: 'CHI', displayName: 'Chicago Bears',          aliases: ['CHI'],               conference: 'NFC', division: 'North', primaryColor: '#C83803', chartColor: '#4682B4' }, // orange; alt blue
  { abbr: 'DET', displayName: 'Detroit Lions',          aliases: ['DET'],               conference: 'NFC', division: 'North', primaryColor: '#0076B6', chartColor: '#B0B7BC' }, // blue; alt silver
  { abbr: 'GB',  displayName: 'Green Bay Packers',      aliases: ['GB'],                conference: 'NFC', division: 'North', primaryColor: '#FFB612', chartColor: '#3CB24C' }, // gold; alt green
  { abbr: 'MIN', displayName: 'Minnesota Vikings',      aliases: ['MIN'],               conference: 'NFC', division: 'North', primaryColor: '#FFC62F', chartColor: '#7B3FBE' }, // gold; alt visible purple

  // NFC South
  { abbr: 'ATL', displayName: 'Atlanta Falcons',        aliases: ['ATL'],               conference: 'NFC', division: 'South', primaryColor: '#A71930', chartColor: '#9CA3AF' }, // red; alt gray
  { abbr: 'CAR', displayName: 'Carolina Panthers',      aliases: ['CAR'],               conference: 'NFC', division: 'South', primaryColor: '#0085CA', chartColor: '#BFC0BF' }, // blue; alt silver
  { abbr: 'NO',  displayName: 'New Orleans Saints',     aliases: ['NO'],                conference: 'NFC', division: 'South', primaryColor: '#D3BC8D', chartColor: '#808080' }, // gold; alt gray
  { abbr: 'TB',  displayName: 'Tampa Bay Buccaneers',   aliases: ['TB'],                conference: 'NFC', division: 'South', primaryColor: '#D50A0A', chartColor: '#B7BAC0' }, // red; alt pewter

  // NFC West
  { abbr: 'ARI', displayName: 'Arizona Cardinals',      aliases: ['ARI'],               conference: 'NFC', division: 'West',  primaryColor: '#97233F', chartColor: '#9CA3AF' }, // red; alt gray
  { abbr: 'LA',  displayName: 'Los Angeles Rams',       aliases: ['LA', 'LAR', 'STL'], conference: 'NFC', division: 'West',  primaryColor: '#FFA300', chartColor: '#4169E1' }, // gold; alt blue
  { abbr: 'SF',  displayName: 'San Francisco 49ers',    aliases: ['SF'],                conference: 'NFC', division: 'West',  primaryColor: '#AA0000', chartColor: '#B3995D' }, // red; alt gold
  { abbr: 'SEA', displayName: 'Seattle Seahawks',       aliases: ['SEA'],               conference: 'NFC', division: 'West',  primaryColor: '#69BE28', chartColor: '#4682B4' }, // green; alt blue
]

// Build lookup index: every alias (uppercased) → NflTeam. Built once at module load.
const TEAM_BY_ALIAS = new Map<string, NflTeam>()
for (const team of TEAMS) {
  for (const alias of team.aliases) {
    TEAM_BY_ALIAS.set(alias.toUpperCase(), team)
  }
}

export function getTeam(abbr: string): NflTeam | null {
  return TEAM_BY_ALIAS.get(abbr.toUpperCase()) ?? null
}

export function getCanonicalAbbr(abbr: string): string | null {
  return getTeam(abbr)?.abbr ?? null
}

export function getDisplayName(abbr: string): string {
  return getTeam(abbr)?.displayName ?? abbr
}

export function getTeamColor(abbr: string): string {
  return getTeam(abbr)?.primaryColor ?? '#6B7280'
}

export function teamLogoUrl(abbr: string): string {
  const canonical = getCanonicalAbbr(abbr)
  if (!canonical) return ''
  return `https://a.espncdn.com/i/teamlogos/nfl/500/${canonical.toLowerCase()}.png`
}

// --- Division structure -------------------------------------------------------

export interface DivisionGroup {
  conference: Conference
  division: Division
  teams: string[]
}

// Ordered East → North → South → West per conference, matching the UI layout.
export const DIVISION_STRUCTURE: DivisionGroup[] = [
  { conference: 'AFC', division: 'East',  teams: ['BUF', 'MIA', 'NE',  'NYJ'] },
  { conference: 'AFC', division: 'North', teams: ['BAL', 'CIN', 'CLE', 'PIT'] },
  { conference: 'AFC', division: 'South', teams: ['HOU', 'IND', 'JAX', 'TEN'] },
  { conference: 'AFC', division: 'West',  teams: ['DEN', 'KC',  'LV',  'LAC'] },
  { conference: 'NFC', division: 'East',  teams: ['DAL', 'NYG', 'PHI', 'WAS'] },
  { conference: 'NFC', division: 'North', teams: ['CHI', 'DET', 'GB',  'MIN'] },
  { conference: 'NFC', division: 'South', teams: ['ATL', 'CAR', 'NO',  'TB' ] },
  { conference: 'NFC', division: 'West',  teams: ['ARI', 'LA',  'SF',  'SEA'] },
]

// --- Chart color resolution ---------------------------------------------------

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

function colorDistance(c1: string, c2: string): number {
  const a = hexToRgb(c1), b = hexToRgb(c2)
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2)
}

// Returns [homeChartColor, awayChartColor].
// When the two teams' primary colors are too similar (distance < 80, ~30% of RGB range),
// the away team falls back to its chartColor alternate so the two series stay distinct.
export function pickChartColors(homeAbbr: string, awayAbbr: string): [string, string] {
  const home = getTeam(homeAbbr)
  const away = getTeam(awayAbbr)
  const homeColor    = home?.primaryColor ?? '#6B7280'
  const awayPrimary  = away?.primaryColor ?? '#9CA3AF'
  const awayAlt      = away?.chartColor   ?? awayPrimary
  return colorDistance(homeColor, awayPrimary) < 80
    ? [homeColor, awayAlt]
    : [homeColor, awayPrimary]
}

// --- Game ID parsing ----------------------------------------------------------

export interface GameIdParts {
  season: number
  week: number
  awayAbbr: string
  homeAbbr: string
}

export function resolveGameId(gameId: string): GameIdParts | null {
  const parts = gameId.split('_')
  if (parts.length < 4) return null
  const season = parseInt(parts[0], 10)
  const week   = parseInt(parts[1], 10)
  if (isNaN(season) || isNaN(week)) return null
  return { season, week, awayAbbr: parts[2], homeAbbr: parts[3] }
}
