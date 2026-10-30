import type { JSX } from 'preact'
import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import { micHataMetni, startPitchStream } from '../audio/mic'
import type { PitchSample } from '../audio/mic'

interface GateError {
  metin: string
  detay?: string
}

/**
 * Mikrofon akışının sahibi. `start` mutlaka kullanıcı dokunuşundan çağrılmalıdır (iOS).
 * Hata olursa Türkçe açıklama ve "Tekrar dene" düğmesi gösterir; çocuk içerik görünür kalır.
 */
export function MicGate(props: {
  onSample: (s: PitchSample) => void
  children: (start: () => Promise<void>, stop: () => void, running: boolean) => JSX.Element
}): JSX.Element {
  const [error, setError] = useState<GateError | null>(null)
  const [running, setRunning] = useState(false)
  const stopperRef = useRef<(() => void) | null>(null)
  const onSampleRef = useRef(props.onSample)
  onSampleRef.current = props.onSample
  const mountedRef = useRef(true)
  /** Her start/stop'ta artar; bayat (geç dönen) başlatmalar bununla ayıklanır. */
  const generationRef = useRef(0)
  /** Süren başlatmanın iptal anahtarı: izler gelir gelmez mic.ts tarafında durdurulur. */
  const abortRef = useRef<AbortController | null>(null)

  const cancelPending = () => {
    abortRef.current?.abort()
    abortRef.current = null
  }

  const stop = useCallback(() => {
    generationRef.current++
    cancelPending()
    const stopper = stopperRef.current
    stopperRef.current = null
    stopper?.()
    if (mountedRef.current) setRunning(false)
  }, [])

  const start = useCallback(async () => {
    stopperRef.current?.()
    stopperRef.current = null
    cancelPending()
    const controller = new AbortController()
    abortRef.current = controller
    const gen = ++generationRef.current
    setError(null)
    try {
      const stopper = await startPitchStream((s) => onSampleRef.current(s), controller.signal)
      if (abortRef.current === controller) abortRef.current = null
      if (!mountedRef.current || gen !== generationRef.current) {
        stopper() // başlatma sürerken kaldırıldı ya da durduruldu
        return
      }
      stopperRef.current = stopper
      setRunning(true)
    } catch (err) {
      if (abortRef.current === controller) abortRef.current = null
      if (!mountedRef.current || gen !== generationRef.current) return
      setRunning(false)
      setError(micHataMetni(err))
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      generationRef.current++
      cancelPending()
      stopperRef.current?.()
      stopperRef.current = null
    }
  }, [])

  return (
    <div>
      {props.children(start, stop, running)}
      {error && (
        <div role="alert" class="mic-error">
          <p>{error.metin}</p>
          {error.detay && <p class="mic-error-detail">Ayrıntı: {error.detay}</p>}
          <button type="button" onClick={() => void start()}>
            Tekrar dene
          </button>
        </div>
      )}
    </div>
  )
}
