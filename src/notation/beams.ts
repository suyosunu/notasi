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
  if (beat !== UNIT) groups.push(...quarterFallback(events, bars, groups, beat))
  return groups.sort((a, b) => a[0]! - b[0]!)
}

/**
 * Yedek geçiş (vuruş penceresi bir dörtlükten farklıyken, ör. 12/8): henüz gruplanmamış, sus ya da ölçü
 * çizgisiyle ayrılmamış ardışık sekizlik/onaltılıklar sekizlik ızgarasında (0,5 dörtlüğün katı) başlıyor ve
 * toplam tam bir dörtlük sürüyorsa (`e. s`, `s e.`, `e e`, `s s e`) kirişlenir. 4/4'te her dörtlük zaten bir
 * vuruş penceresidir; orada bu geçiş vuruşu aşan gruplar kuracağı için uygulanmaz. Yalnızca noktasız sekizliklerden
 * oluşan ve vuruş sınırını aşan çift (12/8 `q e | e q`) kirişlenmez; `e. s` ve `s e.` kabul edilir.
 */
function quarterFallback(events: MusicEvent[], bars: Set<number>, taken: number[][], beat: number): number[][] {
  const used = new Set(taken.flat())
  const eighth = UNIT / 2
  const free = (i: number) => {
    const e = events[i]!
    return !used.has(i) && e.kind === 'note' && (e.dur === 'eighth' || e.dur === 'sixteenth')
  }
  const starts: number[] = []
  let pos = 0
  events.forEach((e, i) => {
    starts.push(pos)
    pos = bars.has(i) ? 0 : pos + Math.round(beats(e) * UNIT)
  })
  const out: number[][] = []
  let i = 0
  while (i < events.length) {
    if (!free(i) || starts[i]! % eighth !== 0) {
      i++
      continue
    }
    const run = [i]
    let span = Math.round(beats(events[i]!) * UNIT)
    let j = i
    while (span < UNIT && !bars.has(j) && j + 1 < events.length && free(j + 1)) {
      j++
      run.push(j)
      span += Math.round(beats(events[j]!) * UNIT)
    }
    // Yalın (noktasız) sekizliklerden oluşan, vuruş sınırını aşan çift (12/8'de q e | e q) kirişlenmez.
    const plainEighths = run.every((k) => {
      const e = events[k]!
      return e.kind === 'note' && e.dur === 'eighth' && !e.dotted
    })
    const crossesBeat = Math.floor(starts[i]! / beat) !== Math.floor((starts[i]! + span - 1) / beat)
    if (span === UNIT && run.length >= 2 && !(plainEighths && crossesBeat)) {
      out.push(run)
      run.forEach((k) => used.add(k))
      i = j + 1
    } else {
      i++
    }
  }
  return out
}

/** Usulün kiriş vuruş birimi (dörtlük): mertebe 8 (ör. 12/8) → üç sekizlik, aksi halde bir dörtlük. */
export function beamBeatsFor(usul: { mertebe: number } | undefined): number {
  return usul?.mertebe === 8 ? 1.5 : 1
}
