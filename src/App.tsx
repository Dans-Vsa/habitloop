import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { HabitDetail } from './components/HabitDetail'
import { HabitForm } from './components/HabitForm'
import { HabitRow } from './components/HabitRow'
import { Heatmap } from './components/Heatmap'
import { useHabits } from './hooks/useHabits'
import { longDateLabel, todayKey } from './lib/dates'
import { isArchived, isDone } from './lib/habits'
import { countByDay } from './lib/heatmap'

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
  const [openId, setOpenId] = useState<string | null>(null)

  const active = habits.filter((h) => !isArchived(h))
  const archived = habits.filter(isArchived)
  const doneCount = active.filter((h) => isDone(h, today)).length
  const combined = useMemo(() => countByDay(habits.filter((h) => !isArchived(h))), [habits])
  const openHabit = habits.find((h) => h.id === openId)

  return (
    <div className="app">
      <header className="top-nav">
        <button type="button" className="brand" onClick={() => setOpenId(null)} aria-label="habitloop home">
          <svg className="brand__mark" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="44 10" strokeLinecap="round" />
          </svg>
          <span>habitloop</span>
        </button>
        <span className="top-nav__date">{longDateLabel(today)}</span>
      </header>

      <main className="content">
        {openHabit ? (
          <HabitDetail
            key={openHabit.id}
            habit={openHabit}
            habits={habits}
            today={today}
            onBack={() => setOpenId(null)}
            onUpdate={(changes) => dispatch({ type: 'update', id: openHabit.id, changes })}
            onArchive={(value) => dispatch({ type: 'archive', id: openHabit.id, archived: value })}
            onRemove={() => {
              dispatch({ type: 'remove', id: openHabit.id })
              setOpenId(null)
            }}
          />
        ) : (
          <>
            <section className="hero">
              <p className="eyebrow">Today</p>
              <h1>{active.length === 0 ? 'Build habits that stick.' : `${doneCount} of ${active.length} done`}</h1>
              <p className="lead">Check off each habit once a day. Your streaks and history stay in this browser.</p>
              {active.length > 0 && (
                <div
                  className="progress"
                  role="progressbar"
                  aria-label="Habits done today"
                  aria-valuemin={0}
                  aria-valuemax={active.length}
                  aria-valuenow={doneCount}
                >
                  <span style={{ width: `${(doneCount / active.length) * 100}%` }} />
                </div>
              )}
            </section>

            <section className="panel">
              <HabitForm habits={habits} onAdd={(name, color) => dispatch({ type: 'add', name, color, today })} />

              {active.length === 0 ? (
                <div className="empty">
                  <p className="empty__title">No habits yet</p>
                  <p>Add your first habit above — small and specific works best.</p>
                </div>
              ) : (
                <ul className="habit-list" aria-label="Habits">
                  {active.map((habit, index) => (
                    <HabitRow
                      key={habit.id}
                      habit={habit}
                      today={today}
                      isFirst={index === 0}
                      isLast={index === active.length - 1}
                      onToggle={(day) => dispatch({ type: 'toggle', id: habit.id, day })}
                      onRemove={() => dispatch({ type: 'remove', id: habit.id })}
                      onOpen={() => setOpenId(habit.id)}
                      onMove={(direction) => dispatch({ type: 'move', id: habit.id, direction })}
                    />
                  ))}
                </ul>
              )}
            </section>

            {active.length > 0 && (
              <section className="panel section" aria-labelledby="year-title">
                <h2 id="year-title" className="section-title">
                  Your year
                </h2>
                <Heatmap counts={combined} end={today} label="All habits" />
              </section>
            )}

            {archived.length > 0 && (
              <details className="archived">
                <summary>Archived ({archived.length})</summary>
                <ul className="archived__list" aria-label="Archived habits">
                  {archived.map((habit) => (
                    <li key={habit.id} style={{ '--habit': habit.color } as CSSProperties}>
                      <span className="dot" aria-hidden="true" />
                      <button type="button" className="archived__name" onClick={() => setOpenId(habit.id)}>
                        {habit.name}
                      </button>
                      <button
                        type="button"
                        className="button button--tertiary"
                        aria-label={`Restore ${habit.name}`}
                        onClick={() => dispatch({ type: 'archive', id: habit.id, archived: false })}
                      >
                        Restore
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
      </main>

      <footer className="footer">Local-first · your data never leaves this device</footer>
    </div>
  )
}
