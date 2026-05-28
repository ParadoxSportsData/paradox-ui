// src/hooks/useScenarioPrediction.ts
// PDX-120: Custom hook — encapsulates predictScenario fetch logic extracted from Lab.tsx.

import { useState, useEffect } from 'react'
import { predictScenario, type ScenarioRequest } from '../api/predict'

export interface ScenarioPredictionResult {
  winProbability: number | null
  otEra: string
  loading: boolean
  error: string | null
}

// useScenarioPrediction fires a prediction request whenever any scenario field changes.
// Returns { winProbability, otEra, loading, error }.
// Deps are spread as primitives so the linter can track them precisely.
export function useScenarioPrediction(scenario: ScenarioRequest): ScenarioPredictionResult {
  const [winProbability, setWinProbability] = useState<number | null>(null)
  const [otEra, setOtEra] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    down,
    distance,
    yardline_100,
    quarter,
    seconds_remaining_quarter,
    score_differential,
    is_home_possession,
    era_season,
    era_week,
  } = scenario

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    const s: ScenarioRequest = {
      down,
      distance,
      yardline_100,
      quarter,
      seconds_remaining_quarter,
      score_differential,
      is_home_possession,
      era_season,
      era_week,
    }

    setLoading(true)
    setError(null)

    predictScenario(s)
      .then((result) => {
        if (!signal.aborted) {
          setWinProbability(result.win_probability)
          setOtEra(result.ot_era)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch prediction')
          setWinProbability(null)
          setLoading(false)
        }
      })

    return () => { controller.abort() }
  }, [down, distance, yardline_100, quarter, seconds_remaining_quarter, score_differential, is_home_possession, era_season, era_week])

  return { winProbability, otEra, loading, error }
}
