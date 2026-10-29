import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_TUNING } from '../music/ahenk'
import type { MusicEvent } from '../music/notation'
import {
  BAG_GECIS_S,
  buildPatternCode,
  DIL_VARSAYILAN,
  getDilBelirginligi,
  setDilBelirginligi,
  TU_BOSLUK_S,
  melodyChain,
  NEFES_SOLUK_CHAIN,
  NEFES_TON_CHAIN,
  NEY_SESLERI,
  SHAKUHACHI_CHAIN,
  SOUND_CHAIN,
  toneSteps,
  toToneEvents,
} from './pattern'
import { SHAKUHACHI_SOUND } from './shakuhachi'

// Çekirdeğin gerçek (kullanılmayan) kabelsalat bağımlılığı Node'da yüklenmez; yalnızca onu taklit ederiz.
vi.mock('@kabelsalat/web', () => ({ SalatRepl: class {} }))

describe('buildPatternCode', () => {
  const events = [
    { hz: 440, beats: 2 },
    { hz: null, beats: 1 },
    { hz: 494.957, beats: 1 },
  ]

  it('freq mini-notasyonu, ses zinciri ve cpm üretir', () => {
    const { code, durationMs } = buildPatternCode(events, 60)
    expect(code.startsWith('freq("440.00@2 ~@1 494.96@1")')).toBe(true)
    expect(code).toContain(melodyChain('shakuhachi'))
    expect(code).toContain('.cpm(15)')
    expect(durationMs).toBe(4000)
  })

  it('tempoya göre süreyi ve cpm değerini ölçekler', () => {
    const { code, durationMs } = buildPatternCode(events, 120)
    expect(code).toContain('.cpm(30)')
    expect(durationMs).toBe(2000)
  })
})

