import { useId } from 'preact/hooks'
import type { Fingering, Hole } from '../content/ney-perdeler'

const WIDTH = 96
const HEIGHT = 250
const TUBE_X = 40
const TUBE_W = 26
const HOLE_R = 8
const THUMB_Y = 26
const FRONT_Y = [66, 92, 118, 162, 188, 214]
const INK = 'currentColor'

const STATE_TR: Record<Hole, string> = { kapali: 'kapalı', acik: 'açık', yarim: 'yarım' }

function ariaText(f: Fingering): string {
  const parts = [`Başparmak (arka): ${STATE_TR[f.thumb]}`]
  f.front.forEach((h, i) => parts.push(`${i + 1}. delik: ${STATE_TR[h]}`))
  return `Ney parmak şeması. ${parts.join('; ')}.`
}

function HoleMark(props: { state: Hole; name: string; cx: number; cy: number; clipId: string }) {
  const { state, name, cx, cy, clipId } = props
  return (
    <g>
      {state === 'yarim' && (
        <>
          <clipPath id={clipId}>
            <rect x={cx - HOLE_R} y={cy} width={HOLE_R * 2} height={HOLE_R} />
          </clipPath>
          <circle data-testid="half-fill" cx={cx} cy={cy} r={HOLE_R} fill={INK} clip-path={`url(#${clipId})`} />
        </>
      )}
      <circle
        data-testid="hole"
        data-hole={name}
        data-state={state}
        cx={cx}
        cy={cy}
        r={HOLE_R}
        fill={state === 'kapali' ? INK : 'none'}
        stroke={INK}
        stroke-width={1.6}
        stroke-dasharray={name === 'thumb' ? '3 2' : undefined}
      />
    </g>
  )
}

/**
 * Dikey ney şeması: üstte arkadaki başparmak deliği, altında yukarıdan aşağı 6 ön delik.
 * Çağıran yalnızca `visibleFingering(p)` çıktısını vermelidir (null ise şema çizilmez).
 */
export function FingeringDiagram(props: { fingering: Fingering }) {
  const { fingering } = props
  const cx = TUBE_X + TUBE_W / 2
  // Aynı sayfada birden çok şema olabilir; clipPath kimlikleri çakışmasın.
  const uid = useId()
  return (
    <svg
      class="fingering"
      role="img"
      aria-label={ariaText(fingering)}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH}
      height={HEIGHT}
    >
      <rect
        x={TUBE_X}
        y={6}
        width={TUBE_W}
        height={HEIGHT - 12}
        rx={TUBE_W / 2}
        fill="none"
        stroke={INK}
        stroke-opacity={0.35}
        stroke-width={1.2}
      />
      <line
        x1={TUBE_X - 6}
        x2={TUBE_X + TUBE_W + 6}
        y1={(THUMB_Y + FRONT_Y[0]) / 2}
        y2={(THUMB_Y + FRONT_Y[0]) / 2}
        stroke={INK}
        stroke-opacity={0.35}
        stroke-dasharray="2 3"
      />
      <HoleMark state={fingering.thumb} name="thumb" cx={cx} cy={THUMB_Y} clipId={`${uid}-h0`} />
      <text data-label="thumb" x={TUBE_X - 6} y={THUMB_Y + 4} font-size={12} text-anchor="end" fill={INK}>
        arka
      </text>
      {fingering.front.map((state, i) => (
        <HoleMark key={i} state={state} name={`front-${i + 1}`} cx={cx} cy={FRONT_Y[i]} clipId={`${uid}-h${i + 1}`} />
      ))}
      {fingering.front.map((_, i) => (
        <text
          key={`n${i}`}
          x={TUBE_X + TUBE_W + 6}
          y={FRONT_Y[i] + 4}
          font-size={11}
          fill={INK}
          fill-opacity={0.6}
        >
          {i + 1}
        </text>
      ))}
    </svg>
  )
}
