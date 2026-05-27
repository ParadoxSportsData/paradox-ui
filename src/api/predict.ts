// src/api/predict.ts
// PDX-65: predict API client for paradox-predict service (port 8002).
// Zod validates the response boundary — parse() throws if the service changes shape.

import { z } from 'zod'

const PREDICT_URL = import.meta.env.VITE_PREDICT_API_URL ?? 'http://localhost:8002'

export const ScenarioRequestSchema = z.object({
  down: z.number().int().min(1).max(4),
  distance: z.number().int().min(1).max(99),
  yardline_100: z.number().int().min(1).max(99),
  quarter: z.number().int().min(1).max(5),
  seconds_remaining_quarter: z.number().int().min(0).max(900),
  score_differential: z.number().int().min(-50).max(50),
  is_home_possession: z.boolean(),
  era_season: z.number().int().min(2010).max(2030),
  era_week: z.number().int().min(1).max(22),
})

export const ScenarioPredictionSchema = z.object({
  win_probability: z.number(),
  ot_era: z.string(),
  scenario: ScenarioRequestSchema,
})

export type ScenarioRequest = z.infer<typeof ScenarioRequestSchema>
export type ScenarioPrediction = z.infer<typeof ScenarioPredictionSchema>

export async function predictScenario(scenario: ScenarioRequest): Promise<ScenarioPrediction> {
  const response = await fetch(`${PREDICT_URL}/predict/scenario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ScenarioRequestSchema.parse(scenario)),
  })

  if (!response.ok) {
    throw new Error(`predict API error: ${response.status} ${response.statusText}`)
  }

  return ScenarioPredictionSchema.parse(await response.json())
}