describe('toToneEvents', () => {
  it('Kız ahenkte La4 dörtlük → ≈494.96 Hz, 1 vuruş', () => {
    const written: MusicEvent[] = [
      { kind: 'note', pitch: { step: 'A', octave: 4, acc: 0 }, dur: 'quarter' },
    ]
    const tones = toToneEvents(written, DEFAULT_TUNING)
    expect(tones).toHaveLength(1)
    expect(tones[0]?.hz).toBeCloseTo(494.96, 2)
    expect(tones[0]?.beats).toBe(1)
  })

  it('sus hz: null olur, noktalı süre vuruşa yansır', () => {
    const written: MusicEvent[] = [{ kind: 'rest', dur: 'half', dotted: true }]
    expect(toToneEvents(written, DEFAULT_TUNING)).toEqual([{ hz: null, beats: 3 }])
  })

  it('üçleme süreleri ölçü toplamını bozmaz', () => {
    const u: MusicEvent = { kind: 'note', pitch: { step: 'A', octave: 4, acc: 0 }, dur: 'eighth', uclu: true }
    const written: MusicEvent[] = [u, u, u, { kind: 'note', pitch: { step: 'G', octave: 4, acc: 0 }, dur: 'quarter' }]
    const sum = toToneEvents(written, DEFAULT_TUNING).reduce((s, t) => s + t.beats, 0)
    expect(Math.abs(sum - 2)).toBeLessThan(1e-6)
  })

  it('bag: farklı perdeler ayrı ses kalır, bağlanan ses legato işaretlenir; susa giden bağ işaretlemez', () => {
    const G4 = { step: 'G', octave: 4, acc: 0 } as const
    const A4 = { step: 'A', octave: 4, acc: 0 } as const
    const written: MusicEvent[] = [
      { kind: 'note', pitch: G4, dur: 'quarter', bag: true },
      { kind: 'note', pitch: A4, dur: 'quarter', bag: true },
      { kind: 'note', pitch: G4, dur: 'quarter', bag: true },
      { kind: 'rest', dur: 'quarter' },
      { kind: 'note', pitch: A4, dur: 'quarter' },
    ]
    const tones = toToneEvents(written, DEFAULT_TUNING)
    expect(tones.map((t) => t.beats)).toEqual([1, 1, 1, 1, 1])
    expect(tones.map((t) => t.legato ?? false)).toEqual([false, true, true, false, false])
    expect('legato' in tones[0]!).toBe(false)
  })

  describe('bağlı notalar', () => {
    const A4 = { step: 'A', octave: 4, acc: 0 } as const
    const E5 = { step: 'E', octave: 5, acc: 0 } as const
    const hzOf = (pitch: typeof A4 | typeof E5) =>
      toToneEvents([{ kind: 'note', pitch, dur: 'quarter' }], DEFAULT_TUNING)[0]!.hz!

    it('bağlı nota dizisi tek sese birleşir, vuruşlar toplanır', () => {
      const written: MusicEvent[] = [
        { kind: 'note', pitch: E5, dur: 'half', tie: true },
        { kind: 'note', pitch: E5, dur: 'eighth' },
        { kind: 'rest', dur: 'quarter' },
      ]
      const tones = toToneEvents(written, DEFAULT_TUNING)
      expect(tones).toHaveLength(2)
      expect(tones[0]!.beats).toBe(2.5)
      expect(tones[0]!.hz).toBeCloseTo(hzOf(E5), 6)
      expect(tones[1]).toEqual({ hz: null, beats: 1 })
    })

    it('üç parçalı bağ zinciri birleşir, ardından gelen bağsız aynı perde ayrı kalır', () => {
      const written: MusicEvent[] = [
        { kind: 'note', pitch: A4, dur: 'half', dotted: true, tie: true },
        { kind: 'note', pitch: A4, dur: 'eighth', dotted: true, tie: true },
        { kind: 'note', pitch: A4, dur: 'sixteenth' },
        { kind: 'note', pitch: A4, dur: 'quarter' },
      ]
      expect(toToneEvents(written, DEFAULT_TUNING).map((t) => t.beats)).toEqual([4, 1])
    })

    it('farklı perdeye ya da susa giden bağ birleştirilmez', () => {
      const written: MusicEvent[] = [
        { kind: 'note', pitch: A4, dur: 'quarter', tie: true },
        { kind: 'note', pitch: E5, dur: 'quarter' },
        { kind: 'note', pitch: A4, dur: 'quarter', tie: true },
        { kind: 'rest', dur: 'quarter' },
      ]
      expect(toToneEvents(written, DEFAULT_TUNING).map((t) => t.beats)).toEqual([1, 1, 1, 1])
    })
  })
})

describe('buildPatternCode: tek seferlik çalma (gerçek Strudel çekirdeği)', () => {
  it('ilk döngüde sesler var, ikinci döngüde ve sonrasında hiç ses yok', async () => {
    const { evalScope } = await import('@strudel/core')
    const { evaluate, transpiler } = await import('@strudel/transpiler')
    await evalScope(import('@strudel/core'), import('@strudel/mini'))
    const { code } = buildPatternCode(
      [
        { hz: 440, beats: 2 },
        { hz: null, beats: 1 },
        { hz: 494.957, beats: 1 },
      ],
      60,
    )
    const { pattern } = await evaluate(code, transpiler)
    const values = (from: number, to: number) =>
      pattern
        .queryArc(from, to)
        .filter((h) => h.hasOnset())
        .map((h) => h.value.freq)
    // Çekirdekteki .cpm(15) = fast(15/60): bir döngü 4 sorgu-döngüsü sürer (REPL'de cps'e bölünür)
    expect(values(0, 4)).toEqual([440, 494.96])
    expect(values(4, 8)).toEqual([])
    expect(values(8, 40)).toEqual([])
  })
})

interface Hit {
  at: number
  freq: number
  s?: string
  gain?: number
  /** `.bpf()` çekirdekte `bandf` anahtarına yazılır. */
  bandf?: number
  /** `.lpf()` çekirdekte `cutoff` anahtarına yazılır. */
  cutoff?: number
  attack?: number
  decay?: number
  sustain?: number
  release?: number
  begin?: number
  clip?: number
}

