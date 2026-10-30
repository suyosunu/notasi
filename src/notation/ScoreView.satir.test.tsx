import { cleanup, fireEvent, render } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MusicEvent } from '../music/notation'

/** Gerçek Staff'ı sarar: hangi satırın (olay dizisinin) yeniden çizildiğini sayar; çizim aynıdır. */
const cizilen: MusicEvent[][] = []
vi.mock('./Staff', async (orig) => {
  const gercek = await orig<typeof import('./Staff')>()
  return {
    ...gercek,
    Staff: (props: Parameters<typeof gercek.Staff>[0]) => {
      cizilen.push(props.events)
      return gercek.Staff(props)
    },
  }
})

import { ScoreView } from './ScoreView'
import type { Secim } from './secim'

afterEach(cleanup)
beforeEach(() => {
  cizilen.length = 0
})

const q = (step: 'G' | 'A' | 'B' | 'C'): MusicEvent => ({ kind: 'note', pitch: { step, octave: 4, acc: 0 }, dur: 'quarter' })
/** Dört ölçü, satır başına bir ölçü: dört satır. */
const OLCU: MusicEvent[][] = Array.from({ length: 4 }, () => [q('G'), q('A'), q('B'), q('C')])
const satirlar = (c: Element) => [...c.querySelectorAll('[data-testid="score-row"]')] as HTMLElement[]
/** Bu çizimde yeniden çizilen satırların sırası (satır başına bir ölçü: satırın ilk olayı o ölçünün ilk olayıdır). */
const cizilenSatirlar = () => cizilen.map((ev) => OLCU.findIndex((m) => m[0] === ev[0])).sort()

describe('ScoreView: satır başına yeniden çizim', () => {
  it('vurgu değişince yalnız vurgusu değişen satırlar yeniden çizilir; ötekilerin SVG düğümleri aynı kalır', () => {
    const dokun = vi.fn()
    const goster = (vurgu: { olcu: number; nota: number } | null) => (
      // Her çizimde yeni bir işlev: satırlar yine de yalnız kendi değerleri değişince çizilmeli.
      <ScoreView olcu={OLCU} olcuPerSatir={1} secim={null} onSatirDokun={(s: Secim) => dokun(s)} vurgu={vurgu} />
    )
    const { container, rerender } = render(goster({ olcu: 0, nota: 1 }))
    expect(cizilenSatirlar()).toEqual([0, 1, 2, 3])
    const svgOnce = satirlar(container).map((r) => r.querySelector('svg'))

    cizilen.length = 0
    rerender(goster({ olcu: 0, nota: 2 }))
    expect(cizilenSatirlar()).toEqual([0])

    cizilen.length = 0
    rerender(goster({ olcu: 1, nota: 0 }))
    expect(cizilenSatirlar()).toEqual([0, 1])
    const svgSonra = satirlar(container).map((r) => r.querySelector('svg'))
    expect(svgSonra[2]).toBe(svgOnce[2])
    expect(svgSonra[3]).toBe(svgOnce[3])
    expect(satirlar(container)[1]!.querySelector('[data-highlight]')!.getAttribute('data-event')).toBe('0')
    expect(satirlar(container)[0]!.querySelector('[data-highlight]')).toBeNull()

    // Dokunuş her zaman son verilen işleve gider.
    fireEvent.click(satirlar(container)[3]!)
    expect(dokun).toHaveBeenCalledWith({ bas: 3, son: 3 })
  })

  it('seçim değişince yalnız seçili durumu değişen satırlar yeniden çizilir', () => {
    const goster = (secim: Secim | null) => <ScoreView olcu={OLCU} olcuPerSatir={1} secim={secim} onSatirDokun={() => {}} />
    const { container, rerender } = render(goster(null))
    cizilen.length = 0
    rerender(goster({ bas: 1, son: 2 }))
    expect(cizilenSatirlar()).toEqual([1, 2])
    expect(satirlar(container).map((r) => r.classList.contains('secili'))).toEqual([false, true, true, false])
  })

  it('sonuçlar değişince yalnız sonucu değişen satırlar yeniden çizilir; içerik aynıysa yeni dizi çizdirmez', () => {
    const goster = (sonuclar: { olcu: number; nota: number; durum: 'pes' | 'tiz' | 'dogru' }[]) => (
      <ScoreView olcu={OLCU} olcuPerSatir={1} sonuclar={sonuclar} />
    )
    const { container, rerender } = render(goster([{ olcu: 0, nota: 0, durum: 'dogru' }]))
    const svgOnce = satirlar(container).map((r) => r.querySelector('svg'))

    cizilen.length = 0
    rerender(goster([{ olcu: 0, nota: 0, durum: 'dogru' }])) // yeni dizi, aynı içerik
    expect(cizilen).toEqual([])

    rerender(goster([{ olcu: 0, nota: 0, durum: 'dogru' }, { olcu: 2, nota: 1, durum: 'pes' }]))
    expect(cizilenSatirlar()).toEqual([2])

    cizilen.length = 0
    rerender(goster([{ olcu: 0, nota: 0, durum: 'tiz' }, { olcu: 2, nota: 1, durum: 'pes' }]))
    expect(cizilenSatirlar()).toEqual([0])
    const svgSonra = satirlar(container).map((r) => r.querySelector('svg'))
    expect(svgSonra[1]).toBe(svgOnce[1])
    expect(svgSonra[3]).toBe(svgOnce[3])
    expect(satirlar(container)[0]!.querySelector('[data-durum]')!.getAttribute('data-durum')).toBe('tiz')
  })
})
