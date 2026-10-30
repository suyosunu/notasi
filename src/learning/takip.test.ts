import { describe, expect, it } from 'vitest'
import { NEY_PERDELER } from '../content/ney-perdeler'
import { soundingHz, DEFAULT_TUNING } from '../music/ahenk'
import { centsBetween } from '../music/pitch'
import type { MusicEvent, NoteEvent } from '../music/notation'
import type { WrittenPitch } from '../music/pitch'
import {
  beklenenNotalar,
  degerlendir,
  enYakinPerde,
  gecikmeBul,
  katlanmisSent,
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
  it('enYakinPerde, perdenin kendi sesi için o perdeyi bulur', () => {
    for (const p of NEY_PERDELER) expect(enYakinPerde(soundingHz(p.written, T), T)).toBe(p.name)
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

  it('-40 sent pes, +40 sent tiz', () => {
    const { notalar, hzler } = dortluk()
    const sapma = [0, -40, 40, 0]
    const s = degerlendir(notalar, iz(notalar, 0.12, (_n, i) => sentAt(hzler[i], sapma[i])), T)
    expect(s.notalar.map((n) => n.durum)).toEqual(['dogru', 'pes', 'tiz', 'dogru'])
    expect(s.notalar[1].sent).toBeCloseTo(-40, 0)
    expect(s.notalar[2].sent).toBeCloseTo(40, 0)
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
})
