// Tek seferlik: public/icons/icon.svg dosyasından PNG simgeleri üretir.
// Kullanım: node scripts/make-icons.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'

const svg = readFileSync('public/icons/icon.svg')
const targets = [
  ['public/icons/icon-192.png', 192],
  ['public/icons/icon-512.png', 512],
  ['public/apple-touch-icon.png', 180],
]
for (const [path, size] of targets) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng()
  writeFileSync(path, png)
  console.log(path, size, png.length)
}
