import { describe, it, expect } from 'vitest'
import {
  getTeam,
  getCanonicalAbbr,
  getDisplayName,
  resolveGameId,
} from './nflTeams'

describe('getTeam', () => {
  it('resolves current abbreviation', () => {
    const team = getTeam('GB')
    expect(team).not.toBeNull()
    expect(team!.displayName).toBe('Green Bay Packers')
  })

  it('resolves historical abbreviation for relocated franchise', () => {
    // 2011 data uses SD for the Chargers
    const sd = getTeam('SD')
    const lac = getTeam('LAC')
    expect(sd).not.toBeNull()
    expect(lac).not.toBeNull()
    expect(sd!.displayName).toBe(lac!.displayName)
  })

  it('resolves OAK as Las Vegas Raiders (same franchise)', () => {
    const oak = getTeam('OAK')
    const lv = getTeam('LV')
    expect(oak).not.toBeNull()
    expect(lv).not.toBeNull()
    expect(oak!.displayName).toBe(lv!.displayName)
  })

  it('resolves STL as Los Angeles Rams (same franchise)', () => {
    const stl = getTeam('STL')
    const la = getTeam('LA')
    expect(stl).not.toBeNull()
    expect(la).not.toBeNull()
    expect(stl!.displayName).toBe(la!.displayName)
  })

  it('returns null for unknown abbreviation', () => {
    expect(getTeam('XYZ')).toBeNull()
  })

  it('is case-insensitive', () => {
    expect(getTeam('gb')).not.toBeNull()
    expect(getTeam('GB')).not.toBeNull()
  })
})

describe('getCanonicalAbbr', () => {
  it('returns canonical abbreviation for primary abbr', () => {
    expect(getCanonicalAbbr('GB')).toBe('GB')
  })

  it('maps historical alias to canonical', () => {
    // SD and LAC both map to the same canonical abbr
    const sdCanon = getCanonicalAbbr('SD')
    const lacCanon = getCanonicalAbbr('LAC')
    expect(sdCanon).toBe(lacCanon)
    expect(sdCanon).not.toBeNull()
  })

  it('maps OAK to same canonical as LV', () => {
    expect(getCanonicalAbbr('OAK')).toBe(getCanonicalAbbr('LV'))
  })

  it('returns null for unknown abbreviation', () => {
    expect(getCanonicalAbbr('XYZ')).toBeNull()
  })
})

describe('getDisplayName', () => {
  it('returns display name for known team', () => {
    expect(getDisplayName('NO')).toBe('New Orleans Saints')
  })

  it('returns display name for historical alias', () => {
    expect(getDisplayName('SD')).toBe(getDisplayName('LAC'))
  })

  it('falls back to provided abbr when unknown', () => {
    expect(getDisplayName('XYZ')).toBe('XYZ')
  })
})

describe('resolveGameId', () => {
  it('extracts home and away from standard game_id format', () => {
    const result = resolveGameId('2011_01_NO_GB')
    expect(result).not.toBeNull()
    expect(result!.awayAbbr).toBe('NO')
    expect(result!.homeAbbr).toBe('GB')
    expect(result!.season).toBe(2011)
    expect(result!.week).toBe(1)
  })

  it('normalizes historical abbreviations in game_id', () => {
    const result = resolveGameId('2011_09_GB_SD')
    expect(result).not.toBeNull()
    // SD should resolve to the same canonical as LAC
    expect(getCanonicalAbbr(result!.homeAbbr)).toBe(getCanonicalAbbr('LAC'))
  })

  it('returns null for invalid game_id format', () => {
    expect(resolveGameId('invalid')).toBeNull()
  })
})
