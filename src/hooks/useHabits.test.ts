import { describe, expect, it } from 'vitest'
import { createHabit } from '../lib/habits'
import { habitsReducer } from './useHabits'

describe('habitsReducer', () => {
  const read = createHabit('Read', '2026-10-01', '#5e6ad2', 'r')

  it('adds habits created today', () => {
    const state = habitsReducer([], { type: 'add', name: ' Run ', color: '#27a644', today: '2026-10-22' })
    expect(state).toHaveLength(1)
    expect(state[0]).toMatchObject({ name: 'Run', color: '#27a644', createdOn: '2026-10-22' })
  })

  it('toggles only the targeted habit', () => {
    const other = createHabit('Run', '2026-10-01', '#27a644', 'o')
    const state = habitsReducer([read, other], { type: 'toggle', id: 'r', day: '2026-10-22' })
    expect(state[0].completions).toEqual(['2026-10-22'])
    expect(state[1]).toBe(other)
  })

  it('removes habits by id', () => {
    expect(habitsReducer([read], { type: 'remove', id: 'r' })).toEqual([])
  })
})
