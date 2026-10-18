import { describe, expect, it } from 'vitest'
import { MAKAMLAR } from '../content/makamlar'
import { cikisInisEvents, diziEvents } from './makam'

describe('makam olayları', () => {
  it('diziEvents: her perde için bir nota, verilen sürede', () => {
    const rast = MAKAMLAR[0]!
    const ev = diziEvents(rast.dizi, 'quarter')
    expect(ev).toHaveLength(8)
    expect(ev.every((e) => e.kind === 'note' && e.dur === 'quarter')).toBe(true)
  })

  it('cikisInisEvents: çıkış sonra iniş, tepe nota tekrarlanmaz, sekizliklerle', () => {
    for (const m of MAKAMLAR) {
      const ev = cikisInisEvents(m.dizi)
      expect(ev).toHaveLength(2 * m.dizi.length - 1)
      expect(ev.every((e) => e.kind === 'note' && e.dur === 'eighth')).toBe(true)
      const pitches = ev.map((e) => (e.kind === 'note' ? e.pitch : null))
      const top = m.dizi.length - 1
      expect(pitches[top]).toEqual(m.dizi[top])
      expect(pitches[top + 1]).toEqual(m.dizi[top - 1])
      expect(pitches[pitches.length - 1]).toEqual(m.dizi[0])
    }
  })
})
