import { beats, type MusicEvent } from '../music/notation'

/** Süreler dörtlüğün 1/48'i cinsinden tamsayıya çevrilir (noktalı onaltılık = 18): kayan nokta hatası olmaz. */
const UNIT = 48

/**
 * Kirişlenecek olay sıraları. Ölçü içindeki vuruş konumu izlenir (her ölçü çizgisinden sonra sıfırlanır).
 * Bir grup, aynı vuruş penceresi [k·beatBeats, (k+1)·beatBeats) içinde başlayıp biten ardışık sekizlik ve
 * onaltılık (noktalılar dahil) notalardan oluşur. Sus, daha uzun nota, ölçü çizgisi ya da vuruş sınırı grubu
 * kapatır; en az iki notalı gruplar döner. `beatBeats` dörtlük cinsindendir (4/4: 1, 12/8: 1,5).
 */
export function beamGroups(events: MusicEvent[], beatBeats: number, barlinesAfter?: number[]): number[][] {
  const beat = Math.round(beatBeats * UNIT)
  if (beat <= 0) return []
  const bars = new Set(barlinesAfter ?? [])
  const groups: number[][] = []
  let cur: number[] = []
  let curBeat = -1
  let pos = 0
  const close = () => {
    if (cur.length >= 2) groups.push(cur)
    cur = []
  }
  events.forEach((e, i) => {
    const end = pos + Math.round(beats(e) * UNIT)
    const k = Math.floor(pos / beat)
    const beamable = e.kind === 'note' && (e.dur === 'eighth' || e.dur === 'sixteenth') && end <= (k + 1) * beat
    if (beamable) {
      if (curBeat !== k) close()
      cur.push(i)
      curBeat = k
    } else {
      close()
    }
    pos = end
    if (bars.has(i)) {
      close()
      pos = 0
    }
  })
  close()
  return groups
}

/** Usulün kiriş vuruş birimi (dörtlük): mertebe 8 (ör. 12/8) → üç sekizlik, aksi halde bir dörtlük. */
export function beamBeatsFor(usul: { mertebe: number } | undefined): number {
  return usul?.mertebe === 8 ? 1.5 : 1
}
