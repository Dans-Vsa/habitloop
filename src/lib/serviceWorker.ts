/** Minimal slice of `Navigator` used here, so tests can pass a fake. */
export interface ServiceWorkerHost {
  serviceWorker?: Pick<ServiceWorkerContainer, 'register'>
}

/**
 * Register `sw.js` (emitted by the build) for offline support. Skipped in
 * development and in browsers without service workers; failures are logged,
 * never thrown, because the app works fine without offline support.
 */
export async function registerServiceWorker(
  host: ServiceWorkerHost | undefined = globalThis.navigator,
  enabled: boolean = import.meta.env.PROD,
): Promise<ServiceWorkerRegistration | null> {
  if (!enabled || !host?.serviceWorker) return null
  try {
    return await host.serviceWorker.register('./sw.js', { scope: './' })
  } catch (error) {
    console.warn('habitloop: offline support is unavailable', error)
    return null
  }
}
