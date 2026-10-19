import { cleanup, render } from '@testing-library/preact'
import { afterEach, describe, expect, it } from 'vitest'
import { PARCALAR } from '../content/parcalar'
import type { MusicEvent } from '../music/notation'
import { ScoreView } from './ScoreView'

afterEach(cleanup)

const q = (step: 'G' | 'A' | 'B' | 'C', octave = 4): MusicEvent => ({
  kind: 'note',
  pitch: { step, octave, acc: 0 },
  dur: 'quarter',
})
const measure = (): MusicEvent[] => [q('G'), q('A'), q('B'), q('C', 5)]
const rows = (c: Element) => [...c.querySelectorAll('[data-testid="score-row"]')]

describe('ScoreView', () => {
  it('10 ölçüyü 5 satıra böler; her satır bir portedir ve ölçü çizgileri vardır', () => {
    const olcu = Array.from({ length: 10 }, measure)
    const { container } = render(<ScoreView olcu={olcu} />)
    const rs = rows(container)
    expect(rs).toHaveLength(5)
    for (const r of rs) {
      expect(r.querySelectorAll('svg')).toHaveLength(1)
      expect(r.querySelectorAll('[data-testid="notehead"]')).toHaveLength(8)
      // iki ölçü arasında bir çizgi + satır sonu çizgisi
      expect(r.querySelectorAll('line[data-barline]')).toHaveLength(2)
    }
  })

  it('olcuPerSatir ile satır başına ölçü sayısı değişir; son satır eksik kalabilir', () => {
    const olcu = Array.from({ length: 7 }, measure)
    const { container } = render(<ScoreView olcu={olcu} olcuPerSatir={3} />)
    const rs = rows(container)
    expect(rs).toHaveLength(3)
    expect(rs.map((r) => r.querySelectorAll('line[data-barline]').length)).toEqual([3, 3, 1])
  })

  it('heceler ölçülerle birlikte satırlara dağıtılır', () => {
    const olcu = [measure(), measure(), measure()]
    const soz = [
      ['Hak', '', 'te', 'â'],
      ['lâ', '', '', ''],
      ['bir', '', '', 'dir'],
    ]
    const { container } = render(<ScoreView olcu={olcu} soz={soz} />)
    const rs = rows(container)
    const syl = (r: Element) => [...r.querySelectorAll('text[data-syllable]')].map((t) => t.textContent)
    expect(syl(rs[0]!)).toEqual(['Hak', 'te', 'â', 'lâ'])
    expect(syl(rs[1]!)).toEqual(['bir', 'dir'])
  })

  it('yatay kaydırma gerekmez: satır SVG\'leri %100 genişlikte, kapta sabit piksel genişlik yok', () => {
    for (const p of PARCALAR) {
      const { container } = render(<ScoreView olcu={p.olcu} soz={p.soz} />)
      const wrap = container.firstElementChild as HTMLElement
      expect(wrap.style.width).toBe('')
      expect(wrap.style.minWidth).toBe('')
      expect(rows(container)).toHaveLength(Math.ceil(p.olcu.length / 2))
      for (const svg of container.querySelectorAll('svg')) {
        expect(svg.getAttribute('width')).toBe('100%')
        expect(svg.getAttribute('height')).toBeNull()
      }
      cleanup()
    }
  })

  it('tüm satırlar aynı görünüm genişliğindedir (ölçek satırdan satıra değişmez)', () => {
    for (const p of PARCALAR) {
      const { container } = render(<ScoreView olcu={p.olcu} soz={p.soz} />)
      const widths = [...container.querySelectorAll('svg')].map((s) => Number(s.getAttribute('viewBox')!.split(' ')[2]))
      for (const w of widths) expect(w).toBeCloseTo(widths[0]!, 3)
      cleanup()
    }
  })

  it('tüm olaylar çizilir (bağlı notalar dahil)', () => {
    const p = PARCALAR.find((x) => x.id === 'daglar-ile-taslar-ile')!
    const { container } = render(<ScoreView olcu={p.olcu} />)
    const notes = p.olcu.flat().filter((e) => e.kind === 'note').length
    const rests = p.olcu.flat().length - notes
    expect(container.querySelectorAll('[data-testid="notehead"]')).toHaveLength(notes)
    expect(container.querySelectorAll('[data-testid="rest"]')).toHaveLength(rests)
  })
})
