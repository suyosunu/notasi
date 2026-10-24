import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getUsulSesi,
  isUsulSesi,
  KAYIT_SESLERI,
  loadUsulSamples,
  resetUsulSamplesForTests,
  setUsulSesi,
  strokeSound,
  usulSampleUrls,
  usulSesiInCode,
  USUL_SESLERI,
} from './usulSamples'
import type { SampleHost } from './usulSamples'

const root = resolve(__dirname, '../..')

describe('usul sesi seçimi', () => {
  it("dört seçenek; varsayılan 'oryantal'; setUsulSesi değiştirir", () => {
    expect(USUL_SESLERI).toEqual(['oryantal', 'konga', 'tahta', 'darbuka'])
    expect(KAYIT_SESLERI).toEqual(['konga', 'tahta', 'darbuka'])
    expect(getUsulSesi()).toBe('oryantal')
    setUsulSesi('darbuka')
    expect(getUsulSesi()).toBe('darbuka')
    setUsulSesi('oryantal')
  })

  it('isUsulSesi yalnızca bilinen değerleri kabul eder', () => {
    for (const v of USUL_SESLERI) expect(isUsulSesi(v)).toBe(true)
    for (const v of ['davul', '', null, undefined, 3]) expect(isUsulSesi(v)).toBe(false)
  })

  it('vuruş → ses adı: düm/tek ayrı kayıt; te/ke konga ve darbukada mat kayıt, tahtada tek kaydı', () => {
    expect(strokeSound('konga', 'düm')).toBe('usul_konga_dum')
    expect(strokeSound('konga', 'tek')).toBe('usul_konga_tek')
    expect(strokeSound('konga', 'te')).toBe('usul_konga_teke')
    expect(strokeSound('konga', 'ke')).toBe('usul_konga_teke')
    expect(strokeSound('tahta', 'düm')).toBe('usul_tahta_dum')
    expect(strokeSound('tahta', 'te')).toBe('usul_tahta_tek')
    expect(strokeSound('tahta', 'ke')).toBe('usul_tahta_tek')
    expect(strokeSound('darbuka', 'tek')).toBe('usul_darbuka_tek')
    expect(strokeSound('darbuka', 'ke')).toBe('usul_darbuka_teke')
  })

  it('koddan kayıt sesi bulunur; oryantal (sentez) kodda yoktur', () => {
    expect(usulSesiInCode('s("usul_tahta_dum@2 usul_tahta_tek@1").cpm(15)')).toBe('tahta')
    expect(usulSesiInCode('stack(freq("440@1").s("triangle"), s("~@2 usul_darbuka_teke@1"))')).toBe('darbuka')
    expect(usulSesiInCode('s("white@2 ~@1").cpm(15)')).toBeNull()
  })
})

describe('usul kayıt dosyaları', () => {
  it('her kayıt sesinin dosyaları public/sounds/usul altında yerel, küçük MP3 dosyalarıdır', () => {
    const all = new Set<string>()
    for (const ses of KAYIT_SESLERI) {
      const urls = usulSampleUrls(ses)
      expect(Object.keys(urls).sort()).toEqual(
        ses === 'tahta' ? ['usul_tahta_dum', 'usul_tahta_tek'] : [`usul_${ses}_dum`, `usul_${ses}_tek`, `usul_${ses}_teke`],
      )
      for (const url of Object.values(urls)) {
        expect(url).toMatch(/^\/sounds\/usul\/[a-z]+-(dum|tek|teke)\.mp3$/)
        const bytes = readFileSync(resolve(root, 'public', url.slice(1)))
        const id3 = bytes.subarray(0, 3).toString('latin1') === 'ID3'
        const sync = bytes[0] === 0xff && (bytes[1]! & 0xe0) === 0xe0
        expect(id3 || sync).toBe(true)
        expect(bytes.length).toBeGreaterThan(1000)
        expect(bytes.length).toBeLessThan(16 * 1024)
        all.add(url)
      }
    }
    expect(all.size).toBe(8)
  })

  it('PWA önbelleği bu mp3 dosyalarını kapsar (glob mp3 içerir, public/ kökü altındadır)', () => {
    const config = readFileSync(resolve(root, 'vite.config.ts'), 'utf8')
    const globs = /globPatterns:\s*\[([^\]]*)\]/.exec(config)![1]!
    expect(globs).toMatch(/'\*\*\/\*\.\{[^}]*\bmp3\b[^}]*\}'/)
  })

  it('lisans metni dosyaların yanında: FluidR3 (Frank Wen) ve WebAudioFont (Srgy Surkv) MIT, VCSL CC0', () => {
    const text = readFileSync(resolve(root, 'public/sounds/usul/LISANS.txt'), 'utf8')
    expect(text).toContain('Copyright (c) 2000-2002, 2008 Frank Wen')
    expect(text).toContain('Copyright (c) 2017 Srgy Surkv')
    expect(text.match(/Permission is hereby granted, free of charge/g)).toHaveLength(2)
    expect(text).toContain('CC0 1.0 Universal')
    expect(text).toContain('https://github.com/sgossner/VCSL')
    for (const n of [64, 63, 62, 77, 76]) expect(text).toContain(`128${n}_0_FluidR3_GM_sf2_file.js`)
    for (const n of [1, 2, 3]) expect(text).toContain(`Darbuka_${n}_hit_vl2_rr1.wav`)
  })
})

