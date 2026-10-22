import { useState, type CSSProperties, type FormEvent } from 'react'
import { HABIT_COLORS, MAX_NAME_LENGTH, validateHabitName, type Habit } from '../lib/habits'

interface Props {
  habits: Habit[]
  onAdd: (name: string, color: string) => void
}

export function HabitForm({ habits, onAdd }: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState<string>(HABIT_COLORS[habits.length % HABIT_COLORS.length])
  const [error, setError] = useState<string | null>(null)

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
      <fieldset className="swatches">
        <legend className="visually-hidden">Color</legend>
        {HABIT_COLORS.map((c) => (
          <label key={c} className="swatch" style={{ '--swatch': c } as CSSProperties}>
            <input
              type="radio"
              name="habit-color"
              value={c}
              checked={color === c}
              onChange={() => setColor(c)}
              aria-label={`Color ${c}`}
            />
            <span aria-hidden="true" />
          </label>
        ))}
      </fieldset>
      {error && (
        <p id="habit-name-error" className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
