// src/components/GameSelector.tsx
// PDX-23: Lists games from /games (or MOCK). Renders a card grid.
// useQuery only — no useEffect fetch.
// PDX-54: OT badge on cards when duration > 3600.
// PDX-55: blindMode masks final scores until user reveals them.

import { useQuery } from '@tanstack/react-query'
import { listGames } from '../api/client'
import type { GameSummary } from '../api/schemas'

interface GameSelectorProps {
  onSelect: (gameId: string) => void
  blindMode: boolean
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function GameCard({
  game,
  onSelect,
  blindMode,
}: {
  game: GameSummary
  onSelect: (id: string) => void
  blindMode: boolean
}) {
  const isOT = game.duration > 3600

  return (
    <button
      onClick={() => onSelect(game.game_id)}
      className="text-left bg-gray-800 rounded-lg p-4 cursor-pointer hover:ring-2 hover:ring-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-lg font-bold text-white">
          {game.away_team} @ {game.home_team}
        </div>
        {isOT && (
          <span className="shrink-0 text-xs font-mono bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">
            OT
          </span>
        )}
      </div>
      <div className="text-2xl font-mono mt-1">
        {blindMode ? (
          <span className="text-gray-600">? – ?</span>
        ) : (
          <span className="text-blue-300">{game.home_score} – {game.away_score}</span>
        )}
      </div>
      <div className="text-sm text-gray-400 mt-2">
        {game.game_id.replace(/_/g, ' ')}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Duration: {formatDuration(game.duration)}
      </div>
    </button>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-gray-800 rounded-lg p-4 animate-pulse">
      <div className="h-5 bg-gray-600 rounded w-3/4 mb-2" />
      <div className="h-7 bg-gray-600 rounded w-1/2 mb-2" />
      <div className="h-4 bg-gray-700 rounded w-full mb-1" />
      <div className="h-3 bg-gray-700 rounded w-1/3" />
    </div>
  )
}

export function GameSelector({ onSelect, blindMode }: GameSelectorProps) {
  const query = useQuery({ queryKey: ['games'], queryFn: listGames })

  if (query.isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div className="p-6">
        <div className="bg-red-900 border border-red-600 text-red-200 rounded-lg p-4 flex items-center justify-between">
          <span>Failed to load games. Is the server running?</span>
          <button
            onClick={() => query.refetch()}
            className="ml-4 bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-200 mb-4">Select a Game</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {query.data.map((game) => (
          <GameCard key={game.game_id} game={game} onSelect={onSelect} blindMode={blindMode} />
        ))}
      </div>
    </div>
  )
}
