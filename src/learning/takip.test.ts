import { describe, expect, it } from 'vitest'
import { NEY_PERDELER } from '../content/ney-perdeler'
import { soundingHz, DEFAULT_TUNING } from '../music/ahenk'
import { centsBetween, samePitch } from '../music/pitch'
import type { MusicEvent, NoteEvent } from '../music/notation'
import type { WrittenPitch } from '../music/pitch'
import {
  beklenenNotalar,
  degerlendir,
  enYakinPerde,
  gecikmeBul,
  gecikmeKestir,
  katlanmisSent,
  KOMA_AYIRT_SENT,
  VARSAYILAN_GECIKME_MS,
  type BeklenenNota,
  type TakipOrnegi,
} from './takip'

const T = DEFAULT_TUNING
const RAST: WrittenPitch = { step: 'G', octave: 4, acc: 0 }
const DUGAH: WrittenPitch = { step: 'A', octave: 4, acc: 0 }
const SEGAH: WrittenPitch = { step: 'B', octave: 4, acc: -1 }
const CARGAH: WrittenPitch = { step: 'C', octave: 5, acc: 0 }
const NEVA: WrittenPitch = { step: 'D', octave: 5, acc: 0 }
const BUSELIK: WrittenPitch = { step: 'B', octave: 4, acc: 0 }
const KURDI: WrittenPitch = { step: 'B', octave: 4, acc: -5 }
const DIK_KURDI: WrittenPitch = { step: 'B', octave: 4, acc: -4 }
/** Ney perdeleri listesinde olmayan yazılı perde (Do4). */
const DO4: WrittenPitch = { step: 'C', octave: 4, acc: 0 }
/** Bir koma (sent). */
const KOMA = 1200 / 53

const nota = (pitch: WrittenPitch, dur: NoteEvent['dur'] = 'quarter', ek: Partial<NoteEvent> = {}): NoteEvent => ({
  kind: 'note',
  pitch,
  dur,
  ...ek,
})

/** Dört dörtlük: Rast, Dügâh, Segâh, Çârgâh (♩=60, giriş 4, t0=10 → 14, 15, 16, 17). */
function dortluk(): { notalar: BeklenenNota[]; hzler: number[] } {
  const olcu: MusicEvent[][] = [[nota(RAST), nota(DUGAH), nota(SEGAH), nota(CARGAH)]]
  return {
    notalar: beklenenNotalar(olcu, 0, T, 60, 10, 4),
    hzler: [RAST, DUGAH, SEGAH, CARGAH].map((p) => soundingHz(p, T)),
  }
}

/** 100 Hz'lik kare damgalarıyla (0.016 sn) sentetik iz; `uret(nota) → hz | null`, gecikme sn. */
function iz(
  notalar: BeklenenNota[],
  gecikme: number,
  uret: (n: BeklenenNota, i: number, t: number) => number | null,
  son = notalar.length ? notalar[notalar.length - 1].son + 1 : 0,
): TakipOrnegi[] {
  const out: TakipOrnegi[] = []
  const bas = notalar.length ? notalar[0].bas - 1 : 0
  for (let t = bas; t < son; t += 0.016) {
    const i = notalar.findIndex((n) => t >= n.bas + gecikme && t < n.son + gecikme)
    out.push({ t, hz: i < 0 ? null : uret(notalar[i], i, t) })
  }
  return out
}

const sentAt = (hz: number, sent: number) => hz * 2 ** (sent / 1200)

