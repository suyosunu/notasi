import { describe, expect, it } from 'vitest'
import { samePitch, writtenKoma } from '../music/pitch'
import { NOTA_TOPICS } from './nota-topics'
import { ILK_SES_REHBER, NEY_PERDELER, visibleFingering } from './ney-perdeler'

describe('NEY_PERDELER', () => {
  it('ilk beş ses Nevâ, Çârgâh, Segâh, Dügâh, Rast', () => {
    expect(NEY_PERDELER.slice(0, 5).map((p) => p.id)).toEqual(['neva', 'cargah', 'segah', 'dugah', 'rast'])
  })

  it('sıra: ilk beş, Seviye 2 ara sesleri, ardından üçüncü kademe; Bûselik Rast’tan sonra gelir', () => {
    expect(NEY_PERDELER.map((p) => p.id)).toEqual([
      'neva', 'cargah', 'segah', 'dugah', 'rast',
      'buselik', 'kurdi', 'dik-kurdi', 'nim-hicaz', 'huseyni', 'acem', 'gerdaniye', 'muhayyer', 'kapali-neva', 'evic',
      'nim-sehnaz', 'nim-hisar',
      'tiz-segah', 'tiz-cargah', 'tiz-neva', 'kapali-gerdaniye', 'kapali-muhayyer', 'tiz-nim-hicaz',
    ])
    expect(NEY_PERDELER.map((p) => p.name)).toEqual([
      'Nevâ', 'Çârgâh', 'Segâh', 'Dügâh', 'Rast',
      'Bûselik', 'Kürdî', 'Dik Kürdî', 'Nim Hicaz', 'Hüseynî', 'Acem', 'Gerdâniye (açık)', 'Muhayyer (açık)', 'Nevâ (kapalı)', 'Eviç',
      'Nim Şehnaz', 'Nim Hisar',
      'Tiz Segâh', 'Tiz Çârgâh', 'Tiz Nevâ', 'Gerdâniye (kapalı)', 'Muhayyer (kapalı)', 'Tiz Nim Hicaz',
    ])
  })

  it("Seviye 2 ara sesleri Rast'tan sonra, üçüncü kademeden önce gelir", () => {
    const ids = NEY_PERDELER.map((p) => p.id)
    expect(ids.slice(5, 9)).toEqual(['buselik', 'kurdi', 'dik-kurdi', 'nim-hicaz'])
    expect(ids[9]).toBe('huseyni')
  })

  it("Bûselik Rast'tan sonra, perde-3 konusuyla açılır", () => {
    const ids = NEY_PERDELER.map((p) => p.id)
    expect(ids.indexOf('buselik')).toBeGreaterThan(ids.indexOf('rast'))
    const byId = Object.fromEntries(NEY_PERDELER.map((p) => [p.id, p]))
    expect(byId.buselik.notaTopicId).toBe('perde-3')
    expect(byId.segah.notaTopicId).toBe('nota-1')
    expect(byId.segah.tip).toBe(
      'Çârgâh duruşuna üstteki elin yüzük parmağını ekle: üstten ilk üç delik kapalı, dördüncü delik açık, alttaki elin orta parmağı kapalı.',
    )
    expect(byId.buselik.tip).toBe(
      'Segâh duruşunda üçüncü deliğin yarısını aç (üstteki elin yüzük parmağı yarım). Ses Segâh’tan bir koma tiz çıkar; yarım deliği kulağınla ayarla.',
    )
  })

  it('Irak ve Hicaz (58) listede yoktur', () => {
    const ids = NEY_PERDELER.map((p) => p.id as string)
    expect(ids).not.toContain('irak')
    expect(ids).not.toContain('hicaz')
    expect(NEY_PERDELER.some((p) => /Irak|^Hicaz/.test(p.name))).toBe(false)
  })

  it('yazılış ve bağlı nota konusu tabloya uyar', () => {
    const rows = NEY_PERDELER.map((p) => [p.id, p.written.step, p.written.octave, p.written.acc, p.notaTopicId])
    expect(rows).toEqual([
      ['neva', 'D', 5, 0, 'nota-1'],
      ['cargah', 'C', 5, 0, 'nota-1'],
      ['segah', 'B', 4, -1, 'nota-1'],
      ['dugah', 'A', 4, 0, 'nota-2'],
      ['rast', 'G', 4, 0, 'nota-2'],
      ['buselik', 'B', 4, 0, 'perde-3'],
      ['kurdi', 'B', 4, -5, 'perde-3'],
      ['dik-kurdi', 'B', 4, -4, 'perde-3'],
      ['nim-hicaz', 'C', 5, 4, 'perde-4'],
      ['huseyni', 'E', 5, 0, 'perde-2'],
      ['acem', 'F', 5, 0, 'perde-2'],
      ['gerdaniye', 'G', 5, 0, 'perde-2'],
      ['muhayyer', 'A', 5, 0, 'perde-2'],
      ['kapali-neva', 'D', 5, 0, 'perde-2'],
      ['evic', 'F', 5, 4, 'perde-4'],
      ['nim-sehnaz', 'G', 5, 4, 'perde-5'],
      ['nim-hisar', 'E', 5, -5, 'perde-5'],
      ['tiz-segah', 'B', 5, -1, 'perde-6'],
      ['tiz-cargah', 'C', 6, 0, 'perde-6'],
      ['tiz-neva', 'D', 6, 0, 'perde-6'],
      ['kapali-gerdaniye', 'G', 5, 0, 'perde-2'],
      ['kapali-muhayyer', 'A', 5, 0, 'perde-2'],
      ['tiz-nim-hicaz', 'C', 6, 4, 'perde-6'],
    ])
    const topicIds = NOTA_TOPICS.map((t) => t.id)
    for (const p of NEY_PERDELER) expect(topicIds).toContain(p.notaTopicId)
  })

  it('Seviye 3 perde sırası: ana sesler, kapalı Nevâ, ara sesler; Nevâ kapalı Nevâ’dan önce gelir', () => {
    const ids = NEY_PERDELER.filter((p) => p.kademe === 3).map((p) => p.id)
    expect(ids).toEqual(['huseyni', 'acem', 'gerdaniye', 'muhayyer', 'kapali-neva', 'evic', 'nim-sehnaz', 'nim-hisar'])
    const hepsi = NEY_PERDELER.map((p) => p.id)
    expect(hepsi.indexOf('neva')).toBeLessThan(hepsi.indexOf('kapali-neva'))
  })

  it('yeni perdelerin şeması ve yazımı tabloya birebir uyar', () => {
    const K = 'kapali'
    const A = 'acik'
    const Y = 'yarim'
    const byId = Object.fromEntries(NEY_PERDELER.map((p) => [p.id, p]))
    const SRC = 'https://www.neyzenim.com/neydersleri_6.html'
    const want = {
      'kapali-neva': { name: 'Nevâ (kapalı)', written: { step: 'D', octave: 5, acc: 0 }, front: [K, K, K, K, K, K], topic: 'perde-2' },
      'nim-sehnaz': { name: 'Nim Şehnaz', written: { step: 'G', octave: 5, acc: 4 }, front: [K, A, A, A, K, A], topic: 'perde-5' },
      'nim-hisar': { name: 'Nim Hisar', written: { step: 'E', octave: 5, acc: -5 }, front: [K, K, K, K, K, Y], topic: 'perde-5' },
    }
    for (const [id, w] of Object.entries(want)) {
      const p = byId[id]!
      expect(p.name, id).toBe(w.name)
      expect(p.kademe, id).toBe(3)
      expect(p.written, id).toEqual(w.written)
      expect(p.fingering, id).toEqual({ thumb: 'kapali', front: w.front })
      expect(p.verified, id).toBe(true)
      expect(p.source, id).toBe(SRC)
      expect(p.notaTopicId, id).toBe(w.topic)
    }
  })

  it('aynı parmak, 31 koma: 2. kademe sesi ve eşi', () => {
    const byId = Object.fromEntries(NEY_PERDELER.map((p) => [p.id, p]))
    const ciftler: [string, string][] = [
      ['dugah', 'huseyni'],
      ['rast', 'kapali-neva'],
      ['cargah', 'gerdaniye'],
      ['neva', 'muhayyer'],
      ['segah', 'evic'],
      ['nim-hicaz', 'nim-sehnaz'],
    ]
    for (const [pest, tiz] of ciftler) {
      expect(byId[tiz]!.fingering, tiz).toEqual(byId[pest]!.fingering)
      expect(writtenKoma(byId[tiz]!.written) - writtenKoma(byId[pest]!.written), tiz).toBe(31)
    }
  })

  it('Nim Hisar: Dügâh şemasının son deliği yarım; ipucu 3/4 ve baş çevirmeyi söyler', () => {
    const byId = Object.fromEntries(NEY_PERDELER.map((p) => [p.id, p]))
    const dugah = byId.dugah.fingering!
    expect(byId['nim-hisar'].fingering).toEqual({ thumb: dugah.thumb, front: [...dugah.front.slice(0, 5), 'yarim'] })
    expect(byId['nim-hisar'].tip).toContain('3/4')
    expect(byId['nim-hisar'].tip).toContain('sola')
  })

  it('kapalı Nevâ ipucu Rast parmağını ve nefesi anar, Nim Şehnaz Nim Hicaz parmağını', () => {
    const byId = Object.fromEntries(NEY_PERDELER.map((p) => [p.id, p]))
    expect(byId['kapali-neva'].tip).toContain('Rast')
    expect(byId['kapali-neva'].tip).toContain('nefesini güçlendirirsin')
    expect(byId['nim-sehnaz'].tip).toContain('Nim Hicaz')
  })

  it('yazılı perdeyle arama Nevâ’yı bulur, kapalı Nevâ’yı değil', () => {
    const neva = NEY_PERDELER.find((p) => p.id === 'neva')!
    expect(NEY_PERDELER.find((p) => samePitch(p.written, neva.written))!.id).toBe('neva')
  })

  it('her doğrulanmış perdenin kaynağı ve şeması doludur', () => {
    for (const p of NEY_PERDELER.filter((x) => x.verified)) {
      expect(p.source, p.id).toBeTruthy()
      expect(p.source, p.id).toMatch(/^https:\/\/\S+$/)
      expect(p.fingering, p.id).not.toBeNull()
      expect(p.fingering!.front, p.id).toHaveLength(6)
    }
  })

  it('her perdenin Türkçe kısa tarifi vardır', () => {
    for (const p of NEY_PERDELER) expect(p.tip.trim().length, p.id).toBeGreaterThan(0)
  })

  it('Rast tüm delikler kapalı, Dügâh yalnız en alt delik açık', () => {
    const byId = Object.fromEntries(NEY_PERDELER.map((p) => [p.id, p]))
    expect(byId.rast.fingering).toEqual({ thumb: 'kapali', front: ['kapali', 'kapali', 'kapali', 'kapali', 'kapali', 'kapali'] })
    expect(byId.dugah.fingering).toEqual({ thumb: 'kapali', front: ['kapali', 'kapali', 'kapali', 'kapali', 'kapali', 'acik'] })
  })

  it('yeni perdelerin şemaları araştırma §4 ile birebir aynıdır', () => {
    const K = 'kapali'
    const A = 'acik'
    const want: Record<string, string[]> = {
      segah: [K, K, K, A, K, A],
      huseyni: [K, K, K, K, K, A],
      acem: [K, K, K, K, A, A],
      evic: [K, K, K, A, K, A],
      kurdi: [K, K, K, K, A, A],
      'dik-kurdi': [K, K, K, K, A, A],
      'nim-hicaz': [K, A, A, A, K, A],
      gerdaniye: [K, K, A, A, K, A],
      muhayyer: [A, K, A, A, K, A],
    }
    for (const [id, front] of Object.entries(want)) {
      const p = NEY_PERDELER.find((x) => x.id === id)!
      expect(p.fingering, id).toEqual({ thumb: 'kapali', front })
      expect(p.verified, id).toBe(true)
    }
  })

  it('yeni perdelerin her biri tek https neyzenim kaynağına dayanır', () => {
    const src = Object.fromEntries(NEY_PERDELER.map((p) => [p.id, p.source]))
    expect(src.segah).toBe('https://www.neyzenim.com/neydersleri_2.html')
    expect(src.kurdi).toBe('https://www.neyzenim.com/neydersleri_5.html')
    expect(src['nim-hicaz']).toBe('https://www.neyzenim.com/neydersleri_5.html')
    expect(src['dik-kurdi']).toBe('https://www.neyzenim.com/neydersleri_10.html')
    for (const id of ['huseyni', 'acem', 'evic', 'gerdaniye', 'muhayyer']) {
      expect(src[id], id).toBe('https://www.neyzenim.com/neydersleri_6.html')
    }
  })

  it('kademe: ilk beşi ve ikinci kademe perdeleri 2, Hüseynî/Acem/Eviç/Gerdâniye/Muhayyer ve yeni üç perde 3', () => {
    const kademe = Object.fromEntries(NEY_PERDELER.map((p) => [p.id, p.kademe]))
    for (const id of ['neva', 'cargah', 'buselik', 'dugah', 'rast', 'segah', 'kurdi', 'dik-kurdi', 'nim-hicaz']) {
      expect(kademe[id], id).toBe(2)
    }
    for (const id of ['huseyni', 'acem', 'evic', 'gerdaniye', 'muhayyer', 'kapali-neva', 'nim-sehnaz', 'nim-hisar']) {
      expect(kademe[id], id).toBe(3)
    }
  })

  it('4. kademe: altı tiz ve kapalı perde, sırası tabloyla aynı', () => {
    expect(NEY_PERDELER.filter((p) => p.kademe === 4).map((p) => p.id)).toEqual([
      'tiz-segah', 'tiz-cargah', 'tiz-neva', 'kapali-gerdaniye', 'kapali-muhayyer', 'tiz-nim-hicaz',
    ])
    expect(NEY_PERDELER.slice(-6).every((p) => p.kademe === 4)).toBe(true)
  })

  it('4. kademe şemaları araştırma D §1 ile birebir aynıdır; hepsi doğrulanmış, neyzenim _8 ya da _9 kaynaklı', () => {
    const K = 'kapali'
    const A = 'acik'
    const want: Record<string, string[]> = {
      'tiz-segah': [K, K, K, A, K, A],
      'tiz-cargah': [K, K, A, A, K, A],
      'tiz-neva': [A, K, A, A, K, A],
      'kapali-gerdaniye': [K, K, K, K, K, K],
      'kapali-muhayyer': [K, K, K, K, K, A],
      'tiz-nim-hicaz': [K, A, A, A, K, A],
    }
    for (const [id, front] of Object.entries(want)) {
      const p = NEY_PERDELER.find((x) => x.id === id)!
      expect(p.fingering, id).toEqual({ thumb: 'kapali', front })
      expect(p.verified, id).toBe(true)
      expect(p.source, id).toMatch(/^https:\/\/www\.neyzenim\.com\/neydersleri_[89]\.html$/)
    }
  })

  it('tiz perdeler aynı parmaklı alt oktav eşiyle aynı şemadadır ve tam bir oktav (53 koma) yüksektir', () => {
    const byId = Object.fromEntries(NEY_PERDELER.map((p) => [p.id, p]))
    const ciftler = [
      ['segah', 'tiz-segah'],
      ['cargah', 'tiz-cargah'],
      ['neva', 'tiz-neva'],
      ['rast', 'kapali-gerdaniye'],
      ['dugah', 'kapali-muhayyer'],
      ['nim-hicaz', 'tiz-nim-hicaz'],
    ] as const
    for (const [alt, ust] of ciftler) {
      expect(byId[ust]!.fingering, ust).toEqual(byId[alt]!.fingering)
    }
    // Yazılı perde farkı: yalnız parmağı aynı olan çiftlerde oktav (53 koma); kapalı Gerdâniye/Muhayyer
    // 3. kademedeki açık eşleriyle aynı yazılı perdedir.
    for (const [alt, ust] of [['segah', 'tiz-segah'], ['cargah', 'tiz-cargah'], ['neva', 'tiz-neva'], ['nim-hicaz', 'tiz-nim-hicaz']] as const) {
      expect(writtenKoma(byId[ust]!.written) - writtenKoma(byId[alt]!.written), ust).toBe(53)
    }
    expect(writtenKoma(byId['kapali-gerdaniye']!.written) - writtenKoma(byId.rast!.written)).toBe(53)
    expect(writtenKoma(byId['kapali-muhayyer']!.written) - writtenKoma(byId.dugah!.written)).toBe(53)
  })

  it('yazılı perdeye göre arama G5 için açık Gerdâniye, A5 için açık Muhayyer verir (açık olanlar önce)', () => {
    expect(NEY_PERDELER.find((p) => samePitch(p.written, { step: 'G', octave: 5, acc: 0 }))!.id).toBe('gerdaniye')
    expect(NEY_PERDELER.find((p) => samePitch(p.written, { step: 'A', octave: 5, acc: 0 }))!.id).toBe('muhayyer')
  })

  it('tiz perde tarifleri: dudak büzülür, ana ses parmağı bir oktav yukarıda; kapalı olanlar nefes şiddeti söylemez', () => {
    const byId = Object.fromEntries(NEY_PERDELER.map((p) => [p.id, p]))
    const aile: Record<string, string> = {
      'tiz-segah': 'Segâh', 'tiz-cargah': 'Çârgâh', 'tiz-neva': 'Nevâ', 'tiz-nim-hicaz': 'Nim Hicaz',
      'kapali-gerdaniye': 'Rast', 'kapali-muhayyer': 'Dügâh',
    }
    for (const [id, ad] of Object.entries(aile)) {
      expect(byId[id]!.tip, id).toContain(`${ad} parmağıyla, bir oktav yukarıda`)
    }
    for (const id of ['tiz-segah', 'tiz-cargah', 'tiz-neva', 'tiz-nim-hicaz']) {
      expect(byId[id]!.tip, id).toContain('Daha da sert üfle; dudak biraz daha büzülür')
    }
    for (const id of ['kapali-gerdaniye', 'kapali-muhayyer']) {
      expect(byId[id]!.tip, id).not.toContain('sert')
      expect(byId[id]!.tip, id).toContain('Kaynak nefes şiddetini yazmıyor')
    }
  })

  it('3. kademe tarifi "Daha sert üfle: " ile ve parmak ailesiyle başlar', () => {
    const family: Record<string, string> = {
      huseyni: 'Dügâh', acem: 'Kürdî', evic: 'Segâh', gerdaniye: 'Çârgâh', muhayyer: 'Nevâ',
      'kapali-neva': 'Rast', 'nim-sehnaz': 'Nim Hicaz', 'nim-hisar': 'Dügâh',
    }
    for (const [id, name] of Object.entries(family)) {
      const p = NEY_PERDELER.find((x) => x.id === id)!
      expect(p.tip.startsWith('Daha sert üfle: '), id).toBe(true)
      expect(p.tip, id).toContain(`${name} parmağı`)
    }
    for (const p of NEY_PERDELER.filter((x) => x.kademe === 2)) expect(p.tip.startsWith('Daha sert üfle'), p.id).toBe(false)
  })

  it('ortak şemalı Kürdî ve Dik Kürdî tarifinde birbirine gönderme notu bulunur', () => {
    const byId = Object.fromEntries(NEY_PERDELER.map((p) => [p.id, p]))
    expect(byId.kurdi.tip).toContain(
      'Parmak konumu Dik Kürdî ile aynı; aradaki koma farkını dudak ve baş açısıyla verirsin.',
    )
    expect(byId['dik-kurdi'].tip).toContain(
      'Parmak konumu Kürdî ile aynı; aradaki koma farkını dudak ve baş açısıyla verirsin.',
    )
    expect(byId.kurdi.fingering).toEqual(byId['dik-kurdi'].fingering)
  })

  it('Nim Hicaz tarifi kapalı başparmağı anar', () => {
    expect(NEY_PERDELER.find((p) => p.id === 'nim-hicaz')!.tip.toLowerCase()).toContain('başparmak arkada kapalı')
  })

  it('listedeki her perdenin şeması gösterilebilir (doğrulanmış)', () => {
    for (const p of NEY_PERDELER) expect(visibleFingering(p), p.id).not.toBeNull()
  })
})

describe('visibleFingering', () => {
  it('doğrulanmamış perdede null döner', () => {
    for (const p of NEY_PERDELER) expect(visibleFingering({ ...p, verified: false })).toBeNull()
  })

  it('doğrulanmış perdede şemayı döner', () => {
    for (const p of NEY_PERDELER) {
      expect(visibleFingering({ ...p, verified: true, source: 'x' })).toBe(p.fingering)
    }
  })
})

describe('ILK_SES_REHBER', () => {
  it('3–5 kısa Türkçe madde içerir', () => {
    expect(ILK_SES_REHBER.length).toBeGreaterThanOrEqual(3)
    expect(ILK_SES_REHBER.length).toBeLessThanOrEqual(5)
    for (const m of ILK_SES_REHBER) {
      expect(m.trim().length).toBeGreaterThan(0)
      expect(m.length).toBeLessThanOrEqual(120)
    }
  })
})
