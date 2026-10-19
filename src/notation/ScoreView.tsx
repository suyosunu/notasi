import type { MusicEvent } from '../music/notation'
import { layoutEvents, Staff, staffWidthFor } from './Staff'

/** Satırın temel görünüm genişliği (px); telefonda kabaca ekran genişliğine denk gelir. */
const ROW_WIDTH = 340
/**
 * Bir olaya düşen en küçük yuva (px). Kalabalık satırda görünüm kutusu genişler ve SVG %100 genişlikte
 * küçülerek sığar; böylece nota başları, bayraklar ve heceler üst üste binmez, yatay kaydırma da gerekmez.
 */
const MIN_SLOT = 17

/**
 * Görünüm genişliği tam `target` olacak temel genişlik: tüm satırlar aynı ölçekte çizilir ve sağ kenara dek
 * dolar. viewWidth temel genişlikle azalmadan arttığı için ikiye bölme yeterlidir.
 */
function fitWidth(events: MusicEvent[], target: number): number {
  let lo = 0
  let hi = target
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2
    if (layoutEvents(events, mid).viewWidth > target) hi = mid
    else lo = mid
  }
  return lo
}

interface Row {
  events: MusicEvent[]
  barlinesAfter: number[]
  syllables?: string[]
}

function toRows(olcu: MusicEvent[][], soz: string[][] | undefined, perRow: number): Row[] {
  const rows: Row[] = []
  for (let start = 0; start < olcu.length; start += perRow) {
    const events: MusicEvent[] = []
    const barlinesAfter: number[] = []
    const syllables: string[] = []
    olcu.slice(start, start + perRow).forEach((m, j) => {
      const s = soz?.[start + j]
      m.forEach((e, k) => {
        events.push(e)
        syllables.push(s?.[k] ?? '')
      })
      barlinesAfter.push(events.length - 1)
    })
    rows.push({ events, barlinesAfter, ...(soz ? { syllables } : {}) })
  }
  return rows
}

/**
 * Ölçüleri satırlara böler: her satır `olcuPerSatir` ölçülük bir porte, ölçüler arasında ve satır sonunda
 * ölçü çizgisi vardır. Donanım yazılmaz (işaretler nota yanında). Heceler nota altında küçük yazılır.
 */
export function ScoreView(props: { olcu: MusicEvent[][]; soz?: string[][]; olcuPerSatir?: number }) {
  const { olcu, soz, olcuPerSatir = 2 } = props
  const perRow = Math.max(1, Math.floor(olcuPerSatir))
  const rows = toRows(olcu, soz, perRow)
  // Tüm satırlar aynı görünüm genişliğinde çizilir: ölçek satırdan satıra değişmez, nota boyları tutarlı kalır.
  const viewWidth = (r: Row, w: number) => layoutEvents(r.events, w).viewWidth
  // Her satırın doğal genişliği: olay başına en az MIN_SLOT, işaretli notalar gerektiği kadar geniş.
  const natural = (r: Row) => viewWidth(r, staffWidthFor(r.events.length, MIN_SLOT, ROW_WIDTH))
  const width = Math.max(ROW_WIDTH, ...rows.map(natural))
  return (
    <div class="score">
      {rows.map((row, i) => (
        <div key={i} class="score-row" data-testid="score-row">
          <Staff
            events={row.events}
            width={fitWidth(row.events, width)}
            barlinesAfter={row.barlinesAfter}
            syllables={row.syllables}
          />
        </div>
      ))}
    </div>
  )
}
