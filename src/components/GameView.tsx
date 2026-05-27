// src/components/GameView.tsx
// PDX-28: Responsive shell composing all components.
// PDX-36: Parallel stats fetch from paradox-stats on tick change (interval-based).
// PDX-39: TeamStatsPanel + PlayerStatsPanel wired below game state panel.

import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TimelineScrubber } from './TimelineScrubber'
import { ScorePanel } from './ScorePanel'
import { DownDistance } from './DownDistance'
import { PlayDescription } from './PlayDescription'
import { WinProbChart } from './WinProbChart'
import { TeamStatsPanel } from './TeamStatsPanel'
import { PlayerStatsPanel } from './PlayerStatsPanel'
import { ErrorBoundary } from './ErrorBoundary'
import { getTimeline, MOCK_MODE } from '../api/client'
import { fetchGameStats } from '../api/stats'
import type { PlaySnapshot } from '../api/schemas'
import type { StatsResponse } from '../api/stats'

// Poll every 100ms so stats update live while scrubbing, not just on release.
const STATS_INTERVAL_MS = 100

interface GameViewProps {
  gameId: string
  onBack: () => void
  onGoToLab: () => void
}

function NavMenu({ onGoToGames, onGoToLab }: { onGoToGames: () => void; onGoToLab: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 cursor-pointer transition-colors"
        aria-label="Navigation menu"
        aria-expanded={open}
      >
        <svg width="18" height="14" viewBox="0 0 18 14" fill="currentColor">
          <rect width="18" height="2" rx="1" />
          <rect y="6" width="18" height="2" rx="1" />
          <rect y="12" width="18" height="2" rx="1" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1.5 z-20 bg-gray-800 border border-gray-700/60 rounded-lg shadow-xl overflow-hidden min-w-[180px]">
            <button
              onClick={() => { setOpen(false); onGoToGames() }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors cursor-pointer"
            >
              Game Selection
            </button>
            <div className="border-t border-gray-700/60" />
            <button
              onClick={() => { setOpen(false); onGoToLab() }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors cursor-pointer"
            >
              The Lab
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-2 border border-gray-700/60">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-4 bg-gray-700 rounded animate-pulse" style={{ width: `${70 + (i % 3) * 10}%` }} />
      ))}
    </div>
  )
}

export function GameView({ gameId, onBack, onGoToLab }: GameViewProps) {
  const [currentPlay, setCurrentPlay] = useState<PlaySnapshot | null>(null)
  const [currentTick, setCurrentTick] = useState(0)
  const [statsData, setStatsData] = useState<StatsResponse | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const latestTickRef = useRef(currentTick)
  const lastFetchedTickRef = useRef(-1)
  const firstLoadDoneRef = useRef(false)

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

  // Keep latestTickRef current so the interval always fetches the most recent position.
  useEffect(() => {
    latestTickRef.current = currentTick
  }, [currentTick])

  // Reset all stats state when the game changes.
  useEffect(() => {
    abortRef.current?.abort()
    lastFetchedTickRef.current = -1
    firstLoadDoneRef.current = false
    setStatsData(null)
    setStatsError(false)
    setStatsLoading(false)
  }, [gameId])

  // Interval-based stats fetch: polls every 100ms and fetches only when the tick
  // has moved since the last fetch. AbortController cancels any in-flight request
  // before starting the next, so stale responses never overwrite fresh ones.
  // Skeleton shows only for the initial load; subsequent updates swap data in place.
  useEffect(() => {
    if (MOCK_MODE) return

    const doFetch = async (tick: number) => {
      if (tick === lastFetchedTickRef.current) return
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      const { signal } = abortRef.current
      lastFetchedTickRef.current = tick
      if (!firstLoadDoneRef.current) setStatsLoading(true)
      setStatsError(false)
      try {
        const stats = await fetchGameStats(gameId, tick, signal)
        if (!signal.aborted) {
          firstLoadDoneRef.current = true
          setStatsData(stats)
          setStatsLoading(false)
        }
      } catch (err) {
        if (!signal.aborted && (err as Error).name !== 'AbortError') {
          lastFetchedTickRef.current = -1
          setStatsData(null)
          setStatsError(true)
          setStatsLoading(false)
        }
      }
    }

    doFetch(latestTickRef.current)
    const id = setInterval(() => doFetch(latestTickRef.current), STATS_INTERVAL_MS)
    return () => {
      clearInterval(id)
      abortRef.current?.abort()
    }
  }, [gameId])

  function handleTickChange(tick: number, play: PlaySnapshot | null) {
    setCurrentTick(tick)
    setCurrentPlay(play)
  }

  // Chart click: only update tick — scrubber's value sync effect derives + propagates the play.
  function handleChartSeek(tick: number) {
    setCurrentTick(tick)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="relative flex items-center px-4 py-3 bg-gray-900 border-b border-gray-700/60">
        <NavMenu onGoToGames={onBack} onGoToLab={onGoToLab} />
        <div className="absolute inset-x-0 flex justify-center pointer-events-none">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {awayTeam} <span className="text-gray-600 font-normal mx-1">@</span> {homeTeam}
          </h1>
        </div>
        <span className="ml-auto text-xs text-gray-600 font-mono">{gameId}</span>
      </header>

      <main className="flex flex-col gap-4 p-4 flex-1">
        <ErrorBoundary>
          <div className="bg-gray-900 rounded-lg border border-gray-700/60">
            <TimelineScrubber gameId={gameId} value={currentTick} onTickChange={handleTickChange} />
            <WinProbChart
              gameId={gameId}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              currentTick={currentTick}
              onTickChange={handleChartSeek}
            />
          </div>

          {/* Game state panels — directly below the visual block */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ScorePanel
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              play={currentPlay}
            />
            <DownDistance play={currentPlay} />
            <PlayDescription play={currentPlay} />
          </div>

          {/* Stats panels — skeleton only on initial load; subsequent updates swap in place */}
          {statsLoading ? (
            <StatsSkeleton />
          ) : statsData ? (
            <>
              <TeamStatsPanel
                homeTeam={statsData.home_team}
                awayTeam={statsData.away_team}
                homeStats={statsData.team.home}
                awayStats={statsData.team.away}
              />
              <PlayerStatsPanel
                homeTeam={statsData.home_team}
                awayTeam={statsData.away_team}
                homePlayers={statsData.players.home}
                awayPlayers={statsData.players.away}
              />
            </>
          ) : statsError ? (
            <div className="text-xs text-gray-400 text-center bg-gray-800 rounded-lg p-4 min-h-[160px] flex items-center justify-center">Stats unavailable</div>
          ) : null}
        </ErrorBoundary>
      </main>
    </div>
  )
}
