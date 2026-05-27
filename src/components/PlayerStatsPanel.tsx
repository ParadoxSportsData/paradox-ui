// src/components/PlayerStatsPanel.tsx
// PDX-38: Position-grouped player stats for both teams.
// PDX-73: Two-column layout — away LEFT, home RIGHT.
// PDX-75: Table format per position group (header row + one data row per player).
//          Keeps PDX-73 spatial split; replaces compact 2-line cards with columnar tables
//          for easier side-by-side production comparison.
// Pure display: no API calls. Sections omitted when both teams have no players.

import type { QBStats, RBStats, WRTEStats, KStats, PlayerGroup } from '../api/stats'
import { getTeamColor } from '../lib/nflTeams'

interface PlayerStatsPanelProps {
  homeTeam: string
  awayTeam: string
  homePlayers: PlayerGroup
  awayPlayers: PlayerGroup
}

function fmtRating(r: number | null): string {
  return r === null ? '—' : r.toFixed(1)
}

function fmtName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length < 2) return name
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`
}

// ── Shared table row styles ───────────────────────────────────────────────────

const HDR = 'grid gap-x-1.5 text-[10px] text-gray-500 pb-0.5 border-b border-gray-700/60 mb-0.5'
const ROW = 'grid gap-x-1.5 text-xs py-px'
const NUM = 'text-right font-mono text-white tabular-nums'

// ── Position group tables ────────────────────────────────────────────────────

function QBTable({ qbs }: { qbs: QBStats[] }) {
  const cols = 'grid-cols-[minmax(0,1fr)_32px_32px_20px_24px_36px]'
  return (
    <div className="mb-2">
      <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-1">QB</div>
      <div className={`${HDR} ${cols}`}>
        <span>Name</span>
        <span className="text-right">C/ATT</span>
        <span className="text-right">YDS</span>
        <span className="text-right">TD</span>
        <span className="text-right">INT</span>
        <span className="text-right">RTG</span>
      </div>
      {qbs.map(qb => (
        <div key={qb.player_id} className={`${ROW} ${cols}`}>
          <span className="text-white truncate">{fmtName(qb.name)}</span>
          <span className={NUM}>{qb.completions}/{qb.attempts}</span>
          <span className={NUM}>{qb.pass_yards}</span>
          <span className={NUM}>{qb.pass_tds}</span>
          <span className={NUM}>{qb.interceptions}</span>
          <span className={NUM}>{fmtRating(qb.passer_rating)}</span>
        </div>
      ))}
    </div>
  )
}

function RBTable({ rbs }: { rbs: RBStats[] }) {
  const cols = 'grid-cols-[minmax(0,1fr)_28px_28px_20px_28px_28px]'
  return (
    <div className="mb-2">
      <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-1">RB</div>
      <div className={`${HDR} ${cols}`}>
        <span>Name</span>
        <span className="text-right">CAR</span>
        <span className="text-right">YDS</span>
        <span className="text-right">TD</span>
        <span className="text-right">REC</span>
        <span className="text-right">RYD</span>
      </div>
      {rbs.map(rb => (
        <div key={rb.player_id} className={`${ROW} ${cols}`}>
          <span className="text-white truncate">{fmtName(rb.name)}</span>
          <span className={NUM}>{rb.carries}</span>
          <span className={NUM}>{rb.rush_yards}</span>
          <span className={NUM}>{rb.rush_tds + rb.rec_tds}</span>
          <span className={NUM}>{rb.receptions}</span>
          <span className={NUM}>{rb.rec_yards}</span>
        </div>
      ))}
    </div>
  )
}

function WRTable({ wrs }: { wrs: WRTEStats[] }) {
  const cols = 'grid-cols-[minmax(0,1fr)_28px_28px_28px_20px]'
  return (
    <div className="mb-2">
      <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-1">WR / TE</div>
      <div className={`${HDR} ${cols}`}>
        <span>Name</span>
        <span className="text-right">TGT</span>
        <span className="text-right">REC</span>
        <span className="text-right">YDS</span>
        <span className="text-right">TD</span>
      </div>
      {wrs.map(wr => (
        <div key={wr.player_id} className={`${ROW} ${cols}`}>
          <span className="text-white truncate">{fmtName(wr.name)}</span>
          <span className={NUM}>{wr.targets}</span>
          <span className={NUM}>{wr.receptions}</span>
          <span className={NUM}>{wr.rec_yards}</span>
          <span className={NUM}>{wr.rec_tds}</span>
        </div>
      ))}
    </div>
  )
}

function KTable({ ks }: { ks: KStats[] }) {
  const cols = 'grid-cols-[minmax(0,1fr)_auto_auto]'
  return (
    <div className="mb-2">
      <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-1">K</div>
      <div className={`${HDR} ${cols}`}>
        <span>Name</span>
        <span className="text-right">FG</span>
        <span className="text-right">XP</span>
      </div>
      {ks.map(k => (
        <div key={k.player_id} className={`${ROW} ${cols}`}>
          <span className="text-white truncate">{fmtName(k.name)}</span>
          <span className={NUM}>{k.fg_made}/{k.fg_att}{k.fg_long > 0 ? ` (${k.fg_long})` : ''}</span>
          <span className={NUM}>{k.xp_made}/{k.xp_att}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export function PlayerStatsPanel({ homeTeam, awayTeam, homePlayers, awayPlayers }: PlayerStatsPanelProps) {
  const hasAny =
    homePlayers.qb.length > 0 || homePlayers.rb.length > 0 || homePlayers.wr_te.length > 0 || homePlayers.k.length > 0 ||
    awayPlayers.qb.length > 0 || awayPlayers.rb.length > 0 || awayPlayers.wr_te.length > 0 || awayPlayers.k.length > 0

  if (!hasAny) return null

  const hasQB = awayPlayers.qb.length > 0 || homePlayers.qb.length > 0
  const hasRB = awayPlayers.rb.length > 0 || homePlayers.rb.length > 0
  const hasWR = awayPlayers.wr_te.length > 0 || homePlayers.wr_te.length > 0
  const hasK  = awayPlayers.k.length > 0 || homePlayers.k.length > 0

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700/60">
      {/* Each position group is a paired row in the grid so CSS row-height
          alignment keeps both columns vertically in sync regardless of player count. */}
      <div className="grid grid-cols-2">
        {/* Team name headers */}
        <div className="pr-3 mb-1.5">
          <div className="text-xs font-mono font-semibold" style={{ color: getTeamColor(awayTeam) }}>{awayTeam}</div>
        </div>
        <div className="pl-3 border-l border-gray-700 mb-1.5">
          <div className="text-xs font-mono font-semibold" style={{ color: getTeamColor(homeTeam) }}>{homeTeam}</div>
        </div>

        {/* QB row */}
        {hasQB && <>
          <div className="pr-3">
            {awayPlayers.qb.length > 0 ? <QBTable qbs={awayPlayers.qb} /> : <div className="mb-2" />}
          </div>
          <div className="pl-3 border-l border-gray-700">
            {homePlayers.qb.length > 0 ? <QBTable qbs={homePlayers.qb} /> : <div className="mb-2" />}
          </div>
        </>}

        {/* RB row */}
        {hasRB && <>
          <div className="pr-3">
            {awayPlayers.rb.length > 0 ? <RBTable rbs={awayPlayers.rb} /> : <div className="mb-2" />}
          </div>
          <div className="pl-3 border-l border-gray-700">
            {homePlayers.rb.length > 0 ? <RBTable rbs={homePlayers.rb} /> : <div className="mb-2" />}
          </div>
        </>}

        {/* WR/TE row */}
        {hasWR && <>
          <div className="pr-3">
            {awayPlayers.wr_te.length > 0 ? <WRTable wrs={awayPlayers.wr_te} /> : <div className="mb-2" />}
          </div>
          <div className="pl-3 border-l border-gray-700">
            {homePlayers.wr_te.length > 0 ? <WRTable wrs={homePlayers.wr_te} /> : <div className="mb-2" />}
          </div>
        </>}

        {/* K row */}
        {hasK && <>
          <div className="pr-3">
            {awayPlayers.k.length > 0 ? <KTable ks={awayPlayers.k} /> : <div className="mb-2" />}
          </div>
          <div className="pl-3 border-l border-gray-700">
            {homePlayers.k.length > 0 ? <KTable ks={homePlayers.k} /> : <div className="mb-2" />}
          </div>
        </>}
      </div>
    </div>
  )
}
