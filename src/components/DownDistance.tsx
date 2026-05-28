// src/components/DownDistance.tsx
// PDX-25: Pure display — quarter, down & distance, field position.
// No hooks. All nullable fields guarded.

import type { PlaySnapshot } from '../api/schemas'

interface DownDistanceProps {
  play: PlaySnapshot | null
}

function ordinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (suffixes[(v - 20) % 10] ?? suffixes[v] ?? suffixes[0])
}

export function DownDistance({ play }: DownDistanceProps) {
  if (play === null) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 min-h-[7rem] flex items-center justify-center border border-gray-700/60">
        <span className="text-gray-400 italic text-sm">Pre-game</span>
      </div>
    )
  }

  const { quarter, down, yards_to_go, yard_line, play_type } = play

  // Kickoff / special — no down
  if (down === null) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 min-h-[7rem] border border-gray-700/60">
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Situation</div>
        <div className="text-xs text-gray-400 mb-0.5">Q{quarter}</div>
        <div className="text-2xl font-bold text-white capitalize">{play_type || 'special'}</div>
      </div>
    )
  }

  const yardLineDisplay = yard_line !== null
    ? `at ${100 - yard_line} yd line`
    : ''

  return (
    <div className="bg-gray-800 rounded-lg p-4 min-h-[7rem] border border-gray-700/60">
      <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Situation</div>
      <div className="text-xs text-gray-400 mb-0.5">Q{quarter}</div>
      <div className="text-2xl font-bold text-white leading-tight">
        {ordinal(down)} <span className="text-gray-500 font-normal">&amp;</span> {yards_to_go ?? '?'}
      </div>
      {yardLineDisplay && <div className="text-xs text-gray-400 mt-1">{yardLineDisplay}</div>}
    </div>
  )
}
