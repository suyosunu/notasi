import type { DurationKind, MusicEvent, NoteEvent, RestEvent } from '../music/notation'
import { beamGroups } from './beams'
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
export const SYLLABLE_SIZE = 12
/** Yan yana iki hece kutusu arasında kalan en az boşluk (px). */
const SYLLABLE_PAD = 4

/** Hecenin tahmini genişliği (px): karakter sayısı × 0,55 × yazı boyu. */
export function syllableWidth(s: string): number {
  return [...s].length * 0.55 * SYLLABLE_SIZE
}
/** Onaltılıkta iki bayrak arasındaki uzaklık (px). */
const FLAG_STEP = 7

function flagCount(dur: DurationKind): number {
  return dur === 'eighth' ? 1 : dur === 'sixteenth' ? 2 : 0
}

function isHollow(dur: DurationKind): boolean {
  return dur === 'whole' || dur === 'half'
}

/** Sapın x konumu: aşağı saplıda başın solunda, yukarı saplıda sağında. */
function stemXFor(x: number, down: boolean): number {
  return down ? x - HEAD_RX + 0.5 : x + HEAD_RX - 0.5
}

/** Tek başına çizilen notanın sap yönü: orta çizgi ve üstü aşağı. */
function soloDown(n: NoteEvent): boolean {
  return staffIndex(n.pitch) >= 4
}

/** Kirişli notanın ortak sap yönü ve kiriş üzerindeki sap ucu. */
interface BeamTip {
  down: boolean
  y: number
}

interface BeamSegment {
  level: 1 | 2
  x1: number
  x2: number
}

interface BeamLayout {
  down: boolean
  /** Olay sırası → sap ucu (kirişin dış kenarı). */
  tips: Map<number, number>
  segments: BeamSegment[]
  /** Kirişin dış kenarının (1. kiriş) x'teki y'si. */
  lineAt: (x: number) => number
}

/** Kiriş kalınlığı (0,45 aralık). */
const BEAM_THICK = 4.5
/** İkinci kirişin birinciye göre nota başlarına doğru kayması (0,75 aralık). */
const BEAM_STEP = 7.5
/** Kirişli notada en kısa sap (2,5 aralık). */
const MIN_BEAM_STEM = 25
/** Kiriş hecelere ya da görünüm kutusunun dışına taşacaksa sap en çok bu boya (2 aralık) dek kısalabilir. */
const EDGE_MIN_STEM = 20
/** Kirişin dış kenarı bu aralıkta kalır: heceler (taban 103) ve görünüm kutusunun üstü korunur. */
const BEAM_MIN_Y = 2
const BEAM_MAX_Y = 88
/** Sap kalınlığının yarısı: kiriş sapların dış kenarına dek uzanır. */
const HALF_STEM = 0.75
/** Tek onaltılıktaki kısa kiriş parçasının boyu: bir nota başı genişliği. */
const STUB_LEN = 2 * HEAD_RX

/**
 * Bir kiriş grubunun geometrisi. Ortak sap yönü orta çizgiden (Si4) en uzak notaya göredir (eşitlikte aşağı).
 * Kiriş ilk ve son notanın olağan sap uçlarından geçen doğrudur; eğimi en fazla ±1 aralığa kısılır, sonra her
 * sap en az 2,5 aralık olacak biçimde dışa kaydırılır. Hecelere ya da görünüm kutusunun üstüne taşacaksa, sap
 * boyları izin verdiği ölçüde başlara doğru çekilir.
 */
function layoutBeam(group: number[], events: MusicEvent[], xs: number[]): BeamLayout {
  const notes = group.map((i) => events[i] as NoteEvent)
  const idxs = notes.map((n) => staffIndex(n.pitch))
  const down = Math.max(...idxs.map((v) => v - 4)) >= Math.max(...idxs.map((v) => 4 - v))
  const sign = down ? 1 : -1
  const sxs = group.map((i) => stemXFor(xs[i]!, down))
  const ys = notes.map((n) => noteY(n.pitch))
  const first = sxs[0]!
  const span = sxs.at(-1)! - first
  const t0 = ys[0]! + sign * STEM_LEN
  const t1 = ys.at(-1)! + sign * STEM_LEN
  // Eğim, çizilen kiriş boyunca (sap kalınlığı dahil) en fazla bir aralık yükselecek biçimde kısılır.
  const maxSlope = LINE_GAP / (span + 2 * HALF_STEM)
  const slope = span > 0 ? Math.max(-maxSlope, Math.min(maxSlope, (t1 - t0) / span)) : 0
  // Kısılan eğimli doğru, iki ucun ortasından geçer.
  let b = (t0 + t1) / 2 - (slope * span) / 2
  const lineAt = (x: number) => b + slope * (x - first)
  const stemLen = (j: number) => sign * (lineAt(sxs[j]!) - ys[j]!)
  const shortest = () => Math.min(...sxs.map((_, j) => stemLen(j)))
  const need = MIN_BEAM_STEM - shortest()
  if (need > 0) b += sign * need
  const ends = [lineAt(first - HALF_STEM), lineAt(first + span + HALF_STEM)]
  const overflow = down ? Math.max(...ends) - BEAM_MAX_Y : BEAM_MIN_Y - Math.min(...ends)
  if (overflow > 0) b -= sign * Math.min(overflow, Math.max(0, shortest() - EDGE_MIN_STEM))

  const tips = new Map(group.map((i, j) => [i, lineAt(sxs[j]!)]))
  const segments: BeamSegment[] = [{ level: 1, x1: first - HALF_STEM, x2: first + span + HALF_STEM }]
  // Onaltılıklar: ardışık olanlar tam ikinci kirişle, tek kalan komşusuna doğru kısa parçayla bağlanır.
  let j = 0
  while (j < notes.length) {
    if (notes[j]!.dur !== 'sixteenth') {
      j++
      continue
    }
    let k = j
    while (k + 1 < notes.length && notes[k + 1]!.dur === 'sixteenth') k++
    if (k > j) {
      segments.push({ level: 2, x1: sxs[j]! - HALF_STEM, x2: sxs[k]! + HALF_STEM })
    } else {
      const left = j === notes.length - 1 || (j > 0 && notes[j - 1]!.dotted === true)
      const sx = sxs[j]!
      segments.push(
        left
          ? { level: 2, x1: sx + HALF_STEM - STUB_LEN, x2: sx + HALF_STEM }
          : { level: 2, x1: sx - HALF_STEM, x2: sx - HALF_STEM + STUB_LEN },
      )
    }
    j = k + 1
  }
  return { down, tips, segments, lineAt }
}

