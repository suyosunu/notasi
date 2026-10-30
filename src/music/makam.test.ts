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

  it('Rast: inişte Eviç yerine Acem (F5 doğal) kullanılır, çıkışta Eviç kalır', () => {
    const rast = MAKAMLAR.find((m) => m.id === 'rast')!
    const ev = cikisInisEvents(rast.dizi, rast.inis)
    const pitches = ev.map((e) => (e.kind === 'note' ? e.pitch : null))
    expect(pitches[6]).toEqual({ step: 'F', octave: 5, acc: 4 }) // çıkışta Eviç
    expect(pitches[8]).toEqual({ step: 'F', octave: 5, acc: 0 }) // inişte Acem
    expect(pitches).toHaveLength(15)
    expect(pitches[14]).toEqual(rast.dizi[0])
  })

  it('inis verilmezse iniş dizinin tersidir; yalnızca Rast, Hüseynî ve Muhayyer inis tanımlar', () => {
    for (const m of MAKAMLAR) expect(m.inis !== undefined).toBe(['rast', 'huseyni', 'muhayyer'].includes(m.id))
    const ussak = MAKAMLAR.find((m) => m.id === 'ussak')!
    expect(cikisInisEvents(ussak.dizi, undefined)).toEqual(cikisInisEvents(ussak.dizi))
  })
})
