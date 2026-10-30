import type { JSX } from 'preact'
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks'
import { buildCalismaCode, konumBul } from '../audio/calisma'
import type { CalismaKodu } from '../audio/calisma'
import { getNeySesi, playCode, sesSaatiSimdi, stopAudio, unlockAudio } from '../audio/player'
import { sonIsaret } from '../audio/sesSaati'
import { acquireWakeLock, releaseWakeLock } from '../audio/wakeLock'
import { SOUND_OFF, SOUND_WARNING } from '../content/ses-mesajlari'
import type { Usul } from '../content/usuller'
import type { MusicEvent } from '../music/notation'
import { ScoreView } from '../notation/ScoreView'
import { secimGuncelle } from '../notation/secim'
import type { Secim } from '../notation/secim'
import { DEFAULT_SETTINGS, getSettings } from '../store/db'
import type { Settings } from '../store/db'

/** "Her turda hızlan": her tur sonunda tempo bu kadar (♩) artar, `bpmMax`'ı geçmez. */
export const HIZ_ADIMI = 5
const METRONOME_NOTE = 'Bu usulün vuruş kalıbı bilinmediği için eşlik metronomla yapılır.'
const IPUCU = 'Bir satıra dokun: yalnız o bölüm çalar. Başka bir satıra da dokunursan aradaki bölüm seçilir.'

type Konum = { olcu: number; nota: number }

/** Çalan tur: vurgu hesabı yalnız bu turun tempo ve giriş sayımıyla yapılır. */
interface Tur {
  run: number
  tempo: number
  girisVurus: number
  /** Seçimin sonuna dek kesilmiş ölçüler (seçimden sonraki ölçü vurgulanmasın). */
  olcu: MusicEvent[][]
  bas: number
}

/** Sonraki kare: `requestAnimationFrame` yoksa 50 ms `setTimeout`. Dönen işlev bekleyen kareyi iptal eder. */
function kare(cb: () => void): () => void {
  if (typeof requestAnimationFrame === 'function') {
    const id = requestAnimationFrame(cb)
    return () => cancelAnimationFrame(id)
  }
  const id = setTimeout(cb, 50)
  return () => clearTimeout(id)
}

const bolumEtiketi = (s: Secim) =>
  s.bas === s.son ? `Bölüm: ${s.bas + 1}. ölçü` : `Bölüm: ${s.bas + 1}–${s.son + 1}. ölçüler`

/**
 * Etüt ve parçanın ortak çalışma paneli: dokunulabilir nota (satır seçimi → yalnız o bölüm çalar), hız, eşlik
 * (usul ya da metronom) anahtarı, tekrar ve her turda hızlanma, dinle / usulle (metronomla) çal / durdur ve çalan
 * notanın vurgusu (ses saati işaretinden). `durdurRef`: üst ekran (ör. "Çaldım") çalan sesi durdurabilsin diye
 * panelin durdurma işlevi buraya yazılır.
 */
