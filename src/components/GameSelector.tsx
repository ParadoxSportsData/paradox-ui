// src/components/GameSelector.tsx
// PDX-23: Lists games from /games. Renders a card grid.
// PDX-54: OT badge on cards when duration > 3600.
// PDX-55: blindMode masks final scores until user reveals them.
// PDX-79: By-team schedule view — team picker → week-by-week schedule with bye rows and playoff rounds.
// PDX-83: Human-readable game date, week label, FINAL/FINAL—OT status, team display names.
// PDX-98: Season picker — teams → years → schedule 3-step navigation.

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listGames } from '../api/client'
import { getDisplayName, teamLogoUrl } from '../lib/nflTeams'
import { buildTeamSchedule, formatWeekLabel, getAllTeams, getSeasonsForTeam } from '../lib/schedule'
import type { GameSummary } from '../api/schemas'
import type { ScheduleEntry } from '../lib/schedule'

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

function GameCard({ game, onSelect, blindMode }: { game: GameSummary; onSelect: (id: string) => void; blindMode: boolean }) {
  const isOT = game.duration > 3600
  const awayDisplay = getDisplayName(game.away_team)
  const homeDisplay = getDisplayName(game.home_team)
  const dateLabel = formatGameDate(game.game_date, game.week)

  return (
    <button
      onClick={() => onSelect(game.game_id)}
      className="text-left bg-gray-800 rounded-lg p-4 cursor-pointer border border-gray-700/50 hover:ring-2 hover:ring-blue-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/40 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-150"
    >
      {dateLabel && <div className="text-xs text-gray-500 mb-1.5">{dateLabel}</div>}
      <div className="flex items-center gap-1.5 text-base font-bold text-white leading-tight flex-wrap">
        <img src={teamLogoUrl(game.away_team)} alt="" className="w-6 h-6 object-contain flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        {awayDisplay}
        <span className="text-gray-500 font-normal mx-0.5">@</span>
        <img src={teamLogoUrl(game.home_team)} alt="" className="w-6 h-6 object-contain flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        {homeDisplay}
      </div>
      <div className="text-2xl font-mono mt-2">
        {blindMode ? (
          <span className="text-blue-300 blur-md select-none" aria-hidden="true">00 – 00</span>
        ) : (
          <span className="text-blue-300">{game.home_score} – {game.away_score}</span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-2">
        {isOT ? (
          <>
            <span className="text-xs font-semibold text-gray-300 tracking-wide">FINAL</span>
            <span className="text-xs font-mono bg-amber-900/60 text-amber-400 border border-amber-700/50 px-1.5 py-0.5 rounded">OT</span>
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

function TeamButton({ abbr, onSelect }: { abbr: string; onSelect: (abbr: string) => void }) {
  return (
    <button
      onClick={() => onSelect(abbr)}
      className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2.5 border border-gray-700/50 hover:ring-2 hover:ring-blue-500 hover:border-blue-500/50 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-150 text-sm font-medium text-gray-200 hover:text-white cursor-pointer"
    >
      <img
        src={teamLogoUrl(abbr)}
        alt=""
        className="w-6 h-6 object-contain flex-shrink-0"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
      {getDisplayName(abbr)}
    </button>
  )
}

function TeamPicker({ teams, filter, onFilterChange, onSelect }: {
  teams: string[]
  filter: string
  onFilterChange: (v: string) => void
  onSelect: (abbr: string) => void
}) {
  const filtered = filter
    ? teams.filter(t =>
        getDisplayName(t).toLowerCase().includes(filter.toLowerCase()) ||
        t.toLowerCase().includes(filter.toLowerCase())
      )
    : teams

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-100 mb-4">Select a Team</h2>
      <input
        type="text"
        value={filter}
        onChange={e => onFilterChange(e.target.value)}
        placeholder="Filter teams…"
        className="w-full mb-4 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm">No teams match &ldquo;{filter}&rdquo;</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {filtered.map(abbr => (
            <TeamButton key={abbr} abbr={abbr} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  )
}

function ScheduleRow({ entry, onSelect, blindMode }: {
  entry: ScheduleEntry
  onSelect: (id: string) => void
  blindMode: boolean
}) {
  const label = formatWeekLabel(entry.weekLabel)

  if (!entry.game) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 select-none">
        <span className="w-32 text-xs font-mono shrink-0">{label}</span>
        <span className="text-sm italic">BYE</span>
      </div>
    )
  }

  const { game, isHome, opponent } = entry
  const isOT       = game.duration > 3600
  const teamScore  = isHome ? game.home_score : game.away_score
  const oppScore   = isHome ? game.away_score : game.home_score

  return (
    <button
      onClick={() => onSelect(game.game_id)}
      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700/50 hover:ring-2 hover:ring-blue-500 hover:border-blue-500/50 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-150 text-left cursor-pointer"
    >
      <span className="w-32 text-xs font-mono text-gray-400 shrink-0">{label}</span>
      <span className="text-xs text-gray-500 shrink-0 w-5">{isHome ? 'vs' : '@'}</span>
      <img
        src={teamLogoUrl(opponent)}
        alt=""
        className="w-5 h-5 object-contain flex-shrink-0"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
      <span className="flex-1 text-sm font-medium text-gray-200">{getDisplayName(opponent)}</span>
      <div className="flex items-center gap-1.5 shrink-0">
        {blindMode ? (
          <span className="text-sm font-mono text-blue-300 blur-sm select-none" aria-hidden="true">00–00</span>
        ) : (
          <span className="text-sm font-mono text-blue-300">{teamScore}–{oppScore}</span>
        )}
        {isOT && (
          <span className="text-xs font-mono bg-amber-900/60 text-amber-400 border border-amber-700/50 px-1 py-0.5 rounded">OT</span>
        )}
        <span className="text-xs text-gray-500 ml-0.5">FINAL</span>
      </div>
    </button>
  )
}

function scheduleRowKey(entry: ScheduleEntry): string {
  if (!entry.game) {
    const w = entry.weekLabel.kind === 'bye' ? entry.weekLabel.week : 0
    return `bye-${w}`
  }
  return entry.game.game_id
}

function YearPicker({ abbr, seasons, onBack, onSelect }: {
  abbr: string
  seasons: number[]
  onBack: () => void
  onSelect: (season: number) => void
}) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="text-xs font-mono px-2.5 py-1.5 rounded bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors cursor-pointer shrink-0"
        >
          ← All Teams
        </button>
        <img
          src={teamLogoUrl(abbr)}
          alt=""
          className="w-7 h-7 object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <h2 className="text-xl font-semibold text-gray-100">{getDisplayName(abbr)}</h2>
      </div>
      {seasons.length === 0 ? (
        <p className="text-gray-500 text-sm">No seasons available for this team.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {seasons.map(season => (
            <button
              key={season}
              onClick={() => onSelect(season)}
              className="px-5 py-3 rounded-lg bg-gray-800 border border-gray-700/50 text-gray-200 font-mono font-semibold hover:ring-2 hover:ring-blue-500 hover:border-blue-500/50 hover:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-150 cursor-pointer"
            >
              {season}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function TeamScheduleView({ abbr, season, schedule, onBack, onSelect, blindMode }: {
  abbr: string
  season: number
  schedule: ScheduleEntry[]
  onBack: () => void
  onSelect: (id: string) => void
  blindMode: boolean
}) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="text-xs font-mono px-2.5 py-1.5 rounded bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors cursor-pointer shrink-0"
        >
          ← {season}
        </button>
        <img
          src={teamLogoUrl(abbr)}
          alt=""
          className="w-7 h-7 object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <h2 className="text-xl font-semibold text-gray-100">{getDisplayName(abbr)} &mdash; {season}</h2>
      </div>
      {schedule.length === 0 ? (
        <p className="text-gray-500 text-sm">No games found for this team.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {schedule.map(entry => (
            <ScheduleRow key={scheduleRowKey(entry)} entry={entry} onSelect={onSelect} blindMode={blindMode} />
          ))}
        </div>
      )}
    </div>
  )
}

type SelectorStep =
  | { step: 'teams' }
  | { step: 'years'; team: string }
  | { step: 'schedule'; team: string; season: number }

export function GameSelector({ onSelect, blindMode }: GameSelectorProps) {
  const [selectorStep, setSelectorStep] = useState<SelectorStep>({ step: 'teams' })
  const [filter, setFilter]             = useState('')
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

  if (query.data.length === 0) {
    return (
      <div className="p-6">
        <p className="text-gray-500 text-sm">No games found. Start the server and load a game file.</p>
      </div>
    )
  }

  if (selectorStep.step === 'years') {
    const seasons = getSeasonsForTeam(query.data, selectorStep.team)
    return (
      <YearPicker
        abbr={selectorStep.team}
        seasons={seasons}
        onBack={() => setSelectorStep({ step: 'teams' })}
        onSelect={(season) => setSelectorStep({ step: 'schedule', team: selectorStep.team, season })}
      />
    )
  }

  if (selectorStep.step === 'schedule') {
    const schedule = buildTeamSchedule(query.data, selectorStep.team, selectorStep.season)
    return (
      <TeamScheduleView
        abbr={selectorStep.team}
        season={selectorStep.season}
        schedule={schedule}
        onBack={() => setSelectorStep({ step: 'years', team: selectorStep.team })}
        onSelect={onSelect}
        blindMode={blindMode}
      />
    )
  }

  const teams = getAllTeams(query.data)
  return (
    <TeamPicker
      teams={teams}
      filter={filter}
      onFilterChange={setFilter}
      onSelect={(team) => setSelectorStep({ step: 'years', team })}
    />
  )
}

// GameCard is exported for potential reuse in other views.
export { GameCard }
