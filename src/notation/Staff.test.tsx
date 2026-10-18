import { cleanup, render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it } from 'vitest'
import type { MusicEvent } from '../music/notation'
import { AccidentalGlyph } from './glyphs'
import { Staff } from './Staff'

afterEach(cleanup)

const note = (
  step: 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B',
  octave: number,
  dur: 'whole' | 'half' | 'quarter' | 'eighth',
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

describe('AccidentalGlyph', () => {
  it('acc === 0 ise hiçbir şey çizmez', () => {
    const { container } = render(
      <svg>
        <AccidentalGlyph acc={0} x={10} y={10} />
      </svg>,
    )
    expect(container.querySelector('svg')!.childNodes).toHaveLength(0)
  })

  it('diyez ve bemol için sembol ve koma sayısı gösterir', () => {
    const { container } = render(
      <svg>
        <AccidentalGlyph acc={4} x={10} y={10} />
        <AccidentalGlyph acc={-1} x={30} y={10} />
      </svg>,
    )
    const text = container.textContent ?? ''
    expect(text).toContain('♯')
    expect(text).toContain('4')
    expect(text).toContain('♭')
    expect(text).toContain('1')
  })
})