describe('beklenenNotalar', () => {
  it('dört dörtlüğün zamanlarını t0 + (giriş + vuruş) × 60 / bpm ile verir', () => {
    const { notalar } = dortluk()
    expect(notalar.map((n) => n.bas)).toEqual([14, 15, 16, 17])
    expect(notalar.map((n) => n.son)).toEqual([15, 16, 17, 18])
    expect(notalar.map((n) => n.nota)).toEqual([0, 1, 2, 3])
    expect(notalar[0].hz).toBeCloseTo(soundingHz(RAST, T), 6)
    expect(notalar.map((n) => n.perde)).toEqual([RAST, DUGAH, SEGAH, CARGAH])
  })

  it('tie ile bağlı iki dörtlük tek nota olur (süre 2)', () => {
    const olcu: MusicEvent[][] = [[nota(RAST, 'quarter', { tie: true }), nota(RAST), nota(DUGAH), nota(SEGAH)]]
    const r = beklenenNotalar(olcu, 0, T, 60, 10, 4)
    expect(r).toHaveLength(3)
    expect(r[0]).toMatchObject({ olcu: 0, nota: 0, bas: 14, son: 16 })
    expect(r[1]).toMatchObject({ nota: 2, bas: 16, son: 17 })
  })

  it('farklı perdeye bağlı tie birleşmez (çalımdaki kuralla aynı): iki ayrı nota', () => {
    const olcu: MusicEvent[][] = [[nota(RAST, 'quarter', { tie: true }), nota(DUGAH), nota(SEGAH), nota(CARGAH)]]
    const r = beklenenNotalar(olcu, 0, T, 60, 10, 4)
    expect(r).toHaveLength(4)
    expect(r[0]).toMatchObject({ nota: 0, bas: 14, son: 15 })
    expect(r[1]).toMatchObject({ nota: 1, bas: 15, son: 16 })
    expect(r[1].hz).toBeCloseTo(soundingHz(DUGAH, T), 6)
  })

  it('tie ile bağlı nota susla kesilirse birleşmez', () => {
    const olcu: MusicEvent[][] = [[nota(RAST, 'quarter', { tie: true }), { kind: 'rest', dur: 'quarter' }, nota(RAST)]]
    const r = beklenenNotalar(olcu, 0, T, 60, 0, 0)
    expect(r.map((n) => [n.nota, n.bas, n.son])).toEqual([
      [0, 0, 1],
      [2, 2, 3],
    ])
  })

  it('ölçü sınırını aşan bağ ilk notanın indislerini korur', () => {
    const olcu: MusicEvent[][] = [
      [nota(DUGAH, 'half'), nota(RAST, 'half', { tie: true })],
      [nota(RAST, 'half'), nota(DUGAH, 'half')],
    ]
    const r = beklenenNotalar(olcu, 0, T, 60, 0, 0)
    expect(r).toHaveLength(3)
    expect(r[1]).toMatchObject({ olcu: 0, nota: 1, bas: 2, son: 6 })
    expect(r[2]).toMatchObject({ olcu: 1, nota: 1, bas: 6, son: 8 })
  })

  it('suslar atlanır ama zamanı geçirir', () => {
    const olcu: MusicEvent[][] = [[nota(RAST), { kind: 'rest', dur: 'quarter' }, nota(DUGAH, 'half')]]
    const r = beklenenNotalar(olcu, 0, T, 60, 0, 0)
    expect(r.map((n) => [n.nota, n.bas, n.son])).toEqual([
      [0, 0, 1],
      [2, 2, 4],
    ])
  })

  it('ilkOlcu verilince olcu indisleri o sayıdan başlar', () => {
    const olcu: MusicEvent[][] = [[nota(RAST)], [nota(DUGAH)]]
    const r = beklenenNotalar(olcu, 3, T, 60, 0, 0)
    expect(r.map((n) => n.olcu)).toEqual([3, 4])
  })

  it('bpm hızına göre ölçeklenir ve üçleme süresi kesirlidir', () => {
    const olcu: MusicEvent[][] = [[nota(RAST, 'eighth', { uclu: true }), nota(DUGAH, 'eighth', { uclu: true })]]
    const r = beklenenNotalar(olcu, 0, T, 120, 1, 0)
    expect(r[0].bas).toBeCloseTo(1, 9)
    expect(r[0].son).toBeCloseTo(1 + (1 / 3) * 0.5, 9)
    expect(r[1].bas).toBeCloseTo(r[0].son, 9)
  })
})

describe('katlanmisSent / enYakinPerde', () => {
  it('hedefe sent verir', () => {
    expect(katlanmisSent(sentAt(440, 30), 440)).toBeCloseTo(30, 6)
    expect(katlanmisSent(sentAt(440, -150), 440)).toBeCloseTo(-150, 6)
  })
  it('±1200 sente 100 sentten yakınsa o oktava katlar', () => {
    expect(katlanmisSent(sentAt(440, 1200 + 10), 440)).toBeCloseTo(10, 6)
    expect(katlanmisSent(sentAt(440, -1200 - 20), 440)).toBeCloseTo(-20, 6)
    expect(katlanmisSent(sentAt(440, 1200 + 150), 440)).toBeCloseTo(1350, 6)
  })
  it('enYakinPerde, perdenin kendi sesi için o perdeyi bulur; aynı yazılı perdede (Nevâ) ilk sıradaki ad döner', () => {
    for (const p of NEY_PERDELER) {
      const ilk = NEY_PERDELER.find((x) => samePitch(x.written, p.written))!
      expect(enYakinPerde(soundingHz(p.written, T), T)).toBe(ilk.name)
    }
    expect(enYakinPerde(soundingHz(NEY_PERDELER.find((p) => p.id === 'kapali-neva')!.written, T), T)).toBe('Nevâ')
  })
})

