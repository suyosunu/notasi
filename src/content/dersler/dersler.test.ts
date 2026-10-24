import { describe, expect, it } from 'vitest'
import { rotaBilinir } from '../../app'
import { NEY_PERDELER } from '../ney-perdeler'
import { NOTA_TOPICS } from '../nota-topics'
import { DERSLER, dersById, notaDersId, perdeDersId } from './index'
import { HAZIRLIK_DERSLERI } from './hazirlik'
import { NOTA_DERSLERI } from './nota'
import { cardToEvents } from '../../learning/cards'
import type { MusicEvent } from '../../music/notation'
import type { Ders, DersBlok } from './types'

/** Bir dersteki tüm metinler (başlık, anlatım, açıklamalar, adımlar, kaynaklar). */
function metinler(d: Ders): string[] {
  const blokMetni = (b: DersBlok): string[] => {
    switch (b.tur) {
      case 'metin':
        return [b.metin]
      case 'liste':
        return b.maddeler
      case 'dene':
        return b.adimlar
      case 'porte':
      case 'parmak':
      case 'gorsel':
        return b.aciklama ? [b.aciklama] : []
    }
  }
  return [d.baslik, ...d.bloklar.flatMap(blokMetni), ...d.kaynaklar]
}

describe('kimlik yardımcıları', () => {
  it('notaDersId ve perdeDersId', () => {
    expect(notaDersId('nota-1')).toBe('nota:nota-1')
    expect(perdeDersId('neva')).toBe('perde:neva')
  })

  it('dersById bilinmeyen kimlikte undefined', () => {
    expect(dersById('yok:yok')).toBeUndefined()
  })
})

