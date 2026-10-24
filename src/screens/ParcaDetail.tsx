import { useEffect, useRef, useState } from 'preact/hooks'
import { getNeySesi, playCode, stopAudio, unlockAudio } from '../audio/player'
import { buildPieceCode } from '../audio/piece'
import { acquireWakeLock, releaseWakeLock } from '../audio/wakeLock'
import { PARCALAR } from '../content/parcalar'
import { SOUND_OFF, SOUND_WARNING } from '../content/ses-mesajlari'
import { USULLER } from '../content/usuller'
import { ScoreView } from '../notation/ScoreView'
import { getSettings } from '../store/db'
import type { Settings } from '../store/db'
import { makamAdi, usulAdi } from './ParcalarSection'

/** SymbTr deposunun sayfası; ham TSV bağlantısı (`piece.source`) kaynak olarak veri dosyasında kalır. */
const SYMBTR_URL = 'https://github.com/MTG/SymbTr'
const BPM_MIN = 40
const BPM_MAX = 100
const BPM_DEFAULT = 60
const METRONOME_NOTE = 'Bu usulün vuruş kalıbı bilinmediği için eşlik metronomla yapılır.'

/** Tek parça: başlık bilgileri, satırlara bölünmüş nota, hız, usul eşliği ve dinle/durdur. */
export function ParcaDetail({ parcaId }: { parcaId: string }) {
  const parca = PARCALAR.find((p) => p.id === parcaId)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [bpm, setBpm] = useState(BPM_DEFAULT)
  const [withUsul, setWithUsul] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [warn, setWarn] = useState<string | null>(null)
  /** Her başlatma/durdurmada artar: yalnızca son çalmanın sonucu ekranı değiştirir. */
  const runRef = useRef(0)

  useEffect(() => {
    let alive = true
    void getSettings().then((cfg) => {
      if (alive) setSettings(cfg)
    })
    return () => {
      alive = false
    }
  }, [])

  // Sayfadan çıkınca çalan parça susar.
  useEffect(
    () => () => {
      runRef.current++
      stopAudio()
      releaseWakeLock()
    },
    [],
  )

  if (!parca) {
    return (
      <main class="screen">
        <p class="muted">Parça bulunamadı.</p>
        <a class="back" href="#/parcalar">
          Parçalar bölümüne dön
        </a>
      </main>
    )
  }
  const piece = parca
  const usul = USULLER.find((u) => u.id === piece.usul)

  /** Dokunuş işleyicisinden çağrılır: unlockAudio ilk iş olarak, eşzamanlı başlatılır (iOS). */
  async function listen() {
    if (!settings) return
    const run = ++runRef.current
    setWarn(null)
    if (!settings.soundOn) {
      setWarn(SOUND_OFF)
      return
    }
    setPlaying(true)
    void acquireWakeLock() // uzun parça çalarken ekran kararmasın
    try {
      const unlocked = unlockAudio()
      unlocked.catch(() => {}) // kod üretimi fırlatırsa işlenmemiş ret kalmasın; hata aşağıda await ile yakalanır
      const { code, durationMs } = buildPieceCode(piece, settings.tuning, bpm, withUsul, getNeySesi())
      await unlocked
      if (run !== runRef.current) return
      await playCode(code, durationMs)
    } catch {
      if (run === runRef.current) setWarn(SOUND_WARNING)
    } finally {
      if (run === runRef.current) {
        setPlaying(false)
        releaseWakeLock()
      }
    }
  }

  function stop() {
    runRef.current++
    stopAudio()
    releaseWakeLock()
    setPlaying(false)
  }

  return (
    <main class="screen">
      <h1>🎧 {piece.title}</h1>
      <dl class="makam-info">
        <div>
          <dt>Makam</dt>
          <dd>
            <a href={`#/makam/${piece.makam}`}>{makamAdi(piece)}</a>
          </dd>
        </div>
        <div>
          <dt>Usul</dt>
          <dd>
            <a href="#/usul">{usulAdi(piece)}</a>
            {usul && <small class="muted">{` ${usul.zaman}/${usul.mertebe}`}</small>}
          </dd>
        </div>
        <div>
          <dt>Besteci</dt>
          <dd>{piece.composer}</dd>
        </div>
      </dl>

      <ScoreView olcu={piece.olcu} soz={piece.soz} />

      <label class="usul-speed">
        <span>{`Hız: ♩ = ${bpm}`}</span>
        <input
          type="range"
          min={BPM_MIN}
          max={BPM_MAX}
          step={1}
          value={bpm}
          onInput={(e) => setBpm(Number(e.currentTarget.value))}
          // Bırakınca: çalıyorsa durur, yeni hızla yeniden Dinle'ye basılır.
          onChange={(e) => {
            setBpm(Number(e.currentTarget.value))
            if (playing) stop()
          }}
        />
      </label>

      <label class="toggle">
        <input
          type="checkbox"
          checked={withUsul}
          onChange={(e) => {
            setWithUsul(e.currentTarget.checked)
            if (playing) stop()
          }}
        />
        {' 🥁 Usul eşliği'}
      </label>
      {withUsul && usul?.vurus === null && <p class="muted">{METRONOME_NOTE}</p>}

      <div class="tools">
        {playing ? (
          <button type="button" class="primary" onClick={stop}>
            ■ Durdur
          </button>
        ) : (
          <button type="button" class="primary" disabled={!settings} onClick={() => void listen()}>
            🔊 Dinle
          </button>
        )}
      </div>
      {warn && (
        <p class="notice" role="status">
          {warn}
        </p>
      )}

      <p class="muted">
        Nota: <a href={SYMBTR_URL}>SymbTr</a> (Karaosmanoğlu 2012), CC BY-NC-SA 4.0.
      </p>
      <div class="links">
        <a class="back" href="#/parcalar">
          Parçalar bölümüne dön
        </a>
      </div>
    </main>
  )
}
