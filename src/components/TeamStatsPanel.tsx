// src/components/TeamStatsPanel.tsx
// PDX-37: Two-column team stats comparison — traditional box score layout.
// PDX-73: Away on LEFT, home on RIGHT — matches broadcast convention and WinProbChart layout.
// Pure display: no API calls, no hooks. Caller handles loading/null state.

import type { TeamStats } from '../api/stats'

interface TeamStatsPanelProps {
  homeTeam: string
  awayTeam: string
  homeStats: TeamStats
  awayStats: TeamStats
}

function fmt3rdDown(conversions: number, attempts: number): string {
  if (attempts === 0) return '—'
  const pct = Math.round((conversions / attempts) * 100)
  return `${conversions}/${attempts} (${pct}%)`
}

function fmtEpa(epa: number): string {
  return epa.toFixed(1)
}

function fmtCompAtt(completions: number, attempts: number): string {
  return `${completions}/${attempts}`
}

interface StatRow {
  label: string
  home: string | number
  away: string | number
}

function buildRows(home: TeamStats, away: TeamStats): StatRow[] {
  return [
    { label: 'Pass Yds', home: home.pass_yards, away: away.pass_yards },
    {
      label: 'Comp/Att',
      home: fmtCompAtt(home.completions, home.attempts),
      away: fmtCompAtt(away.completions, away.attempts),
    },
    { label: 'Pass TDs', home: home.pass_tds, away: away.pass_tds },
    { label: 'INTs', home: home.interceptions, away: away.interceptions },
    { label: 'Rush Yds', home: home.rush_yards, away: away.rush_yards },
    { label: 'Carries', home: home.carries, away: away.carries },
    { label: 'Rush TDs', home: home.rush_tds, away: away.rush_tds },
    { label: 'Turnovers', home: home.turnovers, away: away.turnovers },
    { label: 'Sacks Allowed', home: home.sacks_allowed, away: away.sacks_allowed },
    { label: 'Sacks', home: home.sacks, away: away.sacks },
    { label: 'First Downs', home: home.first_downs, away: away.first_downs },
    {
      label: '3rd Down',
      home: fmt3rdDown(home.third_down_conversions, home.third_down_attempts),
      away: fmt3rdDown(away.third_down_conversions, away.third_down_attempts),
    },
    { label: 'EPA', home: fmtEpa(home.epa), away: fmtEpa(away.epa) },
  ]
}

export function TeamStatsPanel({ homeTeam, awayTeam, homeStats, awayStats }: TeamStatsPanelProps) {
  const rows = buildRows(homeStats, awayStats)

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700/60">
      {/* Header: away LEFT, home RIGHT — broadcast convention */}
      <div className="grid grid-cols-3 font-mono mb-2 pb-2 border-b border-gray-700">
        <span className="text-right text-sm font-semibold text-red-400">{awayTeam}</span>
        <span className="text-center text-xs text-gray-500 self-end">STAT</span>
        <span className="text-left text-sm font-semibold text-blue-400">{homeTeam}</span>
      </div>

      {/* Stat rows: away LEFT, label CENTER, home RIGHT */}
      {rows.map((row) => (
        <div
          key={row.label}
          className="grid grid-cols-3 text-sm py-0.5 even:bg-gray-900/40 hover:bg-gray-700/50 rounded"
        >
          <span className="text-right text-white font-mono">{row.away}</span>
          <span className="text-center text-gray-500 text-xs">{row.label}</span>
          <span className="text-left text-white font-mono">{row.home}</span>
        </div>
      ))}
    </div>
  )
}
