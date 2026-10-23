import type { CSSProperties } from 'react'
import { HABIT_COLORS } from '../lib/habits'

interface Props {
  /** Radio group name; must be unique on the page. */
  name: string
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ name, value, onChange }: Props) {
  return (
    <fieldset className="swatches">
      <legend className="visually-hidden">Color</legend>
      {HABIT_COLORS.map((c) => (
        <label key={c} className="swatch" style={{ '--swatch': c } as CSSProperties}>
          <input
            type="radio"
            name={name}
            value={c}
            checked={value === c}
            onChange={() => onChange(c)}
            aria-label={`Color ${c}`}
          />
          <span aria-hidden="true" />
        </label>
      ))}
    </fieldset>
  )
}
