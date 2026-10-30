import { afterEach, describe, expect, it, vi } from 'vitest'
import { ETUTLER } from '../content/etutler'
import { NEY_PERDELER } from '../content/ney-perdeler'
import { PARCALAR } from '../content/parcalar'
import type { Parca } from '../content/parcalar'
import { USULLER } from '../content/usuller'
import { beats } from '../music/notation'
import type { MusicEvent } from '../music/notation'
import { DEFAULT_TUNING, soundingHz } from '../music/ahenk'

// Çekirdeğin gerçek (kullanılmayan) kabelsalat bağımlılığı Node'da yüklenmez; yalnızca onu taklit ederiz.
vi.mock('@kabelsalat/web', () => ({ SalatRepl: class {} }))
vi.mock('./player', () => ({ unlockAudio: vi.fn(), playLoop: vi.fn(), stopAudio: vi.fn() }))

import { buildCalismaCode, konumBul, measureBeats, olcuVurusu } from './calisma'
import type { CalismaSecenek } from './calisma'
import { melodyChain, NEY_SESLERI, ONE_SHOT, SOUND_CHAIN, toToneEvents } from './pattern'
import type { NeySesi } from './pattern'
import { SHAKUHACHI_SOUND } from './shakuhachi'
import { buildUsulBody, metronomeBody } from './usul'
import { setUsulSesi } from './usulSamples'
import type { UsulSesi } from './usulSamples'

const tekNeva = ETUTLER.find((e) => e.id === 'tek-neva')!
const iki = ETUTLER.find((e) => e.id === 'iki-neva-cargah')!
const toplam = (olcu: MusicEvent[][]) => olcu.flat().reduce((t, e) => t + beats(e), 0)
const usulOf = (id: string) => USULLER.find((u) => u.id === id)!
const parca = (id: string): Parca => PARCALAR.find((p) => p.id === id)!
const TIK = [1200, 800]
const NEVA_YAZIM = NEY_PERDELER.find((p) => p.id === 'neva')!.written
const A4: MusicEvent = { kind: 'note', pitch: { step: 'A', octave: 4, acc: 0 }, dur: 'quarter' }
const A4H: MusicEvent = { kind: 'note', pitch: { step: 'A', octave: 4, acc: 0 }, dur: 'half' }

/** Sofyan, ilk ölçüsü tek dörtlük (anacrusis), ardından iki tam ölçü: toplam 9 vuruş. */
const anacrusis: Parca = {
  id: 'deneme',
  title: 'Deneme',
  makam: 'ussak',
  usul: 'sofyan',
  composer: 'Anonim',
  source: '',
  olcu: [[A4], [A4, A4, A4, A4], [A4, A4, A4, A4]],
}

interface Hit {
  at: number
  s?: string
  freq?: number
  gain?: number
  /** Tutma süresi (sorgu-döngüsü; clip dahil). */
  hold: number
  decay?: number
  release?: number
  bandf?: number
  penv?: number
}

/**
 * Gerçek Strudel çekirdeğiyle: bpm = 60'ta `.cpm(60 / (giriş + toplam))` = bir sorgu-döngüsü bir dörtlük vuruştur.
 * Dönen `at` değerleri sorgu-döngüsü (saniye) cinsindendir.
 */
async function hits(code: string, from: number, to: number): Promise<Hit[]> {
  const { evalScope } = await import('@strudel/core')
  const { evaluate, transpiler } = await import('@strudel/transpiler')
  await evalScope(import('@strudel/core'), import('@strudel/mini'))
  const { pattern } = await evaluate(code, transpiler)
  return pattern
    .queryArc(from, to)
    .filter((h) => h.hasOnset())
    .map((h) => ({ at: Math.round(Number(h.whole.begin) * 1e6) / 1e6, hold: Number(h.duration), ...h.value }) as Hit)
    .sort((a, b) => a.at - b.at)
}

/** Giriş sayımı ve metronom tıkları (sentez, 1200/800 Hz sinüs); "melodi" bunların ve usul seslerinin dışıdır. */
const clicks = (hs: Hit[]) => hs.filter((h) => h.freq !== undefined && TIK.includes(h.freq))
const usulKayit = (hs: Hit[]) => hs.filter((h) => typeof h.s === 'string' && h.s.startsWith('usul_'))
const melody = (hs: Hit[]) => hs.filter((h) => (h.freq === undefined || !TIK.includes(h.freq)) && !h.s?.startsWith('usul_'))
/** Oryantal usul sesleri: düm gövdesi 65 Hz sinüs, tek/te/ke tıkı bant geçirenli gürültü; melodi perde zarfı olmayan üçgen. */
const isMelody = (h: Hit, s = 'triangle') => h.s === s && h.penv === undefined
const isDum = (h: Hit) => h.s === 'sine' && h.freq === 65
const isTekClick = (h: Hit) => h.s === 'white' && h.bandf === 3000

const totalBeats = (p: Parca) => toToneEvents(p.olcu.flat(), DEFAULT_TUNING).reduce((s, e) => s + e.beats, 0)

