import { useEffect, useRef } from 'react'
import { SHORTCUTS } from '../lib/shortcuts'

interface Props {
  onClose: () => void
}

export function ShortcutsHelp({ onClose }: Props) {
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeButton.current?.focus()
    return () => previous?.focus?.()
  }, [])

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog__header">
          <h2 id="shortcuts-title" className="section-title">
            Keyboard shortcuts
          </h2>
          <button ref={closeButton} type="button" className="button button--tertiary" onClick={onClose}>
            Close
          </button>
        </div>
        <dl className="shortcut-list">
          {SHORTCUTS.map(({ keys, description }) => (
            <div key={description} className="shortcut-list__row">
              <dt>
                {keys.map((key) => (key === '…' ? <span key={key}> … </span> : <kbd key={key}>{key}</kbd>))}
              </dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
