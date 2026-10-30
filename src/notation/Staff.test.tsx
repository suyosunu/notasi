import { cleanup, render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it } from 'vitest'
import type { DurationKind, MusicEvent, NoteEvent } from '../music/notation'
import type { Accidental } from '../music/pitch'
import { AccidentalGlyph } from './glyphs'
import { Staff, SYLLABLE_SIZE, syllableWidth } from './Staff'

afterEach(cleanup)

const note = (
  step: 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B',
  octave: number,
  dur: DurationKind,
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

  it('tek otuzikilik üç bayrak çizer (sap yukarıyken de aşağıyken de); sap onaltılıktakinden uzundur', () => {
    const { container } = render(<Staff events={[note('G', 4, 'thirtysecond'), note('D', 5, 'thirtysecond')]} />)
    expect(container.querySelectorAll('g[data-event="0"] [data-flag]')).toHaveLength(3)
    expect(container.querySelectorAll('g[data-event="1"] [data-flag]')).toHaveLength(3)
    const len = (c: Element, i: number) => {
      const s = c.querySelector(`g[data-event="${i}"] line[data-stem]`)!
      return Math.abs(Number(s.getAttribute('y2')) - Number(s.getAttribute('y1')))
    }
    const onaltilik = render(<Staff events={[note('G', 4, 'sixteenth'), note('D', 5, 'sixteenth')]} />).container
    expect(len(container, 0)).toBeGreaterThan(len(onaltilik, 0))
    expect(len(container, 1)).toBeGreaterThan(len(onaltilik, 1))
  })

  it('otuzikilik sus çizilir (üç top)', () => {
    const { container } = render(<Staff events={[{ kind: 'rest', dur: 'thirtysecond' }]} />)
    const rest = container.querySelector('[data-testid="rest"][data-dur="thirtysecond"]')
    expect(rest).not.toBeNull()
    expect(rest!.querySelectorAll('circle')).toHaveLength(3)
  })

  describe('kesik (staccato) işareti', () => {
    type Harf = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'
    const kesik = (step: Harf, octave: number, extra: object = {}): MusicEvent => ({
      ...(note(step, octave, 'quarter') as NoteEvent),
      kesik: true,
      ...extra,
    })
    it('kesik notada bir nokta (data-kesik) çizilir; süre noktası (data-dot) değildir; kesiksiz notada yoktur', () => {
      const { container } = render(<Staff events={[kesik('G', 4), note('G', 4, 'quarter')]} />)
      expect(container.querySelectorAll('[data-kesik]')).toHaveLength(1)
      expect(container.querySelectorAll('g[data-event="0"] [data-kesik]')).toHaveLength(1)
      expect(container.querySelectorAll('[data-dot]')).toHaveLength(0)
    })
    it('nokta sapın karşısındadır: sap yukarıyken başın altında, aşağıyken üstünde', () => {
      const { container } = render(<Staff events={[kesik('G', 4), kesik('D', 5)]} />)
      const head = (i: number) => Number(container.querySelectorAll('[data-testid="notehead"]')[i]!.getAttribute('cy'))
      const dot = (i: number) => Number(container.querySelector(`g[data-event="${i}"] [data-kesik]`)!.getAttribute('cy'))
      expect(container.querySelector('g[data-event="0"] line[data-stem]')!.getAttribute('data-stem')).toBe('up')
      expect(dot(0)).toBeGreaterThan(head(0))
      expect(container.querySelector('g[data-event="1"] line[data-stem]')!.getAttribute('data-stem')).toBe('down')
      expect(dot(1)).toBeLessThan(head(1))
    })
    it('kirişli kesik notada da nokta sapın karşısındadır; noktalı kesik nota hem süre hem kesik noktası çizer', () => {
      const events: MusicEvent[] = [{ ...(note('G', 4, 'eighth') as NoteEvent), kesik: true }, note('A', 4, 'eighth')]
      const { container } = render(<Staff events={events} beamBeats={1} />)
      expect(container.querySelector('line[data-beamed]')!.getAttribute('data-stem')).toBe('up')
      const head = Number(container.querySelector('[data-testid="notehead"]')!.getAttribute('cy'))
      expect(Number(container.querySelector('[data-kesik]')!.getAttribute('cy'))).toBeGreaterThan(head)
      cleanup()
      const d = render(<Staff events={[kesik('G', 4, { dotted: true })]} />).container
      expect(d.querySelectorAll('[data-kesik]')).toHaveLength(1)
      expect(d.querySelectorAll('[data-dot]')).toHaveLength(1)
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

describe('Staff: kirişler', () => {
  type Step = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'
  const ev = (step: Step, octave: number, dur: DurationKind, extra: object = {}): MusicEvent => ({
    kind: 'note',
    pitch: { step, octave, acc: 0 },
    dur,
    ...extra,
  })
  const nums = (d: string) => d.match(/-?\d+(?:\.\d+)?/g)!.map(Number)
  /** Kiriş yolunun dış kenarı: ilk iki nokta. */
  const beamLine = (b: Element) => {
    const [x1, y1, x2, y2] = nums(b.getAttribute('d')!)
    return { x1: x1!, y1: y1!, x2: x2!, y2: y2! }
  }
  const at = (l: ReturnType<typeof beamLine>, x: number) => l.y1 + ((l.y2 - l.y1) * (x - l.x1)) / (l.x2 - l.x1)
  const stems = (c: Element) =>
    [...c.querySelectorAll('line[data-stem]')].map((s) => ({
      x: Number(s.getAttribute('x1')),
      y1: Number(s.getAttribute('y1')),
      y2: Number(s.getAttribute('y2')),
      dir: s.getAttribute('data-stem'),
      beamed: s.hasAttribute('data-beamed'),
    }))
  /** Bugünkü çizimi yakalamak için seçilmiş karışık porte. */
  const mixed: MusicEvent[] = [
    ev('G', 4, 'eighth'),
    ev('A', 4, 'eighth', { tie: true }),
    ev('A', 4, 'eighth'),
    ev('D', 5, 'eighth'),
    ev('E', 5, 'sixteenth'),
    ev('D', 5, 'sixteenth'),
    ev('C', 5, 'sixteenth'),
    ev('B', 4, 'sixteenth'),
    ev('G', 4, 'eighth', { dotted: true }),
    ev('F', 4, 'sixteenth'),
    { kind: 'rest', dur: 'eighth' },
    ev('E', 4, 'eighth'),
  ]

  it('beamBeats verilmeyen Staff eski çizimi korur (sap, bayrak ve bağ geometrisi)', () => {
    const { container } = render(<Staff events={mixed} barlinesAfter={[11]} syllables={mixed.map(() => 'la')} />)
    expect(container.querySelectorAll('[data-beam]')).toHaveLength(0)
    expect(container.querySelectorAll('[data-beamed]')).toHaveLength(0)
    const geo = {
      stems: [...container.querySelectorAll('line[data-stem]')].map(
        (s) => ['x1', 'y1', 'y2'].map((a) => s.getAttribute(a)).join(' ') + ' ' + s.getAttribute('data-stem'),
      ),
      flags: [...container.querySelectorAll('[data-flag]')].map((f) => f.getAttribute('d')),
      ties: [...container.querySelectorAll('[data-tie]')].map((t) => t.getAttribute('d')),
      dots: container.querySelectorAll('[data-dot]').length,
    }
    expect(geo).toMatchInlineSnapshot(`
      {
        "dots": 1,
        "flags": [
          "M 66.6 27 q 9 6 7 16",
          "M 83.80000000000001 22 q 9 6 7 16",
          "M 101 22 q 9 6 7 16",
          "M 106.20000000000002 73 q 9 -6 7 -16",
          "M 123.4 68 q 9 -6 7 -16",
          "M 123.4 61 q 9 -6 7 -16",
          "M 140.6 73 q 9 -6 7 -16",
          "M 140.6 66 q 9 -6 7 -16",
          "M 157.79999999999998 78 q 9 -6 7 -16",
          "M 157.79999999999998 71 q 9 -6 7 -16",
          "M 174.99999999999997 83 q 9 -6 7 -16",
          "M 174.99999999999997 76 q 9 -6 7 -16",
          "M 204.19999999999996 27 q 9 6 7 16",
          "M 221.39999999999995 32 q 9 6 7 16",
          "M 221.39999999999995 39 q 9 6 7 16",
          "M 255.79999999999995 37 q 9 6 7 16",
        ],
        "stems": [
          "66.6 60 27 up",
          "83.80000000000001 55 22 up",
          "101 55 22 up",
          "106.20000000000002 40 73 down",
          "123.4 35 68 down",
          "140.6 40 73 down",
          "157.79999999999998 45 78 down",
          "174.99999999999997 50 83 down",
          "204.19999999999996 60 27 up",
          "221.39999999999995 65 32 up",
          "255.79999999999995 70 37 up",
        ],
        "ties": [
          "M 83.30000000000001 61 Q 86.4 67 89.5 61",
        ],
      }
    `)
  })

  it('kirişlenecek grup yoksa beamBeats çizimi değiştirmez', () => {
    const quarters = [ev('G', 4, 'quarter'), ev('A', 4, 'eighth'), ev('B', 4, 'quarter'), ev('C', 5, 'eighth')]
    const a = render(<Staff events={quarters} />).container.innerHTML
    cleanup()
    const b = render(<Staff events={quarters} beamBeats={1} />).container.innerHTML
    expect(b).toBe(a)
  })

  it('gruplu notalarda bayrak yoktur ve data-beam çizgisi vardır; tek kalan sekizlik bayraklıdır', () => {
    const events = [
      ev('G', 4, 'eighth'),
      ev('A', 4, 'eighth'),
      ev('B', 4, 'eighth'),
      ev('C', 5, 'eighth'),
      ev('D', 5, 'eighth'),
    ]
    const { container } = render(<Staff events={events} beamBeats={1} />)
    expect(container.querySelectorAll('[data-beam="1"]')).toHaveLength(2)
    expect(container.querySelectorAll('[data-beam="2"]')).toHaveLength(0)
    expect(container.querySelectorAll('[data-flag]')).toHaveLength(1)
    expect(container.querySelectorAll('g[data-event="4"] [data-flag]')).toHaveLength(1)
    expect(container.querySelectorAll('line[data-beamed]')).toHaveLength(4)
  })

  it('dört otuzikilik: üç kiriş (3. kiriş 2. kirişin altında), bayrak yok; sap üç kirişe yetecek kadar uzun', () => {
    const events = [ev('G', 4, 'thirtysecond'), ev('A', 4, 'thirtysecond'), ev('G', 4, 'thirtysecond'), ev('A', 4, 'thirtysecond')]
    const { container } = render(<Staff events={events} beamBeats={1} />)
    expect(container.querySelectorAll('[data-beam="1"]')).toHaveLength(1)
    expect(container.querySelectorAll('[data-beam="2"]')).toHaveLength(1)
    expect(container.querySelectorAll('[data-beam="3"]')).toHaveLength(1)
    expect(container.querySelectorAll('[data-flag]')).toHaveLength(0)
    const p = beamLine(container.querySelector('[data-beam="1"]')!)
    const s2 = beamLine(container.querySelector('[data-beam="2"]')!)
    const s3 = beamLine(container.querySelector('[data-beam="3"]')!)
    expect(at(s2, p.x1) - at(p, p.x1)).toBeCloseTo(7.5, 5)
    expect(at(s3, p.x1) - at(p, p.x1)).toBeCloseTo(15, 5)
    // Üçüncü kirişin iç kenarı nota başından en az bir aralık (10 px) uzakta kalır.
    for (const st of stems(container)) {
      const kenar = at(s3, st.x) + 4.5
      expect(Math.abs(kenar - st.y1)).toBeGreaterThanOrEqual(10)
    }
  })

  it('noktalı onaltılık + otuzikilik: 2. kiriş ikisini bağlar, 3. kiriş otuzikilikte sola bakan kısa parçadır', () => {
    const events = [ev('G', 4, 'sixteenth', { dotted: true }), ev('A', 4, 'thirtysecond')]
    const { container } = render(<Staff events={events} beamBeats={1} />)
    expect(container.querySelectorAll('[data-beam="2"]')).toHaveLength(1)
    const b3 = container.querySelectorAll('[data-beam="3"]')
    expect(b3).toHaveLength(1)
    const [st0, st1] = stems(container)
    const l3 = beamLine(b3[0]!)
    expect(l3.x2).toBeGreaterThan(st1!.x)
    expect(l3.x1).toBeLessThan(st1!.x)
    expect(l3.x1).toBeGreaterThan(st0!.x)
  })

  it('onaltılık grubunda iki kiriş vardır; ikincisi nota başlarına doğru kaydırılır', () => {
    const events = [ev('G', 4, 'sixteenth'), ev('A', 4, 'sixteenth'), ev('G', 4, 'sixteenth'), ev('A', 4, 'sixteenth')]
    const { container } = render(<Staff events={events} beamBeats={1} />)
    const primary = container.querySelectorAll('[data-beam="1"]')
    const secondary = container.querySelectorAll('[data-beam="2"]')
    expect(primary).toHaveLength(1)
    expect(secondary).toHaveLength(1)
    expect(container.querySelectorAll('[data-flag]')).toHaveLength(0)
    const p = beamLine(primary[0]!)
    const s = beamLine(secondary[0]!)
    // Saplar yukarı (notalar orta çizginin altında): ikinci kiriş birincinin altındadır.
    expect(stems(container).every((st) => st.dir === 'up')).toBe(true)
    expect(at(s, p.x1) - at(p, p.x1)).toBeCloseTo(7.5, 5)
    expect(s.x1).toBeCloseTo(p.x1, 5)
    expect(s.x2).toBeCloseTo(p.x2, 5)
  })

  it('noktalı sekizlik + onaltılık: onaltılıkta komşusuna doğru, baş genişliğinde kısa ikinci kiriş', () => {
    const events = [
      ev('G', 4, 'eighth', { dotted: true }),
      ev('A', 4, 'sixteenth'),
      ev('A', 4, 'sixteenth'),
      ev('G', 4, 'eighth', { dotted: true }),
    ]
    const { container } = render(<Staff events={events} beamBeats={1} />)
    expect(container.querySelectorAll('[data-beam="1"]')).toHaveLength(2)
    const stubs = [...container.querySelectorAll('[data-beam="2"]')].map(beamLine)
    expect(stubs).toHaveLength(2)
    const st = stems(container)
    // 1. grup (e. s): kısa kiriş onaltılığın sapından sola, 2. grup (s e.): sağa uzanır.
    expect(Math.max(stubs[0]!.x1, stubs[0]!.x2)).toBeCloseTo(st[1]!.x + 0.75, 5)
    expect(Math.abs(stubs[0]!.x2 - stubs[0]!.x1)).toBeCloseTo(13, 5)
    expect(Math.min(stubs[1]!.x1, stubs[1]!.x2)).toBeCloseTo(st[2]!.x - 0.75, 5)
    expect(Math.abs(stubs[1]!.x2 - stubs[1]!.x1)).toBeCloseTo(13, 5)
    expect(container.querySelectorAll('[data-flag]')).toHaveLength(0)
    expect(container.querySelectorAll('[data-dot]')).toHaveLength(2)
  })

  it('gruptaki sapların uçları kiriş üzerindedir; saplar en az 2,5 aralık uzunluğundadır', () => {
    // [olaylar, en kısa sap]: 2. grupta (Mi4…Fa5, saplar aşağı) kiriş hecelere inmesin diye Mi4'ün sapı
    // 2 aralığa (20 px) dek kısalır; diğerlerinde her sap en az 2,5 aralıktır.
    const cases: [MusicEvent[], number][] = [
      [[ev('G', 4, 'eighth'), ev('D', 5, 'eighth')], 25],
      [[ev('E', 4, 'sixteenth'), ev('A', 4, 'sixteenth'), ev('C', 5, 'sixteenth'), ev('F', 5, 'sixteenth')], 20],
      [[ev('A', 5, 'eighth'), ev('C', 5, 'eighth'), ev('E', 5, 'eighth')], 25],
      [[ev('E', 4, 'eighth'), ev('B', 4, 'eighth'), ev('D', 4, 'eighth')], 25],
    ]
    for (const [events, minStem] of cases) {
      const { container, unmount } = render(<Staff events={events} beamBeats={1.5} />)
      const l = beamLine(container.querySelector('[data-beam="1"]')!)
      const st = stems(container)
      expect(st.every((s) => s.beamed)).toBe(true)
      for (const s of st) {
        expect(s.y2).toBeCloseTo(at(l, s.x), 5)
        expect(Math.abs(s.y2 - s.y1)).toBeGreaterThanOrEqual(minStem - 1e-9)
        expect(s.y2).toBeLessThanOrEqual(90 + 1e-9)
      }
      // Kiriş ilk sapın solundan son sapın sağına uzanır (sap kalınlığının yarısı kadar).
      expect(l.x1).toBeCloseTo(st[0]!.x - 0.75, 5)
      expect(l.x2).toBeCloseTo(st.at(-1)!.x + 0.75, 5)
      // Eğim en fazla bir porte aralığı.
      expect(Math.abs(l.y2 - l.y1)).toBeLessThanOrEqual(10 + 1e-9)
      unmount()
    }
  })

  it('ortak sap yönü: orta çizgiden en uzak nota belirler, eşitlikte aşağı', () => {
    const dirs = (events: MusicEvent[]) => {
      const { container, unmount } = render(<Staff events={events} beamBeats={1} />)
      const d = stems(container).map((s) => s.dir)
      unmount()
      return d
    }
    // Mi4 (4 adım aşağıda) Do5'ten (1 adım yukarıda) uzak → yukarı.
    expect(dirs([ev('E', 4, 'eighth'), ev('C', 5, 'eighth')])).toEqual(['up', 'up'])
    // Sol4 (2 aşağı) ile Re5 (2 yukarı) eşit → aşağı.
    expect(dirs([ev('G', 4, 'eighth'), ev('D', 5, 'eighth')])).toEqual(['down', 'down'])
    // Fa5 (4 yukarı) La4'ten (1 aşağı) uzak → aşağı.
    expect(dirs([ev('A', 4, 'eighth'), ev('F', 5, 'eighth')])).toEqual(['down', 'down'])
  })

  it('kiriş eğimi en fazla bir porte aralığıyla sınırlanır', () => {
    const { container } = render(<Staff events={[ev('E', 4, 'eighth'), ev('A', 5, 'eighth')]} beamBeats={1} />)
    const l = beamLine(container.querySelector('[data-beam="1"]')!)
    expect(Math.abs(l.y2 - l.y1)).toBeLessThanOrEqual(10 + 1e-9)
    expect(l.y2).toBeLessThan(l.y1) // yükselen ezgi → yükselen kiriş
  })

  it('bağ yayı ortak sap yönünün karşı tarafındadır; heceler etkilenmez', () => {
    // Sol4 tek başına yukarı saplıdır; Mi5 grubu aşağı saplı yapar → Sol4'teki bağ yayı yukarıda.
    const events = [ev('G', 4, 'eighth', { tie: true }), ev('G', 4, 'eighth'), ev('E', 5, 'eighth')]
    const syl = ['a', '', 'b']
    const { container } = render(<Staff events={events} beamBeats={1.5} syllables={syl} />)
    const [, y1, , cy] = nums(container.querySelector('[data-tie]')!.getAttribute('d')!)
    const headY = Number(container.querySelector('[data-testid="notehead"]')!.getAttribute('cy'))
    expect(y1!).toBeLessThan(headY)
    expect(cy!).toBeLessThan(y1!)
    const sx = (c: Element) =>
      [...c.querySelectorAll('text[data-syllable]')].map((t) => `${t.getAttribute('x')},${t.getAttribute('y')}`)
    const beamed = sx(container)
    cleanup()
    expect(sx(render(<Staff events={events} syllables={syl} />).container)).toEqual(beamed)
  })

  it('kiriş hecelere inmez ve görünüm kutusunun üstünden taşmaz', () => {
    const events = [ev('G', 4, 'eighth'), ev('A', 5, 'eighth'), ev('C', 4, 'eighth'), ev('G', 5, 'eighth')]
    const { container } = render(<Staff events={events} beamBeats={1} />)
    expect(container.querySelectorAll('[data-beam]').length).toBeGreaterThan(0)
    for (const b of container.querySelectorAll('[data-beam]')) {
      nums(b.getAttribute('d')!).forEach((v, i) => {
        if (i % 2 === 1) {
          expect(v).toBeLessThanOrEqual(90)
          expect(v).toBeGreaterThanOrEqual(0)
        }
      })
    }
  })
})

describe('Staff: üçleme, bağ, nefes işareti, röpriz', () => {
  const nt = (step: 'G' | 'A' | 'B' | 'C' | 'D', octave: number, dur: DurationKind, extra: Partial<NoteEvent> = {}) =>
    ({ kind: 'note', pitch: { step, octave, acc: 0 }, dur, ...extra }) as NoteEvent
  const nums = (d: string) => d.match(/-?\d+(?:\.\d+)?/g)!.map(Number)
  const viewWidthOf = (c: Element) => Number(c.querySelector('svg')!.getAttribute('viewBox')!.split(' ')[2])

  it('üçleme grubunun üstünde tek "3"', () => {
    const steps = ['G', 'A', 'B', 'C', 'B', 'A'] as const
    const events = steps.map((s) => nt(s, s === 'C' ? 5 : 4, 'eighth', { uclu: true }))
    const { container } = render(<Staff events={events} beamBeats={1} />)
    const marks = [...container.querySelectorAll('[data-uclu]')]
    expect(marks).toHaveLength(2)
    expect(marks.map((m) => m.textContent)).toEqual(['3', '3'])
    // "3" grubun ortasında ve nota başlarının üstündedir.
    const heads = [...container.querySelectorAll('[data-testid="notehead"]')]
    const cx = heads.map((h) => Number(h.getAttribute('cx')))
    const x0 = Number(marks[0]!.getAttribute('x'))
    expect(x0).toBeGreaterThan(cx[0]!)
    expect(x0).toBeLessThan(cx[2]!)
    const minHeadY = Math.min(...heads.slice(0, 3).map((h) => Number(h.getAttribute('cy'))))
    expect(Number(marks[0]!.getAttribute('y'))).toBeLessThan(minHeadY)
    expect(Number(marks[0]!.getAttribute('y'))).toBeGreaterThan(0)
  })

  it('bağ yay çizer', () => {
    const events = [
      nt('G', 4, 'quarter', { bag: true }),
      nt('D', 5, 'quarter', { bag: true }),
      nt('A', 4, 'quarter'),
      nt('B', 4, 'quarter', { bag: true }),
    ]
    const { container } = render(<Staff events={events} />)
    // Son notadaki bag sonraki nota olmadığı için yay çizmez.
    const arcs = [...container.querySelectorAll('[data-bag]')]
    expect(arcs).toHaveLength(2)
    // Uçlar iki notanın yüksekliğine göredir: Sol4'ten Re5'e giden yayın uçları farklı yükseklikte.
    const [x1, y1, , , x2, y2] = nums(arcs[0]!.getAttribute('d')!)
    const heads = [...container.querySelectorAll('[data-testid="notehead"]')]
    const cx = heads.map((h) => Number(h.getAttribute('cx')))
    expect(x1!).toBeGreaterThan(cx[0]!)
    expect(x2!).toBeLessThan(cx[1]!)
    expect(y2!).toBeLessThan(y1!)
  })

  it('nefes işareti çizilir', () => {
    const events = [nt('G', 4, 'quarter', { nefes: true }), nt('A', 4, 'quarter')]
    const { container } = render(<Staff events={events} />)
    const marks = [...container.querySelectorAll('[data-nefes]')]
    expect(marks).toHaveLength(1)
    const cx = [...container.querySelectorAll('[data-testid="notehead"]')].map((h) => Number(h.getAttribute('cx')))
    const x = Number(marks[0]!.getAttribute('x'))
    expect(x).toBeGreaterThan(cx[0]!)
    expect(x).toBeLessThan(cx[1]!)
    expect(Number(marks[0]!.getAttribute('y'))).toBeLessThanOrEqual(34) // portenin üstünde
  })

  it('röpriz çizgileri', () => {
    const events = [nt('G', 4, 'quarter'), nt('A', 4, 'quarter')]
    const a = render(<Staff events={events} barlinesAfter={[1]} ropriz={{ bas: true, son: true }} />)
    const bas = a.container.querySelector('[data-ropriz="bas"]')!
    const son = a.container.querySelector('[data-ropriz="son"]')!
    expect(bas).toBeTruthy()
    expect(son).toBeTruthy()
    expect(bas.querySelectorAll('circle')).toHaveLength(2)
    expect(son.querySelectorAll('circle')).toHaveLength(2)
    // Satır sonundaki ince ölçü çizgisinin yerini röpriz alır.
    expect(a.container.querySelectorAll('line[data-barline]')).toHaveLength(0)
    const cx = [...a.container.querySelectorAll('[data-testid="notehead"]')].map((h) => Number(h.getAttribute('cx')))
    const basXs = [...bas.querySelectorAll('circle')].map((c) => Number(c.getAttribute('cx')))
    const sonXs = [...son.querySelectorAll('circle')].map((c) => Number(c.getAttribute('cx')))
    expect(Math.max(...basXs)).toBeLessThan(cx[0]! - 6.5)
    expect(Math.min(...sonXs)).toBeGreaterThan(cx[1]! + 6.5)
    a.unmount()
    const b = render(<Staff events={events} ropriz={{ son: true }} />)
    expect(b.container.querySelector('[data-ropriz="bas"]')).toBeNull()
    expect(b.container.querySelector('[data-ropriz="son"]')).toBeTruthy()
  })

  it('375 genişlikte viewBox kırpılmaz', () => {
    const steps = ['G', 'A', 'B', 'C', 'D', 'C', 'B', 'A'] as const
    const events = steps.map((s) => nt(s, s === 'C' || s === 'D' ? 5 : 4, 'eighth', { uclu: true }))
    const { container } = render(
      <Staff events={events} width={375} beamBeats={1} ropriz={{ bas: true, son: true }} />,
    )
    const viewWidth = viewWidthOf(container)
    const cx = [...container.querySelectorAll('[data-testid="notehead"]')].map((h) => Number(h.getAttribute('cx')))
    expect(cx.at(-1)!).toBeLessThan(viewWidth)
    const sonXs = [...container.querySelectorAll('[data-ropriz="son"] circle')].map((c) => Number(c.getAttribute('cx')))
    expect(sonXs).toHaveLength(2)
    expect(Math.min(...sonXs)).toBeGreaterThan(cx.at(-1)! + 6.5)
    expect(container.querySelectorAll('[data-uclu]').length).toBeGreaterThan(0)
    for (const l of container.querySelectorAll('[data-ropriz] line, [data-ropriz] rect')) {
      const x = Number(l.getAttribute('x1') ?? l.getAttribute('x'))
      expect(x).toBeLessThanOrEqual(viewWidth)
    }
    expect(container.querySelector('svg')!.getAttribute('width')).toBe('100%')
  })
})

describe('Staff: tiz perdeler (D6, C6#4) kırpılmaz', () => {
  const tiz = (step: 'B' | 'C' | 'D', octave: number, acc: Accidental): MusicEvent => ({
    kind: 'note',
    pitch: { step, octave, acc },
    dur: 'quarter',
  })

  /** Nota başı (döndürülmüş elips + çizgi kalınlığı: en çok 6 px yukarı), ek çizgiler ve işaretin (en çok `yukselis` px yukarı) üst ucu. */
  function ustUclar(container: Element, yukselis: number): number[] {
    const y: number[] = []
    for (const h of container.querySelectorAll('[data-testid="notehead"]')) y.push(Number(h.getAttribute('cy')) - 6)
    for (const l of container.querySelectorAll('[data-ledger]')) y.push(Number(l.getAttribute('y1')) - 0.6)
    for (const a of container.querySelectorAll('[data-testid="accidental"]')) {
      const m = /translate\([-\d.]+ ([-\d.]+)\)/.exec(a.getAttribute('transform')!)!
      y.push(Number(m[1]) - yukselis)
    }
    return y
  }
  const minYOf = (c: Element) => Number(c.querySelector('svg')!.getAttribute('viewBox')!.split(' ')[1])

  it('D6 nota başı ve ek çizgiler görünüm kutusunun içinde kalır', () => {
    const { container } = render(<Staff events={[tiz('D', 6, 0)]} />)
    const ust = ustUclar(container, 0)
    expect(ust.length).toBe(1 + 2) // baş + iki ek çizgi (La5 ve Do6 çizgileri)
    for (const y of ust) expect(y).toBeGreaterThanOrEqual(minYOf(container) - 0.001)
  })

  it('C6#4 nota başı, bakiye diyezi ve ek çizgiler görünüm kutusunun içinde kalır', () => {
    const { container } = render(<Staff events={[tiz('C', 6, 4)]} />)
    expect(container.querySelector('[data-testid="accidental"]')).toBeTruthy()
    // Diyez en çok 1,4 aralık (14 px) yukarı uzanır.
    for (const y of ustUclar(container, 14)) expect(y).toBeGreaterThanOrEqual(minYOf(container) - 0.001)
    expect(minYOf(container)).toBeLessThan(0)
  })

  it('Tiz Segâh (Si koma bemolü) işareti de kırpılmaz; bemol 1,76 aralık (17,6 px) yukarı uzanır', () => {
    const { container } = render(<Staff events={[tiz('B', 5, -1)]} />)
    for (const y of ustUclar(container, 17.6)) expect(y).toBeGreaterThanOrEqual(minYOf(container) - 0.001)
  })

  it('porte içindeki ve alçak notalarda görünüm kutusu yukarı büyümez', () => {
    const { container } = render(<Staff events={[note('A', 5, 'quarter'), tiz('C', 6, 0)]} />)
    expect(minYOf(container)).toBeGreaterThanOrEqual(-0.001) // Do6 başı: y = 10, üst ucu 4
    const { container: c2 } = render(<Staff events={[note('G', 4, 'quarter')]} />)
    expect(c2.querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 240 110')
  })

  it('işaretli yüksek nota için görünüm kutusu yukarı uzar, genişlik ve yükseklik toplamı bozulmaz', () => {
    const { container } = render(<Staff events={[tiz('D', 6, 0)]} />)
    const [x, minY, w, h] = container.querySelector('svg')!.getAttribute('viewBox')!.split(' ').map(Number)
    expect(x).toBe(0)
    expect(minY!).toBeLessThan(0)
    expect(minY! + h!).toBe(110) // alt kenar sabit: yalnız yukarı büyür
    expect(w).toBeGreaterThan(0)
  })
})

describe('Staff: takip sonuç işaretleri', () => {
  const dort = [note('G', 4, 'quarter'), note('A', 4, 'quarter'), note('B', 4, 'quarter'), note('C', 5, 'quarter')]
  const olay = (c: Element, i: number) => c.querySelector(`[data-event="${i}"]`) as SVGGElement

  it('durumlar verilmezse işaret ve data-durum yoktur; görünüm kutusu değişmez', () => {
    const { container } = render(<Staff events={dort} />)
    expect(container.querySelector('[data-durum]')).toBeNull()
    expect(container.querySelector('[data-durum-isaret]')).toBeNull()
    expect(container.querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 240 110')
  })

  it('durumlu olaylar data-durum, renk, işaret ve erişilebilir ad taşır; doğru işaretsizdir', () => {
    const { container } = render(
      <Staff events={dort} durumlar={['dogru', 'pes', undefined, 'yanlis']} />,
    )
    expect(olay(container, 0).getAttribute('data-durum')).toBe('dogru')
    expect(olay(container, 1).getAttribute('data-durum')).toBe('pes')
    expect(olay(container, 2).hasAttribute('data-durum')).toBe(false)
    expect(olay(container, 3).getAttribute('data-durum')).toBe('yanlis')
    expect(olay(container, 0).querySelector('[data-durum-isaret]')).toBeNull()
    expect(olay(container, 1).querySelector('[data-durum-isaret]')!.textContent).toBe('↓')
    expect(olay(container, 3).querySelector('[data-durum-isaret]')!.textContent).toBe('✗')
    expect(olay(container, 0).style.color).toBe('var(--takip-dogru)')
    expect(olay(container, 1).style.color).toBe('var(--takip-uyari)')
    expect(olay(container, 3).style.color).toBe('var(--takip-hata)')
    expect(olay(container, 2).style.color).toBe('')
    expect(olay(container, 0).querySelector('title')!.textContent).toBe('doğru')
    expect(olay(container, 1).querySelector('title')!.textContent).toBe('pes')
    expect(olay(container, 3).querySelector('title')!.textContent).toBe('başka perde')
  })

  it('her durumun işareti, rengi ve adı doğrudur', () => {
    const tum = ['pes', 'tiz', 'yanlis', 'yok', 'kisa'] as const
    const { container } = render(<Staff events={[...dort, note('D', 5, 'quarter')]} durumlar={[...tum]} />)
    const isaret = tum.map((_, i) => olay(container, i).querySelector('[data-durum-isaret]')!.textContent)
    expect(isaret).toEqual(['↓', '↑', '✗', '–', '◡'])
    const renk = tum.map((_, i) => olay(container, i).style.color)
    expect(renk).toEqual([
      'var(--takip-uyari)',
      'var(--takip-uyari)',
      'var(--takip-hata)',
      'var(--takip-hata)',
      'var(--takip-uyari)',
    ])
    const isaretRengi = tum.map((_, i) => olay(container, i).querySelector('[data-durum-isaret]')!.getAttribute('fill'))
    expect(isaretRengi).toEqual(renk)
    const ad = tum.map((_, i) => olay(container, i).querySelector('title')!.textContent)
    expect(ad).toEqual(['pes', 'tiz', 'başka perde', 'duyulmadı', 'kısa tutuldu'])
  })

  it('vurgu rengi durum renginden önceliklidir; üstteki işaret yine durum rengindedir', () => {
    const { container } = render(<Staff events={dort} durumlar={['pes']} highlightIndex={0} />)
    expect(olay(container, 0).style.color).toBe('var(--accent, #d9480f)')
    expect(olay(container, 0).getAttribute('data-durum')).toBe('pes')
    expect(olay(container, 0).querySelector('[data-durum-isaret]')!.getAttribute('fill')).toBe('var(--takip-uyari)')
  })

  it('sapı aşağı kesik notada işaret, kesik noktasının üstünde kalır (çakışmaz)', () => {
    const kesikRe5: MusicEvent = { ...(note('D', 5, 'quarter') as NoteEvent), kesik: true }
    const { container } = render(<Staff events={[kesikRe5]} durumlar={['pes']} />)
    const nokta = Number(container.querySelector('[data-kesik]')!.getAttribute('cy'))
    const isaretTaban = Number(container.querySelector('[data-durum-isaret]')!.getAttribute('y'))
    expect(isaretTaban).toBeLessThanOrEqual(nokta - 1.8) // yazının taban çizgisi noktanın üst kenarının üstünde
  })

  it('porte üstü yüksek kesik notada nokta ve işaret görünüm kutusunun içinde kalır', () => {
    const kesikDo6: MusicEvent = { ...(note('C', 6, 'quarter') as NoteEvent), kesik: true }
    const { container } = render(<Staff events={[kesikDo6]} durumlar={['tiz']} />)
    const [, minY] = container.querySelector('svg')!.getAttribute('viewBox')!.split(' ').map(Number)
    const nokta = Number(container.querySelector('[data-kesik]')!.getAttribute('cy'))
    const isaretTaban = Number(container.querySelector('[data-durum-isaret]')!.getAttribute('y'))
    expect(isaretTaban).toBeLessThanOrEqual(nokta - 1.8)
    expect(isaretTaban - 10).toBeGreaterThanOrEqual(minY! - 0.001)
  })

  it('durumsuz yüksek kesik notada nokta görünüm kutusunun içinde kalır', () => {
    const kesikDo6: MusicEvent = { ...(note('C', 6, 'quarter') as NoteEvent), kesik: true }
    const { container } = render(<Staff events={[kesikDo6]} />)
    const [, minY] = container.querySelector('svg')!.getAttribute('viewBox')!.split(' ').map(Number)
    const nokta = Number(container.querySelector('[data-kesik]')!.getAttribute('cy'))
    expect(nokta - 1.8).toBeGreaterThanOrEqual(minY! - 0.001)
  })

  it('işaretler porte üstünde kalır ve görünüm kutusunun dışına taşmaz', () => {
    const yuksek = [note('A', 5, 'eighth'), note('B', 5, 'eighth'), note('C', 6, 'quarter')]
    const { container } = render(<Staff events={yuksek} beamBeats={1} durumlar={['tiz', 'yanlis', 'yok']} />)
    const [, minY] = container.querySelector('svg')!.getAttribute('viewBox')!.split(' ').map(Number)
    for (const t of container.querySelectorAll('[data-durum-isaret]')) {
      const y = Number(t.getAttribute('y'))
      expect(y).toBeLessThan(30) // porte üstünden yukarıda
      expect(y - 10).toBeGreaterThanOrEqual(minY! - 0.001) // yazı boyu 10: üst kenar kutu içinde
    }
  })
})
