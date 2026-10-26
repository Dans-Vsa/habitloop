// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { cacheVersion, renderServiceWorker } from './service-worker.ts'

const template = readFileSync(new URL('./sw-template.js', import.meta.url), 'utf8')

describe('renderServiceWorker', () => {
  it('fills in the cache version and a sorted, de-duplicated precache list', () => {
    const sw = renderServiceWorker(template, ['index.html', 'assets/app-1.js', 'favicon.svg', 'index.html', 'sw.js'], 'abc123')
    expect(sw).toContain(`const CACHE = CACHE_PREFIX + "abc123"`)
    const list = JSON.parse(sw.match(/const PRECACHE = (\[[\s\S]*?\])/)![1])
    expect(list).toEqual(['./', 'assets/app-1.js', 'favicon.svg', 'index.html'])
    expect(sw).not.toContain('__')
  })

  it('always precaches index.html as the offline fallback', () => {
    const sw = renderServiceWorker(template, ['assets/app-1.js'], 'v1')
    expect(sw).toContain('"index.html"')
  })

  it('ignores Vary headers when serving cached assets', () => {
    expect(template).toContain('ignoreVary: true')
  })

  it('produces valid JavaScript', () => {
    const sw = renderServiceWorker(template, ['index.html'], 'v1')
    expect(() => new Function(sw)).not.toThrow()
  })
})

describe('cacheVersion', () => {
  it('is stable for the same input and changes with content', () => {
    expect(cacheVersion(['a', 'b'])).toBe(cacheVersion(['a', 'b']))
    expect(cacheVersion(['a', 'b'])).not.toBe(cacheVersion(['a', 'c']))
    expect(cacheVersion(['ab'])).not.toBe(cacheVersion(['a', 'b']))
    expect(cacheVersion([])).toMatch(/^[0-9a-f]{12}$/)
  })
})
