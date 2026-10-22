import { describe, expect, it } from 'vitest'
import {
  completionRate,
  createHabit,
  currentStreak,
  isDone,
  longestStreak,
  toggleCompletion,
  validateHabitName,
  type Habit,
} from './habits'

function habitWith(completions: string[], createdOn = '2026-10-01'): Habit {
  return { ...createHabit('Read', createdOn, '#5e6ad2', 'h1'), completions }
}

describe('createHabit', () => {
  it('normalises whitespace and starts empty', () => {
    const habit = createHabit('  Drink   water ', '2026-10-22', '#27a644', 'x')
    expect(habit).toEqual({
      id: 'x',
      name: 'Drink water',
      color: '#27a644',
      createdOn: '2026-10-22',
      completions: [],
    })
  })

  it('generates unique ids by default', () => {
    expect(createHabit('a', '2026-10-22').id).not.toBe(createHabit('a', '2026-10-22').id)
  })
})

describe('validateHabitName', () => {
  const existing = [createHabit('Read', '2026-10-01', '#5e6ad2', 'r')]

  it('requires a name', () => {
    expect(validateHabitName('   ')).toMatch(/name/)
  })

  it('limits length', () => {
    expect(validateHabitName('x'.repeat(61))).toMatch(/under 60/)
    expect(validateHabitName('x'.repeat(60))).toBeNull()
  })

  it('rejects case-insensitive duplicates, except the habit itself', () => {
    expect(validateHabitName(' read ', existing)).toMatch(/already/)
    expect(validateHabitName('Read', existing, 'r')).toBeNull()
    expect(validateHabitName('Run', existing)).toBeNull()
  })
})

describe('toggleCompletion', () => {
  it('adds days in sorted order and removes them again', () => {
    let habit = habitWith([])
    habit = toggleCompletion(habit, '2026-10-22')
    habit = toggleCompletion(habit, '2026-10-20')
    expect(habit.completions).toEqual(['2026-10-20', '2026-10-22'])
    expect(isDone(habit, '2026-10-22')).toBe(true)
    habit = toggleCompletion(habit, '2026-10-22')
    expect(habit.completions).toEqual(['2026-10-20'])
  })

  it('does not mutate the original habit', () => {
    const habit = habitWith([])
    toggleCompletion(habit, '2026-10-22')
    expect(habit.completions).toEqual([])
  })

  it('rejects invalid days', () => {
    expect(() => toggleCompletion(habitWith([]), 'nope')).toThrow()
  })
})

describe('currentStreak', () => {
  it('counts consecutive days ending today', () => {
    expect(currentStreak(habitWith(['2026-10-20', '2026-10-21', '2026-10-22']), '2026-10-22')).toBe(3)
  })

  it('keeps yesterday’s streak alive while today is still open', () => {
    expect(currentStreak(habitWith(['2026-10-20', '2026-10-21']), '2026-10-22')).toBe(2)
  })

  it('is zero after a missed day', () => {
    expect(currentStreak(habitWith(['2026-10-19', '2026-10-20']), '2026-10-22')).toBe(0)
  })

  it('works across month boundaries', () => {
    expect(currentStreak(habitWith(['2026-09-30', '2026-10-01']), '2026-10-01')).toBe(2)
  })
})

describe('longestStreak', () => {
  it('finds the longest run anywhere in history', () => {
    const habit = habitWith(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-10', '2026-10-11'])
    expect(longestStreak(habit)).toBe(3)
  })

  it('handles empty, single and unsorted histories', () => {
    expect(longestStreak(habitWith([]))).toBe(0)
    expect(longestStreak(habitWith(['2026-10-05']))).toBe(1)
    expect(longestStreak(habitWith(['2026-10-06', '2026-10-05', '2026-10-05']))).toBe(2)
  })
})

describe('completionRate', () => {
  it('uses days since creation when younger than the window', () => {
    const habit = habitWith(['2026-10-21', '2026-10-22'], '2026-10-19')
    expect(completionRate(habit, '2026-10-22')).toBe(0.5)
  })

  it('caps the window and ignores days outside it', () => {
    const habit = habitWith(['2026-09-01', '2026-10-22'], '2026-08-01')
    expect(completionRate(habit, '2026-10-22', 10)).toBeCloseTo(0.1)
  })
})