/** Kodu gerçek Strudel çekirdeğiyle değerlendirip başlangıçlı olayları döner. */
async function query(code: string, from: number, to: number): Promise<Hit[]> {
  const { evalScope } = await import('@strudel/core')
  const { evaluate, transpiler } = await import('@strudel/transpiler')
  await evalScope(import('@strudel/core'), import('@strudel/mini'))
  const { pattern } = await evaluate(code, transpiler)
  return pattern
    .queryArc(from, to)
    .filter((h) => h.hasOnset())
    .map((h) => ({ at: Math.round(Number(h.whole.begin) * 1e6) / 1e6, ...h.value }) as Hit)
    .sort((a, b) => a.at - b.at || (a.s ?? '').localeCompare(b.s ?? ''))
}

describe('toneSteps: üçleme', () => {
  it('ağırlıklar 6 ondalıkla yazılır; tam sayılar olduğu gibi kalır', () => {
    expect(toneSteps([{ hz: 440, beats: 1 / 3 }, { hz: null, beats: 2 }])).toBe('440.00@0.333333 ~@2')
  })

  it('üçlemeli ezgide vuruşlar Strudel çekirdeğinde kaymaz', async () => {
    const third = 0.5 * (2 / 3)
    const events = [
      { hz: 440, beats: third },
      { hz: 494.96, beats: third },
      { hz: 556.8, beats: third },
      { hz: 440, beats: 1 },
    ]
    const { code } = buildPatternCode(events, 60, 'mevcut')
    // ♩ = 60: zaman saniye = vuruş. Dörtlük tam 1. vuruşta başlar (6 ondalık yuvarlaması 1e-6 içinde kalır).
    const hits = await query(code, 0, 2)
    const want = [0, 1 / 3, 2 / 3, 1]
    expect(hits).toHaveLength(4)
    hits.forEach((h, i) => expect(Math.abs(h.at - want[i]!)).toBeLessThan(2e-6))
  })
})

