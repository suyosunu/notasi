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
  it('Rast, Nevâ, Uşşak, Bayâtî, Hüseynî, Muhayyer, Kürdî, Hicaz sırasıyla', () => {
    expect(MAKAMLAR.map((m) => m.id)).toEqual(['rast', 'neva', 'ussak', 'bayati', 'huseyni', 'muhayyer', 'kurdi', 'hicaz'])
    expect(MAKAMLAR.map((m) => m.name)).toEqual(['Rast', 'Nevâ', 'Uşşak', 'Bayâtî', 'Hüseynî', 'Muhayyer', 'Kürdî', 'Hicaz'])
  })

  it('her makamın yapı satırı vardır; Rast, Uşşak ve Hicaz için TDV ile aynıdır', () => {
    expect(makam('rast').yapi).toBe("Rast'ta Rast beşlisi + Nevâ'da Rast dörtlüsü")
    expect(makam('ussak').yapi).toBe("Dügâh'ta Uşşak dörtlüsü + Nevâ'da Bûselik beşlisi")
    expect(makam('hicaz').yapi).toBe("Dügâh'ta Hicaz dörtlüsü + Nevâ'da Rast beşlisi")
    for (const m of MAKAMLAR) expect(m.yapi, m.id).toBeTruthy()
  })

  it('Bayâtî: Uşşak ile aynı dizi ve donanım; durak Dügâh, güçlü Nevâ, yeden Rast', () => {
    const m = makam('bayati')
    expect([m.durak, m.guclu, m.yeden]).toEqual(['Dügâh', 'Nevâ', 'Rast'])
    expect(m.dizi).toEqual(makam('ussak').dizi)
    expect(m.donanim).toEqual([{ step: 'B', octave: 4, acc: -1 }])
    expect(m.inis).toBeUndefined()
    expect(m.yapi).toBe("Dügâh'ta Uşşak dörtlüsü + Nevâ'da Bûselik beşlisi")
  })

  it('Hüseynî: durak Dügâh, güçlü Hüseynî, yeden Rast; donanım Si koma bemolü + Fa bakiye diyezi', () => {
    const m = makam('huseyni')
    expect([m.durak, m.guclu, m.yeden]).toEqual(['Dügâh', 'Hüseynî', 'Rast'])
    expect(m.donanim.map((p) => [p.step, p.acc])).toEqual([
      ['B', -1],
      ['F', 4],
    ])
    expect(komalar(m.dizi)).toEqual([40, 48, 53, 62, 71, 79, 84, 93])
    expect(m.yapi).toBe("Dügâh'ta Hüseynî beşlisi + Hüseynî'de Uşşak dörtlüsü")
  })

  it('Muhayyer: Hüseynî ile aynı dizi, iniş ve donanım; güçlü Muhayyer', () => {
    const m = makam('muhayyer')
    expect([m.durak, m.guclu, m.yeden]).toEqual(['Dügâh', 'Muhayyer', 'Rast'])
    expect(m.dizi).toEqual(makam('huseyni').dizi)
    expect(m.inis).toEqual(makam('huseyni').inis)
    expect(m.donanim).toEqual(makam('huseyni').donanim)
    expect(m.yapi).toBe(makam('huseyni').yapi)
  })

  it('Hüseynî ve Muhayyer: inişin 6. sesi Acem (F5 doğal), geri kalanı dizi ile aynı', () => {
    for (const id of ['huseyni', 'muhayyer']) {
      const m = makam(id)
      expect(m.inis, id).toBeDefined()
      expect(m.inis![5], id).toEqual({ step: 'F', octave: 5, acc: 0 })
      expect(m.dizi[5], id).toEqual({ step: 'F', octave: 5, acc: 4 })
      expect(m.inis!.filter((_, i) => i !== 5)).toEqual(m.dizi.filter((_, i) => i !== 5))
    }
  })

  it('Kürdî: Kürdî perdesi B4b5 ile; durak Dügâh, güçlü Nevâ, yeden Rast; donanım yalnız B4b5', () => {
    const m = makam('kurdi')
    expect([m.durak, m.guclu, m.yeden]).toEqual(['Dügâh', 'Nevâ', 'Rast'])
    expect(m.dizi.map((p) => `${p.step}${p.octave}:${p.acc}`)).toEqual([
      'A4:0',
      'B4:-5',
      'C5:0',
      'D5:0',
      'E5:0',
      'F5:0',
      'G5:0',
      'A5:0',
    ])
    expect(m.donanim).toEqual([{ step: 'B', octave: 4, acc: -5 }])
    expect(m.yapi).toBe("Dügâh'ta Kürdî dörtlüsü + Nevâ'da Bûselik beşlisi")
  })

  it("Uşşak ile Bayâtî'nin; Hüseynî, Muhayyer ve Nevâ'nın dizileri aynı; Rast, Kürdî ve Hicaz dizisi tektir", () => {
    const anahtar = (id: string) => komalar(makam(id).dizi).join()
    expect(anahtar('bayati')).toBe(anahtar('ussak'))
    expect(anahtar('huseyni')).toBe(anahtar('neva'))
    expect(anahtar('muhayyer')).toBe(anahtar('neva'))
    expect(anahtar('ussak')).not.toBe(anahtar('neva'))
    for (const id of ['rast', 'kurdi', 'hicaz']) {
      expect(MAKAMLAR.filter((m) => komalar(m.dizi).join() === anahtar(id)).map((m) => m.id)).toEqual([id])
    }
  })

  it('yalnız Rast, Hüseynî ve Muhayyer iniş dizisi tanımlar', () => {
    expect(MAKAMLAR.filter((m) => m.inis !== undefined).map((m) => m.id)).toEqual(['rast', 'huseyni', 'muhayyer'])
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
  it('makam bölümüne aittir; durak ve güçlü kartları her makama, dizi kartı yalnız dizisi tek olan makamlara üretilir', () => {
    expect(MAKAM_TOPICS.every((t) => t.section === 'makam')).toBe(true)
    const topic = (id: string) => MAKAM_TOPICS.find((t) => t.id === id)!
    expect(topic('makam-dizi').cards).toEqual(['makam-dizi:rast', 'makam-dizi:kurdi', 'makam-dizi:hicaz'])
    expect(topic('makam-durak').cards).toEqual(MAKAMLAR.map((m) => `makam-durak:${m.id}`))
    expect(topic('makam-guclu').cards).toEqual(MAKAMLAR.map((m) => `makam-guclu:${m.id}`))
    expect(MAKAM_TOPICS.flatMap((t) => t.cards)).toHaveLength(3 + 8 + 8)
  })
})
