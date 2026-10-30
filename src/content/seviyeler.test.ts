import { describe, expect, it } from 'vitest'
import { rotaBilinir } from '../app'
import { dersById } from './dersler'
import { ETUTLER } from './etutler'
import { MAKAMLAR } from './makamlar'
import { NEY_PERDELER } from './ney-perdeler'
import { NOTA_TOPICS } from './nota-topics'
import { PARCALAR } from './parcalar'
import { ONERILEN_SEVIYE, SEVIYELER } from './seviyeler'
import { USULLER } from './usuller'

const hedefler = SEVIYELER.flatMap((s) => s.hedefler)

describe('SEVIYELER', () => {
  it('sekiz seviye (0–7), sırayla numaralı; ad, süre ve özet dolu', () => {
    expect(SEVIYELER.map((s) => s.no)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
    for (const s of SEVIYELER) {
      expect(s.ad).not.toBe('')
      expect(s.sure).not.toBe('')
      expect(s.ozet).not.toBe('')
    }
    expect(SEVIYELER[0]).toMatchObject({ ad: 'Hazırlık', sure: '1–3 hafta' })
    expect(SEVIYELER[1]).toMatchObject({ ad: 'İlk beş ses', sure: '3–10. hafta' })
  })

  it('seviye 4–7 henüz hedefsizdir', () => {
    for (const s of SEVIYELER.slice(4)) expect(s.hedefler).toEqual([])
    expect(SEVIYELER[0]!.hedefler).toHaveLength(7)
    expect(SEVIYELER[1]!.hedefler).toHaveLength(10)
  })

  it("Seviye 2'nin hedefleri tanımlı ve kimlikleri tekil", () => {
    const s2 = SEVIYELER[2]!
    expect(s2.hedefler.map((h) => h.id)).toEqual([
      's2-nota',
      's2-ropriz',
      's2-buselik-8',
      's2-kurdi-8',
      's2-dik-kurdi-8',
      's2-nim-hicaz-8',
      's2-vur-nim-sofyan',
      's2-vur-semai',
      's2-vur-sofyan',
      's2-usul-etut',
      's2-dortlu',
      's2-dil',
      's2-ezgi',
    ])
    const ids = hedefler.map((h) => h.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(s2.ozet).toBe(
      'Koma işaretleri, onaltılık ve üçleme; Bûselik, Kürdî, Dik Kürdî, Nim Hicaz; Nim Sofyan, Semâî ve Sofyan usulleri; Çârgâh, Kürdî ve Hicaz dörtlüleri.',
    )
  })

  it('Seviye 2 hedeflerinin ölçütleri, metinleri ve rotaları kararlaştırıldığı gibi', () => {
    const h = (id: string) => hedefler.find((x) => x.id === id)!
    expect(h('s2-nota').olcut).toEqual({ tur: 'konular', topicIds: ['koma-1', 'koma-2', 'perde-3', 'perde-4', 'sure-4'] })
    expect(h('s2-nota').rota).toBe('/nota')
    expect(h('s2-ropriz').olcut).toEqual({ tur: 'ders', dersId: 'okuma:ropriz' })
    for (const [id, ad] of [
      ['buselik', 'Bûselik'],
      ['kurdi', 'Kürdî'],
      ['dik-kurdi', 'Dik Kürdî'],
      ['nim-hicaz', 'Nim Hicaz'],
    ] as const) {
      expect(h(`s2-${id}-8`).olcut).toEqual({ tur: 'uzun-ses', perdeId: id, ms: 8000, cent: 20 })
      expect(h(`s2-${id}-8`).rota).toBe(`/ney/${id}`)
      expect(h(`s2-${id}-8`).metin).toContain(ad)
    }
    for (const [id, ad] of [
      ['nim-sofyan', 'Nim Sofyan'],
      ['semai', 'Semâî'],
      ['sofyan', 'Sofyan'],
    ] as const) {
      expect(h(`s2-vur-${id}`).olcut).toEqual({ tur: 'usul-vurma', usulId: id })
      expect(h(`s2-vur-${id}`).metin).toBe(`${ad} usulünü vurdum`)
      expect(h(`s2-vur-${id}`).rota).toBe(`/usul/vur/${id}`)
    }
    expect(h('s2-usul-etut')).toMatchObject({
      metin: 'Üç usulde birer etüt',
      olcut: { tur: 'etutler', etutIds: ['usul-nim-sofyan', 'usul-semai', 'usul-sofyan'] },
    })
    expect(h('s2-dortlu')).toMatchObject({
      metin: 'Çârgâh, Kürdî ve Hicaz dörtlüleri',
      olcut: { tur: 'etutler', etutIds: ['dortlu-cargah', 'dortlu-kurdi', 'dortlu-hicaz'] },
    })
    expect(h('s2-dil')).toMatchObject({ metin: 'Dil ve bağ etüdü', olcut: { tur: 'etutler', etutIds: ['dil-1'] } })
    expect(h('s2-ezgi')).toMatchObject({
      metin: 'Bir ezgiyi ezbere çaldım (Benim Adım Dertli Dolap)',
      olcut: { tur: 'onay' },
      rota: '/parcalar/benim-adim-dertli-dolap',
    })
  })

  it('s1-olcu Seviye 1 sonunda ölçü dersine bağlı', () => {
    const s1 = SEVIYELER[1]!.hedefler
    expect(s1[s1.length - 1]).toEqual({
      id: 's1-olcu',
      metin: 'Ölçü, ölçü çizgisi ve nefes işareti dersini okudum',
      olcut: { tur: 'ders', dersId: 'okuma:olcu' },
      rota: '/ders/okuma%3Aolcu',
    })
  })

  it('her usul-vurma ölçütü var olan bir usula işaret eder', () => {
    for (const h of hedefler) {
      if (h.olcut.tur === 'usul-vurma') {
        const { usulId } = h.olcut
        expect(USULLER.some((u) => u.id === usulId), h.id).toBe(true)
      }
    }
  })

  it('hedef kimlikleri benzersiz', () => {
    const ids = hedefler.map((h) => h.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('ders ölçütleri var olan derslere bağlı', () => {
    for (const h of hedefler) if (h.olcut.tur === 'ders') expect(dersById(h.olcut.dersId), h.id).toBeTruthy()
  })

  it('konular ve etütler var olan kayıtlara bağlı', () => {
    for (const h of hedefler) {
      if (h.olcut.tur === 'konular') {
        expect(h.olcut.topicIds.length).toBeGreaterThan(0)
        for (const id of h.olcut.topicIds) expect(NOTA_TOPICS.some((t) => t.id === id), `${h.id}:${id}`).toBe(true)
      }
      if (h.olcut.tur === 'etutler') {
        expect(h.olcut.etutIds.length).toBeGreaterThan(0)
        for (const id of h.olcut.etutIds) expect(ETUTLER.some((e) => e.id === id), `${h.id}:${id}`).toBe(true)
      }
    }
  })

  it('uzun ses ölçütleri var olan perdelere bağlı; rotalar çözülür', () => {
    for (const h of hedefler) {
      if (h.olcut.tur === 'uzun-ses') {
        const { perdeId } = h.olcut
        expect(NEY_PERDELER.some((p) => p.id === perdeId), h.id).toBe(true)
      }
      if (h.rota) expect(rotaBilinir(h.rota), `${h.id} → ${h.rota}`).toBe(true)
    }
  })

  it('s1-etut-iki yalnız tek ve iki perde etütlerini sayar', () => {
    const o = hedefler.find((x) => x.id === 's1-etut-iki')!.olcut
    if (o.tur !== 'etutler') throw new Error('etütler ölçütü bekleniyordu')
    expect(o.etutIds).toHaveLength(9)
    for (const id of o.etutIds) expect(['tek', 'iki'], id).toContain(ETUTLER.find((e) => e.id === id)!.tur)
    for (const id of ['rast-besli-1', 'usul-nim-sofyan', 'dortlu-cargah', 'dil-1']) expect(o.etutIds).not.toContain(id)
  })

  it('seviye 0 ve 1 hedefleri kararlaştırılan sayılarla', () => {
    const h = (id: string) => hedefler.find((x) => x.id === id)!
    expect(h('s0-neva-5').olcut).toEqual({ tur: 'uzun-ses', perdeId: 'neva', ms: 5000, cent: 20 })
    expect(h('s0-nefes').rota).toBe('/hazirlik/nefes')
    expect(h('s0-baspare').olcut).toEqual({ tur: 'baspare' })
    expect(h('s0-tani').rota).toBe('/ders/s0%3Aneyi-tani')
    expect(h('s0-durus').rota).toBe('/ders/s0%3Adurus')
    expect(h('s0-ayna').rota).toBe('/ders/s0%3Adurus')
    for (const p of ['neva', 'cargah', 'segah', 'dugah', 'rast']) {
      expect(h(`s1-${p}-8`).olcut).toEqual({ tur: 'uzun-ses', perdeId: p, ms: 8000, cent: 20 })
      expect(h(`s1-${p}-8`).rota).toBe(`/ney/${p}`)
    }
    expect(h('s1-nota').olcut).toMatchObject({ tur: 'konular' })
    const etutler = h('s1-etut-iki').olcut
    expect(etutler.tur === 'etutler' && etutler.etutIds).toHaveLength(9)
    expect(etutler.tur === 'etutler' && etutler.etutIds).toEqual(
      ETUTLER.filter((e) => e.tur === 'tek' || e.tur === 'iki').map((e) => e.id),
    )
    expect(h('s1-rast-besli').olcut).toEqual({ tur: 'etutler', etutIds: ['rast-besli-1', 'rast-besli-2'] })
  })
})

describe('Seviye 3 hedefleri', () => {
  const s3 = SEVIYELER[3]!
  const h = (id: string) => s3.hedefler.find((x) => x.id === id)!
  const ucuncuKademe = NEY_PERDELER.filter((p) => p.kademe === 3)

  it('kimlikler kararlaştırılan sırada', () => {
    expect(s3.hedefler.map((x) => x.id)).toEqual([
      's3-nota',
      ...ucuncuKademe.map((p) => `s3-${p.id}-8`),
      's3-kademe',
      's3-gecis',
      's3-besli',
      's3-neva-besli',
      's3-makam',
      's3-rast',
      's3-neva',
      's3-eser',
      's3-hak-teala',
    ])
    expect(ucuncuKademe.map((p) => p.id)).toEqual([
      'huseyni',
      'acem',
      'gerdaniye',
      'muhayyer',
      'kapali-neva',
      'evic',
      'nim-sehnaz',
      'nim-hisar',
    ])
    expect(s3.ozet).toBe(
      "Hüseynî'den Muhayyer'e üçüncü kademe, kapalı Nevâ, Eviç, Nim Şehnaz, Nim Hisar; kademe geçişleri; beşliler; Rast ve Nevâ makamları.",
    )
  })

  it('ölçütler, metinler ve rotalar kararlaştırıldığı gibi', () => {
    expect(h('s3-nota')).toMatchObject({ metin: "Perde adları: Hüseynî'den Muhayyer'e; Nim Şehnaz ve Nim Hisar", olcut: { tur: 'konular', topicIds: ['perde-2', 'perde-5'] }, rota: '/nota' })
    for (const p of ucuncuKademe) {
      expect(h(`s3-${p.id}-8`)).toMatchObject({
        metin: `${p.name}: 8 sn uzun ses`,
        olcut: { tur: 'uzun-ses', perdeId: p.id, ms: 8000, cent: 20 },
        rota: `/ney/${p.id}`,
      })
    }
    expect(h('s3-kademe')).toMatchObject({
      olcut: {
        tur: 'etutler',
        etutIds: ['kademe-dugah-huseyni', 'kademe-rast-kapali-neva', 'kademe-cargah-gerdaniye', 'kademe-ara', 'kademe-nim-hisar'],
      },
      rota: '/ney',
    })
    expect(h('s3-gecis')).toMatchObject({
      metin: 'İkinci ve üçüncü kademe arasında sesim kırılmadan geçiyor',
      olcut: { tur: 'onay' },
    })
    expect(h('s3-besli')).toMatchObject({ metin: 'Beşli dersini okudum', olcut: { tur: 'ders', dersId: 'dortlu:besli' } })
    expect(h('s3-neva-besli').olcut).toEqual({ tur: 'etutler', etutIds: ['neva-rast-besli', 'neva-buselik-besli'] })
    expect(h('s3-makam').olcut).toEqual({ tur: 'ders', dersId: 'makam:giris' })
    expect(h('s3-rast')).toMatchObject({
      metin: 'Rast dizisi (çıkışta Eviç, inişte Acem)',
      olcut: { tur: 'etutler', etutIds: ['dizi-rast'] },
      rota: '/etut/dizi-rast',
    })
    expect(h('s3-neva')).toMatchObject({
      metin: 'Nevâ makamı dizisi',
      olcut: { tur: 'etutler', etutIds: ['dizi-neva'] },
      rota: '/etut/dizi-neva',
    })
    expect(h('s3-eser')).toMatchObject({
      metin:
        "Bir eseri metronomla çaldım (Yine Bağlandı Dil aranağmesi; öneri: tempo işaretinin %70'inden başla)",
      olcut: { tur: 'onay' },
      rota: '/parcalar/yine-baglandi-dil-aranagme',
    })
    expect(h('s3-hak-teala')).toMatchObject({
      metin: "Hak Teâlâ'yı baştan sona çaldım",
      olcut: { tur: 'onay' },
      rota: '/parcalar/hak-teala',
    })
  })

  it('ders hedeflerinin dersi var; etüt, konu ve perde kimlikleri var; uzun ses perdeleri 3. kademe; rotalar çözülür', () => {
    for (const x of s3.hedefler) {
      if (x.olcut.tur === 'ders') expect(dersById(x.olcut.dersId), x.id).toBeTruthy()
      if (x.olcut.tur === 'etutler') for (const id of x.olcut.etutIds) expect(ETUTLER.some((e) => e.id === id), `${x.id}:${id}`).toBe(true)
      if (x.olcut.tur === 'konular') for (const id of x.olcut.topicIds) expect(NOTA_TOPICS.some((t) => t.id === id), `${x.id}:${id}`).toBe(true)
      if (x.olcut.tur === 'uzun-ses') {
        const { perdeId } = x.olcut
        expect(NEY_PERDELER.find((p) => p.id === perdeId)?.kademe, x.id).toBe(3)
      }
      if (x.rota) expect(rotaBilinir(x.rota), `${x.id} → ${x.rota}`).toBe(true)
    }
  })
})

describe('ONERILEN_SEVIYE', () => {
  it('anahtarlar var olan parça, makam ve usullerdir; Dolap etiketsiz', () => {
    for (const id of Object.keys(ONERILEN_SEVIYE.parca)) expect(PARCALAR.some((p) => p.id === id), id).toBe(true)
    for (const id of Object.keys(ONERILEN_SEVIYE.makam)) expect(MAKAMLAR.some((m) => m.id === id), id).toBe(true)
    for (const id of Object.keys(ONERILEN_SEVIYE.usul)) expect(USULLER.some((u) => u.id === id), id).toBe(true)
    expect(ONERILEN_SEVIYE.usul.dolap).toBeUndefined()
    for (const id of ['yuruk-semai', 'yuruk-semai-64', 'turk-aksagi', 'devr-i-hindi']) expect(ONERILEN_SEVIYE.usul[id], id).toBe(4)
    expect(ONERILEN_SEVIYE.parca['hak-teala']).toBe(3)
    expect(ONERILEN_SEVIYE.makam.rast).toBe(3)
    expect(ONERILEN_SEVIYE.makam.neva).toBe(3)
  })
})
