import { describe, expect, it, vi } from 'vitest'
import { registerServiceWorker } from './serviceWorker'

describe('registerServiceWorker', () => {
  it('registers sw.js relative to the page when enabled', async () => {
    const registration = {} as ServiceWorkerRegistration
    const register = vi.fn().mockResolvedValue(registration)
    await expect(registerServiceWorker({ serviceWorker: { register } }, true)).resolves.toBe(registration)
    expect(register).toHaveBeenCalledWith('./sw.js', { scope: './' })
  })

  it('does nothing in development or without service worker support', async () => {
    const register = vi.fn()
    await expect(registerServiceWorker({ serviceWorker: { register } }, false)).resolves.toBeNull()
    await expect(registerServiceWorker({}, true)).resolves.toBeNull()
    await expect(registerServiceWorker(undefined, true)).resolves.toBeNull()
    expect(register).not.toHaveBeenCalled()
  })

  it('logs and swallows registration errors', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const register = vi.fn().mockRejectedValue(new Error('blocked'))
    await expect(registerServiceWorker({ serviceWorker: { register } }, true)).resolves.toBeNull()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
