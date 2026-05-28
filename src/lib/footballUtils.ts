// src/lib/footballUtils.ts
// PDX-120: Pure football utility functions extracted from Lab.tsx.

// formatTime converts a number of seconds to "M:SS" display format.
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// getFootballFieldPosition converts yardline_100 to a display string.
// yardline: yards to opponent endzone (1-99).
export function getFootballFieldPosition(yardline: number): string {
  if (yardline < 50) return `Own ${yardline}`
  if (yardline === 50) return 'Midfield (50)'
  return `Opp ${100 - yardline}`
}

// getFieldZone returns a zone label based on yardline_100.
export function getFieldZone(yardline: number): string {
  if (yardline >= 80) return 'RED ZONE'
  if (yardline >= 65) return 'SCORING RANGE'
  if (yardline > 50) return 'Opponent Territory'
  if (yardline === 50) return 'Midfield'
  return 'Own Territory'
}

// getFieldPositionColor returns a Tailwind text color class for the given yardline.
export function getFieldPositionColor(yardline: number): string {
  if (yardline >= 80) return 'text-red-400'
  if (yardline >= 65) return 'text-orange-400'
  if (yardline > 50) return 'text-green-400'
  return 'text-blue-400'
}

// DOWN_SUFFIXES maps down number (1-4) to its ordinal suffix.
export const DOWN_SUFFIXES: readonly string[] = ['st', 'nd', 'rd', 'th'] as const

// formatDown formats a down + distance as "1st & 10".
export function formatDown(down: number, distance: number): string {
  const suffix = DOWN_SUFFIXES[down - 1] ?? 'th'
  return `${down}${suffix} & ${distance}`
}

// isValidDown returns true when down is in [1, 4].
export function isValidDown(down: number): boolean {
  return Number.isInteger(down) && down >= 1 && down <= 4
}

// isValidYardline returns true when yardline_100 is in [1, 99].
export function isValidYardline(yardline: number): boolean {
  return Number.isInteger(yardline) && yardline >= 1 && yardline <= 99
}

// isValidDistance returns true when yards-to-go is in [1, 99].
export function isValidDistance(distance: number): boolean {
  return Number.isInteger(distance) && distance >= 1 && distance <= 99
}