describe('melodyChain (ney sesi)', () => {
  it('üç ses vardır; mevcut bugünkü üçgen dalga + vibrato zinciridir', () => {
    expect(NEY_SESLERI).toEqual(['mevcut', 'nefesli', 'shakuhachi'])
    expect(melodyChain('mevcut')).toBe(SOUND_CHAIN)
    expect(SOUND_CHAIN).toBe('.s("triangle").vib(5).vibmod(0.1)')
  })

  it('nefesli: yumuşak girişli, alçak geçiren filtreli ton ve nefes gürültüsü iki katmandır', () => {
    const chain = melodyChain('nefesli')
    expect(chain).toContain(NEFES_TON_CHAIN)
    expect(chain).toContain(NEFES_SOLUK_CHAIN)
    expect(NEFES_TON_CHAIN).toMatch(/\.lpf\(/)
    expect(NEFES_TON_CHAIN).toMatch(/\.attack\(/)
    expect(NEFES_SOLUK_CHAIN).toMatch(/\.s\("pink"\)/)
  })

  it('shakuhachi: yerel shakuhachi sesi kullanılır', () => {
    expect(melodyChain('shakuhachi')).toContain(`.s("${SHAKUHACHI_SOUND}")`)
  })

  it('buildPatternCode seçilen zinciri kullanır; varsayılan shakuhachi', () => {
    const events = [{ hz: 440, beats: 1 }]
    expect(buildPatternCode(events, 60).code).toContain(SHAKUHACHI_CHAIN)
    expect(buildPatternCode(events, 60).code).toBe(buildPatternCode(events, 60, 'shakuhachi').code)
    for (const v of NEY_SESLERI) {
      const { code } = buildPatternCode(events, 60, v)
      expect(code).toBe(`freq("440.00@1")${melodyChain(v)}.mask("<1 0@1000000>").cpm(60)`)
    }
  })
})

describe('ney sesleri: gerçek Strudel çekirdeğiyle', () => {
  // Dügâh, Segâh (koma bemolü), Çârgâh, Nevâ ve bir sus: koma sesleri yuvarlanmadan aynen kalmalı.
  const events = [
    { hz: 494.957, beats: 1 },
    { hz: 527.849, beats: 1 },
    { hz: null, beats: 1 },
    { hz: 556.8, beats: 1 },
    { hz: 742.433, beats: 1 },
  ]

  it('nefesli: her notada aynı frekansta ton + nefes katmanı; frekanslar mevcut ile birebir aynı', async () => {
    const mevcut = await query(buildPatternCode(events, 60, 'mevcut').code, 0, 5)
    const nefesli = await query(buildPatternCode(events, 60, 'nefesli').code, 0, 5)
    const tone = nefesli.filter((h) => h.s === 'triangle')
    const breath = nefesli.filter((h) => h.s === 'pink')
    expect(nefesli).toHaveLength(tone.length + breath.length)
    expect(mevcut.map((h) => h.freq)).toEqual([494.96, 527.85, 556.8, 742.43])
    expect(tone.map((h) => [h.at, h.freq])).toEqual(mevcut.map((h) => [h.at, h.freq]))
    expect(breath.map((h) => h.at)).toEqual(mevcut.map((h) => h.at))
    expect(tone.every((h) => typeof h.cutoff === 'number')).toBe(true)
    expect(breath.every((h) => (h.gain ?? 1) < 0.2 && typeof h.bandf === 'number')).toBe(true)
  })

  it('nefesli: tek seferlik maske iki katmana da uygulanır (2. döngü sessiz)', async () => {
    const { code } = buildPatternCode(events, 60, 'nefesli')
    expect(await query(code, 5, 10)).toEqual([])
    expect(await query(code, 10, 60)).toEqual([])
  })

  describe('bağ (legato)', () => {
    // Nevâ, Çârgâh(bağlı) Nevâ(bağlı), sus, Segâh
    const bagli = [
      { hz: 742.433, beats: 1 },
      { hz: 556.8, beats: 1, legato: true as const },
      { hz: 742.433, beats: 1, legato: true as const },
      { hz: null, beats: 1 },
      { hz: 527.849, beats: 1 },
    ]

    it('dil belirginliği 0 ve bağ yoksa zincir değişmez (eski çalım birebir)', () => {
      for (const v of NEY_SESLERI) expect(melodyChain(v, events, { bpm: 60, dil: 0 })).toBe(melodyChain(v))
    })


    it('mevcut: bağsız sesler superdough varsayılanıyla, bağlı ses vurgusuz aynı düzeyde; önceki ses kısa söner', async () => {
      const hs = await query(buildPatternCode(bagli, 60, 'mevcut').code, 0, 5)
      expect(hs.map((h) => h.freq)).toEqual([742.43, 556.8, 742.43, 527.85])
      const [ilk, b1, b2, son] = hs
      expect([ilk!.attack, ilk!.decay, ilk!.sustain, ilk!.gain]).toEqual([0.001, 0.05, 0.6, 0.8])
      expect(ilk!.release).toBe(BAG_GECIS_S)
      expect([b1!.attack, b1!.sustain, b1!.gain]).toEqual([BAG_GECIS_S, 1, 0.48])
      expect(b1!.release).toBe(BAG_GECIS_S)
      expect(b2!.release).toBe(0.01) // susa gider
      expect(b2!.gain! * b2!.sustain!).toBeCloseTo(son!.gain! * son!.sustain!, 9)
      expect([son!.attack, son!.release]).toEqual([0.001, 0.01])
    })

    it('shakuhachi: bağlı ses kaydın döngü bölgesinden (begin 1) başlar, bağsız sesler baştan', async () => {
      const hs = await query(buildPatternCode(bagli, 60, 'shakuhachi').code, 0, 5)
      expect(hs.map((h) => h.begin)).toEqual([0, 1, 1, 0])
      expect(hs.map((h) => h.release)).toEqual([BAG_GECIS_S, BAG_GECIS_S, 0.1, 0.1])
      expect(hs.map((h) => h.attack)).toEqual([0.03, 0.03, 0.03, 0.03])
      expect(hs.every((h) => h.s === SHAKUHACHI_SOUND)).toBe(true)
    })

    it('nefesli: iki katman da bağlı seste yumuşak girişsiz geçer, kendi değerlerini korur', async () => {
      const hs = await query(buildPatternCode(bagli, 60, 'nefesli').code, 0, 5)
      const ton = hs.filter((h) => h.s === 'triangle')
      const soluk = hs.filter((h) => h.s === 'pink')
      expect(ton.map((h) => h.attack)).toEqual([0.06, BAG_GECIS_S, BAG_GECIS_S, 0.06])
      expect(soluk.map((h) => h.attack)).toEqual([0.04, BAG_GECIS_S, BAG_GECIS_S, 0.04])
      expect(ton.map((h) => h.release)).toEqual([BAG_GECIS_S, BAG_GECIS_S, 0.12, 0.12])
      expect(soluk.map((h) => h.release)).toEqual([BAG_GECIS_S, BAG_GECIS_S, 0.1, 0.1])
      expect(soluk.every((h) => h.gain === 0.08)).toBe(true)
    })
  })

  describe('dil belirginliği', () => {
    afterEach(() => setDilBelirginligi(DIL_VARSAYILAN))
    // Nevâ, Çârgâh (bağsız), Segâh (bağlı), sus, Dügâh
    const tu = [
      { hz: 742.433, beats: 1 },
      { hz: 556.8, beats: 1 },
      { hz: 527.849, beats: 1, legato: true as const },
      { hz: null, beats: 1 },
      { hz: 494.957, beats: 0.5 },
    ]

    it('bağsız geçişte önceki ses erken susar ve kısa söner, sonraki ses keskin girer; bağlı geçiş ve sus etkilenmez', async () => {
      setDilBelirginligi(0.5)
      const hs = await query(buildPatternCode(tu, 60, 'shakuhachi').code, 0, 5)
      expect(hs.map((h) => h.clip ?? 1)).toEqual([1 - 0.5 * TU_BOSLUK_S, 1, 1, 1])
      expect(hs.map((h) => h.release)).toEqual([0.06, BAG_GECIS_S, 0.1, 0.1])
      expect(hs.map((h) => h.attack)).toEqual([0.03, 0.0175, 0.03, 0.03])
    })

    it('erken susma payı saniye cinsindendir: tempo artınca vuruş oranı büyür, en çok yarısı', () => {
      const clips = (bpm: number, dil: number) =>
        melodyChain('mevcut', [{ hz: 440, beats: 0.25 }, { hz: 494, beats: 1 }], { bpm, dil }).match(/\.clip\("([\d.]+)@/)?.[1]
      expect(Number(clips(60, 1))).toBeCloseTo(1 - TU_BOSLUK_S / 0.25, 4)
      expect(Number(clips(200, 1))).toBe(0.5)
    })

    it('0 eski çalımdır; ayar sınır dışı değeri sınıra çeker', () => {
      setDilBelirginligi(0)
      expect(buildPatternCode(tu.slice(0, 2), 60, 'nefesli').code).toBe(
        `freq("742.43@1 556.80@1")${melodyChain('nefesli')}.mask("<1 0@1000000>").cpm(30)`,
      )
      setDilBelirginligi(7)
      expect(getDilBelirginligi()).toBe(1)
      setDilBelirginligi(Number.NaN)
      expect(getDilBelirginligi()).toBe(DIL_VARSAYILAN)
    })
  })

  it('shakuhachi: frekanslar mevcut ile aynı, ses adı yerel shakuhachi', async () => {
    const mevcut = await query(buildPatternCode(events, 60, 'mevcut').code, 0, 5)
    const shaku = await query(buildPatternCode(events, 60, 'shakuhachi').code, 0, 5)
    expect(shaku.map((h) => [h.at, h.freq])).toEqual(mevcut.map((h) => [h.at, h.freq]))
    expect(shaku.every((h) => h.s === SHAKUHACHI_SOUND)).toBe(true)
    expect(await query(buildPatternCode(events, 60, 'shakuhachi').code, 5, 20)).toEqual([])
  })
})