/** Etüt çalımı: usulsüzde 'usul' metronoma düşer. */
const etutSecenek: CalismaSecenek = { melodi: true, eslik: 'usul', voice: 'mevcut', isaret: false }
/** Parça çalımı (Dinle): usul eşliği açıkken 'usul', kapalıyken yalnız giriş sayımı. */
const parcaKodu = (p: Parca, bpm: number, withUsul: boolean, voice: NeySesi = 'shakuhachi', usulSesi: UsulSesi = 'oryantal') =>
  buildCalismaCode(p.olcu, DEFAULT_TUNING, bpm, {
    melodi: true,
    eslik: withUsul ? 'usul' : 'yok',
    voice,
    usul: usulOf(p.usul),
    usulSesi,
    isaret: false,
  })

describe('measureBeats / olcuVurusu', () => {
  it('ölçü süresi dörtlük cinsindendir (Sofyan 4/4 → 4, Dolap 12/8 → 6, Aksak 9/8 → 4.5)', () => {
    expect(measureBeats(usulOf('sofyan'))).toBe(4)
    expect(measureBeats(usulOf('dolap'))).toBe(6)
    expect(measureBeats(usulOf('aksak'))).toBe(4.5)
  })

  it('olcuVurusu: usulsüz 4, usullü measureBeats', () => {
    expect(olcuVurusu()).toBe(4)
    expect(olcuVurusu(usulOf('semai'))).toBe(3)
    expect(olcuVurusu(usulOf('yuruk-semai'))).toBe(3)
  })
})

