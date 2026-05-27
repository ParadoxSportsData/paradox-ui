// src/components/Lab.tsx
// PDX-67: Scenario Simulator — port of paradox-platform/paradox-web/app/lab/page.tsx.
// Adapted: removed "use client", added onBack prop, replaced fetch with predictScenario().

import { useState, useEffect } from 'react'
import { predictScenario, type ScenarioRequest } from '../api/predict'

interface LabProps {
  onBack: () => void
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function getFootballFieldPosition(yardline: number): string {
  if (yardline < 50) return `Own ${yardline}`
  if (yardline === 50) return 'Midfield (50)'
  return `Opp ${100 - yardline}`
}

function getFieldZone(yardline: number): string {
  if (yardline >= 80) return 'RED ZONE'
  if (yardline >= 65) return 'SCORING RANGE'
  if (yardline > 50) return 'Opponent Territory'
  if (yardline === 50) return 'Midfield'
  return 'Own Territory'
}

function getFieldPositionColor(yardline: number): string {
  if (yardline >= 80) return 'text-red-400'
  if (yardline >= 65) return 'text-orange-400'
  if (yardline > 50) return 'text-green-400'
  return 'text-blue-400'
}

export function Lab({ onBack }: LabProps) {
  const [down, setDown] = useState(1)
  const [distance, setDistance] = useState(10)
  const [yardline, setYardline] = useState(50)
  const [quarter, setQuarter] = useState(4)
  const [timeRemainingQuarter, setTimeRemainingQuarter] = useState(900)
  const [scoreDiff, setScoreDiff] = useState(0)
  const [isHomePossession, setIsHomePossession] = useState(true)
  const [eraSeason, setEraSeason] = useState(2024)
  const [eraWeek, setEraWeek] = useState(1)

  const [winProbability, setWinProbability] = useState<number | null>(null)
  const [otEra, setOtEra] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchPrediction() {
      setIsLoading(true)
      setError(null)

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

      try {
        const result = await predictScenario(scenario)
        if (!cancelled) {
          setWinProbability(result.win_probability)
          setOtEra(result.ot_era)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch prediction')
          setWinProbability(null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchPrediction()
    return () => { cancelled = true }
  }, [down, distance, yardline, quarter, timeRemainingQuarter, scoreDiff, isHomePossession, eraSeason, eraWeek])

  const gaugeRadius = 100
  const gaugeCircumference = 2 * Math.PI * gaugeRadius
  const gaugeColor =
    winProbability === null ? '#374151'
    : winProbability >= 0.7 ? '#10b981'
    : winProbability >= 0.5 ? '#3b82f6'
    : winProbability >= 0.3 ? '#f59e0b'
    : '#ef4444'

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="px-6 py-5 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-xs font-mono px-3 py-1.5 rounded transition bg-gray-700 text-gray-300 hover:bg-gray-600"
          >
            Back
          </button>
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
                    onClick={() => { setQuarter(q); setTimeRemainingQuarter(900) }}
                    className={`py-3 rounded-lg font-bold transition-all ${
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
                    className={`py-3 rounded-lg font-bold transition-all ${
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
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Distance to First Down: <span className="text-blue-400 text-xl">{distance} yards</span>
              </label>
              <div className="flex items-center gap-3">
                <button onClick={() => setDistance(Math.max(1, distance - 1))} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">−</button>
                <input type="range" min="1" max="99" value={distance} onChange={(e) => setDistance(Number(e.target.value))} className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                <button onClick={() => setDistance(Math.min(99, distance + 1))} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">+</button>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1"><span>1</span><span>50</span><span>99</span></div>
            </div>

            {/* Yardline */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <label className="block text-sm font-semibold text-gray-300 mb-1">
                Ball Position:{' '}
                <span className={`text-xl font-bold ${getFieldPositionColor(yardline)}`}>
                  {getFootballFieldPosition(yardline)}
                </span>
              </label>
              <p className="text-xs text-gray-500 mb-3">{getFieldZone(yardline)}</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setYardline(Math.max(1, yardline - 1))} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">−</button>
                <input type="range" min="1" max="99" value={yardline} onChange={(e) => setYardline(Number(e.target.value))} className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-600" />
                <button onClick={() => setYardline(Math.min(99, yardline + 1))} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">+</button>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span className="text-blue-400">Own Endzone</span>
                <span>50</span>
                <span className="text-red-400">Opp Endzone</span>
              </div>
            </div>

            {/* Time Remaining */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Time Remaining in {quarter === 5 ? 'OT' : `Q${quarter}`}:{' '}
                <span className="text-yellow-400 text-xl">{formatTime(timeRemainingQuarter)}</span>
              </label>
              <div className="flex items-center gap-3">
                <button onClick={() => setTimeRemainingQuarter(Math.max(0, timeRemainingQuarter - 1))} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">−</button>
                <input type="range" min="0" max="900" step="1" value={timeRemainingQuarter} onChange={(e) => setTimeRemainingQuarter(Number(e.target.value))} className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-600" />
                <button onClick={() => setTimeRemainingQuarter(Math.min(900, timeRemainingQuarter + 1))} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">+</button>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1"><span>0:00 (End)</span><span>7:30</span><span>15:00 (Start)</span></div>
            </div>

            {/* Score Differential */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Score Differential:{' '}
                <span className={`text-xl ml-1 ${scoreDiff > 0 ? 'text-green-400' : scoreDiff < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                  {scoreDiff > 0 ? '+' : ''}{scoreDiff}
                </span>
                <span className="text-sm text-gray-500 ml-2">({scoreDiff > 0 ? 'Winning' : scoreDiff < 0 ? 'Losing' : 'Tied'})</span>
              </label>
              <div className="flex items-center gap-3">
                <button onClick={() => setScoreDiff(Math.max(-50, scoreDiff - 1))} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">−</button>
                <input type="range" min="-50" max="50" value={scoreDiff} onChange={(e) => setScoreDiff(Number(e.target.value))} className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                <button onClick={() => setScoreDiff(Math.min(50, scoreDiff + 1))} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">+</button>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1"><span>-50</span><span>0 (Tied)</span><span>+50</span></div>
            </div>

            {/* Possession */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <label className="block text-sm font-semibold text-gray-300 mb-3">Possession</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setIsHomePossession(true)} className={`py-3 rounded-lg font-bold transition-all ${isHomePossession ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>Home</button>
                <button onClick={() => setIsHomePossession(false)} className={`py-3 rounded-lg font-bold transition-all ${!isHomePossession ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>Away</button>
              </div>
            </div>

            {/* Era */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <label className="block text-sm font-semibold text-gray-300 mb-3">NFL Rule Era</label>
              <select
                value={eraSeason}
                onChange={(e) => setEraSeason(Number(e.target.value))}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              >
                <option value={2024}>2024 (Modified Short OT)</option>
                <option value={2017}>2017 (Modified Short OT)</option>
                <option value={2011}>2011 (Sudden Death reg / Modified playoffs)</option>
              </select>
              <label className="block text-sm font-semibold text-gray-300 mb-3">Game Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setEraWeek(1)} className={`py-3 rounded-lg font-bold transition-all ${eraWeek < 19 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>Regular Season</button>
                <button onClick={() => setEraWeek(20)} className={`py-3 rounded-lg font-bold transition-all ${eraWeek >= 19 ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>Playoffs</button>
              </div>
              {otEra && <p className="text-xs text-gray-500 mt-3">OT Rules: <span className="text-blue-400 font-mono">{otEra}</span></p>}
            </div>
          </div>

          {/* RIGHT: Win Probability Gauge */}
          <div className="lg:sticky lg:top-8 self-start">
            <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
              <h2 className="text-2xl font-bold mb-6 text-center text-gray-200">Win Probability</h2>

              <div className="relative w-64 h-64 mx-auto mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 256 256">
                  <circle cx="128" cy="128" r={gaugeRadius} stroke="#374151" strokeWidth="20" fill="none" />
                  {winProbability !== null && (
                    <circle
                      cx="128"
                      cy="128"
                      r={gaugeRadius}
                      stroke={gaugeColor}
                      strokeWidth="20"
                      fill="none"
                      strokeDasharray={gaugeCircumference}
                      strokeDashoffset={gaugeCircumference * (1 - winProbability)}
                      className="transition-all duration-700 ease-out"
                      strokeLinecap="round"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {isLoading ? (
                    <div className="text-blue-400 text-lg animate-pulse">Calculating…</div>
                  ) : error ? (
                    <div className="text-red-400 text-xs text-center px-4">{error}</div>
                  ) : winProbability !== null ? (
                    <>
                      <div className="text-5xl font-bold text-white">{(winProbability * 100).toFixed(1)}%</div>
                      <div className="text-sm text-gray-400 mt-1">
                        {winProbability >= 0.7 ? 'Highly Favored' : winProbability >= 0.5 ? 'Favored' : winProbability >= 0.3 ? 'Underdog' : 'Long Shot'}
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500 text-sm">Adjust scenario</div>
                  )}
                </div>
              </div>

              {/* Scenario Summary */}
              <div className="bg-gray-950 rounded-lg p-4 border border-gray-800 mb-6">
                <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Current Scenario</h3>
                <p className="text-lg font-bold text-white">
                  {quarter === 5 ? 'OT' : `Q${quarter}`} — {down}{['st','nd','rd','th'][down-1]} & {distance}
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
                    className="bg-gray-800 hover:bg-gray-700 text-white text-xs py-2 px-3 rounded transition-all"
                  >
                    4th &amp; Goal
                  </button>
                  <button
                    onClick={() => { setQuarter(4); setDown(3); setDistance(10); setYardline(50); setTimeRemainingQuarter(120); setScoreDiff(0); setIsHomePossession(true); setEraSeason(2024); setEraWeek(1) }}
                    className="bg-gray-800 hover:bg-gray-700 text-white text-xs py-2 px-3 rounded transition-all"
                  >
                    Tied, 2-Min Warning
                  </button>
                  <button
                    onClick={() => { setQuarter(5); setDown(1); setDistance(10); setYardline(50); setTimeRemainingQuarter(900); setScoreDiff(0); setIsHomePossession(true); setEraSeason(2011); setEraWeek(1) }}
                    className="bg-gray-800 hover:bg-gray-700 text-white text-xs py-2 px-3 rounded transition-all"
                  >
                    OT 2011 (Sudden Death)
                  </button>
                  <button
                    onClick={() => { setQuarter(5); setDown(1); setDistance(10); setYardline(50); setTimeRemainingQuarter(900); setScoreDiff(0); setIsHomePossession(true); setEraSeason(2024); setEraWeek(1) }}
                    className="bg-gray-800 hover:bg-gray-700 text-white text-xs py-2 px-3 rounded transition-all"
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
