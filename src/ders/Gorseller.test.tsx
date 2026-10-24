import { cleanup, render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it } from 'vitest'
import type { GorselAdi } from '../content/dersler/types'
import { Gorsel } from './Gorseller'

afterEach(cleanup)

const ADLAR: GorselAdi[] = ['ney-bolumleri', 'el-yerlesimi', 'nefes-444']

describe('Gorsel', () => {
  it.each(ADLAR)('%s: role=img, Türkçe etiket, viewBox var, sabit piksel width yok', (ad) => {
    render(<Gorsel ad={ad} />)
    const svg = screen.getByRole('img')
    expect(svg.getAttribute('aria-label')).toMatch(/\S{3,}/)
    expect(svg.getAttribute('viewBox')).toMatch(/^0 0 \d+ \d+$/)
    expect(svg.getAttribute('width')).toBe('100%')
  })

  it('ney-bolumleri: etiketler, 6 ön delik, iki uçta parazvane halkası, çok sayıda boğum', () => {
    const { container } = render(<Gorsel ad="ney-bolumleri" />)
    const metin = container.textContent ?? ''
    for (const etiket of ['Başpâre', 'Parazvane', 'Boğumlar', 'Ön delikler', 'Aşîrân deliği (arkada)']) {
      expect(metin).toContain(etiket)
    }
    expect(container.querySelectorAll('[data-on-delik]')).toHaveLength(6)
    expect(container.querySelectorAll('[data-asiran]')).toHaveLength(1)
    expect(container.querySelectorAll('[data-baspare]')).toHaveLength(1)
    // Parazvane: kamışın iki ucunda dolu halka.
    const halkalar = [...container.querySelectorAll('[data-parazvane]')]
    expect(halkalar).toHaveLength(2)
    const xs = halkalar.map((h) => Number(h.getAttribute('x')))
    expect(xs[0]).toBeLessThan(xs[1]!)
    expect(halkalar.every((h) => h.getAttribute('fill') === 'currentColor')).toBe(true)
    // Boğumlar gövde boyunca, birkaç tane ve eşit aralıklı.
    const bogumlar = [...container.querySelectorAll('[data-bogum]')].map((g) => Number(g.querySelector('line')!.getAttribute('x1')))
    expect(bogumlar.length).toBeGreaterThanOrEqual(7)
    expect(bogumlar.length).toBeLessThanOrEqual(9)
    expect(bogumlar[bogumlar.length - 1]! - bogumlar[0]!).toBeGreaterThan(150)
    // Boğum sayısı yazılmaz; etiketlerdeki tek rakam "Ön delikler (6)"dır.
    expect(metin.replace('Ön delikler (6)', '')).not.toMatch(/\d/)
  })

  it('ney-bolumleri: kesik çizgi yalnız arkadaki aşîrân deliğini gösterir', () => {
    const { container } = render(<Gorsel ad="ney-bolumleri" />)
    const kesikler = container.querySelectorAll('[stroke-dasharray]')
    expect(kesikler).toHaveLength(1)
    expect(kesikler[0]!.hasAttribute('data-asiran')).toBe(true)
  })

  it('ney-bolumleri: telefonda okunur (dar viewBox, yazı en az 12)', () => {
    const { container } = render(<Gorsel ad="ney-bolumleri" />)
    const w = Number(container.querySelector('svg')!.getAttribute('viewBox')!.split(' ')[2])
    expect(w).toBeLessThanOrEqual(320)
    for (const t of container.querySelectorAll('text')) expect(Number(t.getAttribute('font-size'))).toBeGreaterThanOrEqual(12)
  })

  it('el-yerlesimi: 7 delik etiketi, sağ el üstte (başparmak aşîrânda), sol el altta', () => {
    const { container } = render(<Gorsel ad="el-yerlesimi" />)
    const etiketler = [...container.querySelectorAll('[data-delik]')].map((g) => g.textContent)
    expect(etiketler).toEqual([
      'Aşîrân (arka) · sağ başparmak',
      '1. delik · sağ işaret',
      '2. delik · sağ orta',
      '3. delik · sağ yüzük',
      '4. delik · sol işaret',
      '5. delik · sol orta',
      '6. delik · sol yüzük',
    ])
  })

  it('nefes-444: Al 4, Tut 4, Ver 4 üç bölme', () => {
    const { container } = render(<Gorsel ad="nefes-444" />)
    expect([...container.querySelectorAll('[data-bolme]')].map((g) => g.textContent)).toEqual(['Al 4', 'Tut 4', 'Ver 4'])
  })
})
