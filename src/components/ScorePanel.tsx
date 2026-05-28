// src/components/ScorePanel.tsx
// PDX-25: Pure display — score and possession indicator.
// No hooks, no fetches. All null-safe.

import type { PlaySnapshot } from '../api/schemas'

interface ScorePanelProps {
  homeTeam: string
  awayTeam: string
  play: PlaySnapshot | null
}

export function ScorePanel({ homeTeam, awayTeam, play }: ScorePanelProps) {
  const homeScore = play?.home_score ?? 0
  const awayScore = play?.away_score ?? 0
  const posteam = play?.posteam ?? null

  return (
    <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between gap-4 border border-gray-700/60">
      {/* Away team */}
      <div className="flex flex-col items-center flex-1">
        <div className="flex items-center gap-1.5 mb-1">
          {posteam === awayTeam && (
            <span className="text-yellow-400 text-sm">▶</span>
          )}
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-gray-400">{awayTeam}</span>
        </div>
        <span className="text-4xl font-black tabular-nums text-white">
          {awayScore}
        </span>
      </div>

      <div className="text-gray-500 text-xl font-light">–</div>

      {/* Home team */}
      <div className="flex flex-col items-center flex-1">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-gray-400">{homeTeam}</span>
          {posteam === homeTeam && (
            <span className="text-yellow-400 text-sm">◀</span>
          )}
        </div>
        <span className="text-4xl font-black tabular-nums text-white">
          {homeScore}
        </span>
      </div>
    </div>
  )
}
