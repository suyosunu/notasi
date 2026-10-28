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

  it('seviye 2–7 henüz hedefsizdir', () => {
    for (const s of SEVIYELER.slice(2)) expect(s.hedefler).toEqual([])
    expect(SEVIYELER[0]!.hedefler).toHaveLength(7)
    expect(SEVIYELER[1]!.hedefler).toHaveLength(9)
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

describe('ONERILEN_SEVIYE', () => {
  it('anahtarlar var olan parça, makam ve usullerdir; Dolap etiketsiz', () => {
    for (const id of Object.keys(ONERILEN_SEVIYE.parca)) expect(PARCALAR.some((p) => p.id === id), id).toBe(true)
    for (const id of Object.keys(ONERILEN_SEVIYE.makam)) expect(MAKAMLAR.some((m) => m.id === id), id).toBe(true)
    for (const id of Object.keys(ONERILEN_SEVIYE.usul)) expect(USULLER.some((u) => u.id === id), id).toBe(true)
    expect(ONERILEN_SEVIYE.usul.dolap).toBeUndefined()
    expect(ONERILEN_SEVIYE.parca['hak-teala']).toBe(3)
    expect(ONERILEN_SEVIYE.makam.rast).toBe(3)
  })
})
