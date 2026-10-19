import type { DurationKind, MusicEvent, NoteEvent, RestEvent } from '../music/notation'
import { accidentalWidth, AccidentalGlyph, CLEF_GLYPH, MUSIC_FONT } from './glyphs'
import { indexY, ledgerLineYs, LINE_GAP, noteY, staffIndex, STAFF_TOP } from './geometry'

const HEIGHT = 110
const DEFAULT_WIDTH = 240
const FIRST_X = 52
const RIGHT_MARGIN = 8
const HEAD_RX = 6.5
const HEAD_RY = 5
const STEM_LEN = 33
const INK = 'currentColor'
/** İşaret ile nota başı arasındaki boşluk (px); en az 2 olmalı. */
const ACC_GAP = 3
/** Yuva içinde işaret ile önceki notanın arasında bırakılan en az boşluk (px). */
const MIN_GAP = 4
const REST_BAR_W = 12
const REST_BAR_H = 5

/** Bağ yayının tepe noktasının uçlara göre yüksekliği (px). */
const TIE_BULGE = 6
/** Hece metninin taban çizgisi ve boyutu (px): portenin ve aşağı saplı notaların altında. */
const SYLLABLE_Y = 103
const SYLLABLE_SIZE = 11
/** Onaltılıkta iki bayrak arasındaki uzaklık (px). */
const FLAG_STEP = 7

function flagCount(dur: DurationKind): number {
  return dur === 'eighth' ? 1 : dur === 'sixteenth' ? 2 : 0
}

function isHollow(dur: DurationKind): boolean {
  return dur === 'whole' || dur === 'half'
}

function NoteShape(props: { event: NoteEvent; x: number; index: number }) {
  const { event, x, index } = props
  const { pitch, dur } = event
  const idx = staffIndex(pitch)
  const y = noteY(pitch)
  const down = idx >= 4
  const stemX = down ? x - HEAD_RX + 0.5 : x + HEAD_RX - 0.5
  const stemEnd = down ? y + STEM_LEN : y - STEM_LEN
  // Çizgi üzerindeki notada nokta bir sonraki boşluğa yukarı kaydırılır.
  const dotY = idx % 2 === 0 ? y - LINE_GAP / 2 : y

  return (
    <g>
      {ledgerLineYs(pitch).map((ly) => (
        <line
          key={ly}
          data-ledger
          x1={x - HEAD_RX - 4}
          x2={x + HEAD_RX + 4}
          y1={ly}
          y2={ly}
          stroke={INK}
          stroke-width={1.2}
        />
      ))}
      <AccidentalGlyph acc={pitch.acc} x={x - HEAD_RX - ACC_GAP - accidentalWidth(pitch.acc)} y={y} />
      <ellipse
        data-testid="notehead"
        data-index={index}
        cx={x}
        cy={y}
        rx={HEAD_RX}
        ry={HEAD_RY}
        transform={`rotate(-20 ${x} ${y})`}
        fill={isHollow(dur) ? 'none' : INK}
        stroke={INK}
        stroke-width={1.5}
      />
      {dur !== 'whole' && (
        <line
          data-stem={down ? 'down' : 'up'}
          x1={stemX}
          x2={stemX}
          y1={y}
          y2={stemEnd}
          stroke={INK}
          stroke-width={1.5}
        />
      )}
      {Array.from({ length: flagCount(dur) }, (_, i) => {
        // İkinci bayrak sap boyunca nota başına doğru kaydırılır.
        const fy = down ? stemEnd - i * FLAG_STEP : stemEnd + i * FLAG_STEP
        return (
          <path
            key={i}
            data-flag
            d={down ? `M ${stemX} ${fy} q 9 -6 7 -16` : `M ${stemX} ${fy} q 9 6 7 16`}
            fill="none"
            stroke={INK}
            stroke-width={1.8}
          />
        )
      })}
      {event.dotted && <circle data-dot cx={x + HEAD_RX + 5} cy={dotY} r={1.8} fill={INK} />}
    </g>
  )
}

