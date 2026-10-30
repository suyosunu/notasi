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

/**
 * Mikrofon açıkken eşlik de çalsın diye 'play-and-record' oturumu; destek yoksa sessizce atlanır.
 * Takip bitince `setPlaybackSession()` ile geri dönülür.
 */
export function setKayitSession(): void {
  const session = (navigator as Navigator & { audioSession?: AudioSessionLike }).audioSession
  if (session) {
    try {
      session.type = 'play-and-record'
    } catch {
      // bazı sürümlerde atama reddedilebilir; mikrofon yine denenir
    }
  }
}

/** Tanılama için: geçerli ses oturumu türü (destek yoksa undefined). */
export function audioSessionType(): string | undefined {
  const session = (navigator as Navigator & { audioSession?: AudioSessionLike }).audioSession
  return session?.type
}

export function isStandalone(): boolean {
  const mql =
    typeof window.matchMedia === 'function' ? window.matchMedia('(display-mode: standalone)') : null
  return (
    mql?.matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}
