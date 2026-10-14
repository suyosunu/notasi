import { cleanup, render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it } from 'vitest'
import type { Fingering } from '../content/ney-perdeler'
import { FingeringDiagram } from './Fingering'

afterEach(cleanup)

const CARGAH: Fingering = { thumb: 'kapali', front: ['kapali', 'kapali', 'acik', 'acik', 'kapali', 'acik'] }

describe('FingeringDiagram (Fingering)', () => {
  it('7 delik çizer: 1 başparmak + 6 ön', () => {
    render(<FingeringDiagram fingering={CARGAH} />)
    const holes = screen.getAllByTestId('hole')
    expect(holes).toHaveLength(7)
    expect(holes.map((h) => h.getAttribute('data-hole'))).toEqual([
      'thumb',
      'front-1',
      'front-2',
      'front-3',
      'front-4',
      'front-5',
      'front-6',
    ])
  })

  it('kapalı delikler dolu, açık delikler boş çizilir', () => {
    render(<FingeringDiagram fingering={CARGAH} />)
    const holes = screen.getAllByTestId('hole')
    const filled = holes.map((h) => h.getAttribute('fill') !== 'none')
    expect(filled).toEqual([true, true, true, false, false, true, false])
    expect(holes.map((h) => h.getAttribute('data-state'))).toEqual([
      'kapali',
      'kapali',
      'kapali',
      'acik',
      'acik',
      'kapali',
      'acik',
    ])
  })

  it('başparmak deliği en üstte "arka" etiketiyle durur', () => {
    const { container } = render(<FingeringDiagram fingering={CARGAH} />)
    const holes = screen.getAllByTestId('hole')
    const ys = holes.map((h) => Number(h.getAttribute('cy')))
    const thumbY = ys[0]
    for (const y of ys.slice(1)) expect(thumbY).toBeLessThan(y)
    // Ön delikler yukarıdan aşağı sıralı.
    for (let i = 2; i < ys.length; i++) expect(ys[i]).toBeGreaterThan(ys[i - 1])
    const label = container.querySelector('[data-label="thumb"]')
    expect(label?.textContent).toBe('arka')
  })

  it('yarım deliği yarısı dolu olarak işaretler', () => {
    render(
      <FingeringDiagram
        fingering={{ thumb: 'kapali', front: ['kapali', 'kapali', 'yarim', 'acik', 'kapali', 'acik'] }}
      />,
    )
    const third = screen.getAllByTestId('hole')[3]
    expect(third.getAttribute('data-state')).toBe('yarim')
    expect(screen.getAllByTestId('half-fill')).toHaveLength(1)
  })

  it('ekran okuyucu için Türkçe tarif verir', () => {
    render(<FingeringDiagram fingering={CARGAH} />)
    const svg = screen.getByRole('img')
    const label = svg.getAttribute('aria-label') ?? ''
    expect(label).toContain('Başparmak (arka): kapalı')
    expect(label).toContain('3. delik: açık')
  })
})
