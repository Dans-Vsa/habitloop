import { WEEKDAYS } from '../lib/stats'

interface Props {
  /** Check-ins per weekday, Monday first. */
  counts: number[]
}

const BAR = 32
const GAP = 16
const CHART_HEIGHT = 120
const TOP = 18
const BOTTOM = 22

/** Bar chart of check-ins per weekday; the busiest day is highlighted. */
export function WeekdayChart({ counts }: Props) {
  const max = Math.max(0, ...counts)
  const width = WEEKDAYS.length * BAR + (WEEKDAYS.length - 1) * GAP
  const height = TOP + CHART_HEIGHT + BOTTOM
  const summary = WEEKDAYS.map((day, i) => `${day} ${counts[i]}`).join(', ')

  return (
    <figure className="weekday-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Check-ins by weekday: ${summary}`}>
        {WEEKDAYS.map((day, i) => {
          const value = counts[i] ?? 0
          const barHeight = max > 0 ? Math.max(value > 0 ? 4 : 0, (value / max) * CHART_HEIGHT) : 0
          const x = i * (BAR + GAP)
          const y = TOP + CHART_HEIGHT - barHeight
          const top = max > 0 && value === max
          return (
            <g key={day}>
              <rect x={x} y={TOP} width={BAR} height={CHART_HEIGHT} rx={6} className="weekday-chart__track" />
              <rect
                x={x}
                y={y}
                width={BAR}
                height={barHeight}
                rx={6}
                className={`weekday-chart__bar ${top ? 'weekday-chart__bar--top' : ''}`}
                data-day={day}
              >
                <title>{`${day}: ${value} check-in${value === 1 ? '' : 's'}`}</title>
              </rect>
              <text x={x + BAR / 2} y={y - 6} className="weekday-chart__value" textAnchor="middle">
                {value}
              </text>
              <text x={x + BAR / 2} y={height - 6} className="weekday-chart__label" textAnchor="middle">
                {day}
              </text>
            </g>
          )
        })}
      </svg>
    </figure>
  )
}