describe('buildCalismaCode: etüt', () => {
  const opts = etutSecenek

  it('durationMs giriş ölçüsünü içerir: (4 + toplam vuruş) · 60000 / bpm; girisVurus / toplamVurus', () => {
    const total = toplam(tekNeva.olcu)
    expect(total).toBe(20)
    expect(buildCalismaCode(tekNeva.olcu, DEFAULT_TUNING, 60, opts).durationMs).toBe(24000)
    expect(buildCalismaCode(tekNeva.olcu, DEFAULT_TUNING, 40, opts).durationMs).toBe(36000)
    expect(buildCalismaCode(tekNeva.olcu, DEFAULT_TUNING, 60, { ...opts, melodi: false }).durationMs).toBe(24000)
    expect(buildCalismaCode(tekNeva.olcu, DEFAULT_TUNING, 60, { ...opts, eslik: 'yok' }).durationMs).toBe(24000)
    const r = buildCalismaCode(tekNeva.olcu, DEFAULT_TUNING, 60, opts)
    expect(r.girisVurus).toBe(4)
    expect(r.toplamVurus).toBe(20)
  })

  it('tek seferlik maske ve cpm = bpm / (giriş + toplam vuruş)', () => {
    const { code } = buildCalismaCode(tekNeva.olcu, DEFAULT_TUNING, 60, opts)
    expect(code.endsWith(`${ONE_SHOT}.cpm(2.5)`)).toBe(true)
    expect(buildCalismaCode(iki.olcu, DEFAULT_TUNING, 90, opts).code.endsWith(`${ONE_SHOT}.cpm(${90 / 36})`)).toBe(true)
  })

  it('melodi:false: melodi katmanı yoktur, yalnız tık (1200/800 Hz sinüs) çalar', async () => {
    const { code } = buildCalismaCode(tekNeva.olcu, DEFAULT_TUNING, 60, { ...opts, melodi: false })
    expect(code).not.toContain(SHAKUHACHI_SOUND)
    expect(code).not.toContain(melodyChain('mevcut'))
    for (const [, deger] of code.matchAll(/freq\("([^"]*)"\)/g)) {
      expect(deger!.split(' ').every((t) => TIK.includes(Number(t.split('@')[0])))).toBe(true)
    }
    const hs = await hits(code, 0, 24)
    expect(melody(hs)).toHaveLength(0)
    // Giriş + 5 ölçü = 6 ölçü × 4 tık; her ölçünün ilki vurgulu (1200).
    expect(hs.map((h) => h.at)).toEqual(Array.from({ length: 24 }, (_, i) => i))
    expect(hs.map((h) => h.freq)).toEqual(Array.from({ length: 24 }, (_, i) => (i % 4 === 0 ? 1200 : 800)))
  })

  it("eslik:'yok': tık yalnız giriş ölçüsünde, melodi giriş ölçüsünden sonra başlar", async () => {
    const { code } = buildCalismaCode(tekNeva.olcu, DEFAULT_TUNING, 60, { ...opts, eslik: 'yok' })
    const hs = await hits(code, 0, 24)
    expect(clicks(hs).map((h) => h.at)).toEqual([0, 1, 2, 3])
    expect(clicks(hs).map((h) => h.freq)).toEqual([1200, 800, 800, 800])
    const m = melody(hs)
    expect(m[0]!.at).toBe(4)
    expect(m[0]!.freq).toBeCloseTo(soundingHz(NEVA_YAZIM, DEFAULT_TUNING), 1)
    // tek-neva: ölçü 1 birlik, ölçü 2 ikilik + sus, ölçü 3: üç dörtlük + sus, ölçü 4: iki ikilik, ölçü 5 birlik.
    expect(m.map((h) => h.at)).toEqual([4, 8, 12, 13, 14, 16, 18, 20])
  })

  it('metronom ve melodi açıkken tık sonuna dek sürer, melodi giriş sayımından sonra başlar', async () => {
    const { code, durationMs } = buildCalismaCode(iki.olcu, DEFAULT_TUNING, 60, opts)
    const total = toplam(iki.olcu)
    const hs = await hits(code, 0, durationMs / 1000)
    expect(clicks(hs)).toHaveLength(4 + total)
    expect(clicks(hs).map((h) => h.at)).toEqual(Array.from({ length: 4 + total }, (_, i) => i))
    expect(melody(hs)[0]!.at).toBe(4)
    expect(melody(hs).every((h) => h.at >= 4)).toBe(true)
  })

  it('tek seferliktir: ikinci döngüde ses çalmaz', async () => {
    const { code, durationMs } = buildCalismaCode(tekNeva.olcu, DEFAULT_TUNING, 60, opts)
    const T = durationMs / 1000
    expect(await hits(code, T, 3 * T)).toHaveLength(0)
  })

  it('melodi ney sesiyle çalar; tempo tıkın süresini belirler', () => {
    const { code } = buildCalismaCode(tekNeva.olcu, DEFAULT_TUNING, 60, { ...opts, voice: 'shakuhachi' })
    expect(code).toContain(melodyChain('shakuhachi'))
    expect(buildCalismaCode(tekNeva.olcu, DEFAULT_TUNING, 60, opts).code).toContain('.decay(0.3)')
    expect(buildCalismaCode(tekNeva.olcu, DEFAULT_TUNING, 40, opts).code).toContain('.decay(0.45)')
  })

  describe('usul verilince', () => {
    const semai = usulOf('semai')
    const sofyan = usulOf('sofyan')
    const usulSemai = ETUTLER.find((e) => e.id === 'usul-semai')!
    const usulSofyan = ETUTLER.find((e) => e.id === 'usul-sofyan')!

    it('durationMs = (zaman + toplam) × 60000 / bpm; cpm = bpm / (zaman + toplam)', () => {
      const total = toplam(usulSemai.olcu)
      expect(total).toBe(24)
      const r = buildCalismaCode(usulSemai.olcu, DEFAULT_TUNING, 60, { ...opts, usul: semai })
      expect(r.durationMs).toBe(27000)
      expect(r.girisVurus).toBe(3)
      expect(r.code.endsWith(`${ONE_SHOT}.cpm(${60 / 27})`)).toBe(true)
      expect(buildCalismaCode(usulSemai.olcu, DEFAULT_TUNING, 40, { ...opts, eslik: 'yok', usul: semai }).durationMs).toBe(
        (27 * 60000) / 40,
      )
    })

    it("eslik:'yok': giriş sayımı usul.zaman tık, usul sesi yok, melodi sayımdan sonra", async () => {
      const { code, durationMs } = buildCalismaCode(usulSemai.olcu, DEFAULT_TUNING, 60, { ...opts, eslik: 'yok', usul: semai })
      const hs = await hits(code, 0, durationMs / 1000)
      expect(clicks(hs).map((h) => h.at)).toEqual([0, 1, 2])
      expect(clicks(hs).map((h) => h.freq)).toEqual([1200, 800, 800])
      expect(usulKayit(hs)).toHaveLength(0)
      expect(code).not.toContain('usul_')
      expect(melody(hs)[0]!.at).toBe(3)
    })

    it("eslik:'usul': giriş sayımı tık, sonra döngü boyunca usul sesi (her ölçü düm tek tek); başka tık yok", async () => {
      const { code, durationMs } = buildCalismaCode(usulSemai.olcu, DEFAULT_TUNING, 60, { ...opts, usul: semai })
      expect(code).toContain(buildUsulBody(semai, 60))
      const hs = await hits(code, 0, durationMs / 1000)
      expect(clicks(hs).map((h) => h.at)).toEqual([0, 1, 2])
      const u = usulKayit(hs)
      // 8 ölçü × 3 vuruş; vuruşlar giriş sayımından sonra başlar.
      expect(u.map((h) => h.at)).toEqual(Array.from({ length: 24 }, (_, i) => 3 + i))
      expect(u.map((h) => h.s)).toEqual(Array.from({ length: 24 }, (_, i) => (i % 3 === 0 ? 'usul_tahta_dum' : 'usul_tahta_tek')))
      expect(await hits(code, durationMs / 1000, (3 * durationMs) / 1000)).toHaveLength(0)
    })

    it('Sofyan: giriş 4 tık; düm 2 zaman sürer (her ölçüde düm, te, ke)', async () => {
      const { code, durationMs } = buildCalismaCode(usulSofyan.olcu, DEFAULT_TUNING, 60, { ...opts, melodi: false, usul: sofyan })
      expect(durationMs).toBe((4 + 32) * 1000)
      const hs = await hits(code, 0, durationMs / 1000)
      expect(clicks(hs).map((h) => h.at)).toEqual([0, 1, 2, 3])
      expect(usulKayit(hs).map((h) => h.at)).toEqual(Array.from({ length: 8 }, (_, i) => [4 + 4 * i, 6 + 4 * i, 7 + 4 * i]).flat())
      expect(melody(hs)).toHaveLength(0)
    })

    it('Sofyan: usul katmanı sayımdan sonraki bölüme sıkıştırılır (.compress(4 / (4 + toplam), 1))', () => {
      const total = toplam(tekNeva.olcu)
      const r = buildCalismaCode(tekNeva.olcu, DEFAULT_TUNING, 60, {
        melodi: true,
        eslik: 'usul',
        voice: 'shakuhachi',
        usul: sofyan,
        isaret: false,
      })
      expect(r.code).toContain(`.compress(4 / ${4 + total}, 1)`)
      expect(r.girisVurus).toBe(4)
      expect(r.toplamVurus).toBe(total)
    })
  })

  it("eslik:'metronom' usullü (Yürük Semâî 6/8): tık usulün biriminde bütün süre boyunca, usul sesi yok", async () => {
    const yuruk = usulOf('yuruk-semai')
    const olcu = [
      [A4, A4, A4],
      [A4, A4, A4],
    ]
    const r = buildCalismaCode(olcu, DEFAULT_TUNING, 60, { melodi: true, eslik: 'metronom', voice: 'mevcut', usul: yuruk, isaret: false })
    // ölçü = 3 dörtlük; giriş + 6 = 9 dörtlük döngü ⇒ ölçü deseni 3 kez
    expect(r.code).toContain(`${metronomeBody(6, (60 * 8) / 4)}.fast(${9 / 3})`)
    expect(r.code).not.toContain('usul_')
    const tik = clicks(await hits(r.code, 0, 9))
    expect(tik.map((h) => h.at)).toEqual(Array.from({ length: 18 }, (_, i) => i / 2))
    expect(tik.filter((h) => h.freq === 1200).map((h) => h.at)).toEqual([0, 3, 6])
  })

  it("eslik:'usul' yalnız anacrusis seçiliyse (tam ölçü yok) usul katmanı eklenmez; sayım ölçü ızgarasında sürer", async () => {
    const { code, girisVurus } = buildCalismaCode([[A4]], DEFAULT_TUNING, 60, {
      melodi: true,
      eslik: 'usul',
      voice: 'mevcut',
      usul: usulOf('sofyan'),
      isaret: false,
    })
    expect(girisVurus).toBe(7)
    expect(code).not.toContain('usul_')
    expect(code).not.toContain('white')
    const hs = await hits(code, 0, 9)
    expect(clicks(hs).map((h) => h.at)).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(hs.filter((h) => isMelody(h)).map((h) => h.at)).toEqual([7])
  })

  it('anacrusis: giriş = 2 ölçü − anacrusis; sayım bir ölçülük tık gövdesinin .fast(giriş / ölçü) hâli, usul 2 ölçü sonra', () => {
    const sofyan = usulOf('sofyan')
    // ilk ölçü tek dörtlük, ardından iki tam ölçü: toplam 9, giriş 2 × 4 − 1 = 7, döngü 16.
    const olcu = [[A4], [A4, A4, A4, A4], [A4, A4, A4, A4]]
    const r = buildCalismaCode(olcu, DEFAULT_TUNING, 60, { melodi: true, eslik: 'usul', voice: 'mevcut', usul: sofyan, isaret: false })
    expect(r.girisVurus).toBe(7)
    expect(r.toplamVurus).toBe(9)
    expect(r.durationMs).toBe(16000)
    expect(r.code).toContain(`${metronomeBody(4, 60)}.fast(${7 / 4}).compress(0, 7 / 16)`)
    expect(r.code).toContain('freq("~@7 ')
    expect(r.code).toContain(`.compress(8 / 16, 1)`)
    expect(r.code.endsWith(`${ONE_SHOT}.cpm(${60 / 16})`)).toBe(true)
    // İlk ölçü tamsa her şey eskisi gibi: sayım tek ölçü, .fast yok.
    const tam = buildCalismaCode(olcu.slice(1), DEFAULT_TUNING, 60, { melodi: true, eslik: 'usul', voice: 'mevcut', usul: sofyan, isaret: false })
    expect(tam.girisVurus).toBe(4)
    expect(tam.code).toContain(`${metronomeBody(4, 60)}.compress(0, 4 / 12)`)
  })

  it('aksak (9/8): giriş 4.5 dörtlük, sayım metronomeBody(9, bpm × 2); durationMs = (4.5 + toplam) × 60000 / bpm', () => {
    const aksak = usulOf('aksak')
    // Tam bir 9/8 ölçüsü (4.5 dörtlük): ilk ölçü kısa olsaydı anacrusis sayılırdı.
    const A4E: MusicEvent = { ...A4, dur: 'eighth' }
    const olcu = [[A4H, A4H, A4E]]
    const total = 4.5
    for (const bpm of [60, 80]) {
      const r = buildCalismaCode(olcu, DEFAULT_TUNING, bpm, { melodi: true, eslik: 'yok', voice: 'mevcut', usul: aksak, isaret: false })
      expect(r.girisVurus).toBe(4.5)
      expect(r.toplamVurus).toBe(total)
      expect(r.durationMs).toBe(((4.5 + total) * 60000) / bpm)
      expect(r.code).toContain(`${metronomeBody(9, bpm * 2)}.compress(0, 4.5 / ${4.5 + total})`)
      expect(r.code.endsWith(`${ONE_SHOT}.cpm(${bpm / (4.5 + total)})`)).toBe(true)
    }
  })

  it('melodi ve eşlik kapalıyken (mikrofonla takip) yalnız giriş sayımı; süre yine seçimin tamamıdır', () => {
    const total = toplam(tekNeva.olcu)
    const r = buildCalismaCode(tekNeva.olcu, DEFAULT_TUNING, 60, { ...opts, melodi: false, eslik: 'yok' })
    expect(r.code).toBe(`${metronomeBody(4, 60)}.compress(0, 4 / ${4 + total})${ONE_SHOT}.cpm(${60 / (4 + total)})`)
    expect(r.durationMs).toBe((4 + total) * 1000)
    expect(r.girisVurus).toBe(4)
  })

  it('tempo geçersizse ya da ses yoksa RangeError', () => {
    expect(() => buildCalismaCode(tekNeva.olcu, DEFAULT_TUNING, 0, opts)).toThrow(RangeError)
    expect(() => buildCalismaCode([], DEFAULT_TUNING, 60, opts)).toThrow(RangeError)
  })

  describe('ses saati işareti', () => {
    it('varsayılan açık: kod s("notasi_isaret") katmanını içerir; isaret:false iken içermez', () => {
      const { isaret: _kapali, ...varsayilan } = etutSecenek
      const acik = buildCalismaCode(tekNeva.olcu, DEFAULT_TUNING, 60, varsayilan)
      expect(acik.code).toContain('s("notasi_isaret")')
      expect(acik.code.startsWith('stack(')).toBe(true)
      expect(acik.durationMs).toBe(24000)
      expect(buildCalismaCode(tekNeva.olcu, DEFAULT_TUNING, 60, { ...varsayilan, isaret: true }).code).toContain('s("notasi_isaret")')
      expect(buildCalismaCode(tekNeva.olcu, DEFAULT_TUNING, 60, { ...varsayilan, isaret: false }).code).not.toContain('notasi_isaret')
    })
  })

  describe('bağlı etüt (dil-1)', () => {
    const dil = ETUTLER.find((e) => e.id === 'dil-1')!

    it('bağlı sesler giriş sayımından sonra da kendi notalarına hizalı: yalnız onlar döngü bölgesinden başlar', async () => {
      const tones = toToneEvents(dil.olcu.flat(), DEFAULT_TUNING).filter((t) => t.hz !== null)
      expect(tones.some((t) => t.legato)).toBe(true)
      const { code } = buildCalismaCode(dil.olcu, DEFAULT_TUNING, 60, { melodi: true, eslik: 'yok', voice: 'shakuhachi', isaret: false })
      const melodi = (await hits(code, 0, 4 + toplam(dil.olcu))).filter((h) => h.s === SHAKUHACHI_SOUND)
      expect(melodi.map((h) => h.freq)).toEqual(tones.map((t) => Number(t.hz!.toFixed(2))))
      expect(melodi.map((h) => (h as { begin?: number }).begin)).toEqual(tones.map((t) => (t.legato ? 1 : 0)))
    })
  })
})

