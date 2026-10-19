import { useMemo } from 'preact/hooks'
import type { MusicEvent } from '../music/notation'
import { layoutEvents, Staff, staffWidthFor } from './Staff'

/** Satırın hedef görünüm genişliği (px): telefonda notanın kabı kabaca bu genişliktedir. */
export const ROW_WIDTH = 340
/**
 * Bir olaya düşen en küçük yuva (px). Kalabalık satırda görünüm kutusu genişler ve SVG %100 genişlikte
 * küçülerek sığar; böylece nota başları, bayraklar ve heceler üst üste binmez, yatay kaydırma da gerekmez.
 */
const MIN_SLOT = 17
/** Satırlar bu ölçekten (ROW_WIDTH / görünüm genişliği) daha çok küçülmemelidir. */
export const MIN_SCALE = 0.8

export interface ScoreRow {
  events: MusicEvent[]
  barlinesAfter: number[]
  syllables?: string[]
  /** Staff'a verilecek temel genişlik: görünüm genişliği ortak genişliğe denk gelir. */
  baseWidth: number
}

/** SVG'nin ROW_WIDTH genişliğindeki kapta ölçeği. */
export function scoreScale(width: number, container = ROW_WIDTH): number {
  return Math.min(1, container / width)
}

/** Satırın doğal görünüm genişliği: olay başına en az MIN_SLOT; işaret ve heceler gerektiği kadar genişletir. */
function naturalWidth(events: MusicEvent[], syllables?: string[]): number {
  return layoutEvents(events, staffWidthFor(events.length, MIN_SLOT, ROW_WIDTH), syllables).viewWidth
}

/**
 * Görünüm genişliği tam `target` olacak temel genişlik: tüm satırlar aynı ölçekte çizilir ve sağ kenara dek
 * dolar. viewWidth temel genişlikle azalmadan arttığı için ikiye bölme yeterlidir.
 */
function fitWidth(events: MusicEvent[], syllables: string[] | undefined, target: number): number {
  let lo = 0
  let hi = target
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2
    if (layoutEvents(events, mid, syllables).viewWidth > target) hi = mid
    else lo = mid
  }
  return lo
}

function joinMeasures(olcu: MusicEvent[][], soz: string[][] | undefined, from: number, count: number) {
  const events: MusicEvent[] = []
  const barlinesAfter: number[] = []
  const syllables: string[] = []
  for (let j = from; j < Math.min(from + count, olcu.length); j++) {
    const s = soz?.[j]
    olcu[j]!.forEach((e, k) => {
      events.push(e)
      syllables.push(s?.[k] ?? '')
    })
    barlinesAfter.push(events.length - 1)
  }
  return { events, barlinesAfter, syllables: soz ? syllables : undefined }
}

/**
 * Satır kuralı: ölçüler `perRow`'luk gruplara ayrılır. Bir grubun doğal genişliği ROW_WIDTH / MIN_SCALE'i
 * aşarsa (yani ölçek 0,8'in altına inerdi) o grubun ölçüleri birer birer satıra yazılır. Ardından tüm
 * satırlara tek bir ortak görünüm genişliği verilir (en geniş satırınki), böylece ölçek her satırda aynıdır.
 */
export function scoreLayout(
  olcu: MusicEvent[][],
  soz: string[][] | undefined,
  perRow: number,
): { rows: ScoreRow[]; width: number } {
  const groups: ReturnType<typeof joinMeasures>[] = []
  for (let start = 0; start < olcu.length; start += perRow) {
    const group = joinMeasures(olcu, soz, start, perRow)
    if (perRow > 1 && naturalWidth(group.events, group.syllables) > ROW_WIDTH / MIN_SCALE) {
      for (let j = start; j < Math.min(start + perRow, olcu.length); j++) groups.push(joinMeasures(olcu, soz, j, 1))
    } else {
      groups.push(group)
    }
  }
  const width = Math.max(ROW_WIDTH, ...groups.map((g) => naturalWidth(g.events, g.syllables)))
  const rows = groups.map((g) => ({
    events: g.events,
    barlinesAfter: g.barlinesAfter,
    ...(g.syllables ? { syllables: g.syllables } : {}),
    baseWidth: fitWidth(g.events, g.syllables, width),
  }))
  return { rows, width }
}

/**
 * Ölçüleri satırlara böler: her satır (genellikle) `olcuPerSatir` ölçülük bir porte, ölçüler arasında ve satır
 * sonunda ölçü çizgisi vardır. Donanım yazılmaz (işaretler nota yanında). Heceler nota altında yazılır.
 */
export function ScoreView(props: { olcu: MusicEvent[][]; soz?: string[][]; olcuPerSatir?: number }) {
  const { olcu, soz, olcuPerSatir = 2 } = props
  const perRow = Math.max(1, Math.floor(olcuPerSatir))
  // Hız kaydırıcısı gibi üst bileşen güncellemelerinde yerleşim yeniden hesaplanmaz.
  const { rows } = useMemo(() => scoreLayout(olcu, soz, perRow), [olcu, soz, perRow])
  return (
    <div class="score">
      {rows.map((row, i) => (
        <div key={i} class="score-row" data-testid="score-row">
          <Staff
            events={row.events}
            width={row.baseWidth}
            barlinesAfter={row.barlinesAfter}
            syllables={row.syllables}
          />
        </div>
      ))}
    </div>
  )
}
