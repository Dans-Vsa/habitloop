import { describe, expect, it } from 'vitest'
import { createHabit, formatStreak, streakInfo, updateHabit, type Habit } from './habits'
import {
  countByWeek,
  currentWeekStreak,
  doneThisWeek,
  hasWeeklyTarget,
  isWeeklyTarget,
  longestWeekStreak,
  targetLabel,
  weekStart,
} from './weekly'

// 2026-10-22 is a Thursday; its week starts on Monday 2026-10-19.
const TODAY = '2026-10-22'

function habitWith(completions: string[], target?: number): Habit {
  const habit = { ...createHabit('Gym', '2026-09-01', '#5e6ad2', 'g'), completions }
  return target === undefined ? habit : { ...habit, target }
}

describe('weekStart', () => {
  it.each([
    ['2026-10-19', '2026-10-19'],
    ['2026-10-22', '2026-10-19'],
    ['2026-10-25', '2026-10-19'],
    ['2026-10-26', '2026-10-26'],
    ['2026-01-01', '2025-12-29'],
  ])('%s starts on %s', (day, monday) => {
    expect(weekStart(day)).toBe(monday)
  })
})

describe('isWeeklyTarget / hasWeeklyTarget', () => {
  it.each([1, 3, 6])('accepts %d', (n) => expect(isWeeklyTarget(n)).toBe(true))
  it.each([0, 7, 2.5, '3', null, undefined])('rejects %j', (n) => expect(isWeeklyTarget(n)).toBe(false))

  it('detects habits with a target', () => {
    expect(hasWeeklyTarget(habitWith([], 3))).toBe(true)
    expect(hasWeeklyTarget(habitWith([]))).toBe(false)
  })
})

describe('countByWeek / doneThisWeek', () => {
  it('groups completions by Monday', () => {
    const habit = habitWith(['2026-10-12', '2026-10-18', '2026-10-19', '2026-10-21'])
    expect(Object.fromEntries(countByWeek(habit))).toEqual({ '2026-10-12': 2, '2026-10-19': 2 })
    expect(doneThisWeek(habit, TODAY)).toBe(2)
    expect(doneThisWeek(habit, '2026-10-26')).toBe(0)
  })
})

describe('currentWeekStreak', () => {
  const history = [
    // week of 10-05: 3 times
    '2026-10-05', '2026-10-07', '2026-10-09',
    // week of 10-12: 3 times
    '2026-10-12', '2026-10-14', '2026-10-16',
    // this week: 1 so far
    '2026-10-20',
  ]

  it('does not break while the current week is still open', () => {
    expect(currentWeekStreak(habitWith(history), 3, TODAY)).toBe(2)
  })

  it('counts this week once the target is reached', () => {
    const habit = habitWith([...history, '2026-10-21', '2026-10-22'])
    expect(currentWeekStreak(habit, 3, TODAY)).toBe(3)
  })

  it('is zero when last week missed the target', () => {
    expect(currentWeekStreak(habitWith(['2026-10-05', '2026-10-06', '2026-10-07']), 3, TODAY)).toBe(0)
  })
})

describe('longestWeekStreak', () => {
  it('finds the longest run of target weeks', () => {
    const habit = habitWith([
      '2026-09-07', '2026-09-08',
      '2026-09-14', '2026-09-15',
      // gap: week of 09-21 has one
      '2026-09-21',
      '2026-09-28', '2026-09-29',
    ])
    expect(longestWeekStreak(habit, 2)).toBe(2)
    expect(longestWeekStreak(habit, 1)).toBe(4)
    expect(longestWeekStreak(habitWith([]), 2)).toBe(0)
  })
})

describe('streakInfo', () => {
  it('uses days for daily habits', () => {
    const habit = habitWith(['2026-10-20', '2026-10-21'])
    expect(streakInfo(habit, TODAY)).toEqual({ current: 2, best: 2, unit: 'day' })
  })

  it('uses weeks for habits with a target', () => {
    const habit = habitWith(['2026-10-12', '2026-10-13', '2026-10-19', '2026-10-20'], 2)
    expect(streakInfo(habit, TODAY)).toEqual({ current: 2, best: 2, unit: 'week' })
  })

  it('formats streaks', () => {
    expect(formatStreak(1, 'week')).toBe('1 week')
    expect(formatStreak(4, 'day')).toBe('4 days')
  })
})

describe('updateHabit target', () => {
  it('sets and clears a weekly target', () => {
    const withTarget = updateHabit(habitWith([]), { target: 3 })
    expect(withTarget.target).toBe(3)
    const cleared = updateHabit(withTarget, { target: null })
    expect('target' in cleared).toBe(false)
  })

  it('ignores invalid targets and keeps other fields', () => {
    const updated = updateHabit(habitWith([], 2), { target: 9, name: '  Lift ' })
    expect('target' in updated).toBe(false)
    expect(updated.name).toBe('Lift')
  })

  it('leaves the target alone when not given', () => {
    expect(updateHabit(habitWith([], 4), { color: '#27a644' }).target).toBe(4)
  })
})

describe('targetLabel', () => {
  it('describes the schedule', () => {
    expect(targetLabel(undefined)).toBe('Every day')
    expect(targetLabel(3)).toBe('3× per week')
  })
})
