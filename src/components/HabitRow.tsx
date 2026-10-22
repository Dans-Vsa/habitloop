import { useState, type CSSProperties } from 'react'
import { lastNDays, longDateLabel, weekdayLabel, type DateKey } from '../lib/dates'
import { currentStreak, isDone, longestStreak, type Habit } from '../lib/habits'

interface Props {
  habit: Habit
  today: DateKey
  onToggle: (day: DateKey) => void
  onRemove: () => void
}

export function HabitRow({ habit, today, onToggle, onRemove }: Props) {
  const [confirming, setConfirming] = useState(false)
  const days = lastNDays(today, 7)
  const streak = currentStreak(habit, today)
  const best = longestStreak(habit)
  const doneToday = isDone(habit, today)

  return (
    <li className="habit-row" style={{ '--habit': habit.color } as CSSProperties}>
      <button
        type="button"
        className={`check ${doneToday ? 'check--done' : ''}`}
        aria-pressed={doneToday}
        aria-label={`Mark ${habit.name} done today`}
        onClick={() => onToggle(today)}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="habit-row__main">
        <span className="habit-row__name">{habit.name}</span>
        <span className="habit-row__meta">
          <span className="badge" title="Current streak">
            {streak} day{streak === 1 ? '' : 's'} streak
          </span>
          <span className="habit-row__best">best {best}</span>
        </span>
      </div>

      <ol className="week" aria-label={`Last 7 days for ${habit.name}`}>
        {days.map((day) => {
          const done = isDone(habit, day)
          const beforeStart = day < habit.createdOn
          return (
            <li key={day}>
              <button
                type="button"
                className={`day ${done ? 'day--done' : ''} ${day === today ? 'day--today' : ''}`}
                aria-pressed={done}
                aria-label={`${longDateLabel(day)}: ${done ? 'done' : 'not done'}`}
                title={longDateLabel(day)}
                disabled={beforeStart && !done}
                onClick={() => onToggle(day)}
              >
                <span className="day__label">{weekdayLabel(day).slice(0, 2)}</span>
              </button>
            </li>
          )
        })}
      </ol>

      <div className="habit-row__actions">
        {confirming ? (
          <>
            <button type="button" className="button button--danger" onClick={onRemove}>
              Delete
            </button>
            <button type="button" className="button button--tertiary" onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            className="button button--tertiary icon-button"
            aria-label={`Delete ${habit.name}`}
            onClick={() => setConfirming(true)}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    </li>
  )
}
