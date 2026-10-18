import type { DurationKind, MusicEvent } from './notation'
import type { WrittenPitch } from './pitch'

/** Dizinin her perdesi için bir nota olayı. */
export function diziEvents(dizi: WrittenPitch[], dur: DurationKind): MusicEvent[] {
  return dizi.map((pitch) => ({ kind: 'note', pitch, dur }))
}

/**
 * Dizi önce çıkar sonra iner; tepe nota tekrarlanmaz. Sekizliklerle.
 * `inis` verilirse iniş o dizinin tersidir (ör. Rast'ta Eviç yerine Acem), yoksa `dizi`nin.
 */
export function cikisInisEvents(dizi: WrittenPitch[], inis: WrittenPitch[] = dizi): MusicEvent[] {
  return diziEvents([...dizi, ...inis.slice(0, -1).reverse()], 'eighth')
}
