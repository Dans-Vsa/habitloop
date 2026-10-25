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

describe('habitsReducer — editing', () => {
  const read = createHabit('Read', '2026-10-01', '#5e6ad2', 'r')
  const run = createHabit('Run', '2026-10-01', '#27a644', 'u')

  it('updates name and color', () => {
    const [next] = habitsReducer([read], { type: 'update', id: 'r', changes: { name: 'Read books', color: '#e5484d' } })
    expect(next).toMatchObject({ name: 'Read books', color: '#e5484d' })
  })

  it('archives and restores', () => {
    const archived = habitsReducer([read], { type: 'archive', id: 'r', archived: true })
    expect(archived[0].archived).toBe(true)
    expect(habitsReducer(archived, { type: 'archive', id: 'r', archived: false })[0].archived).toBeUndefined()
  })

  it('reorders', () => {
    expect(habitsReducer([read, run], { type: 'move', id: 'u', direction: -1 }).map((h) => h.id)).toEqual(['u', 'r'])
  })

  it('sets a weekly target through update', () => {
    const [next] = habitsReducer([read], { type: 'update', id: 'r', changes: { target: 3 } })
    expect(next.target).toBe(3)
  })

  it('replaces the whole list (used by import)', () => {
    expect(habitsReducer([read], { type: 'replace', habits: [run] })).toEqual([run])
  })
})