describe('buildCalismaCode: parça', () => {
  it('seçilen ney sesinin zincirini kullanır (usullü ve usulsüz)', () => {
    const p = parca('hak-teala')
    const tones = toToneEvents(p.olcu.flat(), DEFAULT_TUNING)
    for (const v of NEY_SESLERI) {
      for (const withUsul of [false, true]) {
        const { code } = parcaKodu(p, 60, withUsul, v)
        expect(code.startsWith('stack(freq("~@4 ')).toBe(true)
        expect(code).toContain(`")${melodyChain(v, tones, { lead: 4, bpm: 60 })}, `)
      }
    }
  })

  it('nefesli parça: melodi frekansları mevcut ile aynı, usul katmanı değişmez', async () => {
    const p = parca('hak-teala')
    const mevcut = await hits(parcaKodu(p, 60, true, 'mevcut').code, 0, 20)
    const nefesli = await hits(parcaKodu(p, 60, true, 'nefesli').code, 0, 20)
    const melodi = (hs: Hit[], s: string) => hs.filter((h) => isMelody(h, s)).map((h) => [h.at, h.freq])
    expect(melodi(nefesli, 'triangle')).toEqual(melodi(mevcut, 'triangle'))
    expect(nefesli.filter((h) => h.s === 'pink').map((h) => h.at)).toEqual(melodi(mevcut, 'triangle').map(([at]) => at))
    const usul = (hs: Hit[]) => hs.filter((h) => !isMelody(h) && h.s !== 'pink')
    expect(usul(mevcut).some((h) => h.s === 'triangle' && h.freq === 250)).toBe(true)
    expect(usul(nefesli)).toEqual(usul(mevcut))
  })

  it('eşliksiz: melodi ve giriş sayımı, ses zinciri, cpm = bpm / (giriş + toplam vuruş); süre toplam vuruştan', () => {
    const p = parca('hak-teala')
    const { code, durationMs, girisVurus, toplamVurus } = parcaKodu(p, 60, false, 'mevcut')
    expect(totalBeats(p)).toBe(124)
    expect(code.startsWith('stack(freq("')).toBe(true)
    expect(code).toContain(SOUND_CHAIN)
    expect(code).toContain(`.cpm(${60 / 128})`)
    expect(code).not.toContain('white')
    expect(code).not.toContain('usul_')
    expect(durationMs).toBe(128000)
    expect(girisVurus).toBe(4)
    expect(toplamVurus).toBe(124)
    expect(parcaKodu(p, 80, false, 'mevcut').durationMs).toBe((128 * 60000) / 80)
  })

  it('melodi adım sayısı bağlar birleştirilmiş ToneEvent sayısına eşittir (başa giriş susu)', () => {
    for (const p of PARCALAR) {
      const { code } = parcaKodu(p, 60, true, 'mevcut')
      const steps = /freq\("([^"]*)"\)/.exec(code)![1]!.split(' ')
      expect(steps[0]).toBe(`~@${measureBeats(usulOf(p.usul))}`)
      expect(steps).toHaveLength(toToneEvents(p.olcu.flat(), DEFAULT_TUNING).length + 1)
    }
  })

  it('usul eşliği açıkken kod yeni usul seslerini (perde zarfı, bpf, süreye göre sönme) içerir', () => {
    const { code } = parcaKodu(parca('hak-teala'), 60, true, 'mevcut')
    expect(code.startsWith('stack(')).toBe(true)
    expect(code).toContain('freq("65@2 ~@1 ~@1").s("sine").penv(')
    expect(code).toContain('freq("250@2 ~@1 ~@1").s("triangle").penv(')
    expect(code).toContain('.pdecay(')
    expect(code).toContain('.bpf(3000)')
    // Sofyan (mertebe 4) ♩ = 60 ⇒ usul birimi 1 sn: sönme 0.9 × süre
    expect(code).toContain('.decay("1.8@2 0.9@1 0.9@1")')
    expect(code).toContain('white')
    expect(code).toContain('.fast(31)')
    // Dolap (mertebe 8) ♩ = 60 ⇒ sekizlik 0.5 sn: tık 0.3 × 0.5
    expect(parcaKodu(parca('benim-adim-dertli-dolap'), 60, true, 'mevcut').code).toContain('.decay(0.15)')
  })

  it('geçersiz tempo RangeError fırlatır', () => {
    expect(() => parcaKodu(parca('hak-teala'), 0, true, 'mevcut')).toThrow(RangeError)
  })
})

