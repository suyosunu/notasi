import { cleanup, render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it } from 'vitest'
import type { MusicEvent } from '../music/notation'
import type { Accidental } from '../music/pitch'
import { AccidentalGlyph } from './glyphs'
import { Staff, SYLLABLE_SIZE, syllableWidth } from './Staff'

afterEach(cleanup)

const note = (
  step: 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B',
  octave: number,
  dur: 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth',
): MusicEvent => ({ kind: 'note', pitch: { step, octave, acc: 0 }, dur })

describe('Staff', () => {
  it('üç notalık porte 3 nota başı çizer', () => {
    render(<Staff events={[note('C', 4, 'quarter'), note('G', 4, 'half'), note('A', 5, 'whole')]} />)
    const heads = screen.getAllByTestId('notehead')
    expect(heads).toHaveLength(3)
    expect(heads.map((h) => h.getAttribute('data-index'))).toEqual(['0', '1', '2'])
  })

  it('birlik ve ikilik içi boş, dörtlük ve sekizlik dolu', () => {
    render(
      <Staff
        events={[note('G', 4, 'whole'), note('G', 4, 'half'), note('G', 4, 'quarter'), note('G', 4, 'eighth')]}
      />,
    )
    const fills = screen.getAllByTestId('notehead').map((h) => h.getAttribute('fill'))
    expect(fills[0]).toBe('none')
    expect(fills[1]).toBe('none')
    expect(fills[2]).not.toBe('none')
    expect(fills[3]).not.toBe('none')
  })

  it('5 porte çizgisi ve sol anahtarı çizer', () => {
    const { container } = render(<Staff events={[]} />)
    expect(container.querySelectorAll('line[data-staffline]')).toHaveLength(5)
    expect(container.textContent).toContain('𝄞')
  })

  it('SVG kapsayıcısına göre ölçeklenir', () => {
    const { container } = render(<Staff events={[]} width={300} />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('viewBox')).toMatch(/^0 0 300 /)
    expect(svg.getAttribute('width')).toBe('100%')
  })

  it('Do4 için ek çizgi çizer, Sol4 için çizmez', () => {
    const a = render(<Staff events={[note('C', 4, 'quarter')]} />)
    expect(a.container.querySelectorAll('line[data-ledger]')).toHaveLength(1)
    a.unmount()
    const b = render(<Staff events={[note('G', 4, 'quarter')]} />)
    expect(b.container.querySelectorAll('line[data-ledger]')).toHaveLength(0)
  })

  it('sap yönü: staffIndex >= 4 aşağı, değilse yukarı', () => {
    const { container } = render(<Staff events={[note('G', 4, 'quarter'), note('B', 4, 'quarter')]} />)
    const stems = container.querySelectorAll('line[data-stem]')
    expect(stems).toHaveLength(2)
    expect(stems[0]!.getAttribute('data-stem')).toBe('up')
    expect(stems[1]!.getAttribute('data-stem')).toBe('down')
  })

  it('birlik notanın sapı yoktur', () => {
    const { container } = render(<Staff events={[note('G', 4, 'whole')]} />)
    expect(container.querySelectorAll('line[data-stem]')).toHaveLength(0)
  })

  it('sekizlik notada bayrak, noktalı notada nokta çizer', () => {
    const events: MusicEvent[] = [note('G', 4, 'eighth'), { ...note('G', 4, 'quarter'), dotted: true }]
    const { container } = render(<Staff events={events} />)
    expect(container.querySelectorAll('[data-flag]')).toHaveLength(1)
    expect(container.querySelectorAll('[data-dot]')).toHaveLength(1)
  })

  it('onaltılık notada iki bayrak çizer (sap aşağıyken de)', () => {
    const { container } = render(<Staff events={[note('G', 4, 'sixteenth'), note('D', 5, 'sixteenth')]} />)
    const flags = container.querySelectorAll('[data-flag]')
    expect(flags).toHaveLength(4)
    expect(container.querySelectorAll('g[data-event="0"] [data-flag]')).toHaveLength(2)
    expect(container.querySelectorAll('g[data-event="1"] [data-flag]')).toHaveLength(2)
    // Onaltılık dolu başlıdır ve sapı vardır.
    expect(screen.getAllByTestId('notehead')[0]!.getAttribute('fill')).not.toBe('none')
    expect(container.querySelectorAll('line[data-stem]')).toHaveLength(2)
  })

  describe('bağ', () => {
    const tied = (step: 'G' | 'D', octave: number): MusicEvent => ({
      kind: 'note',
      pitch: { step, octave, acc: 0 },
      dur: 'half',
      tie: true,
    })
    const head = (c: Element, i: number) => {
      const h = c.querySelectorAll('[data-testid="notehead"]')[i]!
      return { x: Number(h.getAttribute('cx')), y: Number(h.getAttribute('cy')) }
    }
    const arc = (c: Element) => {
      const d = c.querySelector('[data-tie]')!.getAttribute('d')!
      const [x1, y1, cx, cy, x2, y2] = d.match(/-?\d+(?:\.\d+)?/g)!.map(Number)
      return { x1: x1!, y1: y1!, cx: cx!, cy: cy!, x2: x2!, y2: y2! }
    }

    it('bağlı notadan sonrakine bir yay çizer; sap yukarıyken yay aşağıdadır', () => {
      const { container } = render(
        <Staff events={[tied('G', 4), note('G', 4, 'eighth'), note('G', 4, 'quarter')]} />,
      )
      expect(container.querySelectorAll('[data-tie]')).toHaveLength(1)
      const a = arc(container)
      expect(a.x1).toBeGreaterThan(head(container, 0).x)
      expect(a.x2).toBeLessThan(head(container, 1).x)
      expect(a.x2).toBeGreaterThan(a.x1)
      expect(a.y1).toBeGreaterThan(head(container, 0).y)
      expect(a.cy).toBeGreaterThan(a.y1)
    })

    it('sap aşağıyken yay yukarıdadır', () => {
      const { container } = render(<Staff events={[tied('D', 5), note('D', 5, 'half')]} />)
      const a = arc(container)
      expect(a.y1).toBeLessThan(head(container, 0).y)
      expect(a.cy).toBeLessThan(a.y1)
    })

    it('sonraki nota portede yoksa yay sağ kenarda biter', () => {
      const { container } = render(<Staff events={[note('G', 4, 'quarter'), tied('G', 4)]} width={240} />)
      expect(container.querySelectorAll('[data-tie]')).toHaveLength(1)
      const a = arc(container)
      expect(a.x2).toBeGreaterThan(a.x1)
      expect(a.x2).toBeLessThanOrEqual(240)
    })

    it('bağsız notalarda yay yok', () => {
      const { container } = render(<Staff events={[note('G', 4, 'half'), note('G', 4, 'half')]} />)
      expect(container.querySelectorAll('[data-tie]')).toHaveLength(0)
    })
  })

  it('onaltılık sus çizilir', () => {
    const { container } = render(<Staff events={[{ kind: 'rest', dur: 'sixteenth' }]} />)
    const rest = container.querySelector('[data-testid="rest"][data-dur="sixteenth"]')
    expect(rest).not.toBeNull()
    expect(rest!.querySelectorAll('circle')).toHaveLength(2)
  })

  describe('sus işaretleri (SVG şekil, yazı tipi gerektirmez)', () => {
    const rests = () => {
      render(
        <Staff
          events={[
            { kind: 'rest', dur: 'whole' },
            { kind: 'rest', dur: 'half' },
            { kind: 'rest', dur: 'quarter' },
            { kind: 'rest', dur: 'eighth' },
          ]}
        />,
      )
      expect(screen.queryAllByTestId('notehead')).toHaveLength(0)
      return screen.getAllByTestId('rest')
    }

    it('hiçbir sus Unicode sus glifi içermez', () => {
      const all = rests()
      expect(all).toHaveLength(4)
      for (const r of all) {
        expect(r.textContent ?? '').not.toMatch(/[\u{1D13B}-\u{1D13E}]/u)
        expect(r.querySelector('text')).toBeNull()
      }
    })

    it('birlik ve ikilik sus dikdörtgen, dörtlük path, sekizlik path + nokta', () => {
      const [whole, half, quarter, eighth] = rests()
      expect(whole!.querySelector('rect')).not.toBeNull()
      expect(half!.querySelector('rect')).not.toBeNull()
      expect(quarter!.querySelector('path')).not.toBeNull()
      expect(eighth!.querySelector('path')).not.toBeNull()
      expect(eighth!.querySelector('circle')).not.toBeNull()
    })

    it('birlik sus 4. çizgiden asılır, ikilik sus 3. çizgiye oturur', () => {
      const [whole, half] = rests()
      const w = whole!.querySelector('rect')!
      expect(Number(w.getAttribute('y'))).toBe(40)
      const h = half!.querySelector('rect')!
      expect(Number(h.getAttribute('y')) + Number(h.getAttribute('height'))).toBe(50)
    })

    it('noktalı susta nokta çizilir', () => {
      const { container } = render(<Staff events={[{ kind: 'rest', dur: 'quarter', dotted: true }]} />)
      expect(container.querySelectorAll('[data-dot]')).toHaveLength(1)
    })
  })

  it('highlightIndex vurgulanan olayı işaretler', () => {
    const { container } = render(<Staff events={[note('G', 4, 'quarter'), note('A', 4, 'quarter')]} highlightIndex={1} />)
    const marked = container.querySelectorAll('[data-highlight]')
    expect(marked).toHaveLength(1)
    expect(marked[0]!.getAttribute('data-event')).toBe('1')
  })
})

