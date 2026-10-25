import { useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import { longDateLabel, type DateKey } from '../lib/dates'
import { countByDay } from '../lib/heatmap'
import {
  completionRate,
  formatStreak,
  isArchived,
  MAX_NAME_LENGTH,
  streakInfo,
  totalCompletions,
  validateHabitName,
  type Habit,
  type HabitChanges,
} from '../lib/habits'
import { MAX_WEEKLY_TARGET, MIN_WEEKLY_TARGET, targetLabel } from '../lib/weekly'
import { ColorPicker } from './ColorPicker'

const TARGET_OPTIONS = Array.from(
  { length: MAX_WEEKLY_TARGET - MIN_WEEKLY_TARGET + 1 },
  (_, i) => MIN_WEEKLY_TARGET + i,
)
import { Heatmap } from './Heatmap'

interface Props {
  habit: Habit
  habits: Habit[]
  today: DateKey
  onBack: () => void
  onUpdate: (changes: HabitChanges) => void
  onArchive: (archived: boolean) => void
  onRemove: () => void
}

export function HabitDetail({ habit, habits, today, onBack, onUpdate, onArchive, onRemove }: Props) {
  const [name, setName] = useState(habit.name)
  const [color, setColor] = useState(habit.color)
  /** 0 = every day */
  const [target, setTarget] = useState(habit.target ?? 0)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const counts = useMemo(() => countByDay([habit]), [habit])
  const archived = isArchived(habit)
  const dirty = name !== habit.name || color !== habit.color || target !== (habit.target ?? 0)
  const streak = streakInfo(habit, today)

  const stats = [
    { label: 'Current streak', value: formatStreak(streak.current, streak.unit) },
    { label: 'Best streak', value: formatStreak(streak.best, streak.unit) },
    { label: 'Total check-ins', value: String(totalCompletions(habit)) },
    { label: 'Last 30 days', value: `${Math.round(completionRate(habit, today, 30) * 100)}%` },
  ]

  function save(event: FormEvent) {
    event.preventDefault()
    const problem = validateHabitName(name, habits, habit.id)
    if (problem) {
      setError(problem)
      return
    }
    onUpdate({ name, color, target: target || null })
    setError(null)
    setSaved(true)
  }

  return (
    <article className="detail" style={{ '--habit': habit.color } as CSSProperties} aria-labelledby="detail-title">
      <button type="button" className="button button--tertiary back-button" onClick={onBack}>
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M10 3.5L5.5 8l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All habits
      </button>

      <header className="detail__header">
        <span className="dot" aria-hidden="true" />
        <h1 id="detail-title">{habit.name}</h1>
        {archived && <span className="badge">Archived</span>}
      </header>
      <p className="detail__since">
        {targetLabel(habit.target)} · tracking since {longDateLabel(habit.createdOn)}
      </p>

      <dl className="stats">
        {stats.map((s) => (
          <div key={s.label} className="stat">
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>

      <section className="panel detail__section" aria-labelledby="history-title">
        <h2 id="history-title" className="section-title">
          History
        </h2>
        <Heatmap counts={counts} end={today} label={`${habit.name} history`} color={habit.color} />
      </section>

      <section className="panel detail__section" aria-labelledby="edit-title">
        <h2 id="edit-title" className="section-title">
          Edit habit
        </h2>
        <form className="edit-form" onSubmit={save} aria-label="Edit habit">
          <label className="field-label" htmlFor="edit-name">
            Name
          </label>
          <div className="habit-form__row">
            <input
              id="edit-name"
              className="text-input"
              value={name}
              maxLength={MAX_NAME_LENGTH + 20}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
                setSaved(false)
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'edit-name-error' : undefined}
              autoComplete="off"
            />
            <button type="submit" className="button button--primary" disabled={!dirty}>
              Save
            </button>
          </div>
          <label className="field-label" htmlFor="edit-target">
            Goal
          </label>
          <select
            id="edit-target"
            className="select"
            value={target}
            onChange={(e) => {
              setTarget(Number(e.target.value))
              setSaved(false)
            }}
          >
            <option value={0}>{targetLabel(undefined)}</option>
            {TARGET_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {targetLabel(n)}
              </option>
            ))}
          </select>
          <ColorPicker
            name="edit-color"
            value={color}
            onChange={(c) => {
              setColor(c)
              setSaved(false)
            }}
          />
          {error && (
            <p id="edit-name-error" className="form-error" role="alert">
              {error}
            </p>
          )}
          {saved && !dirty && (
            <p className="form-status" role="status">
              Saved
            </p>
          )}
        </form>
      </section>

      <section className="detail__danger" aria-label="Manage habit">
        <button type="button" className="button button--secondary" onClick={() => onArchive(!archived)}>
          {archived ? 'Restore habit' : 'Archive habit'}
        </button>
        {confirming ? (
          <>
            <span className="detail__warning">Delete forever, including history?</span>
            <button type="button" className="button button--danger" onClick={onRemove}>
              Delete
            </button>
            <button type="button" className="button button--tertiary" onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </>
        ) : (
          <button type="button" className="button button--tertiary" onClick={() => setConfirming(true)}>
            Delete habit…
          </button>
        )}
      </section>
    </article>
  )
}