describe('buildCalismaCode: parça, gerçek Strudel çekirdeğiyle', () => {
  it('Hak Teâlâ: ilk ölçünün melodi başlangıçları giriş sayımından sonra, doğru frekanslarla', async () => {
    const p = parca('hak-teala')
    const { code } = parcaKodu(p, 60, true, 'mevcut')
    const melodi = (await hits(code, 0, 8)).filter((h) => isMelody(h))
    const first = toToneEvents(p.olcu[0]!, DEFAULT_TUNING)
    const expected: [number, number][] = []
    let t = 4
    for (const e of first) {
      if (e.hz !== null) expected.push([t, Number(e.hz.toFixed(2))])
      t += e.beats
    }
    expect(melodi.map((h) => [h.at, h.freq])).toEqual(expected)
  })

  it('Hak Teâlâ (Sofyan): sayım 4 tık, sonra her ölçü başında düm, 3. ve 4. vuruşta te-ke; parça bitince ses yok', async () => {
    const p = parca('hak-teala')
    const { code } = parcaKodu(p, 60, true, 'mevcut')
    const hs = await hits(code, 0, 128)
    expect(clicks(hs).map((h) => h.at)).toEqual([0, 1, 2, 3])
    const dum = hs.filter(isDum)
    expect(dum.map((h) => h.at)).toEqual(Array.from({ length: 31 }, (_, i) => 4 + i * 4))
    const noise = hs.filter(isTekClick).map((h) => h.at)
    expect(noise).toEqual(Array.from({ length: 31 }, (_, i) => [4 + i * 4 + 2, 4 + i * 4 + 3]).flat())
    // ♩ = 60, Sofyan birimi dörtlük: 2 zamanlık düm 1.8 sn söner ve 1.8 sn tutulur (1 sorgu-döngüsü = 1 sn).
    for (const h of dum) {
      expect(h.decay).toBeCloseTo(1.8, 6)
      expect(h.hold).toBeCloseTo(1.8, 6)
    }
    expect(await hits(code, 128, 600)).toEqual([])
  })

  it('usul eşliği kapalıyken yalnızca giriş sayımı tıkı ve melodi çalar', async () => {
    const { code } = parcaKodu(parca('hak-teala'), 60, false, 'mevcut')
    const hs = await hits(code, 0, 128)
    expect(clicks(hs).map((h) => h.at)).toEqual([0, 1, 2, 3])
    const digerleri = hs.filter((h) => !clicks([h]).length)
    expect(digerleri.length).toBeGreaterThan(0)
    expect(digerleri.every((h) => h.s === 'triangle')).toBe(true)
  })

  it('Dolap (12/8, vuruş yok): metronom, ölçü = 6 dörtlük, sekizlik başına bir tık, ilki vurgulu; sayım dahil', async () => {
    const p = parca('benim-adim-dertli-dolap')
    expect(totalBeats(p)).toBe(48)
    const { code } = parcaKodu(p, 60, true, 'mevcut')
    expect(code).not.toContain('white')
    const tiklar = (await hits(code, 0, 54)).filter((h) => h.s === 'sine')
    // Giriş ölçüsü + 8 ölçü = 9 ölçü × 12 tık.
    expect(tiklar).toHaveLength(9 * 12)
    expect(tiklar.map((h) => h.at)).toEqual(Array.from({ length: 108 }, (_, i) => i / 2))
    expect(tiklar.filter((h) => h.freq === 1200).map((h) => h.at)).toEqual([0, 6, 12, 18, 24, 30, 36, 42, 48])
    expect(await hits(code, 54, 300)).toEqual([])
  })

  it('anacrusis: sayım ölçü ızgarasında anacrusis başına dek tıklar, anacrusis sayılan 2. ölçünün sonunu doldurur, usul tam 2 ölçü sonra', async () => {
    const { code, durationMs, girisVurus } = parcaKodu(anacrusis, 60, true, 'mevcut')
    // giriş = 2 × 4 − 1 = 7; döngü 7 + 9 = 16 dörtlük.
    expect(girisVurus).toBe(7)
    expect(durationMs).toBe(16000)
    const hs = await hits(code, 0, 16)
    expect(clicks(hs).map((h) => h.at)).toEqual([0, 1, 2, 3, 4, 5, 6])
    // Izgara sürer: 2. sayım ölçüsünün başı da vurgulu tıktır.
    expect(clicks(hs).filter((h) => h.freq === 1200).map((h) => h.at)).toEqual([0, 4])
    expect(hs.filter((h) => isMelody(h)).map((h) => h.at)).toEqual([7, 8, 9, 10, 11, 12, 13, 14, 15])
    expect(hs.filter(isDum).map((h) => h.at)).toEqual([8, 12]) // usul düm'ü tam 2 ölçü sonra (8 = 2 × 4)
    expect(hs.filter(isTekClick).map((h) => h.at)).toEqual([10, 11, 14, 15])
    expect(await hits(code, 16, 100)).toEqual([])
  })

  it('anacrusis, usul eşliği kapalı: sayım yine anacrusis başına dek tıklar, melodi 7. vuruşta', async () => {
    const { code, durationMs } = parcaKodu(anacrusis, 60, false, 'mevcut')
    expect(durationMs).toBe(16000)
    const hs = await hits(code, 0, 16)
    expect(clicks(hs).map((h) => h.at)).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(hs.filter((h) => isMelody(h))[0]!.at).toBe(7)
  })

  it("anacrusis, eslik:'metronom': ölçü başı tıkları 0, 4, 8, 12'de; anacrusis 2. ölçünün son vuruşunda", async () => {
    const { code } = buildCalismaCode(anacrusis.olcu, DEFAULT_TUNING, 60, {
      melodi: true,
      eslik: 'metronom',
      voice: 'mevcut',
      usul: usulOf('sofyan'),
      isaret: false,
    })
    const hs = await hits(code, 0, 16)
    expect(clicks(hs).map((h) => h.at)).toEqual(Array.from({ length: 16 }, (_, i) => i))
    expect(clicks(hs).filter((h) => h.freq === 1200).map((h) => h.at)).toEqual([0, 4, 8, 12])
    expect(hs.filter((h) => isMelody(h))[0]!.at).toBe(7)
  })

  it('Yürük Semâî (6/8) anacrusis: ilk usul hap\'i giriş + anacrusis vuruşunda', async () => {
    const yuruk = usulOf('yuruk-semai')
    // 6/8 ölçü = 3 dörtlük; ilk ölçü tek dörtlük (lead 1), ardından iki tam ölçü: toplam 7 vuruş.
    const olcu = [[A4], [A4, A4, A4], [A4, A4, A4]]
    const { code, girisVurus, durationMs } = buildCalismaCode(olcu, DEFAULT_TUNING, 60, {
      melodi: true,
      eslik: 'usul',
      voice: 'mevcut',
      usul: yuruk,
      usulSesi: 'tahta',
      isaret: false,
    })
    // giriş = 2 × 3 − 1 = 5; döngü 5 + 7 = 12 dörtlük.
    expect(girisVurus).toBe(5)
    expect(durationMs).toBe(12000)
    const hs = await hits(code, 0, 12)
    const u = usulKayit(hs)
    expect(u[0]!.at).toBe(2 * 3) // tam 2 ölçü sonra
    expect(u[0]!.s).toBe('usul_tahta_dum')
    // Yürük Semâî: düm tek tek düm tek(2) ⇒ ikinci düm 1.5 dörtlük sonra; iki tam ölçü.
    expect(u.filter((h) => h.s === 'usul_tahta_dum').map((h) => h.at)).toEqual([6, 7.5, 9, 10.5])
    // Sayım: sekizlik tıklar 0'dan anacrusis başına (5) dek.
    expect(clicks(hs).map((h) => h.at)).toEqual(Array.from({ length: 10 }, (_, i) => i / 2))
    expect(hs.filter((h) => isMelody(h))[0]!.at).toBe(5)
  })

  it('tempo iki katına çıkınca her şey yarı sürede çalar', async () => {
    const { code } = parcaKodu(anacrusis, 120, true, 'mevcut')
    const hs = await hits(code, 0, 8)
    expect(hs.filter(isDum).map((h) => h.at)).toEqual([4, 6])
    expect(await hits(code, 8, 50)).toEqual([])
  })

  it('en hızlı tempoda (♩ = 100) da usul seslerinin hiçbiri sonraki vuruşa taşmaz, ≥ 5 ms pay kalır (Dolap ve Sofyan)', async () => {
    for (const id of ['benim-adim-dertli-dolap', 'hak-teala']) {
      const bpm = 100
      const { code } = parcaKodu(parca(id), bpm, true, 'mevcut')
      // Çekirdeğin cpm'i cps = 1 kabul eder: bir sorgu-döngüsü her tempoda 1 sn'dir.
      const hs = (await hits(code, 0, 24)).filter((h) => h.s === 'white' || (h.s === 'sine' && h.release !== undefined))
      expect(hs.length).toBeGreaterThan(0)
      const onsets = [...new Set(hs.map((h) => h.at))].sort((a, b) => a - b)
      for (const h of hs.filter((x) => x.at < onsets[onsets.length - 1]!)) {
        const next = onsets.find((t) => t > h.at + 1e-9)!
        expect(next - (h.at + h.hold + h.release! + 0.01)).toBeGreaterThanOrEqual(0.005 - 1e-9)
      }
    }
  })
})

