import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve(__dirname, 'styles.css'), 'utf8')

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

describe('styles.css: vuruş kutuları', () => {
  it('çalan düm kutusunun zemini beyaz yazıyla en az 4,5:1 karşıtlık verir ve normal düm zemininden koyudur', () => {
    const active = /\.vurus-dum\[data-active='true'\]\s*\{([^}]*)\}/.exec(css)![1]!
    const bg = /background:\s*(#[0-9a-fA-F]{6})/.exec(active)![1]!
    const normal = /\.vurus-dum\s*\{([^}]*)\}/.exec(css)![1]!
    const normalBg = /background:\s*(#[0-9a-fA-F]{6})/.exec(normal)![1]!
    expect(1.05 / (luminance(bg) + 0.05)).toBeGreaterThanOrEqual(4.5)
    expect(luminance(bg)).toBeLessThan(luminance(normalBg))
  })
})

describe('styles.css: usul vurma düğmeleri', () => {
  /** `.ad { ... }` kuralının gövdesi (ad sınıf adıdır, özel karakter içermez). */
  const kural = (ad: string) => new RegExp(`\\.${ad}\\s*\\{([^}]*)\\}`).exec(css)![1]!

  it("iki düğme yan yana eşit sütunlarda; daralabilir (375 pt'de yatay kaydırma yok)", () => {
    const pad = kural('vurma-pad')
    expect(pad).toMatch(/display:\s*grid/)
    expect(pad).toMatch(/grid-template-columns:\s*1fr 1fr/)
    expect(kural('vurma-btn')).toMatch(/min-width:\s*0/)
  })

  it('düğmeler en az 44 pt yüksek; dokunuşta yakınlaştırma yok', () => {
    const btn = kural('vurma-btn')
    const m = /min-height:\s*([\d.]+)(rem|px)/.exec(btn)!
    expect(Number(m[1]) * (m[2] === 'rem' ? 16 : 1)).toBeGreaterThanOrEqual(44)
    expect(btn).toMatch(/touch-action:\s*manipulation/)
  })
})
