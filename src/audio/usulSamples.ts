import type { VurusSesi } from '../content/usuller'

/**
 * Usul sesi kayıtları (Ayarlar → "Usul sesi"). "Oryantal" sentezdir (bkz. usul.ts); diğer üç seçenek uygulamayla
 * birlikte gelen kısa mono mp3 kayıtlardır (`public/sounds/usul/`, PWA önbelleğinde; çalışma anında ağdan hiçbir şey
 * indirilmez). Dosyalar `scripts/usul-sesleri.mjs` ile üretilir; lisanslar `public/sounds/usul/LISANS.txt`'tedir:
 * - Konga: Fluid R3 GM (© Frank Wen, MIT; WebAudioFont dönüşümü © Srgy Surkv, MIT). Düm GM 64 Low Conga,
 *   tek GM 63 Open Hi Conga, te/ke GM 62 Mute Hi Conga.
 * - Tahta: aynı kaynak. Düm GM 77 Low Wood Block, tek/te/ke GM 76 Hi Wood Block.
 * - Darbuka: VCSL (Versilian Studios, CC0). Düm Darbuka_1, tek Darbuka_2, te/ke Darbuka_3 (vl2, rr1).
 */
export type UsulSesi = 'oryantal' | 'konga' | 'tahta' | 'darbuka'
export const USUL_SESLERI: readonly UsulSesi[] = ['oryantal', 'konga', 'tahta', 'darbuka']

/** Kayıt tabanlı seçenekler. */
export type KayitSesi = Exclude<UsulSesi, 'oryantal'>
export const KAYIT_SESLERI: readonly KayitSesi[] = ['konga', 'tahta', 'darbuka']

export function isUsulSesi(v: unknown): v is UsulSesi {
  return typeof v === 'string' && (USUL_SESLERI as readonly string[]).includes(v)
}

/** Seçili usul sesi. Açılışta ayarlardan yüklenir, Ayarlar'da değişince ve yedek geri yüklenince hemen uygulanır. */
let usulSesi: UsulSesi = 'tahta'

export function setUsulSesi(v: UsulSesi): void {
  usulSesi = v
}

export function getUsulSesi(): UsulSesi {
  return usulSesi
}

/** Kayıt dosyası adı (uzantısız). Tahta'da te/ke için ayrı kayıt yoktur: tek kaydı çalar. */
type Kayit = 'dum' | 'tek' | 'teke'
const KAYITLAR: Record<KayitSesi, readonly Kayit[]> = {
  konga: ['dum', 'tek', 'teke'],
  tahta: ['dum', 'tek'],
  darbuka: ['dum', 'tek', 'teke'],
}

const soundName = (ses: KayitSesi, k: Kayit) => `usul_${ses}_${k}`

/** Vuruşun Strudel ses adı (`.s(...)`): düm → `usul_<ses>_dum`, tek → `_tek`, te/ke → `_teke` (tahtada `_tek`). */
export function strokeSound(ses: KayitSesi, v: VurusSesi): string {
  if (v === 'düm') return soundName(ses, 'dum')
  if (v === 'tek' || !KAYITLAR[ses].includes('teke')) return soundName(ses, 'tek')
  return soundName(ses, 'teke')
}

/** Bir sesin kayıtları: ses adı → yerel dosya yolu. */
export function usulSampleUrls(ses: KayitSesi): Record<string, string> {
  return Object.fromEntries(
    KAYITLAR[ses].map((k) => [soundName(ses, k), `${import.meta.env.BASE_URL}sounds/usul/${ses}-${k}.mp3`]),
  )
}

/** Kod bir kayıt sesini çalıyorsa o sesi döndürür (yükleme için); sentez kodunda null. */
export function usulSesiInCode(code: string): KayitSesi | null {
  const m = /\busul_(konga|tahta|darbuka)_/.exec(code)
  return m ? (m[1] as KayitSesi) : null
}

/** superdough'un 10 ms durdurma payıyla aynı: ses bırakmadan bu kadar sonra durur (usul.ts zarf hesabı buna göre). */
const STOP_PAD_S = 0.01

/**
 * mp3 kodlayıcısı (LAME) kaydın başına ~25 ms (1105 örnek) dolgu ekler. Chrome bunu çözerken LAME başlığına bakarak
 * atar; atmayan bir tarayıcıda (Safari'de doğrulanmadı) her vuruş melodiden ve vurgudan geç duyulurdu. Bu yüzden
 * çözülen kaydın başındaki sessizlik ölçülür ve çalma o noktadan başlar. Kayıtlar üretilirken -60 dB'de kırpıldığı
 * için eşiği aşan ilk örnek vuruşun başıdır; Chrome'da kaydırma ≈ 0 çıkar.
 */
