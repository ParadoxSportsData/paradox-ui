// src/components/PlayerStatsPanel.tsx
// PDX-38: Position-grouped player stats for both teams.
// Pure display: no API calls. Sections omitted entirely when both teams have no players.

import type { QBStats, RBStats, WRTEStats, KStats, PlayerGroup } from '../api/stats'

interface PlayerStatsPanelProps {
  homeTeam: string
  awayTeam: string
  homePlayers: PlayerGroup
  awayPlayers: PlayerGroup
}

function fmtRating(r: number | null): string {
  return r === null ? '—' : r.toFixed(1)
}

function fmtFgLong(long: number): string {
  return long === 0 ? '—' : String(long)
}

// ── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label, cols }: { label: string; cols: string[] }) {
  return (
    <>
      <div className="text-xs text-blue-400 font-semibold mt-3 mb-1 border-b border-gray-700 pb-0.5">
        {label}
      </div>
      <div className={`grid gap-1 text-xs text-gray-500 mb-0.5`}
        style={{ gridTemplateColumns: `8rem repeat(${cols.length}, minmax(0,1fr))` }}
      >
        <span>Player</span>
        {cols.map((c) => <span key={c} className="text-center">{c}</span>)}
      </div>
    </>
  )
}

function TeamLabel({ abbr }: { abbr: string }) {
  return (
    <div className="text-xs text-gray-500 font-mono mt-1 mb-0.5">{abbr}</div>
  )
}

// ── QB rows ──────────────────────────────────────────────────────────────────

function QBRow({ qb }: { qb: QBStats }) {
  return (
    <div className="grid gap-1 text-sm"
      style={{ gridTemplateColumns: '8rem repeat(6, minmax(0,1fr))' }}
    >
      <span className="text-white truncate">{qb.name}</span>
      <span className="text-center text-gray-300">{qb.completions}/{qb.attempts}</span>
      <span className="text-center text-gray-300">{qb.pass_yards}</span>
      <span className="text-center text-gray-300">{qb.pass_tds}</span>
      <span className="text-center text-gray-300">{qb.interceptions}</span>
      <span className="text-center text-gray-300">{fmtRating(qb.passer_rating)}</span>
      <span className="text-center text-gray-300">{qb.sacks_taken}</span>
    </div>
  )
}

// ── RB rows ──────────────────────────────────────────────────────────────────

function RBRow({ rb }: { rb: RBStats }) {
  return (
    <div className="grid gap-1 text-sm"
      style={{ gridTemplateColumns: '8rem repeat(6, minmax(0,1fr))' }}
    >
      <span className="text-white truncate">{rb.name}</span>
      <span className="text-center text-gray-300">{rb.carries}</span>
      <span className="text-center text-gray-300">{rb.rush_yards}</span>
      <span className="text-center text-gray-300">{rb.rush_tds}</span>
      <span className="text-center text-gray-300">{rb.receptions}</span>
      <span className="text-center text-gray-300">{rb.rec_yards}</span>
      <span className="text-center text-gray-300">{rb.rec_tds}</span>
    </div>
  )
}

// ── WR/TE rows ───────────────────────────────────────────────────────────────

function WRTERow({ wr }: { wr: WRTEStats }) {
  return (
    <div className="grid gap-1 text-sm"
      style={{ gridTemplateColumns: '8rem repeat(4, minmax(0,1fr))' }}
    >
      <span className="text-white truncate">{wr.name}</span>
      <span className="text-center text-gray-300">{wr.targets}</span>
      <span className="text-center text-gray-300">{wr.receptions}</span>
      <span className="text-center text-gray-300">{wr.rec_yards}</span>
      <span className="text-center text-gray-300">{wr.rec_tds}</span>
    </div>
  )
}

// ── Kicker rows ──────────────────────────────────────────────────────────────

function KRow({ k }: { k: KStats }) {
  return (
    <div className="grid gap-1 text-sm"
      style={{ gridTemplateColumns: '8rem repeat(3, minmax(0,1fr))' }}
    >
      <span className="text-white truncate">{k.name}</span>
      <span className="text-center text-gray-300">{k.fg_made}/{k.fg_att}</span>
      <span className="text-center text-gray-300">{fmtFgLong(k.fg_long)}</span>
      <span className="text-center text-gray-300">{k.xp_made}/{k.xp_att}</span>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export function PlayerStatsPanel({ homeTeam, awayTeam, homePlayers, awayPlayers }: PlayerStatsPanelProps) {
  const hasQBs = homePlayers.qb.length > 0 || awayPlayers.qb.length > 0
  const hasRBs = homePlayers.rb.length > 0 || awayPlayers.rb.length > 0
  const hasWRTEs = homePlayers.wr_te.length > 0 || awayPlayers.wr_te.length > 0
  const hasKickers = homePlayers.k.length > 0 || awayPlayers.k.length > 0

  if (!hasQBs && !hasRBs && !hasWRTEs && !hasKickers) {
    return null
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      {hasQBs && (
        <>
          <SectionHeader label="QBs" cols={['Comp/Att', 'Yds', 'TD', 'INT', 'Rtg', 'Sck']} />
          {homePlayers.qb.length > 0 && (
            <>
              <TeamLabel abbr={homeTeam} />
              {homePlayers.qb.map((qb) => <QBRow key={qb.player_id} qb={qb} />)}
            </>
          )}
          {awayPlayers.qb.length > 0 && (
            <>
              <TeamLabel abbr={awayTeam} />
              {awayPlayers.qb.map((qb) => <QBRow key={qb.player_id} qb={qb} />)}
            </>
          )}
        </>
      )}

      {hasRBs && (
        <>
          <SectionHeader label="RBs" cols={['Car', 'Rush Yds', 'Rush TD', 'Rec', 'Rec Yds', 'Rec TD']} />
          {homePlayers.rb.length > 0 && (
            <>
              <TeamLabel abbr={homeTeam} />
              {homePlayers.rb.map((rb) => <RBRow key={rb.player_id} rb={rb} />)}
            </>
          )}
          {awayPlayers.rb.length > 0 && (
            <>
              <TeamLabel abbr={awayTeam} />
              {awayPlayers.rb.map((rb) => <RBRow key={rb.player_id} rb={rb} />)}
            </>
          )}
        </>
      )}

      {hasWRTEs && (
        <>
          <SectionHeader label="WRs / TEs" cols={['Tar', 'Rec', 'Yds', 'TD']} />
          {homePlayers.wr_te.length > 0 && (
            <>
              <TeamLabel abbr={homeTeam} />
              {homePlayers.wr_te.map((wr) => <WRTERow key={wr.player_id} wr={wr} />)}
            </>
          )}
          {awayPlayers.wr_te.length > 0 && (
            <>
              <TeamLabel abbr={awayTeam} />
              {awayPlayers.wr_te.map((wr) => <WRTERow key={wr.player_id} wr={wr} />)}
            </>
          )}
        </>
      )}

      {hasKickers && (
        <>
          <SectionHeader label="Kickers" cols={['FG', 'Long', 'XP']} />
          {homePlayers.k.length > 0 && (
            <>
              <TeamLabel abbr={homeTeam} />
              {homePlayers.k.map((k) => <KRow key={k.player_id} k={k} />)}
            </>
          )}
          {awayPlayers.k.length > 0 && (
            <>
              <TeamLabel abbr={awayTeam} />
              {awayPlayers.k.map((k) => <KRow key={k.player_id} k={k} />)}
            </>
          )}
        </>
      )}
    </div>
  )
}
