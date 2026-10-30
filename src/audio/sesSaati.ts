import type { SampleHost } from './usulSamples'

/**
 * Ses saati işareti: çalımın başına konan tek, sessiz, kısa bir ses. Strudel onu tetiklediğinde tetik zamanı (ses
 * saati, sn) kaydedilir; böylece ekran, çalan notayı `AudioContext.currentTime`'dan çıkarıp vurgulayabilir.
 */

/** İşaret sesinin Strudel adı (`s("notasi_isaret")`). */
export const ISARET_SESI = 'notasi_isaret'

/** Sessiz kısa ses düğümü (superdough zinciri bir kaynak bekler); insan sesi heceleri ve işaret kullanır. */
export function sessizSes(
  host: SampleHost,
  time: number,
  onended: () => void,
): { node: AudioNode; stop: () => void; nodes: { source: AudioScheduledSourceNode[] } } {
  const ctx = host.getAudioContext()
  const src = ctx.createConstantSource()
  src.offset.value = 0
  const node = ctx.createGain()
  src.connect(node)
  src.start(time)
  src.stop(time + 0.01)
  host.onceEnded(src, () => {
    host.releaseAudioNode(src)
    onended()
  })
  return { node, stop: () => {}, nodes: { source: [src] } }
}

let son: number | null = null

/** İşaret sesini Strudel'e kaydeder; her tetiklenişte tetik zamanı `sonIsaret()`te tutulur. */
export function kaydetIsaret(host: SampleHost): void {
  host.registerSound(
    ISARET_SESI,
    (time, _value, onended) => {
      son = time
      return sessizSes(host, time, onended)
    },
    { type: 'sample' },
  )
}

/** İşaretin son tetiklendiği ses saati (sn); hiç tetiklenmediyse null. */
export function sonIsaret(): number | null {
  return son
}

export function isaretiSifirla(): void {
  son = null
}