describe('gecikmeBul', () => {
  it('kusursuz çalımdaki 150 ms gecikmeyi bulur', () => {
    const { notalar, hzler } = dortluk()
    const ornekler = iz(notalar, 0.15, (_n, i) => hzler[i])
    expect(Math.abs(gecikmeBul(notalar, ornekler) - 150)).toBeLessThanOrEqual(10)
  })
  it('hiç ses yokken varsayılana düşer', () => {
    const { notalar } = dortluk()
    expect(gecikmeBul(notalar, iz(notalar, 0, () => null))).toBe(VARSAYILAN_GECIKME_MS)
  })
  it('aralığın iki ucundaki gecikmeleri de bulur (-100 ve +400 ms)', () => {
    const { notalar, hzler } = dortluk()
    for (const d of [-100, 400]) {
      const r = gecikmeBul(notalar, iz(notalar, d / 1000, (_n, i) => hzler[i]))
      expect(Math.abs(r - d)).toBeLessThanOrEqual(10)
    }
  })
  it('gerçekçi boyutta (100 nota, 3000+ örnek, sırasız) kaba kuvvet referansıyla aynı sonucu verir ve girdiyi değiştirmez', () => {
    const olcu: MusicEvent[][] = [[]]
    const perdeler = [RAST, DUGAH, SEGAH, CARGAH, NEVA]
    for (let i = 0; i < 100; i++) olcu[0].push(nota(perdeler[(i * 7) % 5], 'eighth'))
    const notalar = beklenenNotalar(olcu, 0, T, 60, 5, 0)
    let tohum = 12345
    const rast = () => {
      tohum = (tohum * 1664525 + 1013904223) % 4294967296
      return tohum / 4294967296
    }
    const ornekler = iz(notalar, 0.13, (n) => (rast() < 0.1 ? null : sentAt(n.hz, (rast() - 0.5) * 60)))
    expect(ornekler.length).toBeGreaterThan(3000)
    // Sırasız ver: sıralama girdiyi bozmamalı, sonuç sıradan bağımsız olmalı.
    const karisik = [...ornekler].sort(() => rast() - 0.5)
    const kopya = karisik.map((o) => ({ ...o }))
    const kaba = (): number => {
      let enIyiPuan = -1
      let enIyi = VARSAYILAN_GECIKME_MS
      const sesli = karisik.filter((o) => o.hz !== null)
      for (let d = -100; d <= 400; d += 10) {
        let puan = 0
        for (const n of notalar)
          for (const o of sesli)
            if (o.t >= n.bas + d / 1000 && o.t <= n.son + d / 1000 && Math.abs(katlanmisSent(o.hz as number, n.hz)) <= 50) puan++
        if (puan > enIyiPuan || (puan === enIyiPuan && Math.abs(d - 120) < Math.abs(enIyi - 120))) {
          enIyiPuan = puan
          enIyi = d
        }
      }
      return enIyiPuan < 5 || enIyiPuan < 0.2 * sesli.length ? 120 : enIyi
    }
    const beklenen = kaba()
    expect(Math.abs(beklenen - 130)).toBeLessThanOrEqual(10)
    expect(gecikmeBul(notalar, karisik)).toBe(beklenen)
    expect(gecikmeBul(notalar, ornekler)).toBe(beklenen)
    expect(karisik).toEqual(kopya)
  })
  it('örnek yoksa varsayılana düşer', () => {
    const { notalar } = dortluk()
    expect(gecikmeBul(notalar, [])).toBe(VARSAYILAN_GECIKME_MS)
  })
  it('hedefle ilgisiz sesli örneklerde varsayılana düşer', () => {
    const { notalar } = dortluk()
    expect(gecikmeBul(notalar, iz(notalar, 0, () => 1000))).toBe(VARSAYILAN_GECIKME_MS)
  })
})

describe('gecikmeKestir', () => {
  it('ölçülen gecikmede kaynak olcum', () => {
    const { notalar, hzler } = dortluk()
    const r = gecikmeKestir(notalar, iz(notalar, 0.15, (_n, i) => hzler[i]))
    expect(Math.abs(r.ms - 150)).toBeLessThanOrEqual(10)
    expect(r.kaynak).toBe('olcum')
  })
  it('kestirilemezse varsayılan ve kaynak varsayilan', () => {
    const { notalar } = dortluk()
    expect(gecikmeKestir(notalar, iz(notalar, 0, () => null))).toEqual({ ms: VARSAYILAN_GECIKME_MS, kaynak: 'varsayilan' })
    expect(gecikmeKestir(notalar, [])).toEqual({ ms: VARSAYILAN_GECIKME_MS, kaynak: 'varsayilan' })
  })
  it('aralığın ucunda kaynak sinir (gerçek gecikme aralığın dışında olsa da)', () => {
    const { notalar, hzler } = dortluk()
    for (const d of [-100, 400, 600]) {
      const r = gecikmeKestir(notalar, iz(notalar, d / 1000, (_n, i) => hzler[i]))
      expect(r.ms).toBe(Math.min(400, d))
      expect(r.kaynak).toBe('sinir')
    }
  })
})