export function CalismaPaneli(props: {
  olcu: MusicEvent[][]
  soz?: string[][]
  usul?: Usul
  varsayilanBpm: number
  bpmMin: number
  bpmMax: number
  olcuPerSatir?: number
  beamBeats?: number
  durdurRef?: { current: (() => void) | null }
}): JSX.Element {
  const { olcu, soz, usul, varsayilanBpm, bpmMin, bpmMax, olcuPerSatir, beamBeats, durdurRef } = props
  const [settings, setSettings] = useState<Settings | null>(null)
  const [bpm, setBpm] = useState(varsayilanBpm)
  const [eslik, setEslik] = useState(true)
  const [tekrar, setTekrar] = useState(false)
  const [hizlan, setHizlan] = useState(false)
  const [secim, setSecim] = useState<Secim | null>(null)
  const [playing, setPlaying] = useState(false)
  const [turNo, setTurNo] = useState(1)
  const [warn, setWarn] = useState<string | null>(null)
  const [vurgu, setVurgu] = useState<Konum | null>(null)
  /** Her başlatma/durdurmada artar: yalnızca son çalmanın sonucu ekranı değiştirir. */
  const runRef = useRef(0)
  /** Tekrar ve hızlanma çalarken değişebilir; tur sonunda buradan okunur. */
  const tekrarRef = useRef(false)
  const hizlanRef = useRef(false)
  const turRef = useRef<Tur | null>(null)
  /** Vurgu döngüsünün bekleyen karesini iptal eder. */
  const vurguIptalRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    let alive = true
    getSettings()
      .catch(() => DEFAULT_SETTINGS) // ayarlar okunamazsa varsayılanlarla çalınır
      .then((cfg) => {
        if (alive) setSettings(cfg)
      })
    return () => {
      alive = false
    }
  }, [])

  // Sayfadan çıkınca çalan ses susar, bekleyen tur ya da unlockAudio çıkıştan sonra çalmaz. Preact edilgen
  // (useEffect) temizliklerini çizimden sonraya erteler; geçersiz kılma eşzamanlı çalışsın diye useLayoutEffect'tedir.
  useLayoutEffect(
    () => () => {
      runRef.current++
      stopAudio()
      releaseWakeLock()
      vurguIptalRef.current?.()
    },
    [],
  )

  // Vurgu: çalarken her karede `t0 = sonIsaret()` ve `sesSaatiSimdi()`'den çalan olay bulunur.
  useEffect(() => {
    if (!playing) {
      setVurgu(null)
      return
    }
    let iptal: (() => void) | null = null
    let alive = true
    let son: Konum | null = null
    const tick = () => {
      if (!alive) return
      const tur = turRef.current
      const t0 = sonIsaret()
      const simdi = sesSaatiSimdi()
      let k: Konum | null = null
      if (tur && tur.run === runRef.current && t0 !== null && simdi !== null) {
        k = konumBul(tur.olcu, tur.bas, ((simdi - t0) * tur.tempo) / 60 - tur.girisVurus)
      }
      if (k?.olcu !== son?.olcu || k?.nota !== son?.nota) {
        son = k
        setVurgu(k)
      }
      iptal = kare(tick)
    }
    const durdur = () => {
      alive = false
      iptal?.()
    }
    vurguIptalRef.current = durdur
    tick()
    return () => {
      durdur()
      setVurgu(null)
    }
  }, [playing])

  /**
   * Dokunuş işleyicisinden çağrılır: unlockAudio eşzamanlı, ilk await'ten önce başlatılır (iOS). Her tur seçili
   * ölçüleri o anki tempoyla çalar; tekrar açıksa tur bitince yeniden başlar, hızlanma açıksa tempo `HIZ_ADIMI` artar.
   */
  async function calis(melodi: boolean) {
    if (!settings) return
    const run = ++runRef.current
    setWarn(null)
    if (!settings.soundOn) {
      setWarn(SOUND_OFF)
      return
    }
    const bas = secim?.bas ?? 0
    const sonOlcu = secim ? secim.son : olcu.length - 1
    const dilim = olcu.slice(bas, sonOlcu + 1)
    const kesik = olcu.slice(0, sonOlcu + 1)
    const tuning = settings.tuning
    const voice = getNeySesi()
    // "Usulle / Metronomla çal": yalnız eşlik; melodi kapalıyken anahtar anlamsızdır.
    const tur = (tempo: number): CalismaKodu =>
      buildCalismaCode(dilim, tuning, tempo, {
        melodi,
        eslik: melodi ? (eslik ? 'usul' : 'yok') : 'usul',
        voice,
        ...(usul ? { usul } : {}),
      })
    let tempo = bpm
    setTurNo(1)
    setPlaying(true)
    void acquireWakeLock() // uzun çalışmada ekran kararmasın
    try {
      const unlocked = unlockAudio()
      unlocked.catch(() => {}) // kod üretimi fırlatırsa işlenmemiş ret kalmasın; hata aşağıda await ile yakalanır
      let kod = tur(tempo)
      await unlocked
      for (let n = 1; ; n++) {
        if (run !== runRef.current) return
        setTurNo(n)
        // playCode önce stopAudio ile eski işareti siler; vurgu bu turun değerleriyle hesaplanır.
        const calan = playCode(kod.code, kod.durationMs)
        turRef.current = { run, tempo, girisVurus: kod.girisVurus, olcu: kesik, bas }
        await calan
        if (turRef.current?.run === run) turRef.current = null
        if (run !== runRef.current || !tekrarRef.current) return
        if (hizlanRef.current) {
          tempo = Math.min(bpmMax, tempo + HIZ_ADIMI)
          setBpm(tempo) // kaydırıcı ulaşılan hızı gösterir
        }
        kod = tur(tempo)
      }
    } catch {
      if (run === runRef.current) setWarn(SOUND_WARNING)
    } finally {
      if (turRef.current?.run === run) turRef.current = null
      if (run === runRef.current) {
        setPlaying(false)
        releaseWakeLock()
      }
    }
  }

  function stop() {
    runRef.current++
    turRef.current = null
    stopAudio()
    releaseWakeLock()
    setPlaying(false)
  }
  if (durdurRef) durdurRef.current = stop

  return (
    <>
      <ScoreView
        olcu={olcu}
        soz={soz}
        olcuPerSatir={olcuPerSatir}
        beamBeats={beamBeats}
        secim={secim}
        onSatirDokun={(satir) => {
          setSecim(secimGuncelle(secim, satir))
          if (playing) stop()
        }}
        vurgu={vurgu}
      />
      <p class="muted">{IPUCU}</p>
      {secim && (
        <div class="tools calisma-bolum">
          <span>{bolumEtiketi(secim)}</span>
          <button
            type="button"
            class="tool"
            onClick={() => {
              setSecim(null)
              if (playing) stop()
            }}
          >
            Tümü
          </button>
        </div>
      )}

      <label class="usul-speed">
        <span>{`Hız: ♩ = ${bpm}`}</span>
        <input
          type="range"
          min={bpmMin}
          max={bpmMax}
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
          checked={eslik}
          onChange={(e) => {
            setEslik(e.currentTarget.checked)
            if (playing) stop()
          }}
        />
        {usul ? ` 🥁 Usul eşliği (${usul.name})` : ' 🥁 Metronom'}
      </label>
      {eslik && usul?.vurus === null && <p class="muted">{METRONOME_NOTE}</p>}

      {/* Tekrar ve hızlanma çalarken değişebilir; durdurmaz, tur sonunda okunur. */}
      <label class="toggle">
        <input
          type="checkbox"
          checked={tekrar}
          onChange={(e) => {
            tekrarRef.current = e.currentTarget.checked
            setTekrar(e.currentTarget.checked)
          }}
        />
        {' 🔁 Tekrarla'}
      </label>
      {tekrar && (
        <label class="toggle">
          <input
            type="checkbox"
            checked={hizlan}
            onChange={(e) => {
              hizlanRef.current = e.currentTarget.checked
              setHizlan(e.currentTarget.checked)
            }}
          />
          {` ⏫ Her turda hızlan (♩ +${HIZ_ADIMI})`}
        </label>
      )}

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
      {playing && tekrar && (
        <p class="muted" role="status">
          {`Tur ${turNo} · ♩ = ${bpm}`}
        </p>
      )}
      {warn && (
        <p class="notice" role="status">
          {warn}
        </p>
      )}
    </>
  )
}
