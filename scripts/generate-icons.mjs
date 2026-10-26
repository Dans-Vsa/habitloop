// Render the habitloop app icons (PNG) used by the web app manifest.
// Pure Node, no dependencies: draws the ring logo with 4x4 supersampling
// and writes PNG files to public/icons/. Run with `npm run icons`.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { crc32, deflateSync } from 'node:zlib'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')
const BACKGROUND = [0x01, 0x01, 0x02]
const RING = [0x5e, 0x6a, 0xd2]
const SAMPLES = 4

/** Geometry in a 24x24 design grid, matching public/favicon.svg. */
const RADIUS = 6.5
const STROKE = 2.5
const ARC = 33 / RADIUS // dash length 33 on the circle, in radians

function insideRoundedRect(x, y, size, radius) {
  const cx = Math.min(Math.max(x, radius), size - radius)
  const cy = Math.min(Math.max(y, radius), size - radius)
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2
}

function insideRing(x, y, scale) {
  const dx = x / scale - 12
  const dy = y / scale - 12
  const half = STROKE / 2
  let angle = Math.atan2(dy, dx)
  if (angle < 0) angle += 2 * Math.PI
  if (angle <= ARC) return Math.abs(Math.hypot(dx, dy) - RADIUS) <= half
  // Round caps at both ends of the arc.
  for (const end of [0, ARC]) {
    const ex = Math.cos(end) * RADIUS
    const ey = Math.sin(end) * RADIUS
    if ((dx - ex) ** 2 + (dy - ey) ** 2 <= half ** 2) return true
  }
  return false
}

/** RGBA pixels for one icon. Maskable icons fill the square and shrink the logo into the safe zone. */
function renderIcon(size, maskable) {
  const pixels = Buffer.alloc(size * size * 4)
  const logoScale = maskable ? (size * 0.62) / 24 : size / 24
  const logoOffset = maskable ? (size - 24 * logoScale) / 2 : 0
  const corner = (6 / 24) * size
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let bg = 0
      let ring = 0
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const x = px + (sx + 0.5) / SAMPLES
          const y = py + (sy + 0.5) / SAMPLES
          if (!maskable && !insideRoundedRect(x, y, size, corner)) continue
          bg++
          if (insideRing(x - logoOffset, y - logoOffset, logoScale)) ring++
        }
      }
      const total = SAMPLES * SAMPLES
      const i = (py * size + px) * 4
      const mix = bg ? ring / bg : 0
      for (let c = 0; c < 3; c++) pixels[i + c] = Math.round(BACKGROUND[c] * (1 - mix) + RING[c] * mix)
      pixels[i + 3] = Math.round((bg / total) * 255)
    }
  }
  return pixels
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

function encodePng(size, rgba) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8 // bit depth
  header[9] = 6 // RGBA
  const rows = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    rows[y * (size * 4 + 1)] = 0 // filter: none
    rgba.copy(rows, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const ICONS = [
  { file: 'icon-192.png', size: 192, maskable: false },
  { file: 'icon-512.png', size: 512, maskable: false },
  { file: 'icon-maskable-512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: true },
]

mkdirSync(OUT_DIR, { recursive: true })
for (const { file, size, maskable } of ICONS) {
  const png = encodePng(size, renderIcon(size, maskable))
  writeFileSync(join(OUT_DIR, file), png)
  console.log(`${file} ${size}x${size} ${(png.length / 1024).toFixed(1)} KB`)
}
