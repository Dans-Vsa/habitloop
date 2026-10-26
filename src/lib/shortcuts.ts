export type View = 'today' | 'insights'

export type Shortcut =
  | { type: 'new' }
  | { type: 'toggle'; index: number }
  | { type: 'view'; view: View }
  | { type: 'help' }
  | { type: 'escape' }

/** Keys listed in the help dialog, in display order. */
export const SHORTCUTS: readonly { keys: string[]; description: string }[] = [
  { keys: ['N'], description: 'New habit' },
  { keys: ['1', '…', '9'], description: 'Check off habit 1–9 for today' },
  { keys: ['T'], description: 'Go to Today' },
  { keys: ['I'], description: 'Go to Insights' },
  { keys: ['?'], description: 'Show keyboard shortcuts' },
  { keys: ['Esc'], description: 'Close dialog / back to the list' },
]

interface KeyInput {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  altKey?: boolean
  target?: EventTarget | null
}

/** True when the key press belongs to a text field rather than to the app. */
export function isTypingTarget(target: EventTarget | null | undefined): boolean {
  if (!target || typeof (target as Element).closest !== 'function') return false
  const element = target as HTMLElement
  if (element.isContentEditable) return true
  return element.closest('input, textarea, select, [contenteditable="true"]') !== null
}

/** Map a key press to an app shortcut, or `null` when it is not one. */
export function shortcutFor(event: KeyInput): Shortcut | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null
  if (isTypingTarget(event.target)) return null
  const { key } = event
  if (key === 'Escape') return { type: 'escape' }
  if (key === '?') return { type: 'help' }
  if (/^[1-9]$/.test(key)) return { type: 'toggle', index: Number(key) - 1 }
  switch (key.toLowerCase()) {
    case 'n':
      return { type: 'new' }
    case 't':
      return { type: 'view', view: 'today' }
    case 'i':
      return { type: 'view', view: 'insights' }
    default:
      return null
  }
}
