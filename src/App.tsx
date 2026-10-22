import { useEffect, useState } from 'react'
import { HabitForm } from './components/HabitForm'
import { HabitRow } from './components/HabitRow'
import { useHabits } from './hooks/useHabits'
import { longDateLabel, todayKey } from './lib/dates'
import { isDone } from './lib/habits'

/** Re-render when the local date rolls over so "today" stays correct. */
function useToday(): string {
  const [today, setToday] = useState(() => todayKey())
  useEffect(() => {
    const id = window.setInterval(() => setToday(todayKey()), 60_000)
    return () => window.clearInterval(id)
  }, [])
  return today
}

interface AppProps {
  storage?: Storage
  today?: string
}

export default function App({ storage, today: fixedToday }: AppProps) {
  const liveToday = useToday()
  const today = fixedToday ?? liveToday
  const { habits, dispatch } = useHabits(storage)
  const doneCount = habits.filter((h) => isDone(h, today)).length

  return (
    <div className="app">
      <header className="top-nav">
        <div className="brand">
          <svg className="brand__mark" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="44 10" strokeLinecap="round" />
          </svg>
          <span>habitloop</span>
        </div>
        <span className="top-nav__date">{longDateLabel(today)}</span>
      </header>

      <main className="content">
        <section className="hero">
          <p className="eyebrow">Today</p>
          <h1>
            {habits.length === 0
              ? 'Build habits that stick.'
              : `${doneCount} of ${habits.length} done`}
          </h1>
          <p className="lead">Check off each habit once a day. Your streaks and history stay in this browser.</p>
          {habits.length > 0 && (
            <div
              className="progress"
              role="progressbar"
              aria-label="Habits done today"
              aria-valuemin={0}
              aria-valuemax={habits.length}
              aria-valuenow={doneCount}
            >
              <span style={{ width: `${(doneCount / habits.length) * 100}%` }} />
            </div>
          )}
        </section>

        <section className="panel">
          <HabitForm habits={habits} onAdd={(name, color) => dispatch({ type: 'add', name, color, today })} />

          {habits.length === 0 ? (
            <div className="empty">
              <p className="empty__title">No habits yet</p>
              <p>Add your first habit above — small and specific works best.</p>
            </div>
          ) : (
            <ul className="habit-list" aria-label="Habits">
              {habits.map((habit) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  today={today}
                  onToggle={(day) => dispatch({ type: 'toggle', id: habit.id, day })}
                  onRemove={() => dispatch({ type: 'remove', id: habit.id })}
                />
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="footer">Local-first · your data never leaves this device</footer>
    </div>
  )
}