const SR = 44100
/** Başında `lead` örnek sessizlik (0), sonra ses olan bir kanal. */
function channel(lead: number, length = lead + 2000): Float32Array {
  const data = new Float32Array(length)
  for (let i = lead; i < length; i++) data[i] = 0.5 * Math.sin(i / 10)
  data[lead] = 0.5
  return data
}

function fakeHost(data: Float32Array = channel(0)) {
  const sources: {
    buffer: unknown
    playbackRate: { value: number }
    loop: boolean
    start: ReturnType<typeof vi.fn>
    stop: ReturnType<typeof vi.fn>
    connect: (n: unknown) => unknown
  }[] = []
  const ctx = {
    decodeAudioData: vi.fn((_d: ArrayBuffer) =>
      Promise.resolve({ duration: data.length / SR, sampleRate: SR, getChannelData: (_c: number) => data }),
    ),
    createBufferSource: vi.fn(() => {
      const src = {
        buffer: null as unknown,
        playbackRate: { value: 1 },
        loop: false,
        start: vi.fn(),
        stop: vi.fn(),
        connect: (n: unknown) => n,
      }
      sources.push(src)
      return src
    }),
    createGain: vi.fn(() => ({ gain: {} })),
  }
  const host = {
    getAudioContext: () => ctx,
    registerSound: vi.fn(),
    getADSRValues: vi.fn((_v: unknown[]) => [0.001, 0.001, 1, 0.02]),
    getParamADSR: vi.fn(),
    onceEnded: vi.fn(),
    releaseAudioNode: vi.fn(),
  }
  return { host: host as unknown as SampleHost, raw: host, ctx, sources }
}

const okFetch = () => vi.fn((_u: string) => Promise.resolve(new Response(new ArrayBuffer(4))))