describe('buildCalismaCode: usul sesi', () => {
  afterEach(() => setUsulSesi('tahta'))

  it('usul katmanı seçilen kayıt sesini kullanır: Hak Teâlâ (Sofyan) düm ölçü başında, te-ke 3. ve 4. vuruşta', async () => {
    const p = parca('hak-teala')
    for (const ses of ['konga', 'tahta', 'darbuka'] as const) {
      const { code } = parcaKodu(p, 60, true, 'mevcut', ses)
      const hs = await hits(code, 0, 128)
      const kayit = usulKayit(hs)
      expect(kayit.filter((h) => h.s === `usul_${ses}_dum`).map((h) => h.at)).toEqual(Array.from({ length: 31 }, (_, i) => 4 + i * 4))
      const teke = ses === 'tahta' ? 'usul_tahta_tek' : `usul_${ses}_teke`
      expect(kayit.filter((h) => h.s === teke).map((h) => h.at)).toEqual(
        Array.from({ length: 31 }, (_, i) => [4 + i * 4 + 2, 4 + i * 4 + 3]).flat(),
      )
      // Sentez usul katmanı yoktur; melodi aynı kalır.
      expect(hs.some(isDum) || hs.some(isTekClick)).toBe(false)
      expect(hs.filter((h) => isMelody(h))).toEqual(
        (await hits(parcaKodu(p, 60, false, 'mevcut', 'oryantal').code, 0, 128)).filter((h) => isMelody(h)),
      )
      expect(await hits(code, 128, 600)).toEqual([])
    }
  }, 20000) // üç ses × 128 vuruşluk gerçek çekirdek sorgusu; toplu koşuda 5 sn'yi aşabiliyor

  it('varsayılan: seçili usul sesi (getUsulSesi); ilk değer tahta', () => {
    const p = parca('hak-teala')
    const varsayilan = () =>
      buildCalismaCode(p.olcu, DEFAULT_TUNING, 60, { melodi: true, eslik: 'usul', voice: 'shakuhachi', usul: usulOf(p.usul), isaret: false })
    expect(varsayilan().code).toBe(parcaKodu(p, 60, true, 'shakuhachi', 'tahta').code)
    setUsulSesi('darbuka')
    const { code } = varsayilan()
    expect(code).toBe(parcaKodu(p, 60, true, 'shakuhachi', 'darbuka').code)
    expect(code).toContain('usul_darbuka_dum')
  })

  it('Dolap parçasında metronom her seçenekte sentez tık olarak kalır', () => {
    const p = parca('benim-adim-dertli-dolap')
    for (const ses of ['konga', 'tahta', 'darbuka'] as const) {
      expect(parcaKodu(p, 60, true, 'mevcut', ses).code).toBe(parcaKodu(p, 60, true, 'mevcut', 'oryantal').code)
    }
  })

  it('♩ = 100 Sofyan parçada kayıt vuruşları sonrakine taşmaz (≥ 5 ms pay)', async () => {
    const { code } = parcaKodu(parca('hak-teala'), 100, true, 'mevcut', 'darbuka')
    const hs = usulKayit(await hits(code, 0, 24))
    expect(hs.length).toBeGreaterThan(0)
    for (const [i, h] of hs.slice(0, -1).entries()) {
      expect(hs[i + 1]!.at - (h.at + h.hold + h.release! + 0.01)).toBeGreaterThanOrEqual(0.005 - 1e-9)
    }
  })
})

