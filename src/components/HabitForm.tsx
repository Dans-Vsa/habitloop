import { useEffect, useRef, useState, type FormEvent } from 'react'
import { HABIT_COLORS, MAX_NAME_LENGTH, validateHabitName, type Habit } from '../lib/habits'
import { ColorPicker } from './ColorPicker'

interface Props {
  habits: Habit[]
  onAdd: (name: string, color: string) => void
  /** Focus the name field whenever this number changes (keyboard shortcut). */
  focusSignal?: number
}

export function HabitForm({ habits, onAdd, focusSignal = 0 }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState<string>(HABIT_COLORS[habits.length % HABIT_COLORS.length])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (focusSignal > 0) input.current?.focus()
  }, [focusSignal])

  function submit(event: FormEvent) {
    event.preventDefault()
    const problem = validateHabitName(name, habits)
    if (problem) {
      setError(problem)
      return
    }
    onAdd(name, color)
    setName('')
    setError(null)
    setColor(HABIT_COLORS[(habits.length + 1) % HABIT_COLORS.length])
  }

  return (
    <form className="habit-form" onSubmit={submit} aria-label="Add a habit">
      <div className="habit-form__row">
        <label className="visually-hidden" htmlFor="habit-name">
          Habit name
        </label>
        <input
          ref={input}
          id="habit-name"
          className="text-input"
          placeholder="New habit, e.g. Read 20 pages"
          value={name}
          maxLength={MAX_NAME_LENGTH + 20}
          onChange={(e) => {
            setName(e.target.value)
            if (error) setError(null)
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'habit-name-error' : undefined}
          autoComplete="off"
        />
        <button type="submit" className="button button--primary">
          Add habit
        </button>
      </div>
      <ColorPicker name="habit-color" value={color} onChange={setColor} />
      {error && (
        <p id="habit-name-error" className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
