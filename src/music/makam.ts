import type { DurationKind, MusicEvent } from './notation'
import type { WrittenPitch } from './pitch'

/** Dizinin her perdesi için bir nota olayı. */
export function diziEvents(dizi: WrittenPitch[], dur: DurationKind): MusicEvent[] {
  return dizi.map((pitch) => ({ kind: 'note', pitch, dur }))
}

/** Dizi önce çıkar sonra iner; tepe nota tekrarlanmaz. Sekizliklerle. */
export function cikisInisEvents(dizi: WrittenPitch[]): MusicEvent[] {
  return diziEvents([...dizi, ...dizi.slice(0, -1).reverse()], 'eighth')
}
