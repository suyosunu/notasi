import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks'
import { buildEtutCode } from '../audio/etut'
import { getNeySesi, playCode, stopAudio, unlockAudio } from '../audio/player'
import { acquireWakeLock, releaseWakeLock } from '../audio/wakeLock'
import { ETUTLER } from '../content/etutler'
import type { Etut } from '../content/etutler'
import { SOUND_OFF, SOUND_WARNING } from '../content/ses-mesajlari'
import { USULLER } from '../content/usuller'
import { DersKapisi } from '../ders/DersKapisi'
import { ScoreView } from '../notation/ScoreView'
import { DEFAULT_SETTINGS, getSettings, isaretEkle } from '../store/db'
import type { Settings } from '../store/db'

const BPM_MIN = 40
const BPM_MAX = 90
/** Etütlerin mertebesi 4'tür: dörtlük içindeki sekizlikler kirişlenir. */
const KIRIS_VURUSU = 1
/** Satırdaki ölçü sayısı: 2/4 ve 3/4'te kısa ölçüler üçer, diğerlerinde ikişer (telefon genişliği). */
const olcuPerSatir = (zaman: number) => (zaman === 2 || zaman === 3 ? 3 : 2)

/**
 * Etüdün çalışma bölümü (etüt ekranında ve akşam planında ortak): nota, hız, metronom (usullü etütte usul) anahtarı,
 * dinle / metronomla (usulle) çal / durdur ve "Çaldım" işareti. `baslikGizle`: başlığı üst ekran gösteriyorsa (akşam adımı) çizilmez.
 */
export function EtutCalisma(props: { etut: Etut; onDone?: () => void; baslikGizle?: boolean }) {
  const { etut, onDone, baslikGizle } = props
  /** Usullü etütte eşlik usul sesidir; usulsüzde (ya da usul bulunamazsa) 4/4 metronom. */
  const usul = etut.usulId ? USULLER.find((u) => u.id === etut.usulId) : undefined
  const [settings, setSettings] = useState<Settings | null>(null)
  const [bpm, setBpm] = useState(etut.bpm)
  const [metronom, setMetronom] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [warn, setWarn] = useState<string | null>(null)
  const [calindi, setCalindi] = useState(false)
  /** Her başlatma/durdurmada artar: yalnızca son çalmanın sonucu ekranı değiştirir. */
  const runRef = useRef(0)

  useEffect(() => {
    let alive = true
    getSettings()
      .catch(() => DEFAULT_SETTINGS) // ayarlar okunamazsa varsayılanlarla çalınır
      .then((cfg) => {
        if (!alive) return
        setSettings(cfg)
        setCalindi(cfg.calinanEtutler.includes(etut.id))
      })
    return () => {
      alive = false
    }
  }, [etut.id])

  // Sayfadan çıkınca çalan ses susar ve bekleyen unlockAudio çıkıştan sonra çalmaz. Preact edilgen (useEffect)
  // temizliklerini çizimden sonraya erteler; geçersiz kılma eşzamanlı çalışsın diye useLayoutEffect'tedir.
  useLayoutEffect(
    () => () => {
      runRef.current++
      stopAudio()
      releaseWakeLock()
    },
    [],
  )

  /** Dokunuş işleyicisinden çağrılır: unlockAudio eşzamanlı, kod üretiminden önce başlatılır (iOS). */
  async function calis(melodi: boolean) {
    if (!settings) return
    const run = ++runRef.current
    setWarn(null)
    if (!settings.soundOn) {
      setWarn(SOUND_OFF)
      return
    }
    setPlaying(true)
    void acquireWakeLock() // uzun etüt çalarken ekran kararmasın
    try {
      const unlocked = unlockAudio()
      unlocked.catch(() => {}) // kod üretimi fırlatırsa işlenmemiş ret kalmasın; hata aşağıda await ile yakalanır
      // "Metronomla çal" / "Usulle çal": yalnız eşlik; melodi kapalıyken anahtar anlamsızdır.
      const { code, durationMs } = buildEtutCode(etut.olcu, settings.tuning, bpm, {
        melodi,
        metronom: melodi ? metronom : true,
        voice: getNeySesi(),
        ...(usul ? { usul } : {}),
      })
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

  async function caldim() {
    if (playing) stop()
    try {
      await isaretEkle('calinanEtutler', etut.id)
      setCalindi(true)
    } catch {
      // Kayıt yazılamasa da kullanıcı sonraki adıma geçebilmeli.
    }
    onDone?.()
  }

  return (
    <>
      {!baslikGizle && <h1>🎼 {etut.baslik}</h1>}
      <ScoreView olcu={etut.olcu} olcuPerSatir={olcuPerSatir(usul?.zaman ?? 4)} beamBeats={KIRIS_VURUSU} />

      <label class="usul-speed">
        <span>{`Hız: ♩ = ${bpm}`}</span>
        <input
          type="range"
          min={BPM_MIN}
          max={BPM_MAX}
          step={1}
          value={bpm}
          onInput={(e) => setBpm(Number(e.currentTarget.value))}
          // Bırakınca: çalıyorsa durur, yeni hızla yeniden başlatılır.
          onChange={(e) => {
            setBpm(Number(e.currentTarget.value))
            if (playing) stop()
          }}
        />
      </label>

      <label class="toggle">
        <input
          type="checkbox"
          checked={metronom}
          onChange={(e) => {
            setMetronom(e.currentTarget.checked)
            if (playing) stop()
          }}
        />
        {usul ? ` 🥁 Usul (${usul.name})` : ' 🥁 Metronom'}
      </label>

      <div class="tools">
        {playing ? (
          <button type="button" class="primary" onClick={stop}>
            ⏹ Durdur
          </button>
        ) : (
          <>
            <button type="button" class="primary" disabled={!settings} onClick={() => void calis(true)}>
              ▶ Dinle
            </button>
            <button type="button" class="tool" disabled={!settings} onClick={() => void calis(false)}>
              {usul ? '🥁 Usulle çal' : '🎵 Metronomla çal'}
            </button>
          </>
        )}
      </div>
      {warn && (
        <p class="notice" role="status">
          {warn}
        </p>
      )}

      <div class="tools etut-caldim">
        <button type="button" class="tool" onClick={() => void caldim()}>
          ✓ Çaldım
        </button>
        {calindi && <span class="etut-rozet">Çalındı ✓</span>}
      </div>
    </>
  )
}

/** `/etut/:id`: etüt, ders okunduktan sonra açılır. */
export function EtutDetail({ etutId }: { etutId: string }) {
  const etut = ETUTLER.find((e) => e.id === etutId)
  if (!etut) {
    return (
      <main class="screen">
        <p class="muted">Etüt bulunamadı.</p>
        <a class="back" href="#/ney">
          Ney bölümüne dön
        </a>
      </main>
    )
  }
  return (
    <DersKapisi dersId={etut.dersId} geri={{ href: '#/ney', label: 'Ney bölümüne dön' }}>
      <main class="screen">
        <EtutCalisma etut={etut} />
        <div class="links">
          <a class="back" href="#/ney">
            Ney bölümüne dön
          </a>
        </div>
      </main>
    </DersKapisi>
  )
}