/**
 * Bağ yayı: bu notanın başından sonraki notanın başına, sapın karşı tarafında ince bir eğri.
 * Sonraki nota bu portede yoksa `x2` sağ kenardır.
 */
function TieArc(props: { event: NoteEvent; x1: number; x2: number }) {
  const { event, x1, x2 } = props
  const y = noteY(event.pitch)
  const below = staffIndex(event.pitch) < 4 // sap yukarı → yay aşağıda
  const sign = below ? 1 : -1
  const y0 = y + sign * (HEAD_RY + 1)
  const start = x1 + HEAD_RX - 1
  const end = Math.max(x2 - HEAD_RX + 1, start + 6)
  return (
    <path
      data-tie
      d={`M ${start} ${y0} Q ${(start + end) / 2} ${y0 + sign * TIE_BULGE} ${end} ${y0}`}
      fill="none"
      stroke={INK}
      stroke-width={1.2}
      stroke-linecap="round"
    />
  )
}

function RestShape(props: { event: RestEvent; x: number }) {
  const { event, x } = props
  const { dur } = event
  // Sus işaretleri yazı tipi gerektirmeyen SVG şekillerdir (iOS'ta sus glifleri yok).
  const line2 = STAFF_TOP + LINE_GAP // 4. çizgi (alttan)
  const line3 = STAFF_TOP + 2 * LINE_GAP // orta çizgi
  return (
    <g data-testid="rest" data-dur={dur}>
      {dur === 'whole' && (
        // Birlik sus 4. çizgiden asılır.
        <rect x={x - REST_BAR_W / 2} y={line2} width={REST_BAR_W} height={REST_BAR_H} fill={INK} />
      )}
      {dur === 'half' && (
        // İkilik sus orta çizgiye oturur.
        <rect x={x - REST_BAR_W / 2} y={line3 - REST_BAR_H} width={REST_BAR_W} height={REST_BAR_H} fill={INK} />
      )}
      {dur === 'quarter' && (
        <path
          d={`M ${x - 2} 35 L ${x + 3} 44 L ${x - 3} 52 L ${x + 2} 59 C ${x - 5} 57 ${x - 5} 66 ${x + 2} 65`}
          fill="none"
          stroke={INK}
          stroke-width={2.4}
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      )}
      {dur === 'eighth' && (
        <>
          <circle cx={x - 3} cy={45} r={2.5} fill={INK} />
          <path
            d={`M ${x - 3} 46 Q ${x + 1} 47 ${x + 3.5} 41 L ${x - 2} 62`}
            fill="none"
            stroke={INK}
            stroke-width={1.8}
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </>
      )}
      {dur === 'sixteenth' && (
        <>
          <circle cx={x - 2} cy={41} r={2.5} fill={INK} />
          <circle cx={x - 4} cy={49} r={2.5} fill={INK} />
          <path
            d={`M ${x - 2} 42 Q ${x + 2} 43 ${x + 4.5} 37 L ${x - 3} 66 M ${x - 4} 50 Q ${x} 51 ${x + 2.6} 45`}
            fill="none"
            stroke={INK}
            stroke-width={1.8}
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </>
      )}
      {event.dotted && <circle data-dot cx={x + 10} cy={indexY(5)} r={1.8} fill={INK} />}
    </g>
  )
}

/** `n` olayın her biri en az `slot` px yuva alacak şekilde porte genişliği (en az `min`). */
export function staffWidthFor(n: number, slot: number, min: number): number {
  return Math.max(min, FIRST_X + RIGHT_MARGIN + n * slot)
}

/**
 * Her olay kendi yuvasını alır. Yuva en az `baseSlot` kadardır; işaretli notada solundaki işarete,
 * işaret ile nota başı arasındaki boşluğa ve başın kendisine yetecek kadar genişler. İşaretsiz
 * notalar yalnızca kendi yuvalarının gerektirdiği kadar yer değiştirir. Toplam genişlik `width`'i
 * aşarsa görünüm kutusu genişler (SVG %100 genişlikte ölçeklenir, kırpılmaz).
 */