describe('konumBul', () => {
  const olcu: MusicEvent[][] = [[A4, A4], [A4H]]

  it('seçimin başından vurus dörtlük sonra çalan olayı bulur', () => {
    expect(konumBul(olcu, 0, 0)).toEqual({ olcu: 0, nota: 0 })
    expect(konumBul(olcu, 0, 1.5)).toEqual({ olcu: 0, nota: 1 })
    expect(konumBul(olcu, 0, 2)).toEqual({ olcu: 1, nota: 0 })
    expect(konumBul(olcu, 0, 3.99)).toEqual({ olcu: 1, nota: 0 })
  })

  it('aralık dışında null', () => {
    expect(konumBul(olcu, 0, 4)).toBeNull()
    expect(konumBul(olcu, 0, -0.1)).toBeNull()
  })

  it('bas verilince sayım o ölçüden başlar', () => {
    expect(konumBul(olcu, 1, 0)).toEqual({ olcu: 1, nota: 0 })
    expect(konumBul(olcu, 1, 2)).toBeNull()
  })

  it('sus da olaydır', () => {
    const sus: MusicEvent = { kind: 'rest', dur: 'quarter' }
    expect(konumBul([[A4, sus, A4]], 0, 1)).toEqual({ olcu: 0, nota: 1 })
  })
})
