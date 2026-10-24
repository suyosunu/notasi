/**
 * "Shakuhachi" ney sesi: Fluid R3 GM SoundFont'un shakuhachi örneği (© 2000-2002, 2008 Frank Wen, MIT; kaynak:
 * WebAudioFont verisi `0770_FluidR3_GM_sf2_file`, MIT). Kayıt `public/sounds/shakuhachi.mp3` olarak uygulamayla
 * birlikte gelir ve PWA önbelleğine alınır; çalışma anında ağdan hiçbir şey indirilmez. Lisans metni:
 * `public/sounds/LISANS.txt`.
 *
 * Strudel'in `@strudel/soundfonts` paketi aynı veriyi GitHub Pages'ten çeker ve bütün GM seslerini kaydeder; burada
 * yalnızca bu tek ses, aynı çalma mantığıyla (döngülü örnek, playbackRate ile perde) yerel dosyadan kaydedilir.
 */

/** Strudel'de `.s(...)` ile kullanılan ses adı. */
export const SHAKUHACHI_SOUND = 'ney_shakuhachi'

export const SHAKUHACHI_URL = `${import.meta.env.BASE_URL}sounds/shakuhachi.mp3`

/** Örneğin SoundFont bölgesi (WebAudioFont `0770_FluidR3_GM_sf2_file` verisinden, olduğu gibi). */
export const SHAKUHACHI_ZONE = {
  originalPitch: 7200,
  coarseTune: 0,
  fineTune: 0,
  loopStart: 27377,
  loopEnd: 59881,
  sampleRate: 38000,
} as const

/** Örneğin kök perdesi (MIDI sent cinsinden), ince ve kaba akort düzeltmeleriyle. */
const BASE_CENTS = SHAKUHACHI_ZONE.originalPitch - 100 * SHAKUHACHI_ZONE.coarseTune - SHAKUHACHI_ZONE.fineTune
export const SHAKUHACHI_BASE_HZ = 440 * 2 ** ((BASE_CENTS / 100 - 69) / 12)

/** Zarfın tepe kazancı (Strudel'in soundfont sesleriyle aynı). */
const PEAK_GAIN = 0.3
/** Sesin release'ten sonra kesilmeden önceki küçük payı (s). */
const STOP_PAD = 0.01

/**
 * İstenen frekans için örneğin çalma hızı. Perde yarım sese yuvarlanmaz: oran sürekli olduğundan 53-koma sesleri
 * olduğu gibi elde edilir (Strudel'in `freqToMidi` → playbackRate hesabının kapalı biçimi).
 */
export function playbackRate(freq: number): number {
  return freq / SHAKUHACHI_BASE_HZ
}

interface TriggerValue {
  freq?: number
  duration: number
  attack?: number
  decay?: number
  sustain?: number
  release?: number
}

interface VibratoHandle {
  stop: (t?: number) => void
  nodes: Record<string, AudioNode[]>
}

/** Kayıt için gereken Strudel (superdough) işlevleri; `@strudel/web` modülü bunları dışa aktarır. */
export interface ShakuhachiHost {
  getAudioContext(): AudioContext
  registerSound(
    key: string,
    onTrigger: (time: number, value: TriggerValue, onended: () => void) => unknown,
    data?: Record<string, unknown>,
  ): void
  getADSRValues(params: (number | undefined)[]): number[]
  getParamADSR(
    param: AudioParam,
    attack: number,
    decay: number,
    sustain: number,
    release: number,
    min: number,
    max: number,
    begin: number,
    end: number,
    curve?: 'linear' | 'exponential',
  ): void
  getVibratoOscillator(param: AudioParam, value: object, t: number): VibratoHandle | undefined
  onceEnded(node: AudioScheduledSourceNode, callback: () => void): void
  releaseAudioNode(node: AudioNode): void
}

let loading: Promise<void> | null = null

/**
 * Kaydı yerel dosyadan bir kez yükler, çözer ve `SHAKUHACHI_SOUND` adıyla kaydeder. Tetikleyici eşzamanlıdır:
 * örnek önceden çözüldüğü için ilk nota da yüklenme yüzünden atlanmaz. Başarısız olursa sonraki çağrı yeniden dener.
 */
export function loadShakuhachi(host: ShakuhachiHost, fetchFn: (url: string) => Promise<Response> = fetch): Promise<void> {
  if (!loading) {
    const attempt = (async () => {
      const res = await fetchFn(SHAKUHACHI_URL)
      if (!res.ok) throw new Error(`Shakuhachi sesi yüklenemedi (${res.status})`)
      const buffer = await host.getAudioContext().decodeAudioData(await res.arrayBuffer())
      host.registerSound(SHAKUHACHI_SOUND, (time, value, onended) => trigger(host, buffer, time, value, onended), {
        type: 'soundfont',
      })
    })()
    loading = attempt
    attempt.catch(() => {
      if (loading === attempt) loading = null
    })
  }
  return loading
}

function trigger(host: ShakuhachiHost, buffer: AudioBuffer, time: number, value: TriggerValue, onended: () => void) {
  const [attack, decay, sustain, release] = host.getADSRValues([
    value.attack,
    value.decay,
    value.sustain,
    value.release,
  ]) as [number, number, number, number]
  const ctx = host.getAudioContext()
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.playbackRate.value = playbackRate(value.freq ?? SHAKUHACHI_BASE_HZ)
  src.loop = true
  src.loopStart = SHAKUHACHI_ZONE.loopStart / SHAKUHACHI_ZONE.sampleRate
  src.loopEnd = SHAKUHACHI_ZONE.loopEnd / SHAKUHACHI_ZONE.sampleRate
  src.start(time)
  const env = ctx.createGain()
  const node = src.connect(env) as GainNode
  const holdEnd = time + value.duration
  host.getParamADSR(env.gain, attack, decay, sustain, release, 0, PEAK_GAIN, time, holdEnd, 'linear')
  const vibrato = host.getVibratoOscillator(src.detune, value, time)
  src.stop(holdEnd + release + STOP_PAD)
  host.onceEnded(src, () => {
    host.releaseAudioNode(src)
    vibrato?.stop()
    onended()
  })
  return { node, stop: () => {}, nodes: { source: [src], ...vibrato?.nodes } }
}

/** Yalnızca testler için: yükleme önbelleğini sıfırlar. */
export function resetShakuhachiForTests(): void {
  loading = null
}
