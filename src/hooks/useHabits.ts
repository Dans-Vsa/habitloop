import { useEffect, useReducer } from 'react'
import { createHabit, toggleCompletion, type Habit } from '../lib/habits'
import { loadHabits, saveHabits } from '../lib/storage'
import type { DateKey } from '../lib/dates'

export type HabitAction =
  | { type: 'add'; name: string; color: string; today: DateKey }
  | { type: 'toggle'; id: string; day: DateKey }
  | { type: 'remove'; id: string }

export function habitsReducer(state: Habit[], action: HabitAction): Habit[] {
  switch (action.type) {
    case 'add':
      return [...state, createHabit(action.name, action.today, action.color)]
    case 'toggle':
      return state.map((h) => (h.id === action.id ? toggleCompletion(h, action.day) : h))
    case 'remove':
      return state.filter((h) => h.id !== action.id)
  }
}

/** Habit list backed by localStorage. */
export function useHabits(storage?: Storage) {
  const [habits, dispatch] = useReducer(habitsReducer, storage, (s) => loadHabits(s))

  useEffect(() => {
    saveHabits(habits, storage)
  }, [habits, storage])

  return { habits, dispatch }
}
