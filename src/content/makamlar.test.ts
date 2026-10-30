import { describe, expect, it } from 'vitest'
import { writtenKoma } from '../music/pitch'
import type { WrittenPitch } from '../music/pitch'
import { MAKAMLAR } from './makamlar'
import { MAKAM_TOPICS } from './makam-topics'

const komalar = (dizi: WrittenPitch[]) => dizi.map(writtenKoma)

function makam(id: string) {
  return MAKAMLAR.find((m) => m.id === id)!
}

describe('MAKAMLAR (araştırma §2)', () => {
  it('Rast, Nevâ, Uşşak, Hicaz sırasıyla', () => {
    expect(MAKAMLAR.map((m) => m.id)).toEqual(['rast', 'neva', 'ussak', 'hicaz'])
    expect(MAKAMLAR.map((m) => m.name)).toEqual(['Rast', 'Nevâ', 'Uşşak', 'Hicaz'])
  })

  it("Rast'ın yapı satırı Rast beşlisi ve Nevâ'da Rast dörtlüsünü söyler; Uşşak ve Hicaz'da yoktur", () => {
    expect(makam('rast').yapi).toBe("Rast'ta Rast beşlisi + Nevâ'da Rast dörtlüsü")
    expect(makam('ussak').yapi).toBeUndefined()
    expect(makam('hicaz').yapi).toBeUndefined()
  })

  it('Rast: durak Rast, güçlü Nevâ, yeden Irak; donanım Si koma bemolü + Fa bakiye diyezi', () => {
    const m = makam('rast')
    expect([m.durak, m.guclu, m.yeden]).toEqual(['Rast', 'Nevâ', 'Irak'])
    expect(m.donanim.map((p) => [p.step, p.acc])).toEqual([
      ['B', -1],
      ['F', 4],
    ])
    // Rast, Dügâh, Segâh, Çârgâh, Nevâ, Hüseynî, Eviç, Gerdâniye; Do4 = 0 koma konumları.
    expect(komalar(m.dizi)).toEqual([31, 40, 48, 53, 62, 71, 79, 84])
  })

  it('Nevâ makamı: durak Dügâh, güçlü Nevâ, yeden Rast; donanım Si koma bemolü + Fa bakiye diyezi', () => {
    const m = makam('neva')
    expect([m.durak, m.guclu, m.yeden]).toEqual(['Dügâh', 'Nevâ', 'Rast'])
    expect(m.donanim.map((p) => [p.step, p.acc])).toEqual([
      ['B', -1],
      ['F', 4],
    ])
    // Dügâh, Segâh, Çârgâh, Nevâ, Hüseynî, Eviç, Gerdâniye, Muhayyer.
    expect(komalar(m.dizi)).toEqual([40, 48, 53, 62, 71, 79, 84, 93])
    expect(m.inis).toBeUndefined()
    expect(m.yapi).toBe("Dügâh'ta Uşşak dörtlüsü + Nevâ'da Rast beşlisi")
  })

  it("Nevâ ile Uşşak'ın dizileri yalnız 6. seste ayrılır: Nevâ'da Eviç, Uşşak'ta Acem", () => {
    const neva = makam('neva').dizi
    const ussak = makam('ussak').dizi
    const farkli = neva.map((_, i) => i).filter((i) => writtenKoma(neva[i]!) !== writtenKoma(ussak[i]!))
    expect(farkli).toEqual([5])
    expect(neva[5]).toEqual({ step: 'F', octave: 5, acc: 4 })
    expect(ussak[5]).toEqual({ step: 'F', octave: 5, acc: 0 })
  })

  it('Uşşak: durak Dügâh, güçlü Nevâ, yeden Rast; donanım yalnızca Si koma bemolü', () => {
    const m = makam('ussak')
    expect([m.durak, m.guclu, m.yeden]).toEqual(['Dügâh', 'Nevâ', 'Rast'])
    expect(m.donanim.map((p) => [p.step, p.acc])).toEqual([['B', -1]])
    expect(komalar(m.dizi)).toEqual([40, 48, 53, 62, 71, 75, 84, 93])
  })

  it('Hicaz: durak Dügâh, güçlü Nevâ, yeden Rast; Si bakiye bemolü, Fa ve Do bakiye diyezi', () => {
    const m = makam('hicaz')
    expect([m.durak, m.guclu, m.yeden]).toEqual(['Dügâh', 'Nevâ', 'Rast'])
    expect(m.donanim.map((p) => [p.step, p.acc])).toEqual([
      ['B', -4],
      ['F', 4],
      ['C', 4],
    ])
    expect(komalar(m.dizi)).toEqual([40, 45, 57, 62, 71, 79, 84, 93])
  })

  it('her makamın seyir metni vardır', () => {
    for (const m of MAKAMLAR) expect(m.seyir.length).toBeGreaterThan(40)
  })
})

describe('MAKAM_TOPICS', () => {
  it('makam bölümüne aittir ve her makam için üç kart türü içerir', () => {
    expect(MAKAM_TOPICS.every((t) => t.section === 'makam')).toBe(true)
    const cards = MAKAM_TOPICS.flatMap((t) => t.cards)
    expect(cards).toHaveLength(12)
    for (const id of ['rast', 'neva', 'ussak', 'hicaz']) {
      for (const kind of ['dizi', 'durak', 'guclu']) expect(cards).toContain(`makam-${kind}:${id}`)
    }
  })
})
