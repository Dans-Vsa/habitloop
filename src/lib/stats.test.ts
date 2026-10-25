import { describe, expect, it } from 'vitest'
import { createHabit, type Habit } from './habits'
import { buildInsights, completionRateFor, formatRate, weekdayCounts } from './stats'

// Thursday
const TODAY = '2026-10-22'

function habit(id: string, createdOn: string, completions: string[], target?: number): Habit {
  const h = { ...createHabit(id, createdOn, '#5e6ad2', id), completions }
  return target === undefined ? h : { ...h, target }
}

describe('completionRateFor', () => {
  it('measures daily habits against every day in the window', () => {
    const h = habit('a', '2026-09-01', ['2026-10-16', '2026-10-18', '2026-10-20', '2026-10-22'])
    expect(completionRateFor([h], TODAY, 7)).toBeCloseTo(4 / 7)
  })

  it('only counts days since the habit was created', () => {
    const h = habit('a', '2026-10-21', ['2026-10-21'])
    expect(completionRateFor([h], TODAY, 30)).toBeCloseTo(1 / 2)
  })

  it('scales the expectation for weekly targets and caps extras', () => {
    const weekly = habit('w', '2026-09-01', ['2026-10-16', '2026-10-17', '2026-10-18'], 3)
    expect(completionRateFor([weekly], TODAY, 7)).toBeCloseTo(1)
    const overachiever = habit('o', '2026-09-01', ['2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20'], 3)
    expect(completionRateFor([overachiever], TODAY, 7)).toBe(1)
  })

  it('combines habits and supports all-time', () => {
    const a = habit('a', '2026-10-21', ['2026-10-21', '2026-10-22'])
    const b = habit('b', '2026-10-21', [])
    expect(completionRateFor([a, b], TODAY, null)).toBeCloseTo(2 / 4)
  })

  it('returns null with nothing to measure', () => {
    expect(completionRateFor([], TODAY, 7)).toBeNull()
    expect(completionRateFor([habit('f', '2026-11-01', [])], TODAY, 7)).toBeNull()
  })
})

describe('weekdayCounts', () => {
  it('counts check-ins Monday first', () => {
    // 2026-10-19 Mon, 10-22 Thu, 10-25 Sun
    const h = habit('a', '2026-09-01', ['2026-10-19', '2026-10-22', '2026-10-25', '2026-10-12'])
    expect(weekdayCounts([h])).toEqual([2, 0, 0, 1, 0, 0, 1])
    expect(weekdayCounts([h], '2026-10-20')).toEqual([0, 0, 0, 1, 0, 0, 1])
  })
})

describe('buildInsights', () => {
  it('summarises totals, rates and streaks', () => {
    const read = habit('Read', '2026-10-15', ['2026-10-20', '2026-10-21', '2026-10-22'])
    const gym = habit('Gym', '2026-10-15', ['2026-10-21'], 2)
    const insights = buildInsights([read, gym], TODAY)

    expect(insights.totalCheckIns).toBe(4)
    expect(insights.activeDays).toBe(3)
    expect(insights.topStreak?.habit.id).toBe('Read')
    expect(insights.topStreak?.streak).toEqual({ current: 3, best: 3, unit: 'day' })
    expect(insights.perHabit.map((p) => p.streak.unit)).toEqual(['day', 'week'])
    expect(insights.weekdays.reduce((a, b) => a + b, 0)).toBe(4)
    expect(insights.rates.last7).not.toBeNull()
  })

  it('handles an empty list', () => {
    const insights = buildInsights([], TODAY)
    expect(insights).toMatchObject({ totalCheckIns: 0, activeDays: 0, topStreak: null, perHabit: [] })
    expect(insights.rates).toEqual({ last7: null, last30: null, allTime: null })
  })
})

describe('formatRate', () => {
  it('formats percentages', () => {
    expect(formatRate(0.836)).toBe('84%')
    expect(formatRate(null)).toBe('–')
  })
})
