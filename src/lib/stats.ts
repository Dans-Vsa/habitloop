/**
 * Numbers for the Insights dashboard. Every function takes `today` so results
 * are deterministic and easy to test.
 */
import { addDays, daysBetween, parseDateKey, type DateKey } from './dates'
import { streakInfo, type Habit, type StreakInfo } from './habits'
import { hasWeeklyTarget } from './weekly'

/** Monday first, matching how weeks are counted for weekly targets. */
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

interface Progress {
  done: number
  expected: number
}

/**
 * Check-ins and the number the habit asked for in the last `windowDays`
 * days (or since it was created when `windowDays` is null). A habit with a
 * weekly target of 3 expects 3/7 of a check-in per day. Extra check-ins
 * never count for more than the target.
 */
function habitProgress(habit: Habit, today: DateKey, windowDays: number | null): Progress {
  if (habit.createdOn > today) return { done: 0, expected: 0 }
  const sinceCreated = daysBetween(habit.createdOn, today) + 1
  const span = windowDays === null ? sinceCreated : Math.min(windowDays, sinceCreated)
  const start = addDays(today, -(span - 1))
  const done = habit.completions.filter((d) => d >= start && d <= today).length
  const perDay = hasWeeklyTarget(habit) ? habit.target / 7 : 1
  const expected = span * perDay
  return { done: Math.min(done, expected), expected }
}

/**
 * Completion rate (0..1) across habits for a time window, or `null` when
 * there is nothing to measure yet.
 */
export function completionRateFor(habits: Habit[], today: DateKey, windowDays: number | null): number | null {
  let done = 0
  let expected = 0
  for (const habit of habits) {
    const p = habitProgress(habit, today, windowDays)
    done += p.done
    expected += p.expected
  }
  return expected > 0 ? done / expected : null
}

/** Check-ins per weekday (Mon..Sun), optionally only on or after `since`. */
export function weekdayCounts(habits: Habit[], since?: DateKey): number[] {
  const counts = [0, 0, 0, 0, 0, 0, 0]
  for (const habit of habits) {
    for (const day of habit.completions) {
      if (since && day < since) continue
      counts[(parseDateKey(day).getDay() + 6) % 7]++
    }
  }
  return counts
}

export interface HabitInsight {
  habit: Habit
  rate30: number | null
  streak: StreakInfo
}

export interface Insights {
  totalCheckIns: number
  /** Distinct days with at least one check-in. */
  activeDays: number
  rates: { last7: number | null; last30: number | null; allTime: number | null }
  weekdays: number[]
  /** The habit with the longest current streak, if any streak is running. */
  topStreak: HabitInsight | null
  perHabit: HabitInsight[]
}

export function buildInsights(habits: Habit[], today: DateKey): Insights {
  const days = new Set<DateKey>()
  let totalCheckIns = 0
  for (const habit of habits) {
    totalCheckIns += habit.completions.length
    for (const day of habit.completions) days.add(day)
  }

  const perHabit = habits.map((habit) => ({
    habit,
    rate30: completionRateFor([habit], today, 30),
    streak: streakInfo(habit, today),
  }))
  const topStreak = perHabit.reduce<HabitInsight | null>(
    (best, item) => (item.streak.current > (best?.streak.current ?? 0) ? item : best),
    null,
  )

  return {
    totalCheckIns,
    activeDays: days.size,
    rates: {
      last7: completionRateFor(habits, today, 7),
      last30: completionRateFor(habits, today, 30),
      allTime: completionRateFor(habits, today, null),
    },
    weekdays: weekdayCounts(habits),
    topStreak,
    perHabit,
  }
}

/** "84%", or an en dash when there is no data. */
export function formatRate(rate: number | null): string {
  return rate === null ? '–' : `${Math.round(rate * 100)}%`
}
