import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { serialize, STORAGE_KEY } from './lib/storage'

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
})
