import { describe, expect, it } from 'vitest'
import {
  completionRate,
  createHabit,
  currentStreak,
  isArchived,
  isDone,
  longestStreak,
  moveHabit,
  setArchived,
  toggleCompletion,
  totalCompletions,
  updateHabit,
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

describe('updateHabit', () => {
  it('normalises a new name and keeps history', () => {
    const habit = habitWith(['2026-10-02'])
    const next = updateHabit(habit, { name: '  Read   more ' })
    expect(next).toMatchObject({ name: 'Read more', color: habit.color, completions: ['2026-10-02'] })
    expect(habit.name).toBe('Read')
  })

  it('changes only the color when no name is given', () => {
    expect(updateHabit(habitWith([]), { color: '#e5484d' })).toMatchObject({ name: 'Read', color: '#e5484d' })
  })
})

describe('setArchived / isArchived', () => {
  it('archives and restores without leaving a false flag behind', () => {
    const habit = habitWith([])
    const archived = setArchived(habit, true)
    expect(isArchived(archived)).toBe(true)
    const restored = setArchived(archived, false)
    expect(isArchived(restored)).toBe(false)
    expect('archived' in restored).toBe(false)
  })
})

describe('moveHabit', () => {
  const a = createHabit('A', '2026-10-01', '#5e6ad2', 'a')
  const b = createHabit('B', '2026-10-01', '#5e6ad2', 'b')
  const c = createHabit('C', '2026-10-01', '#5e6ad2', 'c')

  it('swaps with the neighbour', () => {
    expect(moveHabit([a, b, c], 'b', -1).map((h) => h.id)).toEqual(['b', 'a', 'c'])
    expect(moveHabit([a, b, c], 'b', 1).map((h) => h.id)).toEqual(['a', 'c', 'b'])
  })

  it('returns the same array at the edges or for unknown ids', () => {
    const list = [a, b, c]
    expect(moveHabit(list, 'a', -1)).toBe(list)
    expect(moveHabit(list, 'c', 1)).toBe(list)
    expect(moveHabit(list, 'zzz', 1)).toBe(list)
  })

  it('skips habits with a different archived state', () => {
    const hidden = setArchived(b, true)
    expect(moveHabit([a, hidden, c], 'c', -1).map((h) => h.id)).toEqual(['c', 'b', 'a'])
    expect(moveHabit([a, hidden, c], 'b', 1)).toEqual([a, hidden, c])
  })
})

describe('totalCompletions', () => {
  it('counts completed days', () => {
    expect(totalCompletions(habitWith(['2026-10-02', '2026-10-05']))).toBe(2)
  })
})