/** Kiriş parçası: dış kenarı kiriş doğrusunda (ikincisi başlara doğru kaydırılmış), kalınlığı başlara doğru. */
function BeamPath(props: { layout: BeamLayout; segment: BeamSegment }) {
  const { layout, segment } = props
  const inward = layout.down ? -1 : 1
  const off = segment.level === 2 ? inward * BEAM_STEP : 0
  const ya = layout.lineAt(segment.x1) + off
  const yb = layout.lineAt(segment.x2) + off
  const t = inward * BEAM_THICK
  return (
    <path
      data-beam={String(segment.level)}
      d={`M ${segment.x1} ${ya} L ${segment.x2} ${yb} L ${segment.x2} ${yb + t} L ${segment.x1} ${ya + t} Z`}
      fill={INK}
    />
  )
}

function NoteShape(props: { event: NoteEvent; x: number; index: number; beam?: BeamTip }) {
  const { event, x, index, beam } = props
  const { pitch, dur } = event
  const idx = staffIndex(pitch)
  const y = noteY(pitch)
  const down = beam ? beam.down : soloDown(event)
  const stemX = stemXFor(x, down)
  const stemEnd = beam ? beam.y : down ? y + STEM_LEN : y - STEM_LEN
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
          data-beamed={beam ? '' : undefined}
          x1={stemX}
          x2={stemX}
          y1={y}
          y2={stemEnd}
          stroke={INK}
          stroke-width={1.5}
        />
      )}
      {Array.from({ length: beam ? 0 : flagCount(dur) }, (_, i) => {
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
function TieArc(props: { event: NoteEvent; x1: number; x2: number; stemDown: boolean }) {
  const { event, x1, x2, stemDown } = props
  const y = noteY(event.pitch)
  const below = !stemDown // sap yukarı → yay aşağıda
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
  syllables?: string[],
): { xs: number[]; ends: number[]; viewWidth: number } {
  const baseSlot = (width - FIRST_X - RIGHT_MARGIN) / Math.max(events.length, 1)
  const xs: number[] = []
  /** Her yuvanın sağ kenarı (ölçü çizgisi buraya çizilir). */
  const ends: number[] = []
  let start = FIRST_X
  for (const [i, e] of events.entries()) {
    const accW = e.kind === 'note' ? accidentalWidth(e.pitch.acc) : 0
    let slot = accW > 0 ? Math.max(baseSlot, accW + ACC_GAP + 2 * HEAD_RX + MIN_GAP) : baseSlot
    let headFromStart = accW > 0 ? Math.max(slot / 2, accW + ACC_GAP + HEAD_RX + MIN_GAP / 2) : slot / 2
    // Hece notanın altında ortalanır: yuva, hecenin iki yarısına (ve aradaki boşluğa) yetecek kadar genişler.
    const syl = syllables?.[i] ?? ''
    if (syl !== '') {
      const half = (syllableWidth(syl) + SYLLABLE_PAD) / 2
      headFromStart = Math.max(headFromStart, half)
      slot = Math.max(slot, headFromStart + half)
    }
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
  /**
   * Verilirse bir vuruş (dörtlük cinsinden; 4/4: 1, 12/8: 1,5) içindeki sekizlik ve onaltılıklar kirişlenir.
   * Verilmezse her nota bayrağıyla, bugünkü gibi çizilir.
   */
  beamBeats?: number
}) {
  const { events, width: baseWidth = DEFAULT_WIDTH, highlightIndex, barlinesAfter, syllables, beamBeats } = props
  const { xs, ends, viewWidth: width } = layoutEvents(events, baseWidth, syllables)
  const beams =
    beamBeats === undefined
      ? []
      : beamGroups(events, beamBeats, barlinesAfter).map((g) => layoutBeam(g, events, xs))
  const beamTips = new Map<number, BeamTip>()
  for (const b of beams) for (const [i, y] of b.tips) beamTips.set(i, { down: b.down, y })
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
            {e.kind === 'note' ? (
              <NoteShape event={e} x={x} index={i} beam={beamTips.get(i)} />
            ) : (
              <RestShape event={e} x={x} />
            )}
            {e.kind === 'note' && e.tie && (
              <TieArc
                event={e}
                x1={x}
                x2={xs[i + 1] ?? width - RIGHT_MARGIN + HEAD_RX}
                stemDown={beamTips.get(i)?.down ?? soloDown(e)}
              />
            )}
          </g>
        )
      })}
      {beams.map((b, k) => (
        <g key={`b${k}`} data-beam-group>
          {b.segments.map((s, j) => (
            <BeamPath key={j} layout={b} segment={s} />
          ))}
        </g>
      ))}
    </svg>
  )
}