describe('degerlendir', () => {
  it('kusursuz çalım (150 ms gecikme) bütün notaları doğru sayar', () => {
    const { notalar, hzler } = dortluk()
    const s = degerlendir(notalar, iz(notalar, 0.15, (_n, i) => hzler[i]), T)
    expect(Math.abs(s.gecikmeMs - 150)).toBeLessThanOrEqual(10)
    expect(s.notalar.map((n) => n.durum)).toEqual(['dogru', 'dogru', 'dogru', 'dogru'])
    expect(s.atlanan).toBe(0)
    expect(s.sesliOran).toBeGreaterThan(0.5)
  })

  it('gecikmesiz çalım da doğru değerlendirilir ve gecikme varsayılana düşmeden 0 bulunur', () => {
    const { notalar, hzler } = dortluk()
    const s = degerlendir(notalar, iz(notalar, 0, (_n, i) => hzler[i]), T)
    expect(Math.abs(s.gecikmeMs)).toBeLessThanOrEqual(10)
    expect(s.notalar.every((n) => n.durum === 'dogru')).toBe(true)
  })

  it('-40 sent pes, +40 sent tiz (bir koma komşusu olmayan perdelerde)', () => {
    const { notalar, hzler } = dortluk()
    const sapma = [0, -40, 0, 40]
    const s = degerlendir(notalar, iz(notalar, 0.12, (_n, i) => sentAt(hzler[i], sapma[i])), T)
    expect(s.notalar.map((n) => n.durum)).toEqual(['dogru', 'pes', 'dogru', 'tiz'])
    expect(s.notalar[1].sent).toBeCloseTo(-40, 0)
    expect(s.notalar[3].sent).toBeCloseTo(40, 0)
  })

  describe('oktav katlama seçeneği', () => {
    /** Dört dörtlük, `kayma` sentle (ör. −1200 = bir oktav pes) çalınır; `secenek` degerlendir'e geçer. */
    const kos = (kayma: number, secenek?: { oktavKatla?: boolean }) => {
      const { notalar, hzler } = dortluk()
      return degerlendir(notalar, iz(notalar, 0.12, (_n, i) => sentAt(hzler[i], kayma)), T, secenek).notalar
    }

    it('katlama açıkken (varsayılan) bir oktav pes ya da tiz çalınan nota doğru sayılır, oktav alanı yoktur', () => {
      for (const kayma of [-1200, 1200]) {
        for (const secenek of [undefined, { oktavKatla: true }]) {
          const r = kos(kayma, secenek)
          expect(r.map((n) => n.durum)).toEqual(['dogru', 'dogru', 'dogru', 'dogru'])
          expect(r.every((n) => n.oktav === undefined)).toBe(true)
        }
      }
    })

    it('katlama kapalıyken bir oktav pes nota "pes", bir oktav tiz nota "tiz" olur ve oktav alanı taşır', () => {
      const pes = kos(-1200, { oktavKatla: false })
      expect(pes.map((n) => n.durum)).toEqual(['pes', 'pes', 'pes', 'pes'])
      expect(pes.every((n) => n.oktav === -1)).toBe(true)
      expect(pes[0].sent).toBeCloseTo(0, 0) // sapma oktav içinde ölçülür
      const tiz = kos(1200, { oktavKatla: false })
      expect(tiz.map((n) => n.durum)).toEqual(['tiz', 'tiz', 'tiz', 'tiz'])
      expect(tiz.every((n) => n.oktav === 1)).toBe(true)
    })

    it('katlama kapalıyken doğru oktavdaki nota yine doğru; pes/tiz ve yanlış sınıflaması değişmez, oktav alanı yoktur', () => {
      const { notalar, hzler } = dortluk()
      const sapma = [0, -40, 0, 0]
      const s = degerlendir(notalar, iz(notalar, 0.12, (_n, i) => sentAt(hzler[i], sapma[i])), T, { oktavKatla: false })
      expect(s.notalar.map((n) => n.durum)).toEqual(['dogru', 'pes', 'dogru', 'dogru'])
      expect(s.notalar.every((n) => n.oktav === undefined)).toBe(true)
      // Oktav dışında da yanlış perde yine yanlış (örn. +300 sent, oktav yok).
      expect(kos(300, { oktavKatla: false }).map((n) => n.durum)).toEqual(['yanlis', 'yanlis', 'yanlis', 'yanlis'])
    })
  })

  describe('bir koma komşu perdeler', () => {
    /** Dört dörtlük aynı perde, hepsi `sapma` sentle çalınır. */
    const kos = (perde: WrittenPitch, sapma: number) => {
      const olcu: MusicEvent[][] = [[nota(perde), nota(perde), nota(perde), nota(perde)]]
      const notalar = beklenenNotalar(olcu, 0, T, 60, 10, 4)
      return degerlendir(notalar, iz(notalar, 0.12, (n) => sentAt(n.hz, sapma)), T).notalar
    }

    it('KOMA_AYIRT_SENT 15', () => {
      expect(KOMA_AYIRT_SENT).toBe(15)
    })

    it('Bûselik yerine Segâh (−1 koma) yanlış; −12 sent doğru', () => {
      const r = kos(BUSELIK, -KOMA)
      expect(r.map((n) => n.durum)).toEqual(['yanlis', 'yanlis', 'yanlis', 'yanlis'])
      expect(r[0].calinan).toBe('Segâh')
      expect(r[0].sent).toBeCloseTo(-KOMA, 0)
      expect(kos(BUSELIK, -12).map((n) => n.durum)).toEqual(['dogru', 'dogru', 'dogru', 'dogru'])
    })

    it('Segâh yerine Bûselik (+1 koma) yanlış', () => {
      const r = kos(SEGAH, KOMA)
      expect(r[0].durum).toBe('yanlis')
      expect(r[0].calinan).toBe('Bûselik')
    })

    it('Dik Kürdî ile Kürdî birbirinden ayrılır; 12 sent sapma doğru', () => {
      const dik = kos(DIK_KURDI, -KOMA)
      expect(dik[0].durum).toBe('yanlis')
      expect(dik[0].calinan).toBe('Kürdî')
      const kurdi = kos(KURDI, KOMA)
      expect(kurdi[0].durum).toBe('yanlis')
      expect(kurdi[0].calinan).toBe('Dik Kürdî')
      expect(kos(DIK_KURDI, -12)[0].durum).toBe('dogru')
      expect(kos(KURDI, 12)[0].durum).toBe('dogru')
    })

    it('en yakın perde komşu olsa da 15 sentten az sapma doğru', () => {
      // −11.3 sentten aşağısı Segâh'a daha yakındır, ama −14 sent eşiğin altındadır.
      expect(kos(BUSELIK, -14)[0].durum).toBe('dogru')
      expect(kos(BUSELIK, -16)[0].durum).toBe('yanlis')
    })

    it('Segâh +40 sent tiz değil: en yakın perde Bûselik', () => {
      const r = kos(SEGAH, 40)
      expect(r[0].durum).toBe('yanlis')
      expect(r[0].calinan).toBe('Bûselik')
    })

    it('ney perdesi olmayan yazılı nota eski eşiklerle: −1 koma doğru, −40 pes', () => {
      expect(kos(DO4, -KOMA)[0].durum).toBe('dogru')
      expect(kos(DO4, -40)[0].durum).toBe('pes')
    })

    it('oktav hatasında karşılaştırma katlanmış perdeyle yapılır', () => {
      // Bir oktav üstte −1 koma Bûselik Segâh sayılır (katlanmadan en yakın perde başka olurdu).
      const ust = kos(BUSELIK, 1200 - KOMA)
      expect(ust[0].durum).toBe('yanlis')
      expect(ust[0].calinan).toBe('Segâh')
      // Bir oktav üstte −20 sent Rast doğru kalır (katlanmadan en yakın perde Gerdâniye olurdu).
      expect(kos(RAST, 1200 - 20)[0].durum).toBe('dogru')
    })
  })

  it('+300 sent yanlış; calinan o hz\'e en yakın perdenin adıdır', () => {
    const { notalar, hzler } = dortluk()
    const yanlisHz = sentAt(hzler[1], 300)
    const s = degerlendir(notalar, iz(notalar, 0.12, (_n, i) => (i === 1 ? yanlisHz : hzler[i])), T)
    expect(s.notalar[1].durum).toBe('yanlis')
    let en = NEY_PERDELER[0]
    for (const p of NEY_PERDELER) {
      if (Math.abs(centsBetween(yanlisHz, soundingHz(p.written, T))) < Math.abs(centsBetween(yanlisHz, soundingHz(en.written, T)))) en = p
    }
    expect(s.notalar[1].calinan).toBe(en.name)
    expect(s.notalar[1].calinan).not.toBe('Dügâh')
    expect(s.notalar[0].calinan).toBeUndefined()
  })

  it('bir nota boyunca ses yoksa o nota yok olur', () => {
    const { notalar, hzler } = dortluk()
    const s = degerlendir(notalar, iz(notalar, 0.12, (_n, i) => (i === 2 ? null : hzler[i])), T)
    expect(s.notalar.map((n) => n.durum)).toEqual(['dogru', 'dogru', 'yok', 'dogru'])
    expect(s.notalar[2].sent).toBeNull()
  })

  it('hiç ses yoksa hepsi yok, gecikme varsayılan, sesliOran 0', () => {
    const { notalar } = dortluk()
    const s = degerlendir(notalar, iz(notalar, 0, () => null), T)
    expect(s.notalar.map((n) => n.durum)).toEqual(['yok', 'yok', 'yok', 'yok'])
    expect(s.gecikmeMs).toBe(120)
    expect(s.sesliOran).toBe(0)
  })

  it('örnek listesi boşken de hata vermez', () => {
    const { notalar } = dortluk()
    const s = degerlendir(notalar, [], T)
    expect(s.notalar.every((n) => n.durum === 'yok')).toBe(true)
    expect(s.sesliOran).toBe(0)
  })

  it('oktav üstü (+1200 sent) doğru sayılır', () => {
    const { notalar, hzler } = dortluk()
    const sapma = [1200 + 10, 0, 1200 - 10, -1200]
    const s = degerlendir(notalar, iz(notalar, 0.12, (_n, i) => sentAt(hzler[i], sapma[i])), T)
    expect(s.notalar.map((n) => n.durum)).toEqual(['dogru', 'dogru', 'dogru', 'dogru'])
  })

  it('2 sn\'lik notanın yalnız ilk yarısı sesliyse kısa', () => {
    const olcu: MusicEvent[][] = [[nota(RAST, 'half')]]
    const notalar = beklenenNotalar(olcu, 0, T, 60, 10, 0)
    const hz = soundingHz(RAST, T)
    const s = degerlendir(notalar, iz(notalar, 0.12, (n, _i, t) => (t < n.bas + 0.12 + 1 ? hz : null)), T)
    expect(s.notalar).toHaveLength(1)
    expect(s.notalar[0].durum).toBe('kisa')
  })

  it('tam süre tutulan uzun nota doğru kalır', () => {
    const olcu: MusicEvent[][] = [[nota(RAST, 'half')]]
    const notalar = beklenenNotalar(olcu, 0, T, 60, 10, 0)
    const hz = soundingHz(RAST, T)
    const s = degerlendir(notalar, iz(notalar, 0.12, () => hz), T)
    expect(s.notalar[0].durum).toBe('dogru')
  })

  it('her 0.25 sn\'de bir tek karelik 1000 Hz tık medyanı bozmaz', () => {
    const { notalar, hzler } = dortluk()
    let sonTik = -1
    const s = degerlendir(
      notalar,
      iz(notalar, 0.12, (_n, i, t) => {
        if (t - sonTik >= 0.25) {
          sonTik = t
          return 1000
        }
        return hzler[i]
      }),
      T,
    )
    expect(s.notalar.map((n) => n.durum)).toEqual(['dogru', 'dogru', 'dogru', 'dogru'])
  })

  it('♩=60\'ta onaltılıklar değerlendirilir; pencere 0.04 sn\'den kısa notalar atlanır', () => {
    const hz = soundingHz(RAST, T)
    const olcu: MusicEvent[][] = [[nota(RAST, 'sixteenth'), nota(RAST, 'sixteenth'), nota(RAST, 'sixteenth'), nota(RAST, 'sixteenth')]]
    const yavas = beklenenNotalar(olcu, 0, T, 60, 10, 0)
    const sy = degerlendir(yavas, iz(yavas, 0.12, () => hz), T)
    expect(sy.notalar).toHaveLength(4)
    expect(sy.atlanan).toBe(0)

    const hizli = beklenenNotalar(olcu, 0, T, 200, 10, 0)
    const sh = degerlendir(hizli, iz(hizli, 0.12, () => hz), T)
    expect(sh.notalar).toHaveLength(0)
    expect(sh.atlanan).toBe(4)
  })

  it('uzun yanlış perdeli notanın sessiz kuyruğu onu kısa yapmaz: yanlış kalır', () => {
    const olcu: MusicEvent[][] = [[nota(RAST, 'half')]]
    const notalar = beklenenNotalar(olcu, 0, T, 60, 10, 0)
    const yanlis = sentAt(notalar[0].hz, 300)
    const s = degerlendir(notalar, iz(notalar, 0.12, (n, _i, t) => (t < n.bas + 0.12 + 1 ? yanlis : null)), T)
    expect(s.notalar[0].durum).toBe('yanlis')
  })

  it('pes çalınıp erken bırakılan uzun nota kısa olur', () => {
    const olcu: MusicEvent[][] = [[nota(RAST, 'half')]]
    const notalar = beklenenNotalar(olcu, 0, T, 60, 10, 0)
    const s = degerlendir(notalar, iz(notalar, 0.12, (n, _i, t) => (t < n.bas + 0.12 + 1 ? sentAt(n.hz, -40) : null)), T)
    expect(s.notalar[0].durum).toBe('kisa')
  })

  it('kayıt notanın ortasında bittiyse (kuyrukta örnek yok) kısa sayılmaz', () => {
    const olcu: MusicEvent[][] = [[nota(RAST, 'half')]]
    const notalar = beklenenNotalar(olcu, 0, T, 60, 10, 0)
    // Kuyruk penceresi 11.42 + 0.. başlar (son 12 + 0.12 - 0.7); iz 11.3'te biter.
    const s = degerlendir(notalar, iz(notalar, 0.12, (n) => n.hz, 11.3), T)
    expect(s.notalar[0].durum).toBe('dogru')
  })

  it('kisa sınırı 0.75 sn: 0.74 sn’lik nota kısa olmaz, 0.75 sn olur', () => {
    const hz = soundingHz(RAST, T)
    const yarisi = (n: BeklenenNota, t: number) => (t < n.bas + 0.12 + 0.4 ? hz : null)
    // 0.75 sn: ikilik, ♩=160, t0=0 (0.75 tam gösterilir).
    const olcu: MusicEvent[][] = [[nota(RAST, 'half')]]
    const kisaNota = beklenenNotalar(olcu, 0, T, 160, 0, 0)
    expect(kisaNota[0].son - kisaNota[0].bas).toBe(0.75)
    expect(degerlendir(kisaNota, iz(kisaNota, 0.12, (n, _i, t) => yarisi(n, t)), T).notalar[0].durum).toBe('kisa')
    const hafif = beklenenNotalar(olcu, 0, T, 120 / 0.74, 0, 0)
    expect(hafif[0].son - hafif[0].bas).toBeLessThan(0.75)
    expect(degerlendir(hafif, iz(hafif, 0.12, (n, _i, t) => yarisi(n, t)), T).notalar[0].durum).toBe('dogru')
  })

  it('yok sınırı: sesli oran 0.3 ve üstü değerlendirilir, altı yok sayılır', () => {
    const olcu: MusicEvent[][] = [[nota(RAST)]]
    const notalar = beklenenNotalar(olcu, 0, T, 60, 0, 0)
    // Çekirdek pencere gecikme 120 ms ile [0.27, 1.02]; sesli örnekler 5'ten az olduğundan gecikme varsayılana düşer.
    const hz = notalar[0].hz
    const kos = (sesli: number, toplam: number) =>
      degerlendir(notalar, Array.from({ length: toplam }, (_, k) => ({ t: 0.3 + 0.01 * k, hz: k < sesli ? hz : null })), T)
    const uc = kos(3, 10)
    expect(uc.gecikmeMs).toBe(VARSAYILAN_GECIKME_MS)
    expect(uc.notalar[0].durum).toBe('dogru')
    expect(kos(2, 10).notalar[0].durum).toBe('yok')
    expect(kos(2, 7).notalar[0].durum).toBe('yok')
    expect(kos(1, 2).notalar[0].durum).toBe('yok')
  })

  it('olcu ve nota indislerini sonuca taşır', () => {
    const olcu: MusicEvent[][] = [[nota(NEVA), nota(RAST)]]
    const notalar = beklenenNotalar(olcu, 5, T, 60, 0, 0)
    const s = degerlendir(notalar, iz(notalar, 0.12, (n) => n.hz), T)
    expect(s.notalar.map((n) => [n.olcu, n.nota])).toEqual([
      [5, 0],
      [5, 1],
    ])
  })

  describe('tanılama', () => {
    it('pencereSesliOran yalnız notaların çekirdek pencerelerine bakar; sesliOran bütün izedir', () => {
      const { notalar, hzler } = dortluk()
      const tam = degerlendir(notalar, iz(notalar, 0.12, (_n, i) => hzler[i]), T)
      expect(tam.pencereSesliOran).toBe(1)
      expect(tam.sesliOran).toBeLessThan(0.75) // izin önü ve ardı 1'er sn sessiz
      const bos = degerlendir(notalar, iz(notalar, 0.12, (_n, i) => (i === 2 ? null : hzler[i])), T)
      expect(bos.pencereSesliOran).toBeCloseTo(0.75, 1)
      expect(degerlendir(notalar, [], T).pencereSesliOran).toBe(0)
    })

    it('gecikmenin kaynağını taşır', () => {
      const { notalar, hzler } = dortluk()
      expect(degerlendir(notalar, iz(notalar, 0.15, (_n, i) => hzler[i]), T).gecikmeKaynagi).toBe('olcum')
      expect(degerlendir(notalar, [], T).gecikmeKaynagi).toBe('varsayilan')
      expect(degerlendir(notalar, iz(notalar, 0.4, (_n, i) => hzler[i]), T).gecikmeKaynagi).toBe('sinir')
    })

    it("0.5 sn'den kısa ve uzun notalar ayrı sayılır; ortanca |sent| duyulan notalardan", () => {
      // ♩=60: dört onaltılık Rast (0.25 sn; sonuncusu +50 → tiz), sonra dörtlük Dügâh (+10), Çârgâh (−30 → pes), Nevâ (sessiz).
      const olcu: MusicEvent[][] = [
        [nota(RAST, 'sixteenth'), nota(RAST, 'sixteenth'), nota(RAST, 'sixteenth'), nota(RAST, 'sixteenth')],
        [nota(DUGAH), nota(CARGAH), nota(NEVA)],
      ]
      const notalar = beklenenNotalar(olcu, 0, T, 60, 10, 4)
      expect(notalar).toHaveLength(4 + 3)
      const sapma = [0, 0, 0, 50, 10, -30, 0]
      const s = degerlendir(notalar, iz(notalar, 0.12, (n, i) => (i === 6 ? null : sentAt(n.hz, sapma[i]))), T)
      expect(s.notalar.map((n) => n.durum)).toEqual(['dogru', 'dogru', 'dogru', 'tiz', 'dogru', 'pes', 'yok'])
      expect(s.kisaNotalar).toEqual({ dogru: 3, toplam: 4 })
      expect(s.uzunNotalar).toEqual({ dogru: 1, toplam: 3 })
      // |sent|: 0, 0, 0, 50, 10, 30 → ortanca 5
      expect(s.ortancaSapmaSent).toBeCloseTo(5, 0)
    })

    it('hiç duyulan nota yoksa ortanca sapma null; atlanan notalar sayılmaz', () => {
      const { notalar } = dortluk()
      const s = degerlendir(notalar, [], T)
      expect(s.ortancaSapmaSent).toBeNull()
      expect(s.kisaNotalar).toEqual({ dogru: 0, toplam: 0 })
      expect(s.uzunNotalar).toEqual({ dogru: 0, toplam: 4 })
      const hz = soundingHz(RAST, T)
      const olcu: MusicEvent[][] = [[nota(RAST, 'sixteenth'), nota(RAST, 'sixteenth')]]
      const hizli = beklenenNotalar(olcu, 0, T, 200, 10, 0)
      const sh = degerlendir(hizli, iz(hizli, 0.12, () => hz), T)
      expect(sh.atlanan).toBe(2)
      expect(sh.kisaNotalar).toEqual({ dogru: 0, toplam: 0 })
      expect(sh.pencereSesliOran).toBe(0)
    })
  })
})

