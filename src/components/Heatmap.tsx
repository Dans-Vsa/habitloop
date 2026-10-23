import { useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { longDateLabel, type DateKey } from '../lib/dates'
import { buildHeatmap } from '../lib/heatmap'

interface Props {
  counts: Map<DateKey, number>
  end: DateKey
  label: string
  /** Base color for filled cells. */
  color?: string
  weeks?: number
  /** Noun used in tooltips, e.g. "check-in". */
  unit?: string
}

const CELL = 11
const GAP = 3
const STEP = CELL + GAP
const LEFT = 28
const TOP = 16
const WEEKDAY_LABELS: [number, string][] = [
  [1, 'Mon'],
  [3, 'Wed'],
  [5, 'Fri'],
]

function plural(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? '' : 's'}`
}

/** GitHub-style calendar heatmap rendered as a single SVG. */
export function Heatmap({ counts, end, label, color = 'var(--primary)', weeks = 53, unit = 'check-in' }: Props) {
  const map = useMemo(() => buildHeatmap(counts, end, weeks), [counts, end, weeks])
  const width = LEFT + weeks * STEP
  const height = TOP + 7 * STEP
  const scroller = useRef<HTMLDivElement>(null)

  // On narrow screens the grid scrolls; start at the most recent weeks.
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [end, weeks])

  return (
    <figure className="heatmap" style={{ '--heat': color } as CSSProperties}>
      <div className="heatmap__scroll" ref={scroller}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          role="img"
          aria-label={`${label}: ${plural(map.total, unit)} in the last ${weeks} weeks`}
        >
          {map.months.map((m) => (
            <text key={`${m.label}-${m.week}`} className="heatmap__label" x={LEFT + m.week * STEP} y={10}>
              {m.label}
            </text>
          ))}
          {WEEKDAY_LABELS.map(([row, text]) => (
            <text key={text} className="heatmap__label" x={0} y={TOP + row * STEP + CELL - 2}>
              {text}
            </text>
          ))}
          {map.weeks.map((week, w) =>
            week.map((cell, d) =>
              cell.inRange ? (
                <rect
                  key={cell.day}
                  className={`heatmap__cell heatmap__cell--${cell.level}`}
                  x={LEFT + w * STEP}
                  y={TOP + d * STEP}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  data-day={cell.day}
                  data-level={cell.level}
                >
                  <title>{`${longDateLabel(cell.day)}: ${plural(cell.count, unit)}`}</title>
                </rect>
              ) : null,
            ),
          )}
        </svg>
      </div>
      <figcaption className="heatmap__legend">
        <span>{plural(map.total, unit)} in the last year</span>
        <span className="heatmap__scale" aria-hidden="true">
          Less
          {[0, 1, 2, 3, 4].map((level) => (
            <i key={level} className={`heatmap__cell--${level}`} />
          ))}
          More
        </span>
      </figcaption>
    </figure>
  )
}
