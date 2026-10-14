import type { JSX } from 'preact'
import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import { MicError, startPitchStream } from '../audio/mic'
import type { PitchSample } from '../audio/mic'

type Reason = 'izin-yok' | 'desteklenmiyor' | 'acilamadi'

interface GateError {
  reason: Reason
  detail?: string
}

const MESSAGES: Record<Reason, string> = {
  'izin-yok': "Mikrofon izni verilmedi. Akort göstergesi için Ayarlar › Safari › Mikrofon'dan izin verin.",
  desteklenmiyor: 'Bu tarayıcı mikrofonu desteklemiyor.',
  acilamadi: 'Mikrofon açılamadı. Ayarlar › Safari › Mikrofon iznini kontrol edip tekrar deneyin.',
}

function toGateError(err: unknown): GateError {
  if (err instanceof MicError) return { reason: err.reason, detail: err.detail }
  if (err instanceof Error) return { reason: 'acilamadi', detail: `${err.name}: ${err.message}` }
  return { reason: 'acilamadi' }
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

  const stop = useCallback(() => {
    generationRef.current++
    const stopper = stopperRef.current
    stopperRef.current = null
    stopper?.()
    if (mountedRef.current) setRunning(false)
  }, [])

  const start = useCallback(async () => {
    stopperRef.current?.()
    stopperRef.current = null
    const gen = ++generationRef.current
    setError(null)
    try {
      const stopper = await startPitchStream((s) => onSampleRef.current(s))
      if (!mountedRef.current || gen !== generationRef.current) {
        stopper() // başlatma sürerken kaldırıldı ya da durduruldu
        return
      }
      stopperRef.current = stopper
      setRunning(true)
    } catch (err) {
      if (!mountedRef.current || gen !== generationRef.current) return
      setRunning(false)
      setError(toGateError(err))
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      generationRef.current++
      stopperRef.current?.()
      stopperRef.current = null
    }
  }, [])

  return (
    <div>
      {props.children(start, stop, running)}
      {error && (
        <div role="alert" class="mic-error">
          <p>{MESSAGES[error.reason]}</p>
          {error.detail && <p class="mic-error-detail">Ayrıntı: {error.detail}</p>}
          <button type="button" onClick={() => void start()}>
            Tekrar dene
          </button>
        </div>
      )}
    </div>
  )
}
