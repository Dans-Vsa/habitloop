import { useRef, useState, type ChangeEvent } from 'react'
import { backupFileName, createBackup, mergeHabits, parseBackup } from '../lib/backup'
import type { DateKey } from '../lib/dates'
import { downloadText } from '../lib/download'
import type { Habit } from '../lib/habits'

interface Props {
  habits: Habit[]
  today: DateKey
  onReplace: (habits: Habit[]) => void
}

type Status = { kind: 'error' | 'success'; text: string } | null

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

export function BackupPanel({ habits, today, onReplace }: Props) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Habit[] | null>(null)
  const [status, setStatus] = useState<Status>(null)

  function exportData() {
    try {
      downloadText(createBackup(habits), backupFileName(today))
      setStatus({ kind: 'success', text: `Exported ${plural(habits.length, 'habit')}.` })
    } catch {
      setStatus({ kind: 'error', text: 'Your browser blocked the download.' })
    }
  }

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const result = parseBackup(await file.text())
    if (!result.ok) {
      setPending(null)
      setStatus({ kind: 'error', text: result.error })
      return
    }
    setPending(result.habits)
    setStatus(null)
  }

  function apply(mode: 'merge' | 'replace') {
    if (!pending) return
    onReplace(mode === 'merge' ? mergeHabits(habits, pending) : pending)
    setStatus({
      kind: 'success',
      text: mode === 'merge' ? `Merged ${plural(pending.length, 'habit')}.` : `Replaced with ${plural(pending.length, 'habit')}.`,
    })
    setPending(null)
  }

  return (
    <div className="backup">
      <p className="backup__text">
        Save a JSON copy of all habits and check-ins, or bring one back on this or another device.
      </p>
      <div className="backup__actions">
        <button type="button" className="button button--secondary" onClick={exportData} disabled={habits.length === 0}>
          Export JSON
        </button>
        <button type="button" className="button button--secondary" onClick={() => fileInput.current?.click()}>
          Import JSON…
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="visually-hidden"
          aria-label="Backup file"
          tabIndex={-1}
          onChange={readFile}
        />
      </div>

      {pending && (
        <div className="backup__confirm" role="group" aria-label="Confirm import">
          <p>
            Found {plural(pending.length, 'habit')}. Merge them into your current {plural(habits.length, 'habit')}, or
            replace everything?
          </p>
          <div className="backup__actions">
            <button type="button" className="button button--primary" onClick={() => apply('merge')}>
              Merge
            </button>
            <button type="button" className="button button--danger" onClick={() => apply('replace')}>
              Replace all
            </button>
            <button type="button" className="button button--tertiary" onClick={() => setPending(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {status && (
        <p className={status.kind === 'error' ? 'form-error' : 'form-status'} role={status.kind === 'error' ? 'alert' : 'status'}>
          {status.text}
        </p>
      )}
    </div>
  )
}