describe('kesik (staccato) notalar', () => {
  const kesik = (pitch: WrittenPitch, dur: NoteEvent['dur'] = 'quarter', ek: Partial<NoteEvent> = {}) => nota(pitch, dur, { kesik: true, ...ek })

  it('kesik nota yalnız ilk yarısında sesli beklenir; sonraki notanın başı değişmez', () => {
    const olcu: MusicEvent[][] = [[kesik(RAST, 'half'), nota(DUGAH, 'half')]]
    const [a, b] = beklenenNotalar(olcu, 0, T, 60, 10, 0)
    expect(a.bas).toBe(10)
    expect(a.son).toBe(11)
    expect(b.bas).toBe(12)
    expect(b.son).toBe(14)
    // Noktalı kesik de yarısı kadar.
    const [n] = beklenenNotalar([[nota(RAST, 'quarter', { dotted: true, kesik: true })]], 0, T, 60, 0, 0)
    expect(n.son - n.bas).toBeCloseTo(0.75, 9)
  })

  it('bağlı zincirde yalnız son notanın kesiği sayılır; ortadaki kesik yok sayılır', () => {
    const sonKesik: MusicEvent[][] = [[nota(RAST, 'quarter', { tie: true }), kesik(RAST)]]
    const [a] = beklenenNotalar(sonKesik, 0, T, 60, 0, 0)
    expect(a.bas).toBe(0)
    expect(a.son).toBe(1.5)
    const ortada: MusicEvent[][] = [[kesik(RAST, 'quarter', { tie: true }), nota(RAST)]]
    const [b] = beklenenNotalar(ortada, 0, T, 60, 0, 0)
    expect(b.son).toBe(2)
  })

  it('doğru çalınan kesik nota (yalnız ilk yarı sesli) kısa değil doğru sayılır', () => {
    const olcu: MusicEvent[][] = [[kesik(RAST, 'half')]]
    const notalar = beklenenNotalar(olcu, 0, T, 60, 10, 0)
    const hz = soundingHz(RAST, T)
    // 2 sn'lik kesik ikilikte ses 1 sn sürer, sonrası sessizdir (gecikme 0.12 sn ile 10.12–11.12).
    const s = degerlendir(notalar, iz(notalar, 0.12, (n, _i, t) => (t < n.bas + 0.12 + 1 ? hz : null), 13), T)
    expect(s.notalar.map((n) => n.durum)).toEqual(['dogru'])
  })

  it('aynı izle kesiksiz ikilik kısa sayılır; kesik ikilikte kısa denetimi çalışmaz', () => {
    const hz = soundingHz(RAST, T)
    const yariSesli = (n: BeklenenNota, t: number) => (t < n.bas + 0.12 + 1 ? hz : null)
    const duz = beklenenNotalar([[nota(RAST, 'half')]], 0, T, 60, 10, 0)
    expect(degerlendir(duz, iz(duz, 0.12, (n, _i, t) => yariSesli(n, t)), T).notalar[0].durum).toBe('kisa')
    const kes = beklenenNotalar([[kesik(RAST, 'half')]], 0, T, 60, 10, 0)
    expect(degerlendir(kes, iz(kes, 0.12, (n, _i, t) => yariSesli(n, t)), T).notalar[0].durum).toBe('dogru')
  })

  it('bağlı (legato) uzun nota değişmez: tam süre tutulan doğru, yarıda bırakılan kısa', () => {
    const hz = soundingHz(RAST, T)
    const bagli = beklenenNotalar([[nota(RAST, 'half', { bag: true }), nota(DUGAH, 'half')]], 0, T, 60, 10, 0)
    expect(bagli[0].son - bagli[0].bas).toBe(2)
    const tam = degerlendir(bagli, iz(bagli, 0.12, (n) => n.hz), T)
    expect(tam.notalar[0].durum).toBe('dogru')
    const yarim = degerlendir(bagli, iz(bagli, 0.12, (n, _i, t) => (t < n.bas + 0.12 + 1 ? hz : null)), T)
    expect(yarim.notalar[0].durum).toBe('kisa')
  })
})
