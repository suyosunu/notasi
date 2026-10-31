import { NEY_PERDELER } from '../content/ney-perdeler'
import type { PerdeId } from '../content/ney-perdeler'
import { SEVIYELER } from '../content/seviyeler'
import type { MusicEvent } from '../music/notation'
import { samePitch, writtenKoma } from '../music/pitch'

/** Yazıdaki koma bemolü gibi anahtar işareti yazımları için pay: perdeye en çok bu kadar koma uzak nota o perdedendir. */
const KOMA_PAYI = 1

/**
 * Bir perdenin seviyesi: `uzun-ses` hedefi hangi seviyenin hedeflerindeyse o (tek kaynak: SEVIYELER).
 * Seviye 0'daki "ilk ses" hedefi sayılmaz; Nevâ Seviye 1'dendir.
 */
export function perdeSeviyesi(id: PerdeId): number | null {
  for (const s of SEVIYELER) {
    if (s.no < 1) continue
    if (s.hedefler.some((h) => h.olcut.tur === 'uzun-ses' && h.olcut.perdeId === id)) return s.no
  }
  return null
}

/** Ritim seviyesi: otuzikilik 4; onaltılık, noktalı sekizlik ya da üçleme 2; yoksa 1. */
function ritimSeviyesi(olaylar: MusicEvent[]): number {
  let seviye = 1
  for (const e of olaylar) {
    if (e.dur === 'thirtysecond') return 4
    if (e.dur === 'sixteenth' || e.uclu || (e.dur === 'eighth' && e.dotted)) seviye = 2
  }
  return seviye
}

/** Bir notanın seviyesi: tam eşleşen perdelerin en düşüğü; yoksa 1 koma içindekilerin en düşüğü; yoksa null. */
function notaSeviyesi(pitch: Extract<MusicEvent, { kind: 'note' }>['pitch']): number | null {
  const enDusuk = (perdeler: typeof NEY_PERDELER): number | null => {
    const seviyeler = perdeler.map((p) => perdeSeviyesi(p.id)).filter((s): s is number => s !== null)
    return seviyeler.length > 0 ? Math.min(...seviyeler) : null
  }
  const tam = NEY_PERDELER.filter((p) => samePitch(p.written, pitch))
  if (tam.length > 0) return enDusuk(tam)
  const koma = writtenKoma(pitch)
  return enDusuk(NEY_PERDELER.filter((p) => Math.abs(writtenKoma(p.written) - koma) <= KOMA_PAYI))
}

/**
 * Parça seviyesi = max(perde seviyelerinin en büyüğü, ritim seviyesi).
 * Perdesi uygulamada olmayan (her perdeye 1 komadan uzak) nota varsa null.
 */
export function parcaSeviyesi(olcu: MusicEvent[][]): number | null {
  const olaylar = olcu.flat()
  let seviye = ritimSeviyesi(olaylar)
  for (const e of olaylar) {
    if (e.kind !== 'note') continue
    const s = notaSeviyesi(e.pitch)
    if (s === null) return null
    seviye = Math.max(seviye, s)
  }
  return seviye
}
