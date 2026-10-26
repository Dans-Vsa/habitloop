import { useEffect, useRef } from 'react'
import { shortcutFor, type Shortcut } from '../lib/shortcuts'

/** Listen for app-wide keyboard shortcuts on `window`. */
export function useShortcuts(onShortcut: (shortcut: Shortcut) => void) {
  const handler = useRef(onShortcut)

  useEffect(() => {
    handler.current = onShortcut
  })

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) return
      const shortcut = shortcutFor(event)
      if (!shortcut) return
      event.preventDefault()
      handler.current(shortcut)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
