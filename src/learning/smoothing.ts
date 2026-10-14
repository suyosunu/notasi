/** Sayı dizisinin ortancası. Boş dizi için NaN döner. */
export function median(xs: number[]): number {
  if (xs.length === 0) return Number.NaN
  const sorted = [...xs].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * Son N geçerli perde değerinin ortancasını verir. Ortanca, tek kare oktav
 * sıçramalarını bastırır. `null` (sessizlik / belirsiz) gelince tampon temizlenir.
 */
export class Smoother {
  private readonly size: number
  private buffer: number[] = []

  constructor(size = 5) {
    this.size = Math.max(1, Math.floor(size))
  }

  push(hz: number | null): number | null {
    if (hz === null || !Number.isFinite(hz)) {
      this.buffer = []
      return null
    }
    this.buffer.push(hz)
    if (this.buffer.length > this.size) this.buffer.shift()
    const m = median(this.buffer)
    return Number.isFinite(m) ? m : null
  }
}