// Task 35–39 ders ekledikçe bu değişmezler onları kendiliğinden kapsar (boş listede de geçer).
describe('DERSLER değişmezleri', () => {
  it('kimlikler benzersiz', () => {
    const ids = DERSLER.map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(DERSLER.map((d) => [d.id, d] as const))('%s: dene bloğu ve görsel blok var, kaynaklar dolu', (_id, d) => {
    expect(d.bloklar.some((b) => b.tur === 'dene')).toBe(true)
    expect(d.bloklar.some((b) => b.tur === 'porte' || b.tur === 'parmak' || b.tur === 'gorsel')).toBe(true)
    expect(d.kaynaklar.length).toBeGreaterThan(0)
  })

  it.each(DERSLER.map((d) => [d.id, d] as const))('%s: kimlik öneki bağlı olduğu içeriğe işaret eder', (_id, d) => {
    if (d.id.startsWith('perde:')) expect(NEY_PERDELER.map((p) => p.id)).toContain(d.id.slice('perde:'.length))
    if (d.id.startsWith('nota:')) expect(NOTA_TOPICS.map((t) => t.id)).toContain(d.id.slice('nota:'.length))
  })

  it.each(DERSLER.map((d) => [d.id, d] as const))('%s: parmak blokları var olan perdeye bağlı', (_id, d) => {
    for (const b of d.bloklar) if (b.tur === 'parmak') expect(NEY_PERDELER.map((p) => p.id)).toContain(b.perdeId)
  })

  it.each(DERSLER.filter((d) => d.alistirma).map((d) => [d.id, d.alistirma!] as const))(
    '%s: alıştırma rotası (%s) bilinir',
    (_id, rota) => {
      expect(rotaBilinir(rota)).toBe(true)
    },
  )

  it.each(DERSLER.map((d) => [d.id, d] as const))('%s: BELİRSİZ işaretli bilgi yazılmaz', (_id, d) => {
    for (const m of metinler(d)) expect(m).not.toMatch(/BELİRSİZ/i)
  })
})

describe('Seviye 0 (hazırlık) dersleri', () => {
  const S0 = ['s0:neyi-tani', 's0:durus', 's0:nefes', 's0:ilk-ses', 's0:baspare', 's0:uzun-ses']

  it('altı s0 dersi bu sırayla var, hepsi seviye 0 ve DERSLER içinde', () => {
    expect(HAZIRLIK_DERSLERI.map((d) => d.id)).toEqual(S0)
    expect(HAZIRLIK_DERSLERI.every((d) => d.seviye === 0)).toBe(true)
    expect(DERSLER.filter((d) => d.id.startsWith('s0:')).map((d) => d.id)).toEqual(S0)
  })

  it.each(['s0:ilk-ses', 's0:baspare', 's0:uzun-ses'])('%s: Nevâ parmak bloğu içerir', (id) => {
    expect(dersById(id)!.bloklar).toContainEqual(expect.objectContaining({ tur: 'parmak', perdeId: 'neva' }))
  })

  it.each([
    ['s0:neyi-tani', 'ney-bolumleri'],
    ['s0:durus', 'el-yerlesimi'],
    ['s0:nefes', 'nefes-444'],
  ] as const)('%s: %s çizimini gösterir', (id, ad) => {
    expect(dersById(id)!.bloklar).toContainEqual(expect.objectContaining({ tur: 'gorsel', ad }))
  })

  it('alıştırma rotaları: ilk ses akşama, uzun ses Nevâ çalışmasına; diğerleri henüz yok', () => {
    const rotalar = Object.fromEntries(HAZIRLIK_DERSLERI.map((d) => [d.id, d.alistirma]))
    expect(rotalar).toEqual({
      's0:neyi-tani': undefined,
      's0:durus': undefined,
      's0:nefes': undefined,
      's0:ilk-ses': '/aksam',
      's0:baspare': undefined,
      's0:uzun-ses': '/ney/neva',
    })
  })

  it('neyi tanı dersi boğum sayısı vermez (çizim de sayı vermez)', () => {
    for (const m of metinler(dersById('s0:neyi-tani')!)) expect(m).not.toMatch(/\d+\s*boğum/i)
  })

  it("neyi tanı dersi öğrencinin neyinin ahengini varsaymaz; ahengi Ayarlar'a bağlar", () => {
    const metin = metinler(dersById('s0:neyi-tani')!).join(' ')
    expect(metin).not.toMatch(/Senin neyin|rast ahengi/)
    expect(metin).toMatch(/Ney ahengi/)
    expect(metin).toMatch(/4\. çizgi/)
  })

  it('uzun ses dersindeki sayısal hedef "öneri" olarak anılır', () => {
    const metin = metinler(dersById('s0:uzun-ses')!).join(' ')
    expect(metin).toMatch(/5 sn/)
    expect(metin).toMatch(/±20 sent/)
    expect(metin).toMatch(/öneri/i)
  })
})

describe('Seviye 1 nota dersleri', () => {
  const KONULAR = ['nota-1', 'sure-1', 'nota-2', 'sure-2', 'nota-3', 'sure-3', 'nota-4', 'nota-5', 'dizi-1', 'perde-1', 'dizi-2']
  const metin = (topicId: string) => metinler(dersById(notaDersId(topicId))!).join(' ')
  const porteler = (topicId: string) =>
    dersById(notaDersId(topicId))!.bloklar.flatMap((b) => (b.tur === 'porte' ? [b.olaylar] : []))
  /** Bir olayın derste aranacak izi: notada perde, süre derslerinde süre (nota/sus, noktalı mı). */
  const iz = (e: MusicEvent, sure: boolean): string =>
    sure
      ? `${e.kind}:${e.dur}${e.dotted ? '.' : ''}`
      : e.kind === 'note'
        ? `${e.pitch.step}${e.pitch.octave}${e.pitch.acc}`
        : 'sus'

  it('listelenen 11 konunun her birinin dersi var; seviye 1, alıştırması konunun serbest turu, DERSLER içinde', () => {
    expect(NOTA_DERSLERI.map((d) => d.id)).toEqual(KONULAR.map(notaDersId))
    for (const t of KONULAR) {
      const d = dersById(notaDersId(t))
      expect(d).toBeDefined()
      expect(d!.seviye).toBe(1)
      expect(d!.alistirma).toBe(`/nota/${t}`)
    }
  })

  it.each(KONULAR)('%s: en az bir porte bloğunda nota var', (t) => {
    expect(porteler(t).some((olaylar) => olaylar.some((e) => e.kind === 'note'))).toBe(true)
  })

  it.each(KONULAR)('%s: konunun kartlarındaki her nota (ya da süre) bir porte bloğunda gösterilir', (t) => {
    const topic = NOTA_TOPICS.find((x) => x.id === t)!
    const sure = topic.kind === 'duration'
    const gosterilen = new Set(porteler(t).flat().map((e) => iz(e, sure)))
    for (const kart of topic.cards) for (const e of cardToEvents(kart)) expect(gosterilen).toContain(iz(e, sure))
  })

  it('nota-1: porte, sol anahtarı ve "4. çizgi = Re = Nevâ" anlatılır', () => {
    const m = metin('nota-1')
    expect(m).toMatch(/porte/i)
    expect(m).toMatch(/beş yatay çizgi/)
    expect(m).toMatch(/[Ss]ol anahtarı/)
    expect(m).toMatch(/4\. çizgi/)
    expect(m).toMatch(/Nevâ/)
  })

  it.each(['sure-1', 'sure-2', 'sure-3'])("%s: ♩ = 60'ta dörtlüğün 1 sn sürdüğü söylenir", (t) => {
    expect(metin(t)).toMatch(/♩ = 60'ta bir dörtlük 1 sn sürer/)
  })

  it.each(['sure-1', 'sure-2'])('%s: aynı perdeyle yan yana farklı süreler gösterilir', (t) => {
    const yanYana = porteler(t).some((olaylar) => {
      const notalar = olaylar.filter((e) => e.kind === 'note')
      const perdeler = new Set(notalar.map((e) => iz(e, false)))
      const sureler = new Set(notalar.map((e) => iz(e, true)))
      return perdeler.size === 1 && sureler.size > 1
    })
    expect(yanYana).toBe(true)
  })

  it('sure-3: dört sus işareti yalnız sus olan bir portede (Dinle yok), yanında sus içeren notalı bir ezgi', () => {
    const p = porteler('sure-3')
    expect(p.some((olaylar) => olaylar.length > 0 && olaylar.every((e) => e.kind === 'rest'))).toBe(true)
    expect(p.some((olaylar) => olaylar.some((e) => e.kind === 'rest') && olaylar.some((e) => e.kind === 'note'))).toBe(true)
  })

  it.each(['dizi-1', 'dizi-2'])('%s: soldan sağa okuma adımları anlatılır', (t) => {
    const d = dersById(notaDersId(t))!
    expect(metin(t)).toMatch(/soldan sağa/i)
    expect(d.bloklar.some((b) => b.tur === 'liste' && b.maddeler.length >= 3)).toBe(true)
  })

  it("perde-1: Rast = Sol … Nevâ = Re eşlemesi ve Segâh'ın koma bemolü anlatılır, ayrıntı koma konularına bırakılır", () => {
    const m = metin('perde-1')
    for (const e of ['Rast = Sol', 'Dügâh = La', 'Segâh = ', 'Çârgâh = Do', 'Nevâ = Re']) expect(m).toContain(e)
    expect(m).toMatch(/Segâh[^.]*Si'nin biraz pesti/)
    expect(m).toMatch(/koma bemolü/)
    expect(m).toMatch(/koma konularında/)
  })
})
