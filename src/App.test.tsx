import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { createBackup } from './lib/backup'
import { LEGACY_STORAGE_KEY, serialize, STORAGE_KEY } from './lib/storage'

const TODAY = '2026-10-22'

function renderApp() {
  return render(<App storage={localStorage} today={TODAY} />)
}

describe('App', () => {
  it('shows an empty state on first visit', () => {
    renderApp()
    expect(screen.getByRole('heading', { name: 'Build habits that stick.' })).toBeInTheDocument()
    expect(screen.getByText('No habits yet')).toBeInTheDocument()
    expect(screen.getByText('Thursday, October 22')).toBeInTheDocument()
  })

  it('adds a habit and checks it off for today', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.type(screen.getByLabelText('Habit name'), 'Read 20 pages{Enter}')
    expect(screen.getByText('Read 20 pages')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '0 of 1 done' })).toBeInTheDocument()

    const check = screen.getByRole('button', { name: 'Mark Read 20 pages done today' })
    await user.click(check)
    expect(check).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', { name: '1 of 1 done' })).toBeInTheDocument()
    expect(screen.getByText('1 day streak')).toBeInTheDocument()

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored.habits[0].completions).toEqual([TODAY])
  })

  it('validates the habit name', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'Add habit' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Give the habit a name.')

    await user.type(screen.getByLabelText('Habit name'), 'Run{Enter}')
    await user.type(screen.getByLabelText('Habit name'), 'run{Enter}')
    expect(screen.getByRole('alert')).toHaveTextContent('already track')
    expect(screen.getAllByText('Run')).toHaveLength(1)
  })

  it('loads saved habits and shows streaks from history', () => {
    localStorage.setItem(
      STORAGE_KEY,
      serialize([
        {
          id: 'a',
          name: 'Meditate',
          color: '#27a644',
          createdOn: '2026-10-01',
          completions: ['2026-10-19', '2026-10-20', '2026-10-21'],
        },
      ]),
    )
    renderApp()
    expect(screen.getByText('3 days streak')).toBeInTheDocument()
    expect(screen.getByText('best 3')).toBeInTheDocument()
  })

  it('toggles past days from the 7-day strip', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.type(screen.getByLabelText('Habit name'), 'Walk{Enter}')

    const week = screen.getByRole('list', { name: 'Last 7 days for Walk' })
    const days = within(week).getAllByRole('button')
    expect(days).toHaveLength(7)
    // Days before the habit was created are disabled.
    expect(days[0]).toBeDisabled()
    expect(days[6]).toBeEnabled()

    await user.click(days[6])
    expect(days[6]).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Mark Walk done today' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('deletes a habit after confirmation', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.type(screen.getByLabelText('Habit name'), 'Floss{Enter}')

    await user.click(screen.getByRole('button', { name: 'Delete Floss' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('Floss')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete Floss' }))
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.queryByText('Floss')).not.toBeInTheDocument()
    expect(screen.getByText('No habits yet')).toBeInTheDocument()
  })

  it('shows a combined year heatmap once habits exist', async () => {
    const user = userEvent.setup()
    renderApp()
    expect(screen.queryByRole('img', { name: /All habits/ })).not.toBeInTheDocument()
    await user.type(screen.getByLabelText('Habit name'), 'Read{Enter}')
    await user.click(screen.getByRole('button', { name: 'Mark Read done today' }))
    expect(screen.getByRole('img', { name: 'All habits: 1 check-in in the last 53 weeks' })).toBeInTheDocument()
  })

  it('reorders habits with the move buttons', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.type(screen.getByLabelText('Habit name'), 'First{Enter}')
    await user.type(screen.getByLabelText('Habit name'), 'Second{Enter}')

    expect(screen.getByRole('button', { name: 'Move First up' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move Second down' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Move Second up' }))

    const names = within(screen.getByRole('list', { name: 'Habits' }))
      .getAllByTitle('Open history and settings')
      .map((el) => el.textContent)
    expect(names).toEqual(['Second', 'First'])
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored.habits.map((h: { name: string }) => h.name)).toEqual(['Second', 'First'])
  })

  it('opens a habit detail view with stats and history', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      serialize([
        {
          id: 'a',
          name: 'Meditate',
          color: '#27a644',
          createdOn: '2026-10-01',
          completions: ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22'],
        },
      ]),
    )
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'Meditate' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Meditate' })).toBeInTheDocument()
    expect(screen.getByText('Every day · tracking since Thursday, October 1')).toBeInTheDocument()
    expect(screen.getByText('Total check-ins').nextSibling).toHaveTextContent('4')
    expect(screen.getByText('Current streak').nextSibling).toHaveTextContent('4 days')
    expect(screen.getByRole('img', { name: 'Meditate history: 4 check-ins in the last 53 weeks' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'All habits' }))
    expect(screen.getByRole('heading', { name: '1 of 1 done' })).toBeInTheDocument()
  })

  it('edits the name and color from the detail view', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.type(screen.getByLabelText('Habit name'), 'Run{Enter}')
    await user.type(screen.getByLabelText('Habit name'), 'Swim{Enter}')
    await user.click(screen.getByRole('button', { name: 'Run' }))

    const save = screen.getByRole('button', { name: 'Save' })
    expect(save).toBeDisabled()

    const input = screen.getByLabelText('Name')
    await user.clear(input)
    await user.type(input, 'swim')
    await user.click(save)
    expect(screen.getByRole('alert')).toHaveTextContent('already track')

    await user.clear(input)
    await user.type(input, 'Run 5k')
    await user.click(within(screen.getByRole('form', { name: 'Edit habit' })).getByLabelText('Color #e5484d'))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('status')).toHaveTextContent('Saved')
    expect(screen.getByRole('heading', { level: 1, name: 'Run 5k' })).toBeInTheDocument()

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored.habits[0]).toMatchObject({ name: 'Run 5k', color: '#e5484d' })
  })

  it('archives and restores a habit', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.type(screen.getByLabelText('Habit name'), 'Journal{Enter}')
    await user.type(screen.getByLabelText('Habit name'), 'Stretch{Enter}')
    await user.click(screen.getByRole('button', { name: 'Journal' }))
    await user.click(screen.getByRole('button', { name: 'Archive habit' }))
    expect(screen.getByText('Archived')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'All habits' }))
    expect(screen.getByRole('heading', { name: '0 of 1 done' })).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Habits' })).queryByText('Journal')).not.toBeInTheDocument()
    expect(screen.getByText('Archived (1)')).toBeInTheDocument()

    await user.click(screen.getByText('Archived (1)'))
    await user.click(screen.getByRole('button', { name: 'Restore Journal' }))
    expect(screen.queryByText(/Archived \(/)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '0 of 2 done' })).toBeInTheDocument()
  })

  it('deletes a habit from the detail view after confirmation', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.type(screen.getByLabelText('Habit name'), 'Floss{Enter}')
    await user.click(screen.getByRole('button', { name: 'Floss' }))
    await user.click(screen.getByRole('button', { name: 'Delete habit…' }))
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.getByText('No habits yet')).toBeInTheDocument()
  })

  it('sets a weekly goal and counts the streak in weeks', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      serialize([
        {
          id: 'g',
          name: 'Gym',
          color: '#27a644',
          createdOn: '2026-10-01',
          // two sessions last week (Mon 10-12 .. Sun 10-18), one this week
          completions: ['2026-10-13', '2026-10-15', '2026-10-20'],
        },
      ]),
    )
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'Gym' }))
    await user.selectOptions(screen.getByLabelText('Goal'), '2× per week')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByText(/^2× per week · tracking since/)).toBeInTheDocument()
    expect(screen.getByText('Current streak').nextSibling).toHaveTextContent('1 week')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').habits[0].target).toBe(2)

    await user.click(screen.getByRole('button', { name: 'All habits' }))
    expect(screen.getByText('1 week streak')).toBeInTheDocument()
    expect(screen.getByText('1/2 this week')).toBeInTheDocument()
  })

  it('switches to the insights view and back', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.type(screen.getByLabelText('Habit name'), 'Read{Enter}')
    await user.click(screen.getByRole('button', { name: 'Mark Read done today' }))

    await user.click(screen.getByRole('button', { name: 'Insights' }))
    expect(screen.getByRole('button', { name: 'Insights' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('heading', { level: 1, name: 'Your progress' })).toBeInTheDocument()
    expect(within(screen.getByLabelText('Summary')).getByText('Last 7 days').nextSibling).toHaveTextContent('100%')

    await user.click(screen.getByRole('button', { name: 'Read' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Read' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Today' }))
    expect(screen.getByRole('heading', { name: '1 of 1 done' })).toBeInTheDocument()
  })

  it('imports a backup and saves it', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'Insights' }))
    const backup = createBackup([
      { id: 'x', name: 'Imported', color: '#a46ad2', createdOn: '2026-10-01', completions: ['2026-10-21'] },
    ])
    await user.upload(screen.getByLabelText('Backup file'), new File([backup], 'b.json', { type: 'application/json' }))
    await user.click(screen.getByRole('button', { name: 'Replace all' }))

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').habits[0].name).toBe('Imported')
    await user.click(screen.getByRole('button', { name: 'Today' }))
    expect(screen.getByRole('button', { name: 'Imported' })).toBeInTheDocument()
  })

  it('migrates data saved by v0.2 under the old key', () => {
    localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        habits: [{ id: 'm', name: 'Old habit', color: '#5e6ad2', createdOn: '2026-10-01', completions: [TODAY] }],
      }),
    )
    renderApp()
    expect(screen.getByRole('heading', { name: '1 of 1 done' })).toBeInTheDocument()
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull()
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toMatchObject({ version: 2 })
  })
})
