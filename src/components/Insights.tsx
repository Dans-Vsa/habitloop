import { useMemo, type CSSProperties } from 'react'
import type { DateKey } from '../lib/dates'
import { formatStreak, isArchived, type Habit } from '../lib/habits'
import { buildInsights, formatRate } from '../lib/stats'
import { targetLabel } from '../lib/weekly'
import { BackupPanel } from './BackupPanel'
import { WeekdayChart } from './WeekdayChart'

interface Props {
  habits: Habit[]
  today: DateKey
  onOpen: (id: string) => void
  onReplace: (habits: Habit[]) => void
}

/** Stats dashboard: completion rates, weekday pattern, per-habit table and backups. */
export function Insights({ habits, today, onOpen, onReplace }: Props) {
  const active = useMemo(() => habits.filter((h) => !isArchived(h)), [habits])
  const insights = useMemo(() => buildInsights(active, today), [active, today])
  const top = insights.topStreak

  const stats = [
    { label: 'Last 7 days', value: formatRate(insights.rates.last7) },
    { label: 'Last 30 days', value: formatRate(insights.rates.last30) },
    { label: 'All time', value: formatRate(insights.rates.allTime) },
    { label: 'Total check-ins', value: String(insights.totalCheckIns) },
    { label: 'Active days', value: String(insights.activeDays) },
    { label: 'Top streak', value: top ? formatStreak(top.streak.current, top.streak.unit) : '–', hint: top?.habit.name },
  ]

  return (
    <div className="insights">
      <section className="hero">
        <p className="eyebrow">Insights</p>
        <h1>Your progress</h1>
        <p className="lead">
          Completion rates compare check-ins with each habit's goal — every day, or a number of times per week. Archived
          habits are left out.
        </p>
      </section>

      <dl className="stats stats--insights" aria-label="Summary">
        {stats.map((s) => (
          <div key={s.label} className="stat">
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
            {s.hint && <dd className="stat__hint">{s.hint}</dd>}
          </div>
        ))}
      </dl>

      {active.length === 0 ? (
        <div className="panel empty">
          <p className="empty__title">Nothing to measure yet</p>
          <p>Add a habit and check it off — your stats will show up here.</p>
        </div>
      ) : (
        <>
          <section className="panel section" aria-labelledby="weekday-title">
            <h2 id="weekday-title" className="section-title">
              By weekday
            </h2>
            <WeekdayChart counts={insights.weekdays} />
          </section>

          <section className="panel section" aria-labelledby="per-habit-title">
            <h2 id="per-habit-title" className="section-title">
              Per habit
            </h2>
            <table className="habit-table">
              <thead>
                <tr>
                  <th scope="col">Habit</th>
                  <th scope="col">Goal</th>
                  <th scope="col">30 days</th>
                  <th scope="col">Streak</th>
                </tr>
              </thead>
              <tbody>
                {insights.perHabit.map(({ habit, rate30, streak }) => (
                  <tr key={habit.id} style={{ '--habit': habit.color } as CSSProperties}>
                    <th scope="row">
                      <button type="button" className="habit-table__name" onClick={() => onOpen(habit.id)}>
                        <span className="dot" aria-hidden="true" />
                        {habit.name}
                      </button>
                    </th>
                    <td>{targetLabel(habit.target)}</td>
                    <td>
                      <span className="rate">
                        <span className="rate__bar" aria-hidden="true">
                          <span style={{ width: `${Math.round((rate30 ?? 0) * 100)}%` }} />
                        </span>
                        {formatRate(rate30)}
                      </span>
                    </td>
                    <td>{formatStreak(streak.current, streak.unit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      <section className="panel section" aria-labelledby="backup-title">
        <h2 id="backup-title" className="section-title">
          Backup
        </h2>
        <BackupPanel habits={habits} today={today} onReplace={onReplace} />
      </section>
    </div>
  )
}
