import type { Accidental } from '../music/pitch'
import type { DurationKind } from '../music/notation'

export const MUSIC_FONT = "'Noto Music', 'Bravura Text', 'Apple Symbols', 'Segoe UI Symbol', serif"

export const CLEF_GLYPH = '𝄞'

export const REST_GLYPHS: Record<DurationKind, string> = {
  whole: '𝄻',
  half: '𝄼',
  quarter: '𝄽',
  eighth: '𝄾',
}

/**
 * Değiştirgeç işareti. Sürüm 1'de yalnızca altyapı: ♯/♭ ve küçük koma sayısı.
 * Gerçek AEU glifleri Sürüm 2'de eklenecek.
 */
export function AccidentalGlyph(props: { acc: Accidental; x: number; y: number }) {
  const { acc, x, y } = props
  if (acc === 0) return null
  const symbol = acc > 0 ? '♯' : '♭'
  return (
    <g data-testid="accidental" data-acc={acc}>
      <text x={x} y={y + 4} font-size={20} text-anchor="middle" font-family={MUSIC_FONT}>
        {symbol}
      </text>
      <text x={x} y={y - 8} font-size={9} text-anchor="middle" font-family="sans-serif">
        {Math.abs(acc)}
      </text>
    </g>
  )
}
