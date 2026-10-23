import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Heatmap } from './Heatmap'

describe('Heatmap', () => {
  it('renders one cell per day up to the end date with a summary label', () => {
    const counts = new Map([
      ['2026-10-21', 2],
      ['2026-10-22', 1],
    ])
    const { container } = render(<Heatmap counts={counts} end="2026-10-22" label="All habits" weeks={2} />)

    expect(screen.getByRole('img', { name: 'All habits: 3 check-ins in the last 2 weeks' })).toBeInTheDocument()
    // Two weeks starting Sunday 2026-10-11, ending Thursday 2026-10-22.
    const cells = container.querySelectorAll('rect')
    expect(cells).toHaveLength(12)
    expect(container.querySelector('rect[data-day="2026-10-21"]')).toHaveAttribute('data-level', '4')
    expect(container.querySelector('rect[data-day="2026-10-22"]')).toHaveAttribute('data-level', '2')
    expect(container.querySelector('rect[data-day="2026-10-22"] title')).toHaveTextContent(
      'Thursday, October 22: 1 check-in',
    )
  })
})
