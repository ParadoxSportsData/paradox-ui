// src/components/GameSelector.tsx
// PDX-23: Lists games from /games. Renders a card grid.
// PDX-54: OT badge on cards when duration > 3600.
// PDX-55: blindMode masks final scores until user reveals them.
// PDX-83: Human-readable game date, week label, FINAL/FINAL—OT status, team display names.

import { useQuery } from '@tanstack/react-query'
import { listGames } from '../api/client'
import { getDisplayName } from '../lib/nflTeams'
import type { GameSummary } from '../api/schemas'

interface GameSelectorProps {
  onSelect: (gameId: string) => void
  blindMode: boolean
}

// formatGameDate converts an ISO-8601 date string to a human-readable label.
// Appends Z to force UTC parsing so negative-offset timezones don't shift to prior day.
function formatGameDate(isoDate: string | undefined, week: number | undefined): string {
  if (!isoDate) return week != null ? `Week ${week}` : ''
  const date = new Date(isoDate.endsWith('Z') ? isoDate : `${isoDate}Z`)
  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
  return week != null ? `${formatted} — Week ${week}` : formatted
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
  const awayDisplay = getDisplayName(game.away_team)
  const homeDisplay = getDisplayName(game.home_team)
  const dateLabel = formatGameDate(game.game_date, game.week)

  return (
    <button
      onClick={() => onSelect(game.game_id)}
      className="text-left bg-gray-800 rounded-lg p-4 cursor-pointer border border-gray-700/50 hover:ring-2 hover:ring-blue-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/40 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-150"
    >
      {/* Date + week */}
      {dateLabel && (
        <div className="text-xs text-gray-500 mb-1.5">{dateLabel}</div>
      )}

      {/* Matchup */}
      <div className="text-base font-bold text-white leading-tight">
        {awayDisplay}
        <span className="text-gray-500 font-normal"> @ </span>
        {homeDisplay}
      </div>

      {/* Score */}
      <div className="text-2xl font-mono mt-2">
        {blindMode ? (
          <span className="text-blue-300 blur-md select-none" aria-hidden="true">00 – 00</span>
        ) : (
          <span className="text-blue-300">{game.home_score} – {game.away_score}</span>
        )}
      </div>

      {/* Status badge row */}
      <div className="flex items-center gap-2 mt-2">
        {isOT ? (
          <>
            <span className="text-xs font-semibold text-gray-300 tracking-wide">FINAL</span>
            <span className="text-xs font-mono bg-amber-900/60 text-amber-400 border border-amber-700/50 px-1.5 py-0.5 rounded">
              OT
            </span>
          </>
        ) : (
          <span className="text-xs font-semibold text-gray-300 tracking-wide">FINAL</span>
        )}
      </div>
    </button>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-gray-800 rounded-lg p-4 animate-pulse">
      <div className="h-3 bg-gray-700 rounded w-1/2 mb-2" />
      <div className="h-5 bg-gray-600 rounded w-3/4 mb-2" />
      <div className="h-7 bg-gray-600 rounded w-1/2 mb-2" />
      <div className="h-4 bg-gray-700 rounded w-1/4" />
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
      <h2 className="text-xl font-semibold text-gray-100 mb-4">Select a Game</h2>
      {query.data.length === 0 ? (
        <p className="text-gray-500 text-sm">No games found. Start the server and load a game file.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {query.data.map((game) => (
            <GameCard key={game.game_id} game={game} onSelect={onSelect} blindMode={blindMode} />
          ))}
        </div>
      )}
    </div>
  )
}
