// Generates the PWA / app icons with no external dependencies.
// Renders a scored round loaf (boule) in gold on espresso, 2x supersampled
// for smooth edges, and writes PNGs to /public.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
mkdirSync(OUT, { recursive: true })

// --- tiny PNG encoder (RGBA, 8-bit) ---------------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  // 10,11,12 = compression, filter, interlace = 0
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// --- palette ---------------------------------------------------------------
const BG = [26, 18, 11] // #1a120b espresso
const LOAF = [227, 199, 102] // #E3C766 highlight gold
const LOAF_LO = [201, 162, 39] // #C9A227 accent gold (lower shading)
const RIM = [247, 243, 234] // #F7F3EA cream
const SCORE = [26, 18, 11] // espresso cuts

// Color of a single normalized point (u,v in 0..1). Returns [r,g,b,a].
function sample(u, v, { rounded, cy, r }) {
  // rounded-rect alpha mask (for "any" icons)
  let alpha = 255
  if (rounded) {
    const rr = 0.205
    const qx = Math.abs(u - 0.5) - (0.5 - rr)
    const qy = Math.abs(v - 0.5) - (0.5 - rr)
    const outside =
      Math.max(qx, 0) ** 2 + Math.max(qy, 0) ** 2 > rr * rr || Math.max(qx, qy) > rr
    if (outside) return [0, 0, 0, 0]
  }
  const dx = u - 0.5
  const dy = v - cy
  const dist = Math.hypot(dx, dy)

  let col = BG
  if (dist <= r) {
    // loaf body with a soft vertical gradient (lighter top, deeper bottom)
    const t = (dy / r + 1) / 2 // 0 top -> 1 bottom
    col = [
      Math.round(LOAF[0] + (LOAF_LO[0] - LOAF[0]) * t),
      Math.round(LOAF[1] + (LOAF_LO[1] - LOAF[1]) * t),
      Math.round(LOAF[2] + (LOAF_LO[2] - LOAF[2]) * t),
    ]
    // diagonal scoring (three slashes at 45deg), clipped to an inner band
    const a = Math.PI / 4
    const w = dx * Math.cos(a) + dy * Math.sin(a)
    const p = -dx * Math.sin(a) + dy * Math.cos(a)
    const spacing = r * 0.42
    const half = r * 0.07
    for (let k = -1; k <= 1; k++) {
      if (Math.abs(w - k * spacing) < half && Math.abs(p) < r * 0.82) {
        col = SCORE
        break
      }
    }
  } else if (dist <= r + r * 0.05) {
    col = RIM // thin cream rim
  }
  return [col[0], col[1], col[2], alpha]
}

function render(size, opts) {
  const SS = 2 // supersample factor
  const hi = size * SS
  const rgba = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const u = (x * SS + sx + 0.5) / hi
          const v = (y * SS + sy + 0.5) / hi
          const c = sample(u, v, opts)
          // composite sample over (transparent) accumulator with premultiplied add
          r += c[0] * c[3]
          g += c[1] * c[3]
          b += c[2] * c[3]
          a += c[3]
        }
      }
      const n = SS * SS
      const idx = (y * size + x) * 4
      const aa = a / n
      rgba[idx] = aa > 0 ? Math.round(r / a) : 0
      rgba[idx + 1] = aa > 0 ? Math.round(g / a) : 0
      rgba[idx + 2] = aa > 0 ? Math.round(b / a) : 0
      rgba[idx + 3] = Math.round(aa)
    }
  }
  return encodePNG(size, size, rgba)
}

// "any" icons: rounded square, loaf at ~0.34 radius.
const anyOpts = { rounded: true, cy: 0.5, r: 0.34 }
// maskable / apple: full bleed, loaf shrunk into the 80% safe area.
const maskOpts = { rounded: false, cy: 0.5, r: 0.3 }

writeFileSync(join(OUT, 'icon-192.png'), render(192, anyOpts))
writeFileSync(join(OUT, 'icon-512.png'), render(512, anyOpts))
writeFileSync(join(OUT, 'maskable-512.png'), render(512, maskOpts))
writeFileSync(join(OUT, 'apple-touch-icon.png'), render(180, maskOpts))
console.log('icons written to', OUT)
