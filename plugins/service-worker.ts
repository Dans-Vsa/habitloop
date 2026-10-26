import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import type { Plugin } from 'vite'

const TEMPLATE_URL = new URL('./sw-template.js', import.meta.url)

/** Files in the public dir that should not be precached. */
const SKIP_PUBLIC = new Set(['sw.js'])

/** Fill the service worker template with a cache version and precache list. */
export function renderServiceWorker(template: string, files: string[], version: string): string {
  // index.html is the offline fallback; Vite may emit it after this plugin runs.
  const precache = ['./', ...[...new Set([...files, 'index.html'])].filter((file) => file !== 'sw.js').sort()]
  return template
    .replace('__CACHE_VERSION__', JSON.stringify(version))
    .replace('__PRECACHE_FILES__', JSON.stringify(precache, null, 2))
}

/** Short content hash so every build with different files gets a fresh cache. */
export function cacheVersion(parts: string[]): string {
  const hash = createHash('sha256')
  for (const part of parts) hash.update(part).update('\0')
  return hash.digest('hex').slice(0, 12)
}

function listFiles(dir: string, root = dir): string[] {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return []
  }
  return entries.flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? listFiles(path, root) : [relative(root, path).split('\\').join('/')]
  })
}

/**
 * Emit `sw.js` that precaches every file of the production build (hashed JS/CSS,
 * index.html and the public dir) so the app works offline after the first visit.
 */
export function serviceWorker(): Plugin {
  let publicDir = ''
  return {
    name: 'habitloop-service-worker',
    apply: 'build',
    configResolved(config) {
      publicDir = config.publicDir
    },
    generateBundle(_options, bundle) {
      const publicFiles = publicDir ? listFiles(publicDir).filter((file) => !SKIP_PUBLIC.has(file)) : []
      const files = [...Object.keys(bundle).filter((file) => !file.endsWith('.map')), ...publicFiles]
      const versionParts = files.map((file) => {
        const output = bundle[file]
        if (!output) return file
        return file + (output.type === 'asset' ? String(output.source) : output.code)
      })
      const template = readFileSync(TEMPLATE_URL, 'utf8')
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: renderServiceWorker(template, files, cacheVersion([template, ...versionParts])),
      })
    },
  }
}
