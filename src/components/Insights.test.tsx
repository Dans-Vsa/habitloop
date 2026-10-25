import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createBackup } from '../lib/backup'
import type { Habit } from '../lib/habits'
import { Insights } from './Insights'
import { WeekdayChart } from './WeekdayChart'

const TODAY = '2026-10-22'

const read: Habit = {
  id: 'r',
  name: 'Read',
  color: '#5e6ad2',
  createdOn: '2026-10-16',
  // Fri, Sat, Sun, Mon, Tue, Wed, Thu — the full last 7 days
  completions: ['2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22'],
}
const gym: Habit = { id: 'g', name: 'Gym', color: '#27a644', createdOn: '2026-10-16', completions: ['2026-10-19'], target: 3 }
const old: Habit = { id: 'o', name: 'Old', color: '#e5484d', createdOn: '2026-10-01', completions: [], archived: true }

function stat(label: string) {
  return within(screen.getByLabelText('Summary')).getByText(label).nextSibling
}

function fileFrom(text: string) {
  return new File([text], 'backup.json', { type: 'application/json' })
}

describe('WeekdayChart', () => {
  it('draws one bar per weekday and describes the data', () => {
    const { container } = render(<WeekdayChart counts={[1, 0, 0, 4, 0, 0, 2]} />)
    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Check-ins by weekday: Mon 1, Tue 0, Wed 0, Thu 4, Fri 0, Sat 0, Sun 2',
    )
    expect(container.querySelectorAll('.weekday-chart__bar')).toHaveLength(7)
    expect(container.querySelector('.weekday-chart__bar--top')).toHaveAttribute('data-day', 'Thu')
  })

  it('handles no data', () => {
    const { container } = render(<WeekdayChart counts={[0, 0, 0, 0, 0, 0, 0]} />)
    expect(container.querySelector('.weekday-chart__bar--top')).toBeNull()
  })
})

describe('Insights', () => {
  it('shows rates, totals and a per-habit table without archived habits', () => {
    render(<Insights habits={[read, gym, old]} today={TODAY} onOpen={() => {}} onReplace={() => {}} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Your progress' })).toBeInTheDocument()
    expect(stat('Total check-ins')).toHaveTextContent('8')
    expect(stat('Active days')).toHaveTextContent('7')
    expect(stat('Top streak')).toHaveTextContent('7 days')
    expect(screen.getByText('Read', { selector: '.stat__hint' })).toBeInTheDocument()

    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('ReadEvery day100%7 days')
    expect(rows[1]).toHaveTextContent('Gym3× per week')
    expect(screen.queryByText('Old')).not.toBeInTheDocument()
  })

  it('shows an empty state with no active habits', () => {
    render(<Insights habits={[]} today={TODAY} onOpen={() => {}} onReplace={() => {}} />)
    expect(screen.getByText('Nothing to measure yet')).toBeInTheDocument()
    expect(stat('Last 7 days')).toHaveTextContent('–')
    expect(screen.getByRole('button', { name: 'Export JSON' })).toBeDisabled()
  })

  it('opens a habit from the table', async () => {
    const onOpen = vi.fn()
    render(<Insights habits={[read]} today={TODAY} onOpen={onOpen} onReplace={() => {}} />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Read' }))
    expect(onOpen).toHaveBeenCalledWith('r')
  })
})

describe('BackupPanel (via Insights)', () => {
  it('imports and merges a backup after confirmation', async () => {
    const onReplace = vi.fn()
    const user = userEvent.setup()
    render(<Insights habits={[read]} today={TODAY} onOpen={() => {}} onReplace={onReplace} />)

    await user.upload(screen.getByLabelText('Backup file'), fileFrom(createBackup([{ ...read, completions: ['2026-10-01'] }, gym])))
    expect(screen.getByRole('group', { name: 'Confirm import' })).toHaveTextContent('Found 2 habits')

    await user.click(screen.getByRole('button', { name: 'Merge' }))
    const merged: Habit[] = onReplace.mock.calls[0][0]
    expect(merged.map((h) => h.id)).toEqual(['r', 'g'])
    expect(merged[0].completions[0]).toBe('2026-10-01')
    expect(screen.getByRole('status')).toHaveTextContent('Merged 2 habits.')
  })

  it('replaces everything when asked', async () => {
    const onReplace = vi.fn()
    const user = userEvent.setup()
    render(<Insights habits={[read]} today={TODAY} onOpen={() => {}} onReplace={onReplace} />)
    await user.upload(screen.getByLabelText('Backup file'), fileFrom(createBackup([gym])))
    await user.click(screen.getByRole('button', { name: 'Replace all' }))
    expect(onReplace).toHaveBeenCalledWith([gym])
  })

  it('reports invalid files and changes nothing', async () => {
    const onReplace = vi.fn()
    const user = userEvent.setup()
    render(<Insights habits={[read]} today={TODAY} onOpen={() => {}} onReplace={onReplace} />)
    await user.upload(screen.getByLabelText('Backup file'), fileFrom('{oops'))
    expect(screen.getByRole('alert')).toHaveTextContent('not valid JSON')
    expect(screen.queryByRole('group', { name: 'Confirm import' })).not.toBeInTheDocument()
    expect(onReplace).not.toHaveBeenCalled()
  })

  it('exports a JSON file', async () => {
    const createObjectURL = vi.fn(() => 'blob:habitloop')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }))
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    render(<Insights habits={[read, gym]} today={TODAY} onOpen={() => {}} onReplace={() => {}} />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Export JSON' }))

    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(click).toHaveBeenCalledOnce()
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe('habitloop-backup-2026-10-22.json')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:habitloop')
    expect(screen.getByRole('status')).toHaveTextContent('Exported 2 habits.')

    click.mockRestore()
    vi.unstubAllGlobals()
  })
})
