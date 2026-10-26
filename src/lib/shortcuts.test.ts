import { afterEach, describe, expect, it } from 'vitest'
import { isTypingTarget, shortcutFor } from './shortcuts'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('shortcutFor', () => {
  it('maps letter keys case-insensitively', () => {
    expect(shortcutFor({ key: 'n' })).toEqual({ type: 'new' })
    expect(shortcutFor({ key: 'N' })).toEqual({ type: 'new' })
    expect(shortcutFor({ key: 't' })).toEqual({ type: 'view', view: 'today' })
    expect(shortcutFor({ key: 'I' })).toEqual({ type: 'view', view: 'insights' })
  })

  it('maps digits 1-9 to zero-based habit indexes', () => {
    expect(shortcutFor({ key: '1' })).toEqual({ type: 'toggle', index: 0 })
    expect(shortcutFor({ key: '9' })).toEqual({ type: 'toggle', index: 8 })
    expect(shortcutFor({ key: '0' })).toBeNull()
  })

  it('maps help and escape', () => {
    expect(shortcutFor({ key: '?' })).toEqual({ type: 'help' })
    expect(shortcutFor({ key: 'Escape' })).toEqual({ type: 'escape' })
  })

  it('ignores modified keys and unknown keys', () => {
    expect(shortcutFor({ key: 'n', ctrlKey: true })).toBeNull()
    expect(shortcutFor({ key: 'i', metaKey: true })).toBeNull()
    expect(shortcutFor({ key: '1', altKey: true })).toBeNull()
    expect(shortcutFor({ key: 'x' })).toBeNull()
    expect(shortcutFor({ key: 'Enter' })).toBeNull()
  })

  it('ignores keys typed into form fields', () => {
    document.body.innerHTML = '<input id="a" /><textarea id="b"></textarea><select id="c"></select><button id="d"></button>'
    for (const id of ['a', 'b', 'c']) {
      expect(shortcutFor({ key: 'n', target: document.getElementById(id) })).toBeNull()
    }
    expect(shortcutFor({ key: 'n', target: document.getElementById('d') })).toEqual({ type: 'new' })
  })
})

describe('isTypingTarget', () => {
  it('handles missing and non-element targets', () => {
    expect(isTypingTarget(null)).toBe(false)
    expect(isTypingTarget(undefined)).toBe(false)
    expect(isTypingTarget(window)).toBe(false)
  })

  it('detects contenteditable regions', () => {
    document.body.innerHTML = '<div contenteditable="true"><span id="s">x</span></div>'
    expect(isTypingTarget(document.getElementById('s'))).toBe(true)
  })
})
