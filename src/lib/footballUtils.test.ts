// src/lib/footballUtils.test.ts
// PDX-120: Unit tests for pure football utility functions.

import { describe, it, expect } from 'vitest'
import {
  formatTime,
  getFootballFieldPosition,
  getFieldZone,
  getFieldPositionColor,
  formatDown,
  isValidDown,
  isValidYardline,
  isValidDistance,
} from './footballUtils'

describe('formatTime', () => {
  it('formats zero as 0:00', () => {
    expect(formatTime(0)).toBe('0:00')
  })
  it('formats 60 as 1:00', () => {
    expect(formatTime(60)).toBe('1:00')
  })
  it('formats 90 as 1:30', () => {
    expect(formatTime(90)).toBe('1:30')
  })
  it('formats 900 as 15:00', () => {
    expect(formatTime(900)).toBe('15:00')
  })
  it('pads single-digit seconds', () => {
    expect(formatTime(65)).toBe('1:05')
  })
})

describe('getFootballFieldPosition', () => {
  it('returns Own <n> for yardline < 50', () => {
    expect(getFootballFieldPosition(20)).toBe('Own 20')
    expect(getFootballFieldPosition(1)).toBe('Own 1')
  })
  it('returns Midfield for yardline === 50', () => {
    expect(getFootballFieldPosition(50)).toBe('Midfield (50)')
  })
  it('returns Opp <n> for yardline > 50', () => {
    expect(getFootballFieldPosition(80)).toBe('Opp 20')
    expect(getFootballFieldPosition(99)).toBe('Opp 1')
  })
})

describe('getFieldZone', () => {
  it('labels red zone at yardline >= 80', () => {
    expect(getFieldZone(80)).toBe('RED ZONE')
    expect(getFieldZone(99)).toBe('RED ZONE')
  })
  it('labels scoring range at 65-79', () => {
    expect(getFieldZone(65)).toBe('SCORING RANGE')
    expect(getFieldZone(79)).toBe('SCORING RANGE')
  })
  it('labels opponent territory at 51-64', () => {
    expect(getFieldZone(51)).toBe('Opponent Territory')
    expect(getFieldZone(64)).toBe('Opponent Territory')
  })
  it('labels midfield at exactly 50', () => {
    expect(getFieldZone(50)).toBe('Midfield')
  })
  it('labels own territory below 50', () => {
    expect(getFieldZone(1)).toBe('Own Territory')
    expect(getFieldZone(49)).toBe('Own Territory')
  })
})

describe('getFieldPositionColor', () => {
  it('returns red-400 in red zone', () => {
    expect(getFieldPositionColor(80)).toBe('text-red-400')
  })
  it('returns orange-400 in scoring range', () => {
    expect(getFieldPositionColor(65)).toBe('text-orange-400')
  })
  it('returns green-400 in opponent territory', () => {
    expect(getFieldPositionColor(55)).toBe('text-green-400')
  })
  it('returns blue-400 in own territory or midfield', () => {
    expect(getFieldPositionColor(50)).toBe('text-blue-400')
    expect(getFieldPositionColor(30)).toBe('text-blue-400')
  })
})

describe('formatDown', () => {
  it('formats 1st & 10', () => {
    expect(formatDown(1, 10)).toBe('1st & 10')
  })
  it('formats 2nd & 5', () => {
    expect(formatDown(2, 5)).toBe('2nd & 5')
  })
  it('formats 3rd & 7', () => {
    expect(formatDown(3, 7)).toBe('3rd & 7')
  })
  it('formats 4th & 1', () => {
    expect(formatDown(4, 1)).toBe('4th & 1')
  })
})

describe('isValidDown', () => {
  it('accepts 1-4', () => {
    expect(isValidDown(1)).toBe(true)
    expect(isValidDown(4)).toBe(true)
  })
  it('rejects 0 and 5', () => {
    expect(isValidDown(0)).toBe(false)
    expect(isValidDown(5)).toBe(false)
  })
  it('rejects non-integer', () => {
    expect(isValidDown(1.5)).toBe(false)
  })
})

describe('isValidYardline', () => {
  it('accepts 1-99', () => {
    expect(isValidYardline(1)).toBe(true)
    expect(isValidYardline(99)).toBe(true)
  })
  it('rejects 0 and 100', () => {
    expect(isValidYardline(0)).toBe(false)
    expect(isValidYardline(100)).toBe(false)
  })
})

describe('isValidDistance', () => {
  it('accepts 1-99', () => {
    expect(isValidDistance(1)).toBe(true)
    expect(isValidDistance(99)).toBe(true)
  })
  it('rejects 0 and 100', () => {
    expect(isValidDistance(0)).toBe(false)
    expect(isValidDistance(100)).toBe(false)
  })
})
