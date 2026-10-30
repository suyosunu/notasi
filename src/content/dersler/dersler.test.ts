import { describe, expect, it } from 'vitest'
import { rotaBilinir } from '../../app'
import { KOMA_FARKI, NEY_PERDELER } from '../ney-perdeler'
import { MAKAMLAR } from '../makamlar'
import { NOTA_TOPICS } from '../nota-topics'
import { DERSLER, dersById, etutDersleri, makamDersleri, notaDersId, perdeDersId, usulDersId, usulDersleri } from './index'
import { HAZIRLIK_DERSLERI } from './hazirlik'
import { NOTA_DERSLERI } from './nota'
import { NOTA_2_DERSLERI, NOTA_3_DERSLERI } from './nota-2'
import { ETUT_3_DERSLERI, ETUT_DERSLERI } from './etut'
import { PERDE_DERSLERI } from './perdeler'
import { PERDE_3_DERSLERI } from './perdeler-3'
import { MAKAM_DERSLERI } from './makam'
import { USUL_DERSLERI } from './usul'
import { ETUTLER } from '../etutler'
import { USULLER } from '../usuller'
import { PERDE_ADLARI } from '../perde-adlari'
import { cardToEvents, perdeKey } from '../../learning/cards'
import { cikisInisEvents, diziEvents } from '../../music/makam'
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
      case 'usul':
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
    expect(d.bloklar.some((b) => b.tur === 'porte' || b.tur === 'parmak' || b.tur === 'gorsel' || b.tur === 'usul')).toBe(true)
    expect(d.kaynaklar.length).toBeGreaterThan(0)
  })

  it.each(DERSLER.map((d) => [d.id, d] as const))('%s: kimlik öneki bağlı olduğu içeriğe işaret eder', (_id, d) => {
    if (d.id.startsWith('perde:')) expect(NEY_PERDELER.map((p) => p.id)).toContain(d.id.slice('perde:'.length))
    if (d.id.startsWith('nota:')) expect(NOTA_TOPICS.map((t) => t.id)).toContain(d.id.slice('nota:'.length))
    if (d.id.startsWith('usul:') && d.id !== 'usul:giris') expect(USULLER.map((u) => u.id)).toContain(d.id.slice('usul:'.length))
    if (d.id.startsWith('makam:') && d.id !== 'makam:giris') expect(MAKAMLAR.map((m) => m.id)).toContain(d.id.slice('makam:'.length))
  })

  it.each(DERSLER.map((d) => [d.id, d] as const))('%s: usul blokları var olan usule bağlı', (_id, d) => {
    for (const b of d.bloklar) if (b.tur === 'usul') expect(USULLER.map((u) => u.id)).toContain(b.usulId)
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

  it('okuma:olcu basılı notadaki ölçü sayısını ve çift bitiş çizgisini uygulamanın portesinden ayırır', () => {
    const m = metin('okuma:olcu')
    expect(m).toContain('Uygulamadaki portelerde ölçü sayısı yazılmaz')
    expect(m).toContain('Uygulamadaki portelerde bitiş çizgisi tek çizgi görünür')
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
    expect(PERDE_DERSLERI.slice(0, 5).map((d) => d.id)).toEqual(PERDELER.map(perdeDersId))
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

describe('Seviye 2 ara ses perde dersleri', () => {
  const ARA = ['buselik', 'kurdi', 'dik-kurdi', 'nim-hicaz'] as const
  const ONCEKI = { buselik: 'segah', kurdi: 'dugah', 'dik-kurdi': 'kurdi', 'nim-hicaz': 'cargah' } as const
  const perde = (id: string) => NEY_PERDELER.find((p) => p.id === id)!
  const ders = (id: string) => dersById(perdeDersId(id))!
  const porteler = (id: string) => ders(id).bloklar.flatMap((b) => (b.tur === 'porte' ? [b.olaylar] : []))
  const tumMetin = (id: string) => metinler(ders(id)).join(' ')

  it("Kürdî ve Nim Hicaz derslerinde Yücel'in yedi ses kuralı uygulamanın yazımıyla geçer", () => {
    for (const id of ['kurdi', 'nim-hicaz']) {
      expect(tumMetin(id), id).not.toMatch(/Nîm|Hicâz/)
      expect(tumMetin(id), id).toContain('(Nevâ, Nim Hicaz, Çârgâh, Segâh, Kürdî, Dügâh, Rast)')
    }
  })

  it('dört ara ses dersi var, parmak bloğu doğru perdeyi gösterir, seviye 2', () => {
    expect(PERDE_DERSLERI.slice(5).map((d) => d.id)).toEqual(ARA.map(perdeDersId))
    for (const id of ARA) {
      const d = ders(id)
      expect(d.seviye).toBe(2)
      expect(d.alistirma).toBe(`/ney/${id}`)
      expect(DERSLER).toContain(d)
      const parmaklar = d.bloklar.filter((b) => b.tur === 'parmak')
      expect(parmaklar.length).toBeGreaterThan(0)
      for (const b of parmaklar) expect(b.tur === 'parmak' && b.perdeId).toBe(id)
    }
  })

  it.each(ARA)('%s: kendi yazılı notası tek başına, önceki komşudan geçiş iki notalık portede gösterilir', (id) => {
    expect(porteler(id)).toContainEqual([{ kind: 'note', pitch: perde(id).written, dur: 'whole' }])
    const gecisler = porteler(id).filter((o) => o.length === 2 && o.every((e) => e.kind === 'note'))
    expect(gecisler.map((o) => o.map((e) => (e.kind === 'note' ? e.pitch : null)))).toContainEqual([
      perde(ONCEKI[id]).written,
      perde(id).written,
    ])
  })

  it.each(ARA)('%s: kaynaklar perdenin şema kaynağını ve ders numarasını içerir; S2 ve S5 anılır', (id) => {
    const k = ders(id).kaynaklar
    expect(k.some((x) => x.includes(perde(id).source!))).toBe(true)
    const no = perde(id).source!.match(/neydersleri_(\d+)/)![1]
    expect(k.some((x) => x.includes(`Ney Dersleri ${no}:`))).toBe(true)
    expect(k.some((x) => x.startsWith('S2'))).toBe(true)
    expect(k.some((x) => x.startsWith('S5'))).toBe(true)
  })

  it.each(ARA)('%s: koma farkı kulakla ve dudak / baş açısıyla verilir (KOMA_FARKI)', (id) => {
    const m = tumMetin(id)
    expect(m).toContain(KOMA_FARKI)
    expect(m).toMatch(/kulağ/)
  })

  it.each(ARA)('%s: "Kendin dene" uzun ses, ▶ Dinle, kulak, akort göstergesi ve 8 sn / ±20 sent öneri hedefi içerir', (id) => {
    const dene = ders(id).bloklar.find((b) => b.tur === 'dene')!
    const adimlar = dene.tur === 'dene' ? dene.adimlar.join(' ') : ''
    expect(adimlar).toMatch(/uzun ses/i)
    expect(adimlar).toMatch(/▶ Dinle/)
    expect(adimlar).toMatch(/kulağın/)
    expect(adimlar).toMatch(/akort göstergesi/i)
    const m = tumMetin(id)
    expect(m).toMatch(/Seviye 2/)
    expect(m).toMatch(/8 sn/)
    expect(m).toMatch(/±20 sent/)
    expect(m).toMatch(/öneri/i)
  })

  it.each(ARA)('%s: perdenin adı derste geçer', (id) => {
    expect(tumMetin(id)).toContain(perde(id).name)
  })

  it('Kürdî ve Dik Kürdî derslerinde ikisinin aynı parmakla çalındığı yazılı', () => {
    expect(perde('kurdi').fingering).toEqual(perde('dik-kurdi').fingering)
    expect(tumMetin('kurdi')).toMatch(/aynı parmak/)
    expect(tumMetin('kurdi')).toContain('Dik Kürdî')
    expect(tumMetin('dik-kurdi')).toMatch(/aynı parmak/)
    expect(tumMetin('dik-kurdi')).toContain('Kürdî')
  })

  it('Kürdî ve Dik Kürdî derslerinde iki perde art arda ▶ Dinle ile karşılaştırılır', () => {
    for (const id of ['kurdi', 'dik-kurdi'] as const) {
      const ikili = porteler(id).filter(
        (o) => o.length === 2 && o.every((e) => e.kind === 'note' && e.dur === 'half'),
      )
      expect(ikili.map((o) => o.map((e) => (e.kind === 'note' ? e.pitch : null)))).toContainEqual([
        perde('kurdi').written,
        perde('dik-kurdi').written,
      ])
      const dene = ders(id).bloklar.find((b) => b.tur === 'dene')!
      expect(dene.tur === 'dene' && dene.adimlar.join(' ')).toMatch(/▶ Dinle ile .*Kürdî.*Dik Kürdî/)
    }
  })

  it('parmak anlatımı perdenin şemasıyla çelişmez', () => {
    const aciklama = (id: string) => {
      const b = ders(id).bloklar.find((x) => x.tur === 'parmak')!
      return b.tur === 'parmak' ? (b.aciklama ?? '') : ''
    }
    // Bûselik: Segâh duruşu, üçüncü delik yarım.
    expect(perde('buselik').fingering!.front[2]).toBe('yarim')
    expect(aciklama('buselik')).toMatch(/yarım/)
    expect(aciklama('buselik')).toMatch(/Segâh/)
    // Kürdî ve Dik Kürdî: alttaki iki delik açık, ötekiler kapalı.
    for (const id of ['kurdi', 'dik-kurdi']) {
      expect(aciklama(id)).toMatch(/alttaki iki delik açık/)
    }
    // Nim Hicaz: yalnız ilk delik ve alttaki elin orta parmağı kapalı.
    expect(aciklama('nim-hicaz')).toMatch(/yalnız(ca)? ilk delik ve alttaki elin orta parmağı kapalı/)
  })

  it('"iki elin orta parmağı kapalı" cümlesi yalnız şemada gerçekten doğruysa geçer (Kürdî ve Nim Hicaz\'da geçmez)', () => {
    for (const id of ARA) {
      const f = perde(id).fingering!
      const ikisiKapali = f.front[1] === 'kapali' && f.front[4] === 'kapali'
      const m = tumMetin(id)
      if (!ikisiKapali) expect(m, id).not.toMatch(/iki elinin orta parmağı/)
    }
  })
})

describe('Seviye 3 perde dersleri', () => {
  const UCUNCU = ['huseyni', 'acem', 'gerdaniye', 'muhayyer', 'kapali-neva', 'evic', 'nim-sehnaz', 'nim-hisar'] as const
  // Aynı parmakla çalınan pest eş (araştırma C §1 beşli tablosu); Nim Hisar'ın pest eşi Nim Zirgüle uygulamada olmadığından Hüseynî.
  const ONCEKI = {
    huseyni: 'dugah',
    acem: 'kurdi',
    gerdaniye: 'cargah',
    muhayyer: 'neva',
    'kapali-neva': 'rast',
    evic: 'segah',
    'nim-sehnaz': 'nim-hicaz',
    'nim-hisar': 'huseyni',
  } as const
  const perde = (id: string) => NEY_PERDELER.find((p) => p.id === id)!
  const ders = (id: string) => dersById(perdeDersId(id))!
  const porteler = (id: string) => ders(id).bloklar.flatMap((b) => (b.tur === 'porte' ? [b.olaylar] : []))
  const tumMetin = (id: string) => metinler(ders(id)).join(' ')
  const yukseklik = (e: MusicEvent) => (e.kind === 'note' ? e.pitch : null)

  it('NEY_PERDELER 3. kademe sırası ders sırasıyla aynıdır', () => {
    expect(NEY_PERDELER.filter((p) => p.kademe === 3).map((p) => p.id)).toEqual([...UCUNCU])
  })

  it('Seviye 3 perde dersleri her 3. kademe perdesi için var, seviye 3, parmak bloğu doğru perdeyi gösterir', () => {
    expect(PERDE_3_DERSLERI.map((d) => d.id)).toEqual(UCUNCU.map(perdeDersId))
    for (const id of UCUNCU) {
      const d = ders(id)
      expect(d, id).toBeDefined()
      expect(DERSLER, id).toContain(d)
      expect(d.seviye, id).toBe(3)
      expect(d.alistirma, id).toBe(`/ney/${id}`)
      const parmaklar = d.bloklar.flatMap((b) => (b.tur === 'parmak' ? [b.perdeId] : []))
      // Kapalı Nevâ dersi karşılaştırma için açık Nevâ şemasını da gösterir; ötekiler yalnız kendi perdesini.
      const beklenen = id === 'kapali-neva' ? ['kapali-neva', 'neva'] : [id]
      expect([...new Set(parmaklar)].sort(), id).toEqual([...beklenen].sort())
    }
  })

  it.each(UCUNCU)('%s: yazılı notası birlik olarak tek başına, pest eşinden geçiş iki ikilik portede gösterilir', (id) => {
    expect(porteler(id)).toContainEqual([{ kind: 'note', pitch: perde(id).written, dur: 'whole' }])
    const gecisler = porteler(id).filter((o) => o.length === 2 && o.every((e) => e.kind === 'note' && e.dur === 'half'))
    expect(gecisler.map((o) => o.map(yukseklik))).toContainEqual([perde(ONCEKI[id]).written, perde(id).written])
  })

  it('porte örneklerinin notaları perdelerin yazılı notalarıdır', () => {
    const yazilar = NEY_PERDELER.map((p) => JSON.stringify(p.written))
    for (const d of PERDE_3_DERSLERI)
      for (const b of d.bloklar)
        if (b.tur === 'porte')
          for (const e of b.olaylar) {
            expect(e.kind, d.id).toBe('note')
            expect(yazilar, d.id).toContain(JSON.stringify(yukseklik(e)))
          }
  })

  it.each(UCUNCU)('%s: pest eşiyle aynı parmak (Nim Hisar: yalnız son delik açıktan 3/4 kapalıya)', (id) => {
    const a = perde(ONCEKI[id]).fingering!
    const b = perde(id).fingering!
    expect(a.thumb).toBe(b.thumb)
    const degisen = a.front.flatMap((h, i) => (h === b.front[i] ? [] : [[i, h, b.front[i]]]))
    expect(degisen).toEqual(id === 'nim-hisar' ? [[5, 'acik', 'yarim']] : [])
  })

  it.each(UCUNCU)('%s: kaynaklar şema kaynağını, ders numarasını ve MEB ünitesini içerir', (id) => {
    const k = ders(id).kaynaklar
    expect(k.some((x) => x.includes(perde(id).source!))).toBe(true)
    const no = perde(id).source!.match(/neydersleri_(\d+)/)![1]
    expect(k.some((x) => x.includes(`Ney Dersleri ${no}:`))).toBe(true)
    expect(k.some((x) => x.includes('tymm.meb.gov.tr/muzik-okullari-bireysel-calgi-egitimi-dersi-ney-modulu/unite/'))).toBe(true)
  })

  it.each(UCUNCU)('%s: daha sert üfleme, "Kendin dene" ve 8 sn / ±20 sent öneri hedefi', (id) => {
    const m = tumMetin(id)
    expect(m).toMatch(/Seviye 3/)
    expect(m).toMatch(/sert/)
    expect(m).toMatch(/8 sn/)
    expect(m).toMatch(/±20 sent/)
    expect(m).toMatch(/öneri/i)
    const dene = ders(id).bloklar.find((b) => b.tur === 'dene')!
    const adimlar = dene.tur === 'dene' ? dene.adimlar.join(' ') : ''
    expect(adimlar).toMatch(/uzun ses/i)
    expect(adimlar).toMatch(/▶ Dinle/)
    expect(adimlar).toMatch(/kulağın/)
    expect(adimlar).toMatch(/akort göstergesi/i)
    expect(adimlar).toMatch(/8 sn, ±20 sent/)
    // Üçüncü kademede ılık nefes önerilmez.
    expect(adimlar).not.toMatch(/Ilık nefesle/)
  })

  it.each(UCUNCU)('%s: perdenin adı derste geçer', (id) => {
    expect(tumMetin(id)).toContain(perde(id).name.replace(' (açık)', '').replace(' (kapalı)', ''))
  })

  it('perde:huseyni kademe kavramını öğretir: aynı parmak, daha sert nefes, bir beşli (31 koma)', () => {
    const m = tumMetin('huseyni')
    expect(m).toMatch(/kademe/i)
    expect(m).toMatch(/aynı parmak/)
    expect(m).toMatch(/soğuk/)
    expect(m).toMatch(/beşli/)
    expect(m).toMatch(/31 koma/)
  })

  it('perde:huseyni kademe eşlerini sayar: liste altı çifti içerir', () => {
    const liste = ders('huseyni').bloklar.find((b) => b.tur === 'liste')
    const maddeler = liste?.tur === 'liste' ? liste.maddeler : []
    expect(maddeler).toHaveLength(6)
    const CIFTLER = [
      ['Dügâh', 'Hüseynî'],
      ['Kürdî', 'Acem'],
      ['Çârgâh', 'Gerdâniye'],
      ['Nevâ', 'Muhayyer'],
      ['Segâh', 'Eviç'],
      ['Nim Hicaz', 'Nim Şehnaz'],
    ]
    CIFTLER.forEach(([pest, tiz], i) => {
      expect(maddeler[i], `${pest} → ${tiz}`).toContain(pest!)
      expect(maddeler[i], `${pest} → ${tiz}`).toContain(tiz!)
    })
    // Listede olmayan iki 3. kademe sesi metinde anılır.
    expect(tumMetin('huseyni')).toMatch(/kapalı Nevâ/)
    expect(tumMetin('huseyni')).toContain('Nim Hisar')
  })

  it('perde:kapali-neva aynı yazılı notanın iki şemasını anlatır, nefes şiddetinin yazılı olmadığını söyler ve "tiz" geçer', () => {
    const m = tumMetin('kapali-neva')
    expect(perde('kapali-neva').written).toEqual(perde('neva').written)
    expect(m).toMatch(/açık Nevâ/)
    expect(m).toMatch(/iki şema/)
    expect(m).toMatch(/nefes şiddeti[^.]*(yazılı değil|yazmaz|yazılmaz)/)
    expect(m).toMatch(/tiz/)
    expect(m).toMatch(/orta/)
    expect(m).toMatch(/Ders 9/)
  })

  it('perde:nim-hisar 3/4 ve sola bilgisini verir; Hüseynî ve Nevâ ile konumunu söyler', () => {
    const m = tumMetin('nim-hisar')
    expect(m).toMatch(/3\/4/)
    expect(m).toMatch(/sola/)
    expect(m).toMatch(/bir koma ve bir bakiye/)
    expect(m).toMatch(/Hüseynî/)
    expect(m).toMatch(/Nevâ/)
    const parmak = ders('nim-hisar').bloklar.find((b) => b.tur === 'parmak')
    expect(parmak?.tur === 'parmak' && parmak.aciklama).toMatch(/3\/4/)
  })

  it('Nim Şehnaz Nim Hicaz parmağıyla çalındığı için derste Nim Hicaz anılır', () => {
    expect(tumMetin('nim-sehnaz')).toContain('Nim Hicaz')
  })

  it('BELİRSİZ hiçbir ders metninde geçmez', () => {
    for (const d of [...PERDE_3_DERSLERI, ...NOTA_3_DERSLERI]) for (const m of metinler(d)) expect(m, d.id).not.toMatch(/BELİRSİZ/i)
  })
})

describe('Seviye 3 okuma dersleri', () => {
  const IDS = ['nota:perde-2', 'nota:perde-5']
  const ders = (id: string) => dersById(id)!
  const porteler = (id: string) => ders(id).bloklar.flatMap((b) => (b.tur === 'porte' ? [b.olaylar] : []))
  const anahtar = (e: MusicEvent) =>
    e.kind === 'note'
      ? `${e.pitch.step}${e.pitch.octave}${e.pitch.acc === 0 ? '' : `${e.pitch.acc < 0 ? 'b' : '#'}${Math.abs(e.pitch.acc)}`}`
      : 'sus'

  it('nota:perde-2 ve nota:perde-5 var, alistirma rotaları doğru', () => {
    expect(NOTA_3_DERSLERI.map((d) => d.id)).toEqual(IDS)
    for (const id of IDS) {
      expect(DERSLER, id).toContain(ders(id))
      expect(ders(id).seviye, id).toBe(3)
      expect(ders(id).alistirma, id).toBe(`/nota/${id.slice('nota:'.length)}`)
      expect(rotaBilinir(ders(id).alistirma!), id).toBe(true)
    }
  })

  it.each(IDS)('%s: konunun kartlarındaki her perde adıyla anılır ve portede gösterilir; porteler telefona sığar', (id) => {
    const goster = new Set(porteler(id).flat().map(anahtar))
    const m = metinler(ders(id)).join(' ')
    for (const kart of NOTA_TOPICS.find((x) => x.id === id.slice('nota:'.length))!.cards) {
      const key = perdeKey(kart)
      expect(m).toContain(PERDE_ADLARI[key])
      expect(goster).toContain(key)
    }
    for (const o of porteler(id)) expect(o.length).toBeLessThanOrEqual(8)
  })

  it('nota:perde-2: Hüseynî, Acem, Gerdâniye, Muhayyer işaretsiz Mi, Fa, Sol, La; Re hep Nevâ', () => {
    const m = metinler(ders('nota:perde-2')).join(' ')
    for (const s of ['Hüseynî = Mi', 'Acem = Fa', 'Gerdâniye = Sol', 'Muhayyer = La', 'Nevâ']) expect(m).toContain(s)
    expect(m).toMatch(/Eviç/)
  })

  it('nota:perde-5: Nim Şehnaz Sol bakiye diyezi, Nim Hisar Mi küçük mücenneb bemolü', () => {
    const m = metinler(ders('nota:perde-5')).join(' ')
    expect(m).toContain(`Sol ${ACCIDENTAL_NAMES[4]}`)
    expect(m).toContain(`Mi ${ACCIDENTAL_NAMES[-5]}`)
    expect(m).not.toMatch(/mücennep/)
  })
})

describe('Seviye 1 etüt dersleri', () => {
  const ders = (id: string) => dersById(id)!
  const porteler = (id: string) => ders(id).bloklar.flatMap((b) => (b.tur === 'porte' ? [b] : []))

  it('iki etüt dersi bu sırayla var; seviye 1, DERSLER içinde, alıştırması ilk etüde gider', () => {
    expect(ETUT_DERSLERI.map((d) => d.id)).toEqual(['etut:giris', 'etut:rast-besli'])
    // etut:kademe Seviye 3'tür (ETUT_3_DERSLERI).
    expect(DERSLER.filter((d) => d.id.startsWith('etut:')).map((d) => d.id)).toEqual(['etut:giris', 'etut:rast-besli', 'etut:kademe'])
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

describe('Usul dersleri', () => {
  const S2_IDS = ['usul:giris', 'usul:nim-sofyan', 'usul:semai', 'usul:sofyan']
  const S4_IDS = ['usul:yuruk-semai', 'usul:turk-aksagi', 'usul:devr-i-hindi']
  const IDS = [...S2_IDS, ...S4_IDS]
  /** Seviye 2 usulleri (bunlarda ♩ = 60, "iki kez çalar" ve zaman/4 kalıbı denetlenir). */
  const USUL_IDLERI = ['nim-sofyan', 'semai', 'sofyan']
  const S4_USUL_IDLERI = ['yuruk-semai', 'turk-aksagi', 'devr-i-hindi']
  const ders = (id: string) => dersById(id)!
  const metin = (id: string) => metinler(ders(id)).join(' ')
  const usulBloklari = (id: string) => ders(id).bloklar.flatMap((b) => (b.tur === 'usul' ? [b] : []))

  it('yedi usul dersi bu sırayla var; ilk dördü seviye 2, Yürük Semâî, Türk Aksağı ve Devr-i Hindî seviye 4; DERSLER içinde; alıştırma: giriş usul bölümü, ötekiler vurma', () => {
    expect(USUL_DERSLERI.map((d) => d.id)).toEqual(IDS)
    expect(DERSLER.filter((d) => d.id.startsWith('usul:')).map((d) => d.id)).toEqual(IDS)
    for (const id of S2_IDS) expect(ders(id).seviye, id).toBe(2)
    for (const id of S4_IDS) expect(ders(id).seviye, id).toBe(4)
    expect(ders('usul:giris').alistirma).toBe('/usul')
    for (const u of [...USUL_IDLERI, ...S4_USUL_IDLERI]) expect(ders(`usul:${u}`).alistirma, u).toBe(`/usul/vur/${u}`)
  })

  it('etutDersleri: usul etüdünde ölçü, usul girişi ve usulün dersi; makam etüdünde Makam nedir? ve makamın dersi; ötekilerde etüdün kendi dersi', () => {
    for (const e of ETUTLER) {
      const beklenen = e.usulId
        ? ['okuma:olcu', 'usul:giris', `usul:${e.usulId}`]
        : e.dersId.startsWith('makam:')
          ? ['makam:giris', e.dersId]
          : [e.dersId]
      expect(etutDersleri(e), e.id).toEqual(beklenen)
      expect(etutDersleri(e).at(-1), e.id).toBe(e.dersId)
      for (const id of etutDersleri(e)) expect(dersById(id), `${e.id}: ${id}`).toBeTruthy()
    }
  })

  it('usulDersId ve usulDersleri', () => {
    expect(usulDersId('semai')).toBe('usul:semai')
    expect(usulDersleri('nim-sofyan')).toEqual(['usul:giris', 'usul:nim-sofyan'])
    expect(usulDersleri('sofyan')).toEqual(['usul:giris', 'usul:sofyan'])
    expect(usulDersleri('turk-aksagi')).toEqual(['usul:giris', 'usul:turk-aksagi'])
    expect(usulDersleri('devr-i-hindi')).toEqual(['usul:giris', 'usul:devr-i-hindi'])
    // Yürük Semâî dersi iki mertebeyi birlikte anlatır: 6/4 de aynı dersi okutur.
    expect(usulDersId('yuruk-semai-64')).toBe('usul:yuruk-semai')
    expect(usulDersleri('yuruk-semai')).toEqual(['usul:giris', 'usul:yuruk-semai'])
    expect(usulDersleri('yuruk-semai-64')).toEqual(['usul:giris', 'usul:yuruk-semai'])
    // dersi olmayan usullerde yalnız giriş
    const dersli = [...USUL_IDLERI, ...S4_USUL_IDLERI, 'yuruk-semai-64']
    for (const u of USULLER.filter((x) => !dersli.includes(x.id))) expect(usulDersleri(u.id), u.id).toEqual(['usul:giris'])
  })

  it('her usul dersinde yalnız ilgili usulün usul bloğu var; kaynaklar dolu; dene bloğu var', () => {
    for (const u of USUL_IDLERI) {
      const id = usulDersId(u)
      expect(usulBloklari(id).map((b) => b.usulId), id).toEqual([u])
      expect(ders(id).kaynaklar.length, id).toBeGreaterThan(0)
      expect(ders(id).bloklar.some((b) => b.tur === 'dene'), id).toBe(true)
    }
    for (const u of ['turk-aksagi', 'devr-i-hindi']) {
      const id = usulDersId(u)
      expect(usulBloklari(id).map((b) => b.usulId), id).toEqual([u])
      expect(ders(id).kaynaklar.length, id).toBeGreaterThan(0)
      expect(ders(id).bloklar.some((b) => b.tur === 'dene'), id).toBe(true)
    }
    // Yürük Semâî dersi iki mertebeyi iki şemayla gösterir.
    expect(usulBloklari('usul:yuruk-semai').map((b) => b.usulId)).toEqual(['yuruk-semai', 'yuruk-semai-64'])
    expect(ders('usul:yuruk-semai').bloklar.some((b) => b.tur === 'dene')).toBe(true)
    expect(usulBloklari('usul:giris').length).toBeGreaterThan(0)
    expect(ders('usul:giris').kaynaklar.length).toBeGreaterThan(0)
  })

  it('Seviye 4 usul dersleri: kaynak neyzenim Ders 13, tr.wikipedia ve TDV; hepsi usul verisine bağlı', () => {
    for (const u of S4_USUL_IDLERI) {
      const kaynaklar = ders(usulDersId(u)).kaynaklar.join(' ')
      expect(kaynaklar, u).toContain('neydersleri_13')
      expect(kaynaklar, u).toContain('tr.wikipedia.org')
      expect(kaynaklar, u).toContain(`islamansiklopedisi.org.tr/${u === 'yuruk-semai' ? 'yuruk-semai' : u}`)
    }
  })

  it('her usul dersinin "Kendin dene" kutusunda sesli sayma, dizlere vurma ve Vurarak çalış adımı var', () => {
    const kalip: Record<string, string> = {
      'nim-sofyan': 'düm-tek',
      semai: 'düm-tek-tek',
      sofyan: 'düm-te-ke',
      'yuruk-semai': 'düm-tek-tek-düm-tek',
      'turk-aksagi': 'düm-tek-tek',
      'devr-i-hindi': 'düm-tek-tek-düm-tek',
    }
    for (const u of [...USUL_IDLERI, ...S4_USUL_IDLERI]) {
      const dene = ders(usulDersId(u)).bloklar.find((b) => b.tur === 'dene')
      const adimlar = dene && dene.tur === 'dene' ? dene.adimlar.join(' ') : ''
      expect(adimlar, u).toMatch(/sesli say/)
      expect(adimlar, u).toContain(`(${kalip[u]})`)
      expect(adimlar, u).toMatch(/dizlerine vurarak eşlik et/)
      expect(adimlar, u).toMatch(/Vurarak çalış/)
    }
  })

  it('giriş: usul tanımı, düm kalın/güçlü, tek ince/hafif, te ve ke, öğretim sırası, vurarak çalışma', () => {
    const m = metin('usul:giris')
    expect(m).toMatch(/tekrarlanan vuruş kalıbı/)
    expect(m).toMatch(/iskelet/)
    expect(m).toMatch(/[Dd]üm[^.]*kalın[^.]*güçlü/)
    expect(m).toMatch(/[Tt]ek[^.]*ince[^.]*hafif/)
    expect(m).toMatch(/\b[Tt]e\b[^.]*\bke\b/)
    expect(m.indexOf('Nim Sofyan')).toBeGreaterThan(-1)
    expect(m.indexOf('Nim Sofyan')).toBeLessThan(m.indexOf('Semâî'))
    expect(m.indexOf('Semâî')).toBeLessThan(m.indexOf('Sofyan', m.indexOf('Semâî')))
    expect(m).toMatch(/Vurarak çalış/)
  })

  it('hiçbir ders hangi elle vurulacağını söylemez (kaynaklarda doğrulanamadı)', () => {
    // \b Türkçe harflerde (ğ) sınır bulmaz; kelime sınırı Unicode harf sınıfıyla denetlenir.
    const el = /(^|[^\p{L}])(sağ|sol)(?!\p{L})/iu
    expect('düm sağ, tek sol').toMatch(el)
    expect('Sağ elle vur').toMatch(el)
    expect('sağlam ve solgun').not.toMatch(el)
    for (const id of IDS) expect(metin(id), id).not.toMatch(el)
  })

  it('usul dersleri vuruş kalıbını ve zamanı usul verisiyle aynı anlatır', () => {
    const olcuMetni = (id: string, zaman: number, kalip: RegExp) => {
      expect(metin(`usul:${id}`), id).toContain(`${zaman}/4`)
      expect(metin(`usul:${id}`), id).toMatch(kalip)
    }
    olcuMetni('nim-sofyan', 2, /düm,? tek/)
    olcuMetni('semai', 3, /düm,? tek,? tek/)
    olcuMetni('sofyan', 4, /düm[^.]*te[^.]*ke/)
    for (const u of USUL_IDLERI) {
      const usul = USULLER.find((x) => x.id === u)!
      expect(usul.zaman).toBe({ 'nim-sofyan': 2, semai: 3, sofyan: 4 }[u])
      expect(usul.mertebe).toBe(4)
    }
  })

  it('Nim Sofyan dersi iki mertebesini anar (2/4 ve 2/8), uygulamanın 2/4 kullandığını söyler; Sofyan dersi düm 2 zaman uzar der', () => {
    expect(metin('usul:nim-sofyan')).toMatch(/2\/8/)
    expect(metin('usul:nim-sofyan')).toMatch(/2\/4/)
    expect(metin('usul:sofyan')).toMatch(/2 zaman/)
  })

  it('sayılar "öneri" diye anılır: ♩ = 60 verilen her derste öneri kelimesi de vardır', () => {
    for (const id of IDS) if (/♩ = 60/.test(metin(id))) expect(metin(id), id).toMatch(/öneri/)
  })

  it('Türk Aksağı dersi: 5/8, beş zamanlı üç vuruşlu, düm 2 · tek 2 · tek 1, nîm-sofyan + semâî, 5/4 mertebesi; birim ♪', () => {
    const m = metin('usul:turk-aksagi')
    expect(m).toContain('5/8')
    expect(m).toMatch(/beş zamanlı/)
    expect(m).toMatch(/üç vuruş/)
    expect(m).toMatch(/düm[^.]*2 zaman/)
    expect(m).toMatch(/nîm-sofyan/)
    expect(m).toMatch(/semâî/)
    expect(m).toContain('5/4')
    expect(m).toMatch(/♪ = 60/)
    expect(m).toMatch(/öneri/)
    const usul = USULLER.find((x) => x.id === 'turk-aksagi')!
    expect([usul.zaman, usul.mertebe]).toEqual([5, 8])
    expect(usul.vurus!.map((x) => `${x.ses}${x.sure}`)).toEqual(['düm2', 'tek2', 'tek1'])
  })

  it('Devr-i Hindî dersi: 7/8, yedi zamanlı beş vuruşlu, semâî + sofyan, 7/4 mertebesi; birim ♪', () => {
    const m = metin('usul:devr-i-hindi')
    expect(m).toContain('7/8')
    expect(m).toMatch(/yedi zamanlı/)
    expect(m).toMatch(/beş vuruş/)
    expect(m).toMatch(/semâî/)
    expect(m).toMatch(/sofyan/)
    expect(m).toContain('7/4')
    expect(m).toMatch(/♪ = 60/)
    expect(m).toMatch(/öneri/)
    const usul = USULLER.find((x) => x.id === 'devr-i-hindi')!
    expect([usul.zaman, usul.mertebe]).toEqual([7, 8])
    expect(usul.vurus!.map((x) => `${x.ses}${x.sure}`)).toEqual(['düm1', 'tek1', 'tek1', 'düm2', 'tek2'])
  })

  it('Yürük Semâî dersi: 6/8 ve 6/4 aynı vuruşu taşır; TDV notu (asıl yeri 6/8, 6/4 de yürük semâî diye anılır, form çoğunlukla 6/4); iki birim', () => {
    const m = metin('usul:yuruk-semai')
    expect(m).toContain('6/8')
    expect(m).toContain('6/4')
    expect(m).toMatch(/aynı/)
    expect(m).toMatch(/TDV/)
    expect(m).toMatch(/sengin semâî/)
    expect(m).toMatch(/♪ = 60/)
    expect(m).toMatch(/♩ = 60/)
    expect(m).toMatch(/öneri/)
    const sekizlik = USULLER.find((x) => x.id === 'yuruk-semai')!
    const dortluk = USULLER.find((x) => x.id === 'yuruk-semai-64')!
    expect(dortluk.vurus).toEqual(sekizlik.vurus)
    expect([sekizlik.zaman, sekizlik.mertebe, dortluk.zaman, dortluk.mertebe]).toEqual([6, 8, 6, 4])
  })

  it('kalıp verisi: her usul dersi, usul bloğunun gösterdiği vuruşları (düm/tek/te/ke adları) metinde de anar', () => {
    for (const u of [...USUL_IDLERI, ...S4_USUL_IDLERI]) {
      const usul = USULLER.find((x) => x.id === u)!
      for (const ses of new Set(usul.vurus!.map((x) => x.ses))) expect(metin(usulDersId(u)), `${u} ${ses}`).toContain(ses)
    }
  })
})

describe('Seviye 2 dörtlü, dil ve eser dersleri', () => {
  const ders = (id: string) => dersById(id)!
  const porteler = (id: string) => ders(id).bloklar.flatMap((b) => (b.tur === 'porte' ? [b] : []))
  const listeler = (id: string) => ders(id).bloklar.flatMap((b) => (b.tur === 'liste' ? b.maddeler : [])).join(' ')
  const perdeler = (olaylar: MusicEvent[]) => olaylar.map((e) => (e.kind === 'note' ? e.pitch : null))
  const yazim = (ids: string[]) => ids.map((id) => NEY_PERDELER.find((p) => p.id === id)!.written)

  const DORTLULER = [
    { id: 'dortlu:cargah', etut: 'dortlu-cargah', perdeler: ['rast', 'dugah', 'buselik', 'cargah'], sayilar: ['9', '4'] },
    { id: 'dortlu:kurdi', etut: 'dortlu-kurdi', perdeler: ['dugah', 'kurdi', 'cargah', 'neva'], sayilar: ['4', '9'] },
    { id: 'dortlu:hicaz', etut: 'dortlu-hicaz', perdeler: ['dugah', 'dik-kurdi', 'nim-hicaz', 'neva'], sayilar: ['5', '12'] },
  ]

  it.each(DORTLULER)('$id: seviye 2; porte dörtlünün dört notasını sırayla içerir; alıştırma etüde gider', (d) => {
    expect(ders(d.id).seviye).toBe(2)
    expect(DERSLER.map((x) => x.id)).toContain(d.id)
    expect(ders(d.id).alistirma).toBe(`/etut/${d.etut}`)
    expect(ETUTLER.find((e) => e.id === d.etut)!.dersId).toBe(d.id)
    const cikis = porteler(d.id).map((b) => perdeler(b.olaylar))
    expect(cikis).toContainEqual(yazim(d.perdeler))
  })

  it('dörtlü portelerindeki yazılı notalar Global Constraints ile aynı', () => {
    const anahtar = (id: string) =>
      perdeler(porteler(id)[0]!.olaylar).map((p) => p && `${p.step}${p.octave}${p.acc === 0 ? '' : `${p.acc < 0 ? 'b' : '#'}${Math.abs(p.acc)}`}`)
    expect(anahtar('dortlu:cargah').join(' ')).toBe(['G4', 'A4', 'B4', 'C5'].join(' '))
    expect(anahtar('dortlu:kurdi').join(' ')).toBe(['A4', 'B4b5', 'C5', 'D5'].join(' '))
    expect(anahtar('dortlu:hicaz').join(' ')).toBe(['A4', 'B4b4', 'C5#4', 'D5'].join(' '))
  })

  it.each(DORTLULER)('$id: liste bloğu aralıkları koma cinsinden yazar', (d) => {
    const liste = listeler(d.id)
    for (const s of d.sayilar) expect(liste).toMatch(new RegExp(String.raw`\b${s} koma`))
  })

  it('dörtlü derslerinin aralık sırası: Çârgâh 9+9+4, Kürdî 4+9+9, Hicaz 5+12+5', () => {
    const sira = (id: string) => [...listeler(id).matchAll(/(\d+) koma/g)].map((m) => m[1]).join('+')
    expect(sira('dortlu:cargah')).toBe('9+9+4')
    expect(sira('dortlu:kurdi')).toBe('4+9+9')
    expect(sira('dortlu:hicaz')).toBe('5+12+5')
  })

  it('dörtlü dersleri: makam Seviye 3’e bırakılır; Kürdî dersi Çârgâh ile, Hicaz dersi artık ikiliyle ilgilenir', () => {
    expect(metinler(ders('dortlu:cargah')).join(' ')).toMatch(/Seviye 3/)
    expect(metinler(ders('dortlu:cargah')).join(' ')).toMatch(/S3/)
    expect(metinler(ders('dortlu:kurdi')).join(' ')).toMatch(/Çârgâh dörtlüsü/)
    expect(metinler(ders('dortlu:hicaz')).join(' ')).toMatch(/artık ikili/)
  })

  it('dörtlü dersleri ara sesleri uygulamanın işaret adlarıyla anar; süre "vuruş" diye söylenir (dörtlük ile karışmaz)', () => {
    const m = (id: string) => metinler(ders(id)).join(' ')
    for (const d of DORTLULER) {
      expect(m(d.id), d.id).not.toMatch(/\d koma (bemol|diyez)\b/)
      expect(m(d.id), d.id).not.toMatch(/bir dörtlük/)
      expect(m(d.id), d.id).toMatch(/her ses bir vuruş/)
    }
    expect(m('dortlu:kurdi')).toContain(`Si ${ACCIDENTAL_NAMES[-5]}`)
    expect(m('dortlu:hicaz')).toContain(`Si ${ACCIDENTAL_NAMES[-4]}`)
    expect(m('dortlu:hicaz')).toContain(`Do ${ACCIDENTAL_NAMES[4]}`)
  })

  it('dil:tu-bag: röpriz dersine "ayrıntısı var" diye gönderir (sıra zorunlu değil); kaynak yalnız S4 ders 15', () => {
    const d = ders('dil:tu-bag')
    const m = metinler(d).join(' ')
    expect(m).not.toMatch(/görmüştün/)
    expect(m).toMatch(/"Röpriz ve bağ" dersinde var/)
    expect(d.kaynaklar).toHaveLength(1)
    expect(d.kaynaklar[0]).toMatch(/^S4/)
  })

  it('dil:tu-bag: ayrık ve bağlı porte; bağlı portede bag işaretli nota var; ses farkı dürüstçe söylenir', () => {
    const d = ders('dil:tu-bag')
    expect(d.seviye).toBe(2)
    expect(d.alistirma).toBe('/etut/dil-1')
    expect(ETUTLER.find((e) => e.id === 'dil-1')!.dersId).toBe('dil:tu-bag')
    const [ayrik, bagli] = porteler('dil:tu-bag').map((b) => b.olaylar)
    expect(ayrik!.some((e) => e.kind === 'note' && e.bag)).toBe(false)
    expect(bagli!.some((e) => e.kind === 'note' && e.bag)).toBe(true)
    const m = metinler(d).join(' ')
    expect(m).toMatch(/tu/)
    expect(m).toMatch(/dil vurulmaz/)
    expect(m).toMatch(/Seviye 4/)
    expect(m).toMatch(/aynı duyurur|aynı çalar|aynı ses/)
  })

  it('eser:giris: sıra dinle → oku → çal; Yücel kuralı ve ezber; kaynaklar S1 ve S5', () => {
    const d = ders('eser:giris')
    expect(d.seviye).toBe(2)
    expect(d.alistirma).toBeUndefined()
    const m = metinler(d).join(' ')
    expect(m).toMatch(/dinle[\s\S]*oku[\s\S]*çal/i)
    expect(m).toMatch(/usul/i)
    expect(m).toMatch(/solfej/i)
    expect(m).toMatch(/2–3 ay/)
    expect(m).toMatch(/ezber/i)
    expect(d.kaynaklar.some((k) => k.startsWith('S1 '))).toBe(true)
    expect(d.kaynaklar.some((k) => k.startsWith('S5 '))).toBe(true)
    expect(d.kaynaklar.some((k) => k.startsWith('S4 '))).toBe(true)
  })
})

describe('Seviye 3 teori ve makam dersleri', () => {
  const ders = (id: string) => dersById(id)!
  const metin = (id: string) => metinler(ders(id)).join(' ')
  const porteler = (id: string) => ders(id).bloklar.flatMap((b) => (b.tur === 'porte' ? [b] : []))
  const perdeler = (olaylar: MusicEvent[]) => olaylar.map((e) => (e.kind === 'note' ? e.pitch : null))
  const yazim = (ids: string[]) => ids.map((id) => NEY_PERDELER.find((p) => p.id === id)!.written)
  const makam = (id: string) => MAKAMLAR.find((m) => m.id === id)!
  const IDS = ['dortlu:besli', 'etut:kademe', 'makam:giris', 'makam:rast', 'makam:neva']

  it('beş ders var, hepsi seviye 3 ve DERSLER içinde; alıştırma rotaları etütlere gider', () => {
    for (const id of IDS) {
      expect(DERSLER, id).toContain(ders(id))
      expect(ders(id).seviye, id).toBe(3)
    }
    expect(MAKAM_DERSLERI.map((d) => d.id)).toEqual(['makam:giris', 'makam:rast', 'makam:neva'])
    expect(ETUT_3_DERSLERI.map((d) => d.id)).toEqual(['etut:kademe'])
    expect(ders('dortlu:besli').alistirma).toBe('/etut/neva-rast-besli')
    expect(ders('makam:rast').alistirma).toBe('/etut/dizi-rast')
    expect(ders('makam:neva').alistirma).toBe('/etut/dizi-neva')
    expect(ders('etut:kademe').alistirma).toBe('/etut/kademe-dugah-huseyni')
  })

  it('etütlerin alıştırma bağlantısı ve dersleri karşılıklı tutar', () => {
    for (const [id, etut] of [
      ['dortlu:besli', 'neva-rast-besli'],
      ['makam:rast', 'dizi-rast'],
      ['makam:neva', 'dizi-neva'],
      ['etut:kademe', 'kademe-dugah-huseyni'],
    ] as const)
      expect(ETUTLER.find((e) => e.id === etut)!.dersId, etut).toBe(id)
  })

  it('beşli dersi altı çeşniyi ve 31 komayı anar; Uşşak beşlisi yok der; porte notaları yazılı perdeler', () => {
    const m = metin('dortlu:besli')
    for (const ad of ['Çârgâh', 'Bûselik', 'Kürdî', 'Rast', 'Uşşak', 'Hicaz']) expect(m, ad).toContain(ad)
    for (const aralik of ['9+9+4+9', '9+4+9+9', '4+9+9+9', '9+8+5+9', '5+12+5+9']) expect(m, aralik).toContain(aralik)
    for (const dortlu of ['9+9+4', '9+4+9', '4+9+9', '9+8+5', '8+5+9', '5+12+5']) expect(m, dortlu).toContain(dortlu)
    expect(m).toMatch(/31 koma/)
    expect(m).toMatch(/22 koma/)
    expect(m).toMatch(/Uşşak[^.]*beşlisi yok/)
    const listeler = ders('dortlu:besli').bloklar.flatMap((b) => (b.tur === 'liste' ? [b.maddeler] : []))
    expect(listeler.some((l) => l.length === 6)).toBe(true)
    // Porteler: Rast'ta Rast beşlisi ve Dügâh'ta Bûselik beşlisi, perdelerin yazılı notalarıyla.
    const p = porteler('dortlu:besli').map((b) => perdeler(b.olaylar))
    expect(p).toContainEqual(yazim(['rast', 'dugah', 'segah', 'cargah', 'neva']))
    expect(p).toContainEqual(yazim(['dugah', 'buselik', 'cargah', 'neva', 'huseyni']))
    const yazilar = NEY_PERDELER.map((x) => JSON.stringify(x.written))
    for (const b of porteler('dortlu:besli'))
      for (const e of b.olaylar) {
        expect(e.kind).toBe('note')
        expect(yazilar).toContain(JSON.stringify(e.kind === 'note' ? e.pitch : null))
      }
  })

  it('beşli dersi "beşli = dörtlü + tanini (9 koma)" der', () => {
    expect(metin('dortlu:besli')).toMatch(/dörtlü[^.]*9 koma[^.]*tanini|dörtlü[^.]*tanini[^.]*9 koma/)
    expect(ders('dortlu:besli').kaynaklar.length).toBeGreaterThan(1)
  })

  it("makam dersleri: makam:neva dizisi MAKAMLAR'daki Nevâ dizisiyle aynı notalar", () => {
    const neva = makam('neva')
    const p = porteler('makam:neva').map((b) => perdeler(b.olaylar))
    expect(p).toContainEqual(neva.dizi)
    // Dizi, ney perdelerinin yazılı notalarıdır (gerçek ney perdesi olmayan nota yok).
    const yazilar = NEY_PERDELER.map((x) => JSON.stringify(x.written))
    for (const pitch of neva.dizi) expect(yazilar).toContain(JSON.stringify(pitch))
    expect(neva.inis).toBeUndefined()
    const m = metin('makam:neva')
    expect(m).toContain(neva.durak)
    expect(m).toContain(neva.guclu)
    expect(m).toContain(neva.yeden)
    expect(m).toContain(neva.yapi!)
  })

  it('makam:neva Uşşak farkını (Eviç / Acem) ve asma karardaki Acem’i söyler; Uşşak ve Hicaz için ders yoktur', () => {
    const m = metin('makam:neva')
    expect(m).toMatch(/Uşşak/)
    expect(m).toMatch(/Eviç/)
    expect(m).toMatch(/Acem/)
    expect(m).toMatch(/asma karar/)
    expect(m).toMatch(/bûselik/)
    expect(m).toMatch(/segâh/)
    expect(m).toMatch(/seyir/i)
    expect(dersById('makam:ussak')).toBeUndefined()
    expect(dersById('makam:hicaz')).toBeUndefined()
    // Uşşak ile Nevâ'nın farkı portede de gösterilir: Hüseynî, Acem (F5) ya da Eviç (F5#4), Gerdâniye.
    const p = porteler('makam:neva').map((b) => perdeler(b.olaylar))
    expect(p).toContainEqual(makam('ussak').dizi.slice(4, 7))
    expect(p).toContainEqual(makam('neva').dizi.slice(4, 7))
  })

  it('makam:rast: Rast dizisi çıkışta Eviç, inişte Acem portesiyle; yapı MAKAMLAR ile aynı', () => {
    const rast = makam('rast')
    const p = porteler('makam:rast').map((b) => perdeler(b.olaylar))
    expect(p).toContainEqual(rast.dizi)
    expect(p).toContainEqual([...rast.inis!].reverse())
    // İnişteki Acem (F5, işaretsiz) çıkıştaki Eviç'ten (F5#4) farklıdır.
    expect(rast.dizi[6]).not.toEqual(rast.inis![6])
    const m = metin('makam:rast')
    expect(m).toContain(rast.yapi!)
    expect(m).toMatch(/Eviç/)
    expect(m).toMatch(/Acem/)
    expect(m).toMatch(/acemli rast/)
    for (const x of [rast.durak, rast.guclu, rast.yeden]) expect(m).toContain(x)
  })

  it('Eviç/Acem sırası doğru anılır: Rast dizisinde yedinci, Nevâ dizisinde altıncı ses', () => {
    const rast = makam('rast')
    const neva = makam('neva')
    expect(rast.dizi[6]).toEqual({ step: 'F', octave: 5, acc: 4 }) // Eviç
    expect(rast.inis![6]).toEqual({ step: 'F', octave: 5, acc: 0 }) // Acem
    expect(neva.dizi[5]).toEqual({ step: 'F', octave: 5, acc: 4 }) // Eviç
    const r = metin('makam:rast')
    expect(r).toMatch(/Rast'tan sayınca yedinci ses Acem/)
    expect(r).toMatch(/yedinci ses Eviç/)
    expect(r).toMatch(/yedinci sesin değiştiğini/)
    expect(r).not.toMatch(/altıncı/)
    expect(metin('makam:neva')).toMatch(/altıncı/)
    expect(metin('makam:neva')).not.toMatch(/yedinci/)
  })

  it('makam:giris: durak, güçlü, yeden, asma karar, seyir; makam dörtlü ve beşliden kurulur (Rast örneği)', () => {
    const m = metin('makam:giris')
    for (const terim of ['dizi', 'durak', 'güçlü', 'yeden', 'asma karar', 'seyir', 'dörtlü', 'beşli']) expect(m, terim).toContain(terim)
    const rast = makam('rast')
    // Rast örneği: beşli (ilk beş ses) ve Nevâ'daki dörtlü (son dört ses).
    const p = porteler('makam:giris').map((b) => perdeler(b.olaylar))
    expect(p).toContainEqual(rast.dizi.slice(0, 5))
    expect(p).toContainEqual(rast.dizi.slice(4))
    expect(m).toContain(rast.yapi!)
    expect(ders('makam:giris').alistirma).toBe('/makam')
  })

  it('makam:giris Uşşak ve Hicaz derslerini Seviye 4’e bırakır', () => {
    expect(metin('makam:giris')).toMatch(/Seviye 4/)
  })

  it('makam portelerinin hepsi telefona sığar (en çok sekiz olay) ve diziEvents ile aynı sayıdadır', () => {
    for (const id of ['makam:giris', 'makam:rast', 'makam:neva'])
      for (const b of porteler(id)) expect(b.olaylar.length, id).toBeLessThanOrEqual(8)
    expect(porteler('makam:neva').some((b) => JSON.stringify(b.olaylar) === JSON.stringify(diziEvents(makam('neva').dizi, 'quarter')))).toBe(true)
    expect(cikisInisEvents(makam('neva').dizi)).toHaveLength(15)
  })

  it('makamDersleri: giriş ve makamın kendi dersi; dersi olmayan makamda yalnız giriş', () => {
    expect(makamDersleri('rast')).toEqual(['makam:giris', 'makam:rast'])
    expect(makamDersleri('neva')).toEqual(['makam:giris', 'makam:neva'])
    expect(makamDersleri('ussak')).toEqual(['makam:giris'])
    expect(makamDersleri('hicaz')).toEqual(['makam:giris'])
  })

  it('etut:kademe "öneri" der: aynı parmak, yalnız nefes değişir; önce uzun sonra kısa değerler; kalıplar bu uygulamanın önerisi', () => {
    const m = metin('etut:kademe')
    expect(m).toMatch(/öneri/)
    expect(m).toMatch(/bu uygulamanın önerisi/)
    expect(m).toMatch(/aynı parmak/)
    expect(m).toMatch(/yalnız nefes/)
    expect(m).toMatch(/kırıl/)
    expect(m).toMatch(/uzun[\s\S]*kısa/)
    // Porte örneği Dügâh–Hüseynî etüdünün ilk ölçüleridir.
    const etut = ETUTLER.find((e) => e.id === 'kademe-dugah-huseyni')!
    expect(porteler('etut:kademe').map((b) => b.olaylar)).toContainEqual(etut.olcu.slice(0, 3).flat())
  })

  it.each(IDS)('%s: BELİRSİZ yazılmaz, "Kendin dene" ve dolu kaynaklar var', (id) => {
    expect(metin(id)).not.toMatch(/BELİRSİZ/i)
    expect(ders(id).bloklar.some((b) => b.tur === 'dene')).toBe(true)
    expect(ders(id).kaynaklar.length).toBeGreaterThan(0)
  })
})
