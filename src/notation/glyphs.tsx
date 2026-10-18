import type { Accidental } from '../music/pitch'
import { LINE_GAP } from './geometry'

export const MUSIC_FONT = "'Noto Music', 'Bravura Text', 'Apple Symbols', 'Segoe UI Symbol', serif"

export const CLEF_GLYPH = '𝄞'

const INK = 'currentColor'

/**
 * AEU değiştirgeçleri (Arel-Ezgi-Uzdilek). Hepsi SVG şekli; yazı tipi gerekmez.
 * Şekiller ve ölçüler araştırma notu §1'deki Bravura sınır kutularından alındı.
 * Yerel koordinatlar "porte aralığı" (sp) cinsindendir; y yukarı pozitiftir ve
 * 0 notanın çizgisi/aralığıdır. 1 sp = LINE_GAP px.
 */

type AeuAccidental = 1 | -1 | 4 | -4 | 5 | -5 | 8 | -8

/** Sağ ve sol kenar arasındaki genişlik (sp). */
const WIDTH_SP: Record<AeuAccidental, number> = {
  [-1]: 0.92,
  [-4]: 1.15,
  [-5]: 0.91,
  [-8]: 1.15,
  1: 0.92,
  4: 1.0,
  5: 1.36,
  8: 1.37,
}

function isAeu(acc: Accidental): acc is AeuAccidental {
  return acc !== 0 && acc !== 9 && acc !== -9
}

/** İşaretin px cinsinden genişliği; çizilmeyen (0, ±9) için 0. */
export function accidentalWidth(acc: Accidental): number {
  return isAeu(acc) ? Math.round(WIDTH_SP[acc] * LINE_GAP * 100) / 100 : 0
}

const STEM_W = 0.1
const BAR_T = 0.2
/** Çubukların sağa yükselişi (sp / sp). */
const BAR_SLOPE = 0.3

/** Sağa yükselen, uçları dikey kesilmiş kalın çubuk. (x1,yMerkez1) -> (x2,yMerkez2) */
function barPath(x1: number, x2: number, yCenterMid: number, thickness = BAR_T): string {
  const half = ((x2 - x1) * BAR_SLOPE) / 2
  const ya = yCenterMid - half
  const yb = yCenterMid + half
  const t = thickness / 2
  return `M ${x1} ${ya - t} L ${x2} ${yb - t} L ${x2} ${yb + t} L ${x1} ${ya + t} Z`
}

/** Bemol gövdesi + göbeği; sol kenar x0. Standart bemol 0.91 sp genişliğindedir. */
function Flat(props: { x0: number }) {
  const x = props.x0
  const s = x + STEM_W // gövdenin sağ kenarı
  return (
    <>
      <rect data-part="stem" x={x} y={-0.7} width={STEM_W} height={2.46} fill={INK} />
      <path
        data-part="bowl"
        d={
          `M ${s} -0.62 ` +
          `C ${x + 0.4} -0.4 ${x + 0.91} -0.02 ${x + 0.91} 0.5 ` +
          `C ${x + 0.91} 0.95 ${x + 0.5} 1.08 ${s} 0.66 ` +
          `L ${s} 0.5 ` +
          `C ${x + 0.4} 0.88 ${x + 0.63} 0.78 ${x + 0.63} 0.46 ` +
          `C ${x + 0.63} 0.12 ${x + 0.42} -0.1 ${s} -0.28 Z`
        }
        fill={INK}
      />
    </>
  )
}

/** Gövdeyi göbeğin üstünde kesen eğik çizgi (bakiye / büyük mücenneb bemolü). */
function Slash(props: { x1: number; x2: number; y: number }) {
  return <path data-part="slash" d={barPath(props.x1, props.x2, props.y, 0.17)} fill={INK} />
}

function Stem(props: { x: number; y1: number; y2: number }) {
  return <rect data-part="stem" x={props.x - STEM_W / 2} y={props.y1} width={STEM_W} height={props.y2 - props.y1} fill={INK} />
}

function Bar(props: { x1: number; x2: number; y: number }) {
  return <path data-part="bar" d={barPath(props.x1, props.x2, props.y)} fill={INK} />
}

/** Sol kenarı x = 0, y = 0 nota konumu olan yerel şekil. */
function Shape(props: { acc: AeuAccidental }) {
  switch (props.acc) {
    case -5:
      return <Flat x0={0} />
    case -1:
      // Koma bemolü: bemolün yatay aynası (gövde sağda, göbek sola açılır).
      return (
        <g data-mirrored="true" transform={`translate(${WIDTH_SP[-1]} 0) scale(-1 1)`}>
          <Flat x0={0} />
        </g>
      )
    case -4:
      // Bakiye bemolü: bir eğik çizgi gövdeyi göbeğin üstünde keser.
      return (
        <>
          <Flat x0={0.24} />
          <Slash x1={0} x2={0.62} y={1.2} />
        </>
      )
    case -8:
      // Büyük mücenneb bemolü: iki paralel eğik çizgi.
      return (
        <>
          <Flat x0={0.24} />
          <Slash x1={0} x2={0.62} y={1.05} />
          <Slash x1={0} x2={0.62} y={1.5} />
        </>
      )
    case 1:
      // Koma diyezi: tek gövde, iki kısa çubuk.
      return (
        <>
          <Stem x={0.46} y1={-1.35} y2={1.29} />
          <Bar x1={0} x2={0.92} y={0.5} />
          <Bar x1={0} x2={0.92} y={-0.5} />
        </>
      )
    case 4:
      // Bakiye diyezi: standart diyez.
      return (
        <>
          <Stem x={0.3} y1={-1.2} y2={1.4} />
          <Stem x={0.7} y1={-1.39} y2={1.2} />
          <Bar x1={0} x2={1} y={0.5} />
          <Bar x1={0} x2={1} y={-0.5} />
        </>
      )
    case 5:
      // Küçük mücenneb diyezi: tek gövde, üç çubuk; ortadaki uzun.
      return (
        <>
          <Stem x={0.68} y1={-1.35} y2={1.28} />
          <Bar x1={0.22} x2={1.14} y={0.75} />
          <Bar x1={0} x2={1.36} y={0} />
          <Bar x1={0.22} x2={1.14} y={-0.75} />
        </>
      )
    case 8:
      // Büyük mücenneb diyezi: standart diyez + ortada uzun üçüncü çubuk.
      return (
        <>
          <Stem x={0.49} y1={-1.2} y2={1.39} />
          <Stem x={0.89} y1={-1.4} y2={1.2} />
          <Bar x1={0.185} x2={1.185} y={0.75} />
          <Bar x1={0} x2={1.37} y={0} />
          <Bar x1={0.185} x2={1.185} y={-0.75} />
        </>
      )
  }
}

/**
 * AEU değiştirgeci. `x` işaretin SOL kenarı, `y` notanın merkez çizgisi (px).
 * Sağ kenar `x + accidentalWidth(acc)` olur. 0 ve ±9 (tam ses) için çizim yoktur.
 */
export function AccidentalGlyph(props: { acc: Accidental; x: number; y: number }) {
  const { acc, x, y } = props
  if (!isAeu(acc)) return null
  const width = accidentalWidth(acc)
  return (
    <g
      data-testid="accidental"
      data-acc={acc}
      data-x={x}
      data-width={width}
      data-right={x + width}
      transform={`translate(${x} ${y})`}
    >
      <g transform={`scale(${LINE_GAP} ${-LINE_GAP})`}>
        <Shape acc={acc} />
      </g>
    </g>
  )
}
