interface AudioSessionLike {
  type: string
}

/** iOS Safari'de sessiz anahtarı açıkken de çalsın diye; destek yoksa sessizce atlanır. */
export function setPlaybackSession(): void {
  const session = (navigator as Navigator & { audioSession?: AudioSessionLike }).audioSession
  if (session) {
    try {
      session.type = 'playback'
    } catch {
      // bazı sürümlerde atama reddedilebilir; ses yine de çalar
    }
  }
}

export function isStandalone(): boolean {
  const mql =
    typeof window.matchMedia === 'function' ? window.matchMedia('(display-mode: standalone)') : null
  return (
    mql?.matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}