export function layoutEvents(
  events: MusicEvent[],
  width: number,
): { xs: number[]; ends: number[]; viewWidth: number } {
  const baseSlot = (width - FIRST_X - RIGHT_MARGIN) / Math.max(events.length, 1)
  const xs: number[] = []
  /** Her yuvanın sağ kenarı (ölçü çizgisi buraya çizilir). */
  const ends: number[] = []
  let start = FIRST_X
  for (const e of events) {
    const accW = e.kind === 'note' ? accidentalWidth(e.pitch.acc) : 0
    const slot = accW > 0 ? Math.max(baseSlot, accW + ACC_GAP + 2 * HEAD_RX + MIN_GAP) : baseSlot
    const headFromStart = accW > 0 ? Math.max(slot / 2, accW + ACC_GAP + HEAD_RX + MIN_GAP / 2) : slot / 2
    xs.push(start + headFromStart)
    start += slot
    ends.push(start)
  }
  return { xs, ends, viewWidth: Math.max(width, start + RIGHT_MARGIN) }
}

export function Staff(props: {
  events: MusicEvent[]
  width?: number
  highlightIndex?: number
  /** Bu olay sıralarından sonra ölçü çizgisi çizilir; verilirse satır sonuna da bir çizgi çizilir. */
  barlinesAfter?: number[]
  /** Olaylarla hizalı heceler; nota altında küçük yazılır, boş dizgiler atlanır. */
  syllables?: string[]
}) {
  const { events, width: baseWidth = DEFAULT_WIDTH, highlightIndex, barlinesAfter, syllables } = props
  const { xs, ends, viewWidth: width } = layoutEvents(events, baseWidth)
  const last = events.length - 1
  const barXs = barlinesAfter
    ? [...barlinesAfter.filter((i) => i >= 0 && i < last).map((i) => ends[i]!), width - 2]
    : []

  return (
    <svg
      viewBox={`0 0 ${width} ${HEIGHT}`}
      width="100%"
      role="img"
      aria-label="Porte"
      style={{ maxWidth: `${width * 2}px`, display: 'block' }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={i}
          data-staffline
          x1={2}
          x2={width - 2}
          y1={STAFF_TOP + i * LINE_GAP}
          y2={STAFF_TOP + i * LINE_GAP}
          stroke={INK}
          stroke-width={1}
        />
      ))}
      <text
        x={6}
        y={STAFF_TOP + 3 * LINE_GAP + 4}
        font-size={6 * LINE_GAP}
        font-family={MUSIC_FONT}
        fill={INK}
      >
        {CLEF_GLYPH}
      </text>
      {barXs.map((bx) => (
        <line
          key={bx}
          data-barline
          x1={bx}
          x2={bx}
          y1={STAFF_TOP}
          y2={STAFF_TOP + 4 * LINE_GAP}
          stroke={INK}
          stroke-width={1.2}
        />
      ))}
      {syllables?.map((syl, i) =>
        syl === '' || xs[i] === undefined ? null : (
          <text
            key={`s${i}`}
            data-syllable
            x={xs[i]}
            y={SYLLABLE_Y}
            font-size={SYLLABLE_SIZE}
            text-anchor="middle"
            fill={INK}
          >
            {syl}
          </text>
        ),
      )}
      {events.map((e, i) => {
        const x = xs[i]!
        const highlighted = i === highlightIndex
        return (
          <g
            key={i}
            data-event={i}
            data-highlight={highlighted ? '' : undefined}
            style={highlighted ? { color: 'var(--accent, #d9480f)' } : undefined}
          >
            {e.kind === 'note' ? <NoteShape event={e} x={x} index={i} /> : <RestShape event={e} x={x} />}
            {e.kind === 'note' && e.tie && (
              <TieArc event={e} x1={x} x2={xs[i + 1] ?? width - RIGHT_MARGIN + HEAD_RX} />
            )}
          </g>
        )
      })}
    </svg>
  )
}
