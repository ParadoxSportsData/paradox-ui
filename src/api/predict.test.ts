// src/api/predict.test.ts
// PDX-100: Tests for predict.ts API client and Zod schemas.

import { describe, it, expect, vi, afterEach } from 'vitest'
import { ScenarioRequestSchema, ScenarioPredictionSchema } from './predict'
import { predictScenario } from './predict'

const VALID_SCENARIO = {
  down: 3,
  distance: 7,
  yardline_100: 65,
  quarter: 2,
  seconds_remaining_quarter: 300,
  score_differential: 0,
  is_home_possession: true,
  era_season: 2024,
  era_week: 8,
}

describe('ScenarioRequestSchema', () => {
  it('accepts a fully valid scenario', () => {
    const result = ScenarioRequestSchema.safeParse(VALID_SCENARIO)
    expect(result.success).toBe(true)
  })

  it('rejects down < 1', () => {
    expect(ScenarioRequestSchema.safeParse({ ...VALID_SCENARIO, down: 0 }).success).toBe(false)
  })

  it('rejects down > 4', () => {
    expect(ScenarioRequestSchema.safeParse({ ...VALID_SCENARIO, down: 5 }).success).toBe(false)
  })

  it('rejects quarter > 5', () => {
    expect(ScenarioRequestSchema.safeParse({ ...VALID_SCENARIO, quarter: 6 }).success).toBe(false)
  })

  it('rejects yardline_100 out of range', () => {
    expect(ScenarioRequestSchema.safeParse({ ...VALID_SCENARIO, yardline_100: 0 }).success).toBe(false)
    expect(ScenarioRequestSchema.safeParse({ ...VALID_SCENARIO, yardline_100: 100 }).success).toBe(false)
  })

  it('rejects score_differential out of range', () => {
    expect(ScenarioRequestSchema.safeParse({ ...VALID_SCENARIO, score_differential: -51 }).success).toBe(false)
    expect(ScenarioRequestSchema.safeParse({ ...VALID_SCENARIO, score_differential: 51 }).success).toBe(false)
  })

  it('rejects missing required field', () => {
    const { down: _omit, ...withoutDown } = VALID_SCENARIO
    expect(ScenarioRequestSchema.safeParse(withoutDown).success).toBe(false)
  })
})

describe('ScenarioPredictionSchema', () => {
  it('accepts a valid prediction response', () => {
    const result = ScenarioPredictionSchema.safeParse({
      win_probability: 0.712,
      ot_era: 'MODIFIED_SHORT',
      scenario: VALID_SCENARIO,
    })
    expect(result.success).toBe(true)
  })

  it('rejects win_probability outside [0, 1]', () => {
    expect(ScenarioPredictionSchema.safeParse({
      win_probability: 1.1,
      ot_era: 'MODIFIED_SHORT',
      scenario: VALID_SCENARIO,
    }).success).toBe(false)
    expect(ScenarioPredictionSchema.safeParse({
      win_probability: -0.1,
      ot_era: 'MODIFIED_SHORT',
      scenario: VALID_SCENARIO,
    }).success).toBe(false)
  })

  it('rejects missing ot_era', () => {
    expect(ScenarioPredictionSchema.safeParse({
      win_probability: 0.5,
      scenario: VALID_SCENARIO,
    }).success).toBe(false)
  })
})

describe('predictScenario', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('throws on non-2xx response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    }))
    await expect(predictScenario(VALID_SCENARIO)).rejects.toThrow('503')
  })

  it('returns parsed ScenarioPrediction on success', async () => {
    const mockResponse = {
      win_probability: 0.65,
      ot_era: 'GUARANTEED',
      scenario: VALID_SCENARIO,
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }))
    const result = await predictScenario(VALID_SCENARIO)
    expect(result.win_probability).toBe(0.65)
    expect(result.ot_era).toBe('GUARANTEED')
  })

  it('posts to /predict/scenario with JSON body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ win_probability: 0.5, ot_era: 'MODIFIED', scenario: VALID_SCENARIO }),
    })
    vi.stubGlobal('fetch', fetchMock)
    await predictScenario(VALID_SCENARIO)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/predict/scenario')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual(VALID_SCENARIO)
  })
})
