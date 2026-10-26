import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { serialize, STORAGE_KEY } from './lib/storage'

const TODAY = '2026-10-22'

function seed() {
  localStorage.setItem(
    STORAGE_KEY,
    serialize([
      { id: 'a', name: 'Read', color: '#5e6ad2', createdOn: '2026-10-01', completions: [] },
      { id: 'b', name: 'Run', color: '#27a644', createdOn: '2026-10-01', completions: [] },
    ]),
  )
}

function renderApp() {
  return render(<App storage={localStorage} today={TODAY} />)
}

describe('keyboard shortcuts', () => {
  it('toggles habits by their position with number keys', async () => {
    seed()
    const user = userEvent.setup()
    renderApp()

    await user.keyboard('2')
    expect(screen.getByRole('button', { name: 'Mark Run done today' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Mark Read done today' })).toHaveAttribute('aria-pressed', 'false')

    await user.keyboard('2')
    expect(screen.getByRole('button', { name: 'Mark Run done today' })).toHaveAttribute('aria-pressed', 'false')

    await user.keyboard('9')
    expect(screen.getByRole('heading', { name: '0 of 2 done' })).toBeInTheDocument()
  })

  it('focuses the new habit field with N without typing the letter', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.keyboard('i')
    expect(screen.getByRole('button', { name: 'Insights' })).toHaveAttribute('aria-current', 'page')

    await user.keyboard('n')
    const input = screen.getByLabelText('Habit name')
    expect(input).toHaveFocus()
    expect(input).toHaveValue('')

    // Shortcuts are ignored while typing.
    await user.keyboard('in1')
    expect(input).toHaveValue('in1')
    expect(screen.getByRole('button', { name: 'Today' })).toHaveAttribute('aria-current', 'page')
  })

  it('switches views with T and I', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.keyboard('i')
    expect(screen.getByRole('button', { name: 'Insights' })).toHaveAttribute('aria-current', 'page')
    await user.keyboard('t')
    expect(screen.getByRole('button', { name: 'Today' })).toHaveAttribute('aria-current', 'page')
  })

  it('opens and closes the shortcuts dialog', async () => {
    seed()
    const user = userEvent.setup()
    renderApp()

    await user.keyboard('?')
    const dialog = screen.getByRole('dialog', { name: 'Keyboard shortcuts' })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()

    // Other shortcuts are paused while the dialog is open.
    await user.keyboard('1')
    expect(screen.getByRole('button', { name: 'Mark Read done today' })).toHaveAttribute('aria-pressed', 'false')

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /for shortcuts/ }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('goes back from a habit page with Escape and ignores number keys there', async () => {
    seed()
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('button', { name: 'Read' }))
    expect(screen.queryByRole('list', { name: 'Habits' })).not.toBeInTheDocument()
    await user.keyboard('1')
    await user.keyboard('{Escape}')
    expect(screen.getByRole('list', { name: 'Habits' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mark Read done today' })).toHaveAttribute('aria-pressed', 'false')
  })
})