const ALL_ACC = [-1, -4, -5, -8, 1, 4, 5, 8] as const

function glyph(acc: number) {
  const { container } = render(
    <svg>
      <AccidentalGlyph acc={acc as Accidental} x={10} y={30} />
    </svg>,
  )
  return container.querySelector(`g[data-acc="${acc}"]`) as SVGGElement | null
}
const count = (g: Element, part: string) => g.querySelectorAll(`[data-part="${part}"]`).length

describe('AccidentalGlyph', () => {
  it('acc === 0 ve tam ses işaretleri (±9) için hiçbir şey çizmez', () => {
    for (const acc of [0, 9, -9]) {
      const { container, unmount } = render(
        <svg>
          <AccidentalGlyph acc={acc as Accidental} x={10} y={10} />
        </svg>,
      )
      expect(container.querySelector('svg')!.childNodes).toHaveLength(0)
      unmount()
    }
  })

  it('sekiz işaretin her biri kendi koma sayısını data-acc olarak taşır ve metin içermez', () => {
    for (const acc of ALL_ACC) {
      const g = glyph(acc)
      expect(g, `acc ${acc}`).not.toBeNull()
      expect(g!.querySelector('text')).toBeNull()
      expect(g!.textContent).toBe('')
      cleanup()
    }
  })

  it('koma bemolü, bemolün yatay aynasıdır; diğer bemoller aynalanmaz', () => {
    const koma = glyph(-1)!
    const mirrored = koma.querySelector('[data-mirrored="true"]')
    expect(mirrored).not.toBeNull()
    expect(mirrored!.getAttribute('transform')).toMatch(/scale\(-1/)
    // Aynalanan şekil standart bemolün (küçük mücenneb) şekliyle aynıdır.
    const bowl = mirrored!.querySelector('[data-part="bowl"]')!.getAttribute('d')
    cleanup()
    const flat = glyph(-5)!
    expect(flat.querySelector('[data-mirrored]')).toBeNull()
    expect(flat.querySelector('[data-part="bowl"]')!.getAttribute('d')).toBe(bowl)
    expect(count(koma, 'slash')).toBe(0)
  })

  it('bemollerde eğik çizgi sayısı: koma 0, bakiye 1, küçük mücenneb 0, büyük mücenneb 2', () => {
    const expected: Record<number, number> = { [-1]: 0, [-4]: 1, [-5]: 0, [-8]: 2 }
    for (const [acc, slashes] of Object.entries(expected)) {
      const g = glyph(Number(acc))!
      expect(count(g, 'slash'), `acc ${acc}`).toBe(slashes)
      expect(count(g, 'stem'), `acc ${acc}`).toBe(1)
      expect(count(g, 'bowl'), `acc ${acc}`).toBe(1)
      cleanup()
    }
  })

  it('diyezlerde gövde ve çubuk sayısı: koma 1+2, bakiye 2+2, küçük mücenneb 1+3, büyük mücenneb 2+3', () => {
    const expected: Record<number, [number, number]> = { 1: [1, 2], 4: [2, 2], 5: [1, 3], 8: [2, 3] }
    for (const [acc, [stems, bars]] of Object.entries(expected)) {
      const g = glyph(Number(acc))!
      expect(count(g, 'stem'), `acc ${acc} stem`).toBe(stems)
      expect(count(g, 'bar'), `acc ${acc} bar`).toBe(bars)
      expect(g.querySelector('[data-mirrored]')).toBeNull()
      cleanup()
    }
  })

  it('genişlik araştırma tablosuyla uyumlu (1 sp = 10 px) ve sağ kenar x + genişliktir', () => {
    const widths: Record<number, number> = { [-1]: 9.2, [-4]: 11.5, [-5]: 9.1, [-8]: 11.5, 1: 9.2, 4: 10, 5: 13.6, 8: 13.7 }
    for (const [acc, w] of Object.entries(widths)) {
      const g = glyph(Number(acc))!
      expect(Number(g.getAttribute('data-width'))).toBeCloseTo(w, 5)
      expect(Number(g.getAttribute('data-right'))).toBeCloseTo(10 + w, 5)
      cleanup()
    }
  })
})

describe('Staff: değiştirgeç yerleşimi', () => {
  const accNote = (step: 'B' | 'C', octave: number, acc: Accidental): MusicEvent => ({
    kind: 'note',
    pitch: { step, octave, acc },
    dur: 'quarter',
  })

  it('işaretin sağ kenarı nota başının sol kenarından en az 2 px solda kalır', () => {
    for (const acc of ALL_ACC) {
      const { container, unmount } = render(<Staff events={[accNote('B', 4, acc)]} />)
      const g = container.querySelector(`g[data-acc="${acc}"]`)!
      const head = container.querySelector('[data-testid="notehead"]')!
      const headLeft = Number(head.getAttribute('cx')) - Number(head.getAttribute('rx'))
      expect(Number(g.getAttribute('data-right')), `acc ${acc}`).toBeLessThanOrEqual(headLeft - 2)
      unmount()
    }
  })

  it('işaret komşu notayla çakışmaz: sekiz işaretli nota art arda dizilse de', () => {
    const events = ALL_ACC.map((acc) => accNote(acc < 0 ? 'B' : 'C', acc < 0 ? 4 : 5, acc))
    const { container } = render(<Staff events={events} width={420} />)
    const heads = [...container.querySelectorAll('[data-testid="notehead"]')]
    const cx = heads.map((h) => Number(h.getAttribute('cx')))
    const glyphs = [...container.querySelectorAll('g[data-acc]')]
    expect(glyphs).toHaveLength(8)
    glyphs.forEach((g, i) => {
      if (i === 0) return
      expect(Number(g.getAttribute('data-x'))).toBeGreaterThan(cx[i - 1]! + 6.5)
    })
  })

  it('yoğun porte (240 px, 8 sekizlik, +5 ve +8 dahil): işaret önceki başa binmez, hiçbir şey kırpılmaz', () => {
    const eighth = (step: 'B' | 'C', octave: number, acc: Accidental): MusicEvent => ({
      kind: 'note',
      pitch: { step, octave, acc },
      dur: 'eighth',
    })
    const accs: Accidental[] = [0, 5, 0, 8, -8, 0, 5, 8]
    const events = accs.map((a) => eighth('C', 5, a))
    const { container } = render(<Staff events={events} width={240} />)
    const viewWidth = Number(container.querySelector('svg')!.getAttribute('viewBox')!.split(' ')[2])
    const heads = [...container.querySelectorAll('[data-testid="notehead"]')].map((h) => Number(h.getAttribute('cx')))
    const eventGroups = [...container.querySelectorAll('g[data-event]')]
    eventGroups.forEach((grp, i) => {
      const acc = grp.querySelector('g[data-acc]')
      if (acc && i > 0) {
        expect(Number(acc.getAttribute('data-x')), `olay ${i}`).toBeGreaterThanOrEqual(heads[i - 1]! + 6.5 + 1)
      }
      const stem = grp.querySelector('line[data-stem]')
      expect(Math.max(heads[i]! + 6.5, Number(stem!.getAttribute('x1')))).toBeLessThanOrEqual(viewWidth)
      // Bayrak ve sağ kenar payı da sığmalı.
      expect(heads[i]! + 6.5 + 8).toBeLessThanOrEqual(viewWidth)
    })
    // Sığmadığı için görünüm kutusu genişlemiş, SVG hâlâ %100 genişliktedir.
    expect(viewWidth).toBeGreaterThan(240)
    expect(container.querySelector('svg')!.getAttribute('width')).toBe('100%')
  })

  it('işaretsiz porte yerleşimi değişmez (yuva ortası) ve bir notanın işareti ötekileri kaydırmaz', () => {
    const plain = [note('G', 4, 'quarter'), note('A', 4, 'quarter'), note('B', 4, 'quarter'), note('C', 5, 'quarter')]
    const slot = (240 - 52 - 8) / 4
    const a = render(<Staff events={plain} />)
    const cxs = [...a.container.querySelectorAll('[data-testid="notehead"]')].map((h) => Number(h.getAttribute('cx')))
    cxs.forEach((cx, i) => expect(cx).toBeCloseTo(52 + slot * (i + 0.5), 5))
    expect(a.container.querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 240 110')
    a.unmount()
    // 1. nota (i=0) işaretli olsa da, yuvası zaten yetiyorsa 2.-4. notalar yerinde kalır.
    const withAcc = [accNote('B', 4, -1), ...plain.slice(1)]
    const b = render(<Staff events={withAcc} />)
    const cxs2 = [...b.container.querySelectorAll('[data-testid="notehead"]')].map((h) => Number(h.getAttribute('cx')))
    expect(cxs2.slice(1)).toEqual(cxs.slice(1))
  })

  it('işaret, nota ile aynı yükseklikte ortalanır (Si4 = 3. çizgi)', () => {
    const { container } = render(<Staff events={[accNote('B', 4, -1)]} />)
    const g = container.querySelector('g[data-acc="-1"]')!
    expect(g.getAttribute('transform')).toMatch(/translate\([\d.]+[ ,]50\)/)
  })

  it('acc 0 olan notada işaret çizilmez', () => {
    const { container } = render(<Staff events={[accNote('B', 4, 0)]} />)
    expect(container.querySelectorAll('g[data-acc]')).toHaveLength(0)
  })
})

describe('Staff: ölçü çizgileri ve heceler', () => {
  const four = [note('G', 4, 'quarter'), note('A', 4, 'quarter'), note('B', 4, 'quarter'), note('C', 5, 'quarter')]
  const barXs = (c: Element) => [...c.querySelectorAll('line[data-barline]')].map((l) => Number(l.getAttribute('x1')))
  const headXs = (c: Element) =>
    [...c.querySelectorAll('[data-testid="notehead"]')].map((h) => Number(h.getAttribute('cx')))

  it('barlinesAfter yoksa ölçü çizgisi çizilmez (eski davranış)', () => {
    const { container } = render(<Staff events={four} />)
    expect(container.querySelectorAll('line[data-barline]')).toHaveLength(0)
    expect(container.querySelectorAll('text[data-syllable]')).toHaveLength(0)
  })

  it('verilen olaylardan sonra ve satır sonunda ölçü çizgisi çizer; çizgi iki notanın arasındadır', () => {
    const { container } = render(<Staff events={four} barlinesAfter={[1]} />)
    const xs = barXs(container)
    expect(xs).toHaveLength(2)
    const heads = headXs(container)
    expect(xs[0]!).toBeGreaterThan(heads[1]!)
    expect(xs[0]!).toBeLessThan(heads[2]!)
    const viewWidth = Number(container.querySelector('svg')!.getAttribute('viewBox')!.split(' ')[2])
    expect(xs[1]!).toBeGreaterThan(heads[3]!)
    expect(xs[1]!).toBeLessThanOrEqual(viewWidth)
    // ölçü çizgisi portenin üst çizgisinden alt çizgisine iner
    const bar = container.querySelector('line[data-barline]')!
    expect([Number(bar.getAttribute('y1')), Number(bar.getAttribute('y2'))]).toEqual([30, 70])
  })

  it('son olaydan sonraki ölçü çizgisi iki kez çizilmez', () => {
    const { container } = render(<Staff events={four} barlinesAfter={[1, 3]} />)
    expect(barXs(container)).toHaveLength(2)
  })

  it('heceler 12 px yazılır; tahmini genişlik karakter × 0,55 × 12', () => {
    expect(SYLLABLE_SIZE).toBe(12)
    expect(syllableWidth('Der')).toBeCloseTo(3 * 0.55 * 12, 6)
    expect(syllableWidth('lar‿')).toBeCloseTo(4 * 0.55 * 12, 6)
    const { container } = render(<Staff events={four} syllables={['a', '', '', '']} />)
    expect(container.querySelector('text[data-syllable]')!.getAttribute('font-size')).toBe('12')
  })

  it('yan yana uzun heceler çakışmaz: merkezler arası uzaklık yarı genişliklerin toplamı + 4 px kadar', () => {
    // Dar porte: yuva tek başına heceye yetmez, hece yuvayı genişletir.
    const events = [note('G', 4, 'eighth'), note('A', 4, 'eighth'), note('B', 4, 'eighth'), note('C', 5, 'eighth')]
    const syllables = ['Der', 'dim', 'var‿', 'mış']
    const { container } = render(<Staff events={events} width={100} syllables={syllables} />)
    const texts = [...container.querySelectorAll('text[data-syllable]')]
    const xs = texts.map((t) => Number(t.getAttribute('x')))
    for (let i = 1; i < xs.length; i++) {
      const halfSum = (syllableWidth(syllables[i - 1]!) + syllableWidth(syllables[i]!)) / 2
      expect(xs[i]! - xs[i - 1]!).toBeGreaterThanOrEqual(halfSum + 4 - 1e-9)
    }
    // ilk hece portenin sol kenarını, son hece görünüm kutusunun sağını aşmaz
    const viewWidth = Number(container.querySelector('svg')!.getAttribute('viewBox')!.split(' ')[2])
    expect(xs.at(-1)! + syllableWidth(syllables.at(-1)!) / 2).toBeLessThanOrEqual(viewWidth)
  })

  it('hece verilmeyen olayların yuvası değişmez', () => {
    const a = render(<Staff events={four} />)
    const plain = headXs(a.container)
    a.unmount()
    const b = render(<Staff events={four} syllables={['', '', '', '']} />)
    expect(headXs(b.container)).toEqual(plain)
  })

  it('heceler notanın x konumunda, portenin altında yazılır; boş heceler atlanır', () => {
    const { container } = render(<Staff events={four} syllables={['Hak', '', 'te', 'â‿lâ']} />)
    const texts = [...container.querySelectorAll('text[data-syllable]')]
    expect(texts.map((t) => t.textContent)).toEqual(['Hak', 'te', 'â‿lâ'])
    const heads = headXs(container)
    expect(texts.map((t) => Number(t.getAttribute('x')))).toEqual([heads[0], heads[2], heads[3]])
    for (const t of texts) {
      expect(t.getAttribute('text-anchor')).toBe('middle')
      expect(Number(t.getAttribute('y'))).toBeGreaterThan(90)
    }
  })
})
