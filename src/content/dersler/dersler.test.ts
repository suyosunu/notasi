import { describe, expect, it } from 'vitest'
import { rotaBilinir } from '../../app'
import { NEY_PERDELER } from '../ney-perdeler'
import { NOTA_TOPICS } from '../nota-topics'
import { DERSLER, dersById, notaDersId, perdeDersId } from './index'
import { HAZIRLIK_DERSLERI } from './hazirlik'
import { NOTA_DERSLERI } from './nota'
import { NOTA_2_DERSLERI } from './nota-2'
import { ETUT_DERSLERI } from './etut'
import { PERDE_DERSLERI } from './perdeler'
import { ETUTLER } from '../etutler'
import { PERDE_ADLARI } from '../perde-adlari'
import { cardToEvents, perdeKey } from '../../learning/cards'
import { neyLevelConfig } from '../../learning/long-tone'
import { ACCIDENTAL_NAMES } from '../../music/accidentals'
import { beats } from '../../music/notation'
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

  it('alıştırma rotaları: nefes ve başpâre kendi sayfalarına, ilk ses akşama, uzun ses Nevâ çalışmasına; duruş Yolum ekranına', () => {
    const rotalar = Object.fromEntries(HAZIRLIK_DERSLERI.map((d) => [d.id, d.alistirma]))
    expect(rotalar).toEqual({
      's0:neyi-tani': undefined,
      's0:durus': '/yolum',
      's0:nefes': '/hazirlik/nefes',
      's0:ilk-ses': '/aksam',
      's0:baspare': '/hazirlik/baspare',
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

describe('Seviye 2 okuma dersleri', () => {
  const SEVIYE: Record<string, number> = {
    'nota:koma-1': 2,
    'nota:koma-2': 2,
    'nota:perde-3': 2,
    'nota:perde-4': 2,
    'nota:sure-4': 2,
    'okuma:olcu': 1,
    'okuma:ropriz': 2,
  }
  const IDS = Object.keys(SEVIYE)
  const ders = (id: string) => dersById(id)!
  const metin = (id: string) => metinler(ders(id)).join(' ')
  const porteBloklari = (id: string) => ders(id).bloklar.flatMap((b) => (b.tur === 'porte' ? [b] : []))
  const porteler = (id: string) => porteBloklari(id).map((b) => b.olaylar)
  const anahtar = (e: MusicEvent) =>
    e.kind === 'note'
      ? `${e.pitch.step}${e.pitch.octave}${e.pitch.acc === 0 ? '' : `${e.pitch.acc < 0 ? 'b' : '#'}${Math.abs(e.pitch.acc)}`}`
      : 'sus'
  /** Süre izi: nota/sus, süre, noktalı, üçleme. */
  const sureIzi = (e: MusicEvent) => `${e.kind}:${e.dur}${e.dotted ? '.' : ''}${e.uclu ? '3' : ''}`

  it('yedi ders bu sırayla var; seviyeleri tablodaki gibi, DERSLER içinde', () => {
    expect(NOTA_2_DERSLERI.map((d) => d.id)).toEqual(IDS)
    for (const id of IDS) {
      expect(dersById(id), id).toBeDefined()
      expect(ders(id).seviye, id).toBe(SEVIYE[id])
    }
  })

  it.each(IDS)('%s: görsel/porte blok, dene bloğu ve dolu kaynaklar', (id) => {
    const d = ders(id)
    expect(d.bloklar.some((b) => b.tur === 'porte' || b.tur === 'parmak' || b.tur === 'gorsel')).toBe(true)
    expect(d.bloklar.some((b) => b.tur === 'dene')).toBe(true)
    expect(d.kaynaklar.length).toBeGreaterThan(0)
  })

  it.each(IDS)('%s: her porte telefona sığar (en çok 8 olay) ve en az bir portede nota var', (id) => {
    for (const o of porteler(id)) expect(o.length).toBeLessThanOrEqual(8)
    expect(porteler(id).some((o) => o.some((e) => e.kind === 'note'))).toBe(true)
  })

  it.each(IDS)('%s: alıştırma nota derslerinde konunun turu, okuma derslerinde yok', (id) => {
    expect(ders(id).alistirma).toBe(id.startsWith('nota:') ? `/nota/${id.slice('nota:'.length)}` : undefined)
  })

  it('koma dersleri konu kartlarındaki her işareti gösterir', () => {
    const goster = (id: string) => new Set(porteler(id).flat().map(anahtar))
    for (const k of ['B4b1', 'B4b4', 'B4b5', 'B4b8']) expect(goster('nota:koma-1')).toContain(k)
    for (const k of ['C5#1', 'C5#4', 'C5#5', 'C5#8']) expect(goster('nota:koma-2')).toContain(k)
  })

  it('koma dersleri işaret adlarını ACCIDENTAL_NAMES ile aynı yazar; 9 koma, sık kullanılanlar, natürel, tanini, artık ikili', () => {
    const m1 = metin('nota:koma-1')
    const m2 = metin('nota:koma-2')
    for (const [acc, ad] of Object.entries(ACCIDENTAL_NAMES)) expect(Number(acc) < 0 ? m1 : m2).toContain(ad)
    expect(m1).toMatch(/[Dd]iyez[^.]*tizleştirir/)
    expect(m1).toMatch(/9 koma/)
    expect(m1).toMatch(/1, 4 ve 5/)
    expect(m2).toMatch(/[Nn]atürel/)
    expect(m2).toMatch(/[Tt]anini/)
    expect(m2).toMatch(/artık ikili/)
    expect(`${m1} ${m2}`).not.toMatch(/mücennep/)
  })

  it('perde-3/perde-4 dersleri konu kartlarındaki perdelerin hepsini anar (PERDE_ADLARI adlarıyla) ve portede gösterir', () => {
    for (const t of ['perde-3', 'perde-4']) {
      const id = notaDersId(t)
      const goster = new Set(porteler(id).flat().map(anahtar))
      for (const kart of NOTA_TOPICS.find((x) => x.id === t)!.cards) {
        const key = perdeKey(kart)
        expect(metin(id)).toContain(PERDE_ADLARI[key])
        expect(goster).toContain(key)
      }
    }
  })

  it("perde-3 Segâh ile karşılaştırır; perde-4 Eviç'in Seviye 3'te çalınacağını söyler", () => {
    expect(metin('nota:perde-3')).toMatch(/Segâh/)
    expect(porteler('nota:perde-3').some((o) => ['B4', 'B4b1', 'B4b4', 'B4b5'].every((k) => o.map(anahtar).includes(k)))).toBe(
      true,
    )
    expect(metin('nota:perde-4')).toMatch(/Eviç[^.]*Seviye 3/)
  })

  it('Seviye 2 nota konularının kartlarındaki her nota ya da süre bir porte bloğunda gösterilir', () => {
    for (const t of ['koma-1', 'koma-2', 'perde-3', 'perde-4', 'sure-4']) {
      const topic = NOTA_TOPICS.find((x) => x.id === t)!
      const iz = topic.kind === 'duration' ? sureIzi : anahtar
      const goster = new Set(porteler(notaDersId(t)).flat().map(iz))
      for (const kart of topic.cards) for (const e of cardToEvents(kart)) expect(goster, `${t} ${kart}`).toContain(iz(e))
    }
  })

  it('sure-4 dersinde en az bir üçleme ve bir onaltılık porte örneği var; metronom değerleri öneri olarak', () => {
    const p = porteler('nota:sure-4')
    expect(p.some((o) => o.some((e) => e.kind === 'note' && e.uclu))).toBe(true)
    expect(p.some((o) => o.some((e) => e.kind === 'note' && e.dur === 'sixteenth'))).toBe(true)
    const m = metin('nota:sure-4')
    expect(m).toMatch(/65–70/)
    expect(m).toMatch(/50–75/)
    expect(m).toMatch(/öneri/)
    expect(m).toMatch(/"3"/)
    expect(m).toMatch(/kiriş/)
  })

  it('okuma:ropriz dersinde ropriz: true porte ve bag içeren porte var; uzatma bağı (tie) da gösterilir', () => {
    const b = porteBloklari('okuma:ropriz')
    expect(b.some((x) => x.ropriz === true)).toBe(true)
    expect(b.some((x) => x.olaylar.some((e) => e.kind === 'note' && e.bag))).toBe(true)
    expect(b.some((x) => x.olaylar.some((e) => e.kind === 'note' && e.tie))).toBe(true)
    const m = metin('okuma:ropriz')
    expect(m).toMatch(/iki kez/)
    expect(m).toMatch(/dil/)
    expect(m).toMatch(/[Uu]zatma bağı/)
  })

  it('okuma:olcu dersinde nefes içeren porte ve ölçü çizgili porteler var; 2/4, 3/4, 4/4 anlatılır', () => {
    const b = porteBloklari('okuma:olcu')
    expect(b.some((x) => x.olaylar.some((e) => e.nefes))).toBe(true)
    expect(b.some((x) => (x.olcuCizgileri?.length ?? 0) > 0)).toBe(true)
    const m = metin('okuma:olcu')
    for (const s of ['2/4', '3/4', '4/4', 'ölçü çizgisi', 'bitiş çizgisi', 'nefes işareti']) expect(m).toContain(s)
  })

  it('ölçü çizgili portelerde her ölçü ölçü sayısını doldurur (çizgiler geçerli olay sıralarında)', () => {
    for (const id of IDS)
      for (const x of porteBloklari(id)) {
        if (!x.olcuCizgileri) continue
        const sinirlar = [-1, ...x.olcuCizgileri, x.olaylar.length - 1]
        const olculer = sinirlar.slice(1).map((son, k) => x.olaylar.slice(sinirlar[k]! + 1, son + 1))
        const vuruslar = olculer.map((o) => o.reduce((t, e) => t + beats(e), 0))
        for (const v of vuruslar) expect(Math.abs(v - vuruslar[0]!), id).toBeLessThan(1e-6)
      }
  })
})

describe('Seviye 1 perde dersleri', () => {
  const PERDELER = ['neva', 'cargah', 'segah', 'dugah', 'rast'] as const
  const perde = (id: string) => NEY_PERDELER.find((p) => p.id === id)!
  const ders = (id: string) => dersById(perdeDersId(id))!
  const porteler = (id: string) => ders(id).bloklar.flatMap((b) => (b.tur === 'porte' ? [b.olaylar] : []))
  const yukseklik = (e: MusicEvent) => (e.kind === 'note' ? e.pitch : null)

  it('beş perde dersi bu sırayla var; seviye 1, kimlik perde:<id>, alıştırması /ney/<id>, DERSLER içinde', () => {
    expect(PERDE_DERSLERI.map((d) => d.id)).toEqual(PERDELER.map(perdeDersId))
    for (const id of PERDELER) {
      const d = dersById(perdeDersId(id))
      expect(d).toBeDefined()
      expect(d!.seviye).toBe(1)
      expect(d!.alistirma).toBe(`/ney/${id}`)
    }
  })

  it('ders sırası uygulamadaki perde sırasıyla aynıdır', () => {
    expect(NEY_PERDELER.slice(0, 5).map((p) => p.id)).toEqual([...PERDELER])
  })

  it.each(PERDELER)('%s: parmak blokları yalnız dersin perdesine bağlı ve en az bir tane var', (id) => {
    const parmaklar = ders(id).bloklar.filter((b) => b.tur === 'parmak')
    expect(parmaklar.length).toBeGreaterThan(0)
    for (const b of parmaklar) expect(b.tur === 'parmak' && b.perdeId).toBe(id)
  })

  it.each(PERDELER)('%s: perdenin yazılı notası birlik olarak tek başına bir portede gösterilir', (id) => {
    expect(porteler(id)).toContainEqual([{ kind: 'note', pitch: perde(id).written, dur: 'whole' }])
  })

  it.each(PERDELER.slice(1).map((id, i) => [PERDELER[i]!, id] as const))(
    '%s → %s: önceki perdeden geçişi gösteren iki notalık porte var',
    (onceki, id) => {
      const gecis = porteler(id).filter(
        (o) => o.length === 2 && o.every((e) => e.kind === 'note'),
      )
      expect(gecis.map((o) => o.map(yukseklik))).toContainEqual([perde(onceki).written, perde(id).written])
    },
  )

  it('Nevâ dersinde geçiş portesi yoktur (ilk ses)', () => {
    expect(porteler('neva').filter((o) => o.length === 2)).toHaveLength(0)
  })

  it.each(PERDELER.slice(1).map((id, i) => [PERDELER[i]!, id] as const))(
    '%s → %s: "bir parmak ekle" doğrudur; şemada tek bir delik açıktan kapalıya geçer',
    (onceki, id) => {
      const a = perde(onceki).fingering!
      const b = perde(id).fingering!
      expect(b.thumb).toBe(a.thumb)
      const degisen = a.front.flatMap((h, i) => (h === b.front[i] ? [] : [[h, b.front[i]]]))
      expect(degisen).toEqual([['acik', 'kapali']])
    },
  )

  it.each(PERDELER)('%s: kaynaklar perdenin şema kaynağını (source) içerir', (id) => {
    const src = perde(id).source!
    expect(ders(id).kaynaklar.some((k) => k.includes(src))).toBe(true)
  })

  it.each(PERDELER)('%s: üfleme notu ve "Kendin dene": uzun ses, Dinle ile kulakla karşılaştırma, akort göstergesi', (id) => {
    const m = metinler(ders(id)).join(' ')
    expect(m).toMatch(/ılık/)
    const dene = ders(id).bloklar.find((b) => b.tur === 'dene')!
    const adimlar = dene.tur === 'dene' ? dene.adimlar.join(' ') : ''
    expect(adimlar).toMatch(/uzun ses/i)
    expect(adimlar).toMatch(/▶ Dinle/)
    expect(adimlar).toMatch(/kulağın/)
    expect(adimlar).toMatch(/akort göstergesi/i)
  })

  it.each(PERDELER)('%s: sayısal hedef (8 sn, ±20 sent) "öneri" olarak anılır', (id) => {
    const m = metinler(ders(id)).join(' ')
    expect(m).toMatch(/8 sn/)
    expect(m).toMatch(/±20 sent/)
    expect(m).toMatch(/öneri/i)
  })

  it.each(PERDELER)('%s: perdenin adı ve nota adı derste geçer', (id) => {
    const m = metinler(ders(id)).join(' ')
    const notaAdi = { neva: 'Re', cargah: 'Do', segah: 'Si', dugah: 'La', rast: 'Sol' }[id]
    expect(m).toContain(perde(id).name)
    expect(m).toContain(notaAdi)
  })

  it("Segâh dersi koma bemolünü anlatır; Rast dersi Zeki Sözen'in Sol kuralını anar", () => {
    expect(metinler(ders('segah')).join(' ')).toMatch(/koma bemolü/)
    expect(metinler(ders('rast')).join(' ')).toMatch(/Zeki Sözen/)
  })

  it.each(PERDELER)('%s: orta parmakların (2. ve 5. delik) destek için kapalı olduğu söylenir', (id) => {
    expect(metinler(ders(id)).join(' ')).toMatch(/orta parma/)
  })
})

describe('Seviye 1 etüt dersleri', () => {
  const ders = (id: string) => dersById(id)!
  const porteler = (id: string) => ders(id).bloklar.flatMap((b) => (b.tur === 'porte' ? [b] : []))

  it('iki etüt dersi bu sırayla var; seviye 1, DERSLER içinde, alıştırması ilk etüde gider', () => {
    expect(ETUT_DERSLERI.map((d) => d.id)).toEqual(['etut:giris', 'etut:rast-besli'])
    expect(DERSLER.filter((d) => d.id.startsWith('etut:')).map((d) => d.id)).toEqual(['etut:giris', 'etut:rast-besli'])
    expect(ETUT_DERSLERI.every((d) => d.seviye === 1)).toBe(true)
    expect(ders('etut:giris').alistirma).toBe('/etut/tek-neva')
    expect(ders('etut:rast-besli').alistirma).toBe('/etut/rast-besli-1')
  })

  it('her etüdün dersi vardır', () => {
    for (const e of ETUTLER) expect(dersById(e.dersId), e.id).toBeDefined()
  })

  it('etut:giris: tek-neva etüdünün ilk iki ölçüsü porte olarak gösterilir', () => {
    const tekNeva = ETUTLER.find((e) => e.id === 'tek-neva')!
    expect(porteler('etut:giris').map((b) => b.olaylar)).toContainEqual(tekNeva.olcu.slice(0, 2).flat())
  })

  it('etut:giris: dinle, oku, metronomla yavaş çal, hızlan sırası ve uzun ses → etüt → eser anlatılır', () => {
    const m = metinler(ders('etut:giris')).join(' ')
    expect(m).toMatch(/Önce dinle/)
    expect(m).toMatch(/Notayı oku/)
    expect(m).toMatch(/Metronomla yavaş çal/)
    expect(m).toMatch(/Sonra hızlan/)
    expect(m).toMatch(/Uzun ses[\s\S]*Etüt[\s\S]*Eser/)
    expect(m).toMatch(/M\.M\. 60–80/)
    expect(m).toMatch(/öneridir/)
  })

  it('etut:rast-besli: Rast’tan Nevâ’ya beş ses ve çıkış / iniş portesi; sekizlik etüdü anlatılır', () => {
    const d = ders('etut:rast-besli')
    expect(metinler(d).join(' ')).toMatch(/Rast, Dügâh, Segâh, Çârgâh, Nevâ/)
    const [cikis, inis] = porteler('etut:rast-besli').map((b) => b.olaylar)
    expect(cikis).toHaveLength(5)
    expect(inis).toEqual([...cikis!].reverse())
    expect(cikis!.map((e) => (e.kind === 'note' ? e.pitch : null))).toEqual(
      ['rast', 'dugah', 'segah', 'cargah', 'neva'].map((id) => NEY_PERDELER.find((p) => p.id === id)!.written),
    )
    expect(metinler(d).join(' ')).toMatch(/sekizlik/)
    expect(metinler(d).join(' ')).toMatch(/S2/)
  })
})

describe('uzun ses dersleri uygulamanın bant ve süre eğrisiyle tutarlı', () => {
  const baslangic = neyLevelConfig(0)
  const son = neyLevelConfig(99)
  const ONERI_CENT = 20

  it('eğri: ±25 sent / 5 sn ile başlar, sonra ±20, en sonda ±15 sent / 10 sn', () => {
    expect([baslangic.toleranceCents, baslangic.requiredMs]).toEqual([25, 5000])
    expect(neyLevelConfig(1).toleranceCents).toBe(ONERI_CENT)
    expect([son.toleranceCents, son.requiredMs]).toEqual([15, 10000])
  })

  it.each([
    ['s0:uzun-ses'],
    ['perde:neva'],
  ])('%s: başlangıç ve bitiş değerleri eğriyle aynı yazılır, "öneri" sözü kalır', (id) => {
    const m = metinler(dersById(id)!).join(' ')
    expect(m).toMatch(new RegExp(`${baslangic.requiredMs / 1000} sn`))
    expect(m).toMatch(new RegExp(`±${baslangic.toleranceCents} sent`))
    expect(m).toMatch(new RegExp(`${son.requiredMs / 1000} sn`))
    expect(m).toMatch(new RegExp(`±${son.toleranceCents} sent`))
    expect(m).toMatch(new RegExp(`öneri ±${ONERI_CENT} sent`, 'i'))
    expect(m).toMatch(/öneri/)
    expect(m).not.toMatch(/4 sn|±10 sent/)
  })
})