const ONSET_THRESHOLD = 0.003
/** Kaydırmanın üst sınırı (sn): kayıt bozuk ya da sessizse bile vuruşun gövdesi atlanmasın. */
const MAX_START_OFFSET_S = 0.06

interface DecodedSample {
  buffer: AudioBuffer
  /** Kaydın içinde çalmanın başladığı yer (sn). */
  offset: number
}

/** İlk kanalda |değer| > eşik olan ilk örneğin zamanı (sn), en çok MAX_START_OFFSET_S. */
export function leadingSilence(buffer: Pick<AudioBuffer, 'getChannelData' | 'sampleRate'>): number {
  const data = buffer.getChannelData(0)
  const max = Math.min(data.length, Math.ceil(MAX_START_OFFSET_S * buffer.sampleRate))
  let i = 0
  while (i < max && Math.abs(data[i]!) <= ONSET_THRESHOLD) i++
  return Math.min(i / buffer.sampleRate, MAX_START_OFFSET_S)
}

interface TriggerValue {
  duration: number
  attack?: number
  decay?: number
  sustain?: number
  release?: number
}

/** Kayıt için gereken Strudel (superdough) işlevleri; `@strudel/web` modülü bunları dışa aktarır. */
export interface SampleHost {
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
  onceEnded(node: AudioScheduledSourceNode, callback: () => void): void
  releaseAudioNode(node: AudioNode): void
}

const loading = new Map<KayitSesi, Promise<void>>()

/**
 * Sesin kayıtlarını yerel dosyalardan bir kez yükler, çözer ve ses adlarıyla kaydeder. Tetikleyici eşzamanlıdır:
 * kayıtlar önceden çözüldüğü için ilk vuruş da yüklenme yüzünden atlanmaz. Başarısız olursa sonraki çağrı yeniden dener.
 */
export function loadUsulSamples(
  host: SampleHost,
  ses: KayitSesi,
  fetchFn: (url: string) => Promise<Response> = fetch,
): Promise<void> {
  let p = loading.get(ses)
  if (!p) {
    const attempt = (async () => {
      const ctx = host.getAudioContext()
      const decoded = await Promise.all(
        Object.entries(usulSampleUrls(ses)).map(async ([name, url]) => {
          const res = await fetchFn(url)
          if (!res.ok) throw new Error(`Usul sesi yüklenemedi: ${url} (${res.status})`)
          const buffer = await ctx.decodeAudioData(await res.arrayBuffer())
          return [name, { buffer, offset: leadingSilence(buffer) }] as const
        }),
      )
      // Hepsi çözülünce kaydedilir: yarım yüklenmiş ses kümesi kalmaz.
      for (const [name, sample] of decoded) {
        host.registerSound(name, (time, value, onended) => trigger(host, sample, time, value, onended), {
          type: 'sample',
        })
      }
    })()
    p = attempt
    loading.set(ses, attempt)
    attempt.catch(() => {
      if (loading.get(ses) === attempt) loading.delete(ses)
    })
  }
  return p
}

/**
 * Kaydı doğal hızında (perde değişmeden), döngüsüz çalar. Zarf tutma süresince tam düzeydedir; kaydın kendi sönüşü
 * duyulur. Kayıt vuruştan uzunsa tutma sonunda (`clip`) bırakmayla (`release`) kesilir: usul.ts `envelope(d)`.
 * Düzey (`gain`) superdough zincirinde uygulanır.
 */
function trigger(host: SampleHost, sample: DecodedSample, time: number, value: TriggerValue, onended: () => void) {
  const [attack, decay, sustain, release] = host.getADSRValues([
    value.attack,
    value.decay,
    value.sustain,
    value.release,
  ]) as [number, number, number, number]
  const ctx = host.getAudioContext()
  const src = ctx.createBufferSource()
  src.buffer = sample.buffer
  // Kayıt baştaki sessizlik (kodlayıcı dolgusu) atlanarak tam vuruş anında başlar; durma zamanı bundan bağımsızdır.
  src.start(time, sample.offset)
  const env = ctx.createGain()
  const node = src.connect(env) as GainNode
  const holdEnd = time + value.duration
  host.getParamADSR(env.gain, attack, decay, sustain, release, 0, 1, time, holdEnd, 'linear')
  src.stop(holdEnd + release + STOP_PAD_S)
  host.onceEnded(src, () => {
    host.releaseAudioNode(src)
    onended()
  })
  return { node, stop: () => {}, nodes: { source: [src] } }
}

/** Yalnızca testler için: yükleme önbelleğini sıfırlar. */
export function resetUsulSamplesForTests(): void {
  loading.clear()
}
