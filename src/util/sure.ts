/** Saniye, bir ondalık, Türkçe ondalık virgülüyle: 3200 → "3,2". */
export function seconds(ms: number): string {
  return (ms / 1000).toFixed(1).replace('.', ',')
}