describe('loadUsulSamples', () => {
  beforeEach(() => resetUsulSamplesForTests())

  it('yalnızca seçilen sesin dosyalarını yükler, çözer ve ses adlarıyla kaydeder', async () => {
    const { host, raw, ctx } = fakeHost()
    const fetchFn = okFetch()
    await loadUsulSamples(host, 'konga', fetchFn)
    expect(fetchFn.mock.calls.map((c) => c[0]).sort()).toEqual(
      ['/sounds/usul/konga-dum.mp3', '/sounds/usul/konga-tek.mp3', '/sounds/usul/konga-teke.mp3'],
    )
    expect(ctx.decodeAudioData).toHaveBeenCalledTimes(3)
    expect(raw.registerSound.mock.calls.map((c) => c[0]).sort()).toEqual([
      'usul_konga_dum',
      'usul_konga_tek',
      'usul_konga_teke',
    ])
  })

  it('aynı ses bir kez yüklenir; başka ses ayrıca yüklenir', async () => {
    const { host } = fakeHost()
    const fetchFn = okFetch()
    await Promise.all([loadUsulSamples(host, 'tahta', fetchFn), loadUsulSamples(host, 'tahta', fetchFn)])
    await loadUsulSamples(host, 'tahta', fetchFn)
    expect(fetchFn).toHaveBeenCalledTimes(2)
    await loadUsulSamples(host, 'darbuka', fetchFn)
    expect(fetchFn).toHaveBeenCalledTimes(5)
  })

  it('yükleme başarısız olursa reject olur ve sonraki çağrı yeniden dener', async () => {
    const { host, raw } = fakeHost()
    const fetchFn = okFetch()
    fetchFn.mockImplementationOnce(() => Promise.resolve(new Response(null, { status: 404 })))
    await expect(loadUsulSamples(host, 'darbuka', fetchFn)).rejects.toThrow()
    raw.registerSound.mockClear()
    await loadUsulSamples(host, 'darbuka', fetchFn)
    expect(raw.registerSound).toHaveBeenCalledTimes(3)
  })

  it('tetiklenince kaydı doğal hızında, döngüsüz çalar; tutma + bırakma + 10 ms sonra durur', async () => {
    const { host, raw, sources } = fakeHost()
    await loadUsulSamples(host, 'darbuka', okFetch())
    const [name, onTrigger] = raw.registerSound.mock.calls[0]! as [
      string,
      (t: number, v: Record<string, unknown>, onended: () => void) => { node: unknown },
    ]
    expect(name).toMatch(/^usul_darbuka_/)
    const handle = onTrigger(5, { duration: 0.9, release: 0.02 }, () => {})
    expect(handle.node).toBeTruthy()
    const src = sources[0]!
    expect(src.buffer).toBeTruthy()
    expect(src.playbackRate.value).toBe(1)
    expect(src.loop).toBe(false)
    expect(src.start).toHaveBeenCalledWith(5, 0) // başta sessizlik yok: kaydırma 0
    expect(src.stop.mock.calls[0]![0]).toBeCloseTo(5 + 0.9 + 0.02 + 0.01, 9)
    // Zarf: tutma süresince tam düzey, sonra bırakma ile sıfıra (kaydın kendi sönüşü korunur).
    const [, a, d, s, r, min, max, begin, end] = raw.getParamADSR.mock.calls[0]!
    expect([a, d, s, r, min, max, begin]).toEqual([0.001, 0.001, 1, 0.02, 0, 1, 5])
    expect(end).toBeCloseTo(5.9, 9)
  })
})

describe('loadUsulSamples: mp3 kodlayıcı gecikmesi (baştaki sessizlik)', () => {
  beforeEach(() => resetUsulSamplesForTests())

  async function startOffset(data: Float32Array): Promise<number> {
    resetUsulSamplesForTests()
    const { host, raw, sources } = fakeHost(data)
    await loadUsulSamples(host, 'konga', okFetch())
    const onTrigger = raw.registerSound.mock.calls[0]![1] as (t: number, v: Record<string, unknown>, e: () => void) => unknown
    onTrigger(2, { duration: 0.3, release: 0.02 }, () => {})
    const src = sources[0]!
    expect(src.start.mock.calls[0]![0]).toBe(2)
    // durma zamanı kaydırmadan bağımsızdır (tutma + bırakma + 10 ms)
    expect(src.stop.mock.calls[0]![0]).toBeCloseTo(2 + 0.3 + 0.02 + 0.01, 9)
    return src.start.mock.calls[0]![1] as number
  }

  it('başındaki 1100 sessiz örnek (LAME dolgusu, ~25 ms) atlanır: kayıt o noktadan başlar', async () => {
    expect(await startOffset(channel(1100))).toBeCloseTo(1100 / SR, 6) // ≈ 0.0249 sn
  })

  it('eşiğin (0.003) altındaki gürültü sessizlik sayılır', async () => {
    const data = channel(500)
    for (let i = 0; i < 500; i++) data[i] = i % 2 ? 0.002 : -0.002
    expect(await startOffset(data)).toBeCloseTo(500 / SR, 6)
  })

  it('başta sessizlik yoksa kaydırma 0', async () => {
    expect(await startOffset(channel(0))).toBe(0)
  })

  it('kaydırma en çok 60 ms (sınır)', async () => {
    expect(await startOffset(channel(10000))).toBeCloseTo(0.06, 9)
    expect(await startOffset(new Float32Array(20000))).toBeCloseTo(0.06, 9) // tamamen sessiz
  })
})
