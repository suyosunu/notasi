import { cleanup, fireEvent, render } from '@testing-library/preact'
import { afterEach, describe, expect, it } from 'vitest'
import { PARCALAR } from '../content/parcalar'
import { USULLER } from '../content/usuller'
import type { MusicEvent } from '../music/notation'
import { beamBeatsFor } from './beams'
import { MIN_SCALE, ROW_WIDTH, scoreLayout, scoreScale, ScoreView } from './ScoreView'
import { SYLLABLE_SIZE } from './Staff'

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
      expect(rows(container).length).toBeGreaterThanOrEqual(Math.ceil(p.olcu.length / 2))
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

  it('yoğun ölçü çifti birer ölçülük satırlara ayrılır, seyrek çift iki ölçü kalır', () => {
    const s = (step: 'G' | 'A' | 'B' | 'C'): MusicEvent => ({
      kind: 'note',
      pitch: { step, octave: step === 'C' ? 5 : 4, acc: 0 },
      dur: 'sixteenth',
    })
    const dense = (): MusicEvent[] => Array.from({ length: 16 }, (_, i) => s((['G', 'A', 'B', 'C'] as const)[i % 4]!))
    // ölçü 1-2 seyrek (4+4 olay), ölçü 3-4 yoğun (16+16 olay)
    const olcu = [measure(), measure(), dense(), dense()]
    const { rows: rs } = scoreLayout(olcu, undefined, 2)
    expect(rs.map((r) => r.barlinesAfter.length)).toEqual([2, 1, 1])
    const { container } = render(<ScoreView olcu={olcu} />)
    expect(rows(container).map((r) => r.querySelectorAll('line[data-barline]').length)).toEqual([2, 1, 1])
  })

  it('üç gerçek parçada hece boyu 375 pt telefondaki 325 px kapta en az 12 × 0,8 = 9,6 px', () => {
    // 375 − 2×20 (ekran dolgusu) − 2×4 (nota dolgusu) − 2×1 (kenarlık) = 325
    expect(ROW_WIDTH).toBe(325)
    for (const p of PARCALAR) {
      const { width } = scoreLayout(p.olcu, p.soz, 2)
      expect(scoreScale(width, ROW_WIDTH)).toBeGreaterThanOrEqual(MIN_SCALE)
      expect(SYLLABLE_SIZE * scoreScale(width, 325)).toBeGreaterThanOrEqual(9.6)
    }
  })

  it('beamBeats satırlara geçer: gruplar her satırda ölçü başından sayılır', () => {
    const e = (): MusicEvent => ({ kind: 'note', pitch: { step: 'G', octave: 4, acc: 0 }, dur: 'eighth' })
    const olcu = Array.from({ length: 3 }, () => Array.from({ length: 6 }, e))
    const plain = render(<ScoreView olcu={olcu} />).container
    expect(plain.querySelectorAll('[data-beam]')).toHaveLength(0)
    cleanup()
    const four = render(<ScoreView olcu={olcu} beamBeats={1} />).container
    expect(four.querySelectorAll('[data-beam="1"]')).toHaveLength(9)
    cleanup()
    const twelve = render(<ScoreView olcu={olcu} beamBeats={1.5} />).container
    expect(twelve.querySelectorAll('[data-beam="1"]')).toHaveLength(6)
    expect(twelve.querySelectorAll('[data-flag]')).toHaveLength(0)
  })

  it('üç gerçek parçada hiçbir kiriş hece bandına inmez (satır genişliğinde, usulün vuruş birimiyle)', () => {
    const nums = (d: string) => d.match(/-?\d+(?:\.\d+)?/g)!.map(Number)
    let beams = 0
    for (const p of PARCALAR) {
      const beat = beamBeatsFor(USULLER.find((u) => u.id === p.usul))
      const { container } = render(<ScoreView olcu={p.olcu} soz={p.soz} beamBeats={beat} />)
      const syl = container.querySelector('text[data-syllable]')!
      // Hece kutusunun üstü: taban çizgisi − yazı boyu (tam em; gerçek büyük harf yüksekliğinden daha temkinli).
      const bandTop = Number(syl.getAttribute('y')) - Number(syl.getAttribute('font-size'))
      expect(bandTop).toBe(91)
      for (const b of container.querySelectorAll('[data-beam]')) {
        beams++
        nums(b.getAttribute('d')!).forEach((v, i) => {
          if (i % 2 === 1) expect(v, `${p.id}: ${b.getAttribute('d')}`).toBeLessThan(bandTop)
        })
      }
      // Gerçek parçalarda 2 aralıklık kenar istisnası hiç kullanılmaz: her kirişli sap en az 2,5 aralık.
      for (const s of container.querySelectorAll('line[data-beamed]')) {
        const len = Math.abs(Number(s.getAttribute('y2')) - Number(s.getAttribute('y1')))
        expect(len, p.id).toBeGreaterThanOrEqual(25 - 1e-9)
      }
      cleanup()
    }
    expect(beams).toBeGreaterThan(100)
  })

  it('scoreLayout satırları ölçü aralığını taşır (tek tek bölünen gruplar dahil)', () => {
    const s = (step: 'G' | 'A' | 'B' | 'C'): MusicEvent => ({
      kind: 'note',
      pitch: { step, octave: step === 'C' ? 5 : 4, acc: 0 },
      dur: 'sixteenth',
    })
    const dense = (): MusicEvent[] => Array.from({ length: 16 }, (_, i) => s((['G', 'A', 'B', 'C'] as const)[i % 4]!))
    const olcu = [measure(), measure(), dense(), dense(), measure()]
    const { rows: rs } = scoreLayout(olcu, undefined, 2)
    expect(rs.map((r) => [r.olcuBas, r.olcuSon])).toEqual([
      [0, 1],
      [2, 2],
      [3, 3],
      [4, 4],
    ])
  })

  it('onSatirDokun yokken satırlar düğme değildir', () => {
    const { container } = render(<ScoreView olcu={Array.from({ length: 4 }, measure)} />)
    expect(container.querySelectorAll('[role="button"]')).toHaveLength(0)
    expect(container.querySelectorAll('[tabindex]')).toHaveLength(0)
  })

  it('onSatirDokun varken satır tıklaması ve Enter/Boşluk ölçü aralığını bildirir', () => {
    const olcu = Array.from({ length: 6 }, measure)
    const seen: unknown[] = []
    const { container } = render(<ScoreView olcu={olcu} onSatirDokun={(s) => seen.push(s)} />)
    const rs = rows(container)
    expect(rs).toHaveLength(3)
    expect(rs.every((r) => r.getAttribute('role') === 'button' && r.getAttribute('tabindex') === '0')).toBe(true)
    fireEvent.click(rs[1]!)
    expect(seen).toEqual([{ bas: 2, son: 3 }])
    fireEvent.keyDown(rs[2]!, { key: 'Enter' })
    expect(seen[1]).toEqual({ bas: 4, son: 5 })
    const space = fireEvent.keyDown(rs[0]!, { key: ' ' })
    expect(space).toBe(false) // varsayılan davranış (kaydırma) engellendi
    expect(seen[2]).toEqual({ bas: 0, son: 1 })
    expect(fireEvent.keyDown(rs[0]!, { key: 'a' })).toBe(true)
    expect(seen).toHaveLength(3)
  })

  it('aria-label 1 tabanlı ölçü numaralarıyla yazılır', () => {
    const olcu = Array.from({ length: 3 }, measure)
    const { container } = render(<ScoreView olcu={olcu} onSatirDokun={() => {}} />)
    expect(rows(container).map((r) => r.getAttribute('aria-label'))).toEqual(['1–2. ölçüleri seç', '3. ölçüyü seç'])
  })

  it('aria-pressed ve secili sınıfı seçime göre değişir', () => {
    const olcu = Array.from({ length: 6 }, measure)
    const { container } = render(<ScoreView olcu={olcu} secim={{ bas: 2, son: 3 }} onSatirDokun={() => {}} />)
    const rs = rows(container)
    expect(rs.map((r) => r.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false'])
    expect(rs.map((r) => r.classList.contains('secili'))).toEqual([false, true, false])
  })

  it('seçim aralığı birden çok satırı kapsayabilir; null seçimde hiçbiri seçili değildir', () => {
    const olcu = Array.from({ length: 6 }, measure)
    const wide = render(<ScoreView olcu={olcu} secim={{ bas: 1, son: 4 }} onSatirDokun={() => {}} />).container
    expect(rows(wide).map((r) => r.classList.contains('secili'))).toEqual([false, true, false])
    cleanup()
    const all = render(<ScoreView olcu={olcu} secim={{ bas: 0, son: 5 }} onSatirDokun={() => {}} />).container
    expect(rows(all).map((r) => r.classList.contains('secili'))).toEqual([true, true, true])
    cleanup()
    const none = render(<ScoreView olcu={olcu} secim={null} onSatirDokun={() => {}} />).container
    expect(none.querySelectorAll('.secili')).toHaveLength(0)
  })

  it('vurgu, çalan olayın satırındaki Staff olayını işaretler', () => {
    const olcu = Array.from({ length: 6 }, measure)
    const { container } = render(<ScoreView olcu={olcu} vurgu={{ olcu: 2, nota: 1 }} />)
    const rs = rows(container)
    expect(container.querySelectorAll('[data-highlight]')).toHaveLength(1)
    const marked = rs[1]!.querySelectorAll('[data-highlight]')
    expect(marked).toHaveLength(1)
    // 2. satır = ölçü 2-3; ölçü 2'nin 1. notası satırdaki 1. olaydır
    expect(marked[0]!.getAttribute('data-event')).toBe('1')
  })

  it('vurgu satırın ikinci ölçüsündeyse satırdaki sıra ilk ölçünün olaylarından sonra gelir', () => {
    const olcu = Array.from({ length: 6 }, measure)
    const { container } = render(<ScoreView olcu={olcu} olcuPerSatir={2} vurgu={{ olcu: 3, nota: 1 }} />)
    const marked = rows(container)[1]!.querySelectorAll('[data-highlight]')
    expect(container.querySelectorAll('[data-highlight]')).toHaveLength(1)
    expect(marked).toHaveLength(1)
    // 2. satır = ölçü 2-3; ölçü 3'ün 1. notası = ölçü 2'nin 4 olayı + 1
    expect(marked[0]!.getAttribute('data-event')).toBe('5')
  })

  it('vurgu yoksa veya geçersizse hiçbir olay işaretlenmez', () => {
    const olcu = Array.from({ length: 4 }, measure)
    expect(render(<ScoreView olcu={olcu} />).container.querySelectorAll('[data-highlight]')).toHaveLength(0)
    cleanup()
    expect(render(<ScoreView olcu={olcu} vurgu={null} />).container.querySelectorAll('[data-highlight]')).toHaveLength(0)
    cleanup()
    expect(
      render(<ScoreView olcu={olcu} vurgu={{ olcu: 9, nota: 0 }} />).container.querySelectorAll('[data-highlight]'),
    ).toHaveLength(0)
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

describe('ScoreView: sonuçlar', () => {
  const olay = (c: Element, satir: number, i: number) =>
    rows(c)[satir]!.querySelector(`[data-event="${i}"]`) as SVGGElement

  it('sonuçları ilgili satıra ve olaya dağıtır (iki ölçülük satırın ikinci ölçüsü dahil)', () => {
    const olcu = Array.from({ length: 4 }, measure)
    const { container } = render(
      <ScoreView
        olcu={olcu}
        sonuclar={[
          { olcu: 0, nota: 1, durum: 'pes' },
          { olcu: 1, nota: 2, durum: 'tiz' }, // ilk satırın ikinci ölçüsü: olay 4 + 2 = 6
          { olcu: 3, nota: 0, durum: 'yok' }, // ikinci satırın ikinci ölçüsü: olay 4
        ]}
      />,
    )
    expect(olay(container, 0, 1).getAttribute('data-durum')).toBe('pes')
    expect(olay(container, 0, 6).getAttribute('data-durum')).toBe('tiz')
    expect(olay(container, 1, 4).getAttribute('data-durum')).toBe('yok')
    expect(container.querySelectorAll('[data-durum]')).toHaveLength(3)
  })

  it('aralık dışı ya da eksik sonuçları yok sayar; sonuclar yokken işaret çizmez', () => {
    const olcu = Array.from({ length: 2 }, measure)
    const { container } = render(
      <ScoreView olcu={olcu} sonuclar={[{ olcu: 5, nota: 0, durum: 'pes' }, { olcu: 0, nota: 9, durum: 'pes' }]} />,
    )
    expect(container.querySelector('[data-durum]')).toBeNull()
    cleanup()
    const r2 = render(<ScoreView olcu={olcu} sonuclar={null} />)
    expect(r2.container.querySelector('[data-durum]')).toBeNull()
  })
})
