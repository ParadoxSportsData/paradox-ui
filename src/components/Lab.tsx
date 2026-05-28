// src/components/Lab.tsx
// PDX-67: Scenario Simulator — port of paradox-platform/paradox-web/app/lab/page.tsx.
// Adapted: removed "use client", added onBack prop, replaced fetch with predictScenario().
// PDX-120: Extracted useScenarioPrediction hook, WinProbGauge component, footballUtils.

import { useState } from 'react'
import type { ScenarioRequest } from '../api/predict'
import { useScenarioPrediction } from '../hooks/useScenarioPrediction'
import { WinProbGauge } from './WinProbGauge'
import {
  formatTime,
  getFootballFieldPosition,
  getFieldZone,
  getFieldPositionColor,
  formatDown,
} from '../lib/footballUtils'
import { SECONDS_PER_QUARTER } from '../lib/nfl2011'

interface LabProps {
  onBack: () => void
}

function NavMenu({ onGoToGames }: { onGoToGames: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors cursor-pointer focus:outline-none focus:bg-gray-700 focus:text-white"
            >
              Game Selection
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function Lab({ onBack }: LabProps) {
  const [down, setDown] = useState(1)
  const [distance, setDistance] = useState(10)
  const [yardline, setYardline] = useState(50)
  const [quarter, setQuarter] = useState(4)
  const [timeRemainingQuarter, setTimeRemainingQuarter] = useState(SECONDS_PER_QUARTER)
  const [scoreDiff, setScoreDiff] = useState(0)
  const [isHomePossession, setIsHomePossession] = useState(true)
  const [eraSeason, setEraSeason] = useState(2024)
  const [eraWeek, setEraWeek] = useState(1)

  const scenario: ScenarioRequest = {
    down,
    distance,
    yardline_100: yardline,
    quarter,
    seconds_remaining_quarter: timeRemainingQuarter,
    score_differential: scoreDiff,
    is_home_possession: isHomePossession,
    era_season: eraSeason,
    era_week: eraWeek,
  }

  const { winProbability, otEra, loading, error } = useScenarioPrediction(scenario)

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="relative flex items-center px-4 py-3 bg-gray-900 border-b border-gray-700/60">
        <NavMenu onGoToGames={onBack} />
        <div className="absolute inset-x-0 flex justify-center pointer-events-none">
          <h1 className="text-2xl font-bold tracking-tight">
            The Lab <span className="text-purple-400 font-mono text-lg">Scenario Simulator</span>
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Controls */}
          <div className="space-y-6">
            {/* Quarter */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <label className="block text-sm font-semibold text-gray-300 mb-3">Quarter / Period</label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setQuarter(q); setTimeRemainingQuarter(SECONDS_PER_QUARTER) }}
                    className={`py-3 rounded-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      quarter === q
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {q <= 4 ? `Q${q}` : 'OT'}
                  </button>
                ))}
              </div>
            </div>

            {/* Down */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <label className="block text-sm font-semibold text-gray-300 mb-3">Down</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDown(d)}
                    className={`py-3 rounded-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      down === d
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Distance */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <label htmlFor="lab-distance" className="block text-sm font-semibold text-gray-300 mb-3">
                Distance to First Down: <span className="text-blue-400 text-xl">{distance} yards</span>
              </label>
              <div className="flex items-center gap-3">
                <button onClick={() => setDistance(Math.max(1, distance - 1))} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">−</button>
                <input id="lab-distance" type="range" min="1" max="99" value={distance} onChange={(e) => setDistance(Number(e.target.value))} className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                <button onClick={() => setDistance(Math.min(99, distance + 1))} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">+</button>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1"><span>1</span><span>50</span><span>99</span></div>
            </div>

            {/* Yardline */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <label htmlFor="lab-yardline" className="block text-sm font-semibold text-gray-300 mb-1">
                Ball Position:{' '}
                <span className={`text-xl font-bold ${getFieldPositionColor(yardline)}`}>
                  {getFootballFieldPosition(yardline)}
                </span>
              </label>
              <p className="text-xs text-gray-500 mb-3">{getFieldZone(yardline)}</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setYardline(Math.max(1, yardline - 1))} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">−</button>
                <input id="lab-yardline" type="range" min="1" max="99" value={yardline} onChange={(e) => setYardline(Number(e.target.value))} className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-600" />
                <button onClick={() => setYardline(Math.min(99, yardline + 1))} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">+</button>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span className="text-blue-400">Own Endzone</span>
                <span>50</span>
                <span className="text-red-400">Opp Endzone</span>
              </div>
            </div>

            {/* Time Remaining */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <label htmlFor="lab-time" className="block text-sm font-semibold text-gray-300 mb-3">
                Time Remaining in {quarter === 5 ? 'OT' : `Q${quarter}`}:{' '}
                <span className="text-amber-400 text-xl">{formatTime(timeRemainingQuarter)}</span>
              </label>
              <div className="flex items-center gap-3">
                <button onClick={() => setTimeRemainingQuarter(Math.max(0, timeRemainingQuarter - 1))} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">−</button>
                <input id="lab-time" type="range" min="0" max={SECONDS_PER_QUARTER} step="1" value={timeRemainingQuarter} onChange={(e) => setTimeRemainingQuarter(Number(e.target.value))} className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                <button onClick={() => setTimeRemainingQuarter(Math.min(SECONDS_PER_QUARTER, timeRemainingQuarter + 1))} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">+</button>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1"><span>0:00 (End)</span><span>7:30</span><span>15:00 (Start)</span></div>
            </div>

            {/* Score Differential */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <label htmlFor="lab-score-diff" className="block text-sm font-semibold text-gray-300 mb-3">
                Score Differential:{' '}
                <span className={`text-xl ml-1 ${scoreDiff > 0 ? 'text-green-400' : scoreDiff < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                  {scoreDiff > 0 ? '+' : ''}{scoreDiff}
                </span>
                <span className="text-sm text-gray-500 ml-2">({scoreDiff > 0 ? 'Winning' : scoreDiff < 0 ? 'Losing' : 'Tied'})</span>
              </label>
              <div className="flex items-center gap-3">
                <button onClick={() => setScoreDiff(Math.max(-50, scoreDiff - 1))} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">−</button>
                <input id="lab-score-diff" type="range" min="-50" max="50" value={scoreDiff} onChange={(e) => setScoreDiff(Number(e.target.value))} className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                <button onClick={() => setScoreDiff(Math.min(50, scoreDiff + 1))} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">+</button>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1"><span>-50</span><span>0 (Tied)</span><span>+50</span></div>
            </div>

            {/* Possession */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <label className="block text-sm font-semibold text-gray-300 mb-3">Possession</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setIsHomePossession(true)} className={`py-3 rounded-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${isHomePossession ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>Home</button>
                <button onClick={() => setIsHomePossession(false)} className={`py-3 rounded-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isHomePossession ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>Away</button>
              </div>
            </div>

            {/* Era */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <label htmlFor="lab-era-season" className="block text-sm font-semibold text-gray-300 mb-3">NFL Rule Era</label>
              <select
                id="lab-era-season"
                value={eraSeason}
                onChange={(e) => setEraSeason(Number(e.target.value))}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              >
                <option value={2024}>2024 (Mod. Short reg / Guaranteed playoffs)</option>
                <option value={2017}>2017 (Modified Short — all games)</option>
                <option value={2011}>2011 (Sudden Death reg / Modified playoffs)</option>
              </select>
              <label className="block text-sm font-semibold text-gray-300 mb-3">Game Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setEraWeek(1)} className={`py-3 rounded-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${eraWeek < 19 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>Regular Season</button>
                <button onClick={() => setEraWeek(20)} className={`py-3 rounded-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${eraWeek >= 19 ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>Playoffs</button>
              </div>
              {otEra && <p className="text-xs text-gray-500 mt-3">OT Rules: <span className="text-blue-400 font-mono">{otEra}</span></p>}
            </div>
          </div>

          {/* RIGHT: Win Probability Gauge */}
          <div className="lg:sticky lg:top-8 self-start">
            <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
              <h2 className="text-2xl font-bold mb-6 text-center text-gray-200">Win Probability</h2>

              <WinProbGauge winProbability={winProbability} loading={loading} error={error} />

              {/* Scenario Summary */}
              <div className="bg-gray-950 rounded-lg p-4 border border-gray-800 mb-6">
                <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Current Scenario</h3>
                <p className="text-lg font-bold text-white">
                  {quarter === 5 ? 'OT' : `Q${quarter}`} — {formatDown(down, distance)}
                </p>
                <p className={`text-sm font-semibold ${getFieldPositionColor(yardline)}`}>
                  {getFootballFieldPosition(yardline)} · {getFieldZone(yardline)}
                </p>
                <p className="text-sm text-gray-300 mt-2">{formatTime(timeRemainingQuarter)} remaining</p>
                <p className="text-sm text-gray-300">{scoreDiff > 0 ? 'Up' : scoreDiff < 0 ? 'Down' : 'Tied'} by {Math.abs(scoreDiff)}</p>
                <p className="text-sm text-gray-300">{isHomePossession ? 'Home' : 'Away'} possession</p>
                {quarter === 5 && otEra && (
                  <p className="text-xs text-purple-400 mt-2">OT Rules: {otEra}</p>
                )}
              </div>

              {/* Quick Presets */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Quick Scenarios</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setQuarter(4); setDown(4); setDistance(1); setYardline(1); setTimeRemainingQuarter(10); setScoreDiff(-4); setIsHomePossession(true); setEraSeason(2024); setEraWeek(1) }}
                    className="bg-gray-800 hover:bg-gray-700 text-white text-xs py-2 px-3 rounded transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    4th &amp; Goal
                  </button>
                  <button
                    onClick={() => { setQuarter(4); setDown(3); setDistance(10); setYardline(50); setTimeRemainingQuarter(120); setScoreDiff(0); setIsHomePossession(true); setEraSeason(2024); setEraWeek(1) }}
                    className="bg-gray-800 hover:bg-gray-700 text-white text-xs py-2 px-3 rounded transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Tied, 2-Min Warning
                  </button>
                  <button
                    onClick={() => { setQuarter(5); setDown(1); setDistance(10); setYardline(50); setTimeRemainingQuarter(SECONDS_PER_QUARTER); setScoreDiff(0); setIsHomePossession(true); setEraSeason(2011); setEraWeek(1) }}
                    className="bg-gray-800 hover:bg-gray-700 text-white text-xs py-2 px-3 rounded transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    OT 2011 (Sudden Death)
                  </button>
                  <button
                    onClick={() => { setQuarter(5); setDown(1); setDistance(10); setYardline(50); setTimeRemainingQuarter(SECONDS_PER_QUARTER); setScoreDiff(0); setIsHomePossession(true); setEraSeason(2024); setEraWeek(1) }}
                    className="bg-gray-800 hover:bg-gray-700 text-white text-xs py-2 px-3 rounded transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    OT 2024 (Modified)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
