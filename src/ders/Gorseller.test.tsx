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

  it('ney-bolumleri: beş etiketi içerir, 6 ön delik ve arkada aşîrân deliği çizer', () => {
    const { container } = render(<Gorsel ad="ney-bolumleri" />)
    const metin = container.textContent ?? ''
    for (const etiket of ['Başpâre', 'Parazvane', 'Boğum', 'Ön delikler', 'Aşîrân deliği']) expect(metin).toContain(etiket)
    expect(container.querySelectorAll('[data-on-delik]')).toHaveLength(6)
    expect(container.querySelectorAll('[data-asiran]')).toHaveLength(1)
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
