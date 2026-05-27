// src/components/GameView.tsx
// PDX-28: Responsive shell composing all components.
// PDX-36: Parallel stats fetch from paradox-stats on tick change (debounced 150ms).
// Manages shared tick/play/stats state. Reads game metadata from cached timeline query.

import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TimelineScrubber } from './TimelineScrubber'
import { ScorePanel } from './ScorePanel'
import { DownDistance } from './DownDistance'
import { PlayDescription } from './PlayDescription'
import { WinProbChart } from './WinProbChart'
import { ErrorBoundary } from './ErrorBoundary'
import { getTimeline, MOCK_MODE } from '../api/client'
import { fetchGameStats } from '../api/stats'
import type { PlaySnapshot } from '../api/schemas'
import type { StatsResponse } from '../api/stats'

const STATS_DEBOUNCE_MS = 150

interface GameViewProps {
  gameId: string
  onBack: () => void
}

export function GameView({ gameId, onBack }: GameViewProps) {
  const [currentPlay, setCurrentPlay] = useState<PlaySnapshot | null>(null)
  const [currentTick, setCurrentTick] = useState(0)
  const [statsData, setStatsData] = useState<StatsResponse | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Read game metadata from cached timeline — no extra fetch
  const timelineQuery = useQuery({
    queryKey: ['timeline', gameId],
    queryFn: () => getTimeline(gameId),
  })

  // Guard against TanStack Query returning stale data from a previously cached game.
  // Only use the response if its game_id matches the current prop — prevents header
  // showing wrong team names during the transition to a newly selected game.
  const canonicalData = timelineQuery.data?.game_id === gameId ? timelineQuery.data : undefined
  const homeTeam = canonicalData?.home_team ?? '—'
  const awayTeam = canonicalData?.away_team ?? '—'

  // Debounced stats fetch: fires 150ms after tick settles.
  // Stats failure is silently handled — game state display is never broken by it.
  useEffect(() => {
    if (MOCK_MODE) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const stats = await fetchGameStats(gameId, currentTick)
        setStatsData(stats)
      } catch {
        setStatsData(null)
      }
    }, STATS_DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [gameId, currentTick])

  // Reset stats when game changes
  useEffect(() => {
    setStatsData(null)
  }, [gameId])

  function handleTickChange(tick: number, play: PlaySnapshot | null) {
    setCurrentTick(tick)
    setCurrentPlay(play)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-4 bg-gray-900 border-b border-gray-800">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
        >
          ← Back
        </button>
        <h1 className="text-lg font-semibold text-white">
          {awayTeam} @ {homeTeam}
        </h1>
        <span className="text-xs text-gray-500 font-mono ml-auto">{gameId}</span>
      </header>

      <main className="flex flex-col gap-4 p-4 flex-1" data-stats-ready={statsData !== null}>
        <ErrorBoundary>
          {/* Timeline scrubber — full width */}
          <div className="bg-gray-900 rounded-lg">
            <TimelineScrubber gameId={gameId} onTickChange={handleTickChange} />
          </div>

          {/* Panel row — stacked on mobile, 3-col on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ScorePanel homeTeam={homeTeam} awayTeam={awayTeam} play={currentPlay} />
            <DownDistance play={currentPlay} />
            <PlayDescription play={currentPlay} />
          </div>

          {/* Win probability chart — full width */}
          <WinProbChart
            gameId={gameId}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            currentTick={currentTick}
          />
        </ErrorBoundary>
      </main>
    </div>
  )
}
