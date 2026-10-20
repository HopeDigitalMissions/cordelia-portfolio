// Draw the browser tab and home screen icons from her lettered name: the C
// on the site yellow, with the star from the dot of her i tucked into it.
//
// Both shapes come out of src/assets/name-mark.svg (see scripts/name-mark.py),
// so this needs no font file. Uses sharp, which comes with Astro.
//
//     node scripts/favicons.mjs
//
// Writes favicon.svg, favicon.ico, apple-touch-icon.png and the icon-*.png
// files that public/site.webmanifest points at.

import {readFileSync, writeFileSync} from 'node:fs'
import sharp from 'sharp'

const ROOT = new URL('..', import.meta.url)
const SUN = '#ffcf33'
const COCOA = '#4e2f1b'

const mark = readFileSync(new URL('src/assets/name-mark.svg', ROOT), 'utf8')
const lines = [...mark.matchAll(/<g [^>]*>(.*?)<\/g>/g)].map(([, line]) =>
  [...line.matchAll(/ d="([^"]+)"/g)].map(([, d]) => d),
)
const C = lines[0][0]
// The i is its stem plus the star; the star is the outline that sits highest
const STAR = lines[0][6]
  .split(/(?=M)/)
  .reduce((a, b) => (bounds(b)[3] > bounds(a)[3] ? b : a))

// Bounds of a font outline path (absolute M L H V Q C Z), sampling the curves
function bounds(d) {
  const tokens = d.match(/[MLHVQCZ]|-?[\d.]+/g)
  let i = 0
  let command
  let x = 0
  let y = 0
  let box = [Infinity, Infinity, -Infinity, -Infinity]
  const add = (px, py) => {
    box = [Math.min(box[0], px), Math.min(box[1], py), Math.max(box[2], px), Math.max(box[3], py)]
  }
  const take = (n) => tokens.slice(i, (i += n)).map(Number)
  const curve = (points) => {
    const all = [[x, y], ...points]
    for (let t = 0; t <= 1; t += 1 / 32) {
      let row = all
      while (row.length > 1) row = row.slice(1).map(([px, py], k) => [row[k][0] + (px - row[k][0]) * t, row[k][1] + (py - row[k][1]) * t])
      add(...row[0])
    }
    ;[x, y] = points.at(-1)
  }
  while (i < tokens.length) {
    if (/[A-Z]/.test(tokens[i])) command = tokens[i++]
    if (command === 'M' || command === 'L') [x, y] = take(2)
    else if (command === 'H') [x] = take(1)
    else if (command === 'V') [y] = take(1)
    else if (command === 'Q') {
      const [x1, y1, x2, y2] = take(4)
      curve([[x1, y1], [x2, y2]])
    } else if (command === 'C') {
      const [x1, y1, x2, y2, x3, y3] = take(6)
      curve([[x1, y1], [x2, y2], [x3, y3]])
    }
    if (command !== 'Z') add(x, y)
    if (command === 'M') command = 'L'
  }
  return box
}

// Fit an outline to height h, centered on (cx, cy), flipping it right side up
function place(d, cx, cy, h) {
  const [left, bottom, right, top] = bounds(d)
  const s = h / (top - bottom)
  const tx = cx - (s * (left + right)) / 2
  const ty = cy + (s * (bottom + top)) / 2
  return `<path transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(5)} ${(-s).toFixed(5)})" d="${d}"/>`
}

// A 64-unit tile. Rounded for tabs; square where the phone rounds it itself.
// inset shrinks the letter for Android's maskable icon, which can crop to a circle.
function tile({rounded = true, inset = 1} = {}) {
  const shrink = inset === 1 ? '' : ` transform="translate(32 32) scale(${inset}) translate(-32 -32)"`
  const letter = `<g fill="${COCOA}"${shrink}>${place(C, 29, 32.5, 44)}${place(STAR, 46.5, 32.5, 15)}</g>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64"${rounded ? ' rx="14"' : ''} fill="${SUN}"/>${letter}</svg>\n`
}

const png = (svg, size) =>
  sharp(Buffer.from(svg), {density: (72 * size) / 64})
    .resize(size, size)
    .png()
    .toBuffer()

// An .ico is a small header and directory around plain PNGs
function ico(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  let offset = 6 + 16 * images.length
  const entries = images.map(({size, data}) => {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size, 0)
    entry.writeUInt8(size, 1)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(data.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += data.length
    return entry
  })
  return Buffer.concat([header, ...entries, ...images.map(({data}) => data)])
}

const out = (name, data) => {
  writeFileSync(new URL(`public/${name}`, ROOT), data)
  console.log(`Wrote public/${name}`)
}

const rounded = tile()
out('favicon.svg', rounded)
out('favicon.ico', ico(await Promise.all([16, 32, 48].map(async (size) => ({size, data: await png(rounded, size)})))))
out('apple-touch-icon.png', await png(tile({rounded: false}), 180))
out('icon-192.png', await png(rounded, 192))
out('icon-512.png', await png(rounded, 512))
out('icon-mask.png', await png(tile({rounded: false, inset: 0.8}), 512))
