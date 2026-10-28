import { useEffect, useRef, useState } from 'preact/hooks'
import { startUsul, stopUsul } from '../audio/usul'
import { acquireWakeLock, releaseWakeLock } from '../audio/wakeLock'
import { SOUND_OFF, SOUND_WARNING } from '../content/ses-mesajlari'
import { dersById, usulDersId } from '../content/dersler'
import { ONERILEN_SEVIYE } from '../content/seviyeler'
import { USULLER } from '../content/usuller'
import type { Usul } from '../content/usuller'
import { DersKapisi } from '../ders/DersKapisi'
import { VurusDiagram } from '../notation/VurusDiagram'
import { getSettings } from '../store/db'
import type { Settings } from '../store/db'

const BPM_MIN = 40
const BPM_MAX = 120
const BPM_DEFAULT = 60
/**
 * Vurgu saatinin gecikme payı (ms): Strudel zamanlayıcısı desenleri ~0.1 sn ileriden planlar, yani ilk vuruş
 * `startUsul` çözüldükten yaklaşık bu kadar sonra duyulur. Vurgu sesle birlikte ilerlesin diye saat bu kadar geç başlar.
 */
const HIGHLIGHT_LATENCY_MS = 100

/** Çalan döngünün saati: konum bundan ve bpm'den hesaplanır. */
interface Clock {
  usul: Usul
  bpm: number
  /** performance.now() cinsinden, ölçünün ilk vuruşunun duyulduğu an. */
  startedAt: number
}

/** `pos` (zaman birimi, ölçü içinde) hangi vuruşun [başlangıç, başlangıç + süre) aralığındaysa onun sırası. */
function strokeAt(u: Usul, pos: number): number | null {
  if (u.vurus === null) return null
  let start = 0
  for (let i = 0; i < u.vurus.length; i++) {
    const end = start + u.vurus[i]!.sure
    if (pos >= start && pos < end) return i
    start = end
  }
  return null
}

/**
 * Saat varken her karede (requestAnimationFrame) o anki vuruşun sırasını hesaplar:
 * konum = ((now − startedAt) / 1000 × bpm / 60) mod zaman. Saat kalkınca (durdur, hata, sayfadan çıkış) döngü
 * iptal edilir ve vurgu kalkar.
 */
function useActiveStroke(clock: Clock | null): number | null {
  const [active, setActive] = useState<number | null>(null)
  useEffect(() => {
    if (!clock || clock.usul.vurus === null) {
      setActive(null)
      return
    }
    let raf = 0
    let alive = true
    const tick = () => {
      if (!alive) return
      const elapsed = (performance.now() - clock.startedAt) / 1000
      const pos = (elapsed * clock.bpm) / 60
      setActive(pos < 0 ? null : strokeAt(clock.usul, pos % clock.usul.zaman))
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => {
      alive = false
      cancelAnimationFrame(raf)
      setActive(null)
    }
  }, [clock])
  return active
}

/** Usul bölümü: önce "Usul nedir?" dersi (ders kuralı), sonra usul listesi, vuruş şeması, hız kaydırıcısı ve döngü çalma. */
export function UsulSection() {
  return (
    <DersKapisi dersId="usul:giris" geri={{ href: '#/', label: 'Ana ekrana dön' }}>
      <UsulIcerik />
    </DersKapisi>
  )
}

function UsulIcerik() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [selectedId, setSelectedId] = useState(USULLER[0]!.id)
  const [bpm, setBpm] = useState(BPM_DEFAULT)
  const [playing, setPlaying] = useState(false)
  const [warn, setWarn] = useState<string | null>(null)
  const [clock, setClock] = useState<Clock | null>(null)
  const active = useActiveStroke(clock)
  /** Hızlı art arda başlatmalarda yalnızca son çağrının hatası/sonucu geçerlidir. */
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

  // Sayfadan çıkınca çalan döngü susar.
  useEffect(
    () => () => {
      stopUsul()
      releaseWakeLock()
    },
    [],
  )

  const usul = USULLER.find((u) => u.id === selectedId)!

  /** Dokunuş işleyicisinden çağrılır (startUsul, unlockAudio'yu eşzamanlı başlatır). */
  async function start(u: Usul, speed: number) {
    const run = ++runRef.current
    setWarn(null)
    setClock(null) // yeni usul/hız: saat ses başlayınca yeniden kurulur
    if (!settings?.soundOn) {
      setPlaying(false)
      setWarn(SOUND_OFF)
      return
    }
    setPlaying(true)
    void acquireWakeLock() // döngü çalarken ekran kararmasın
    try {
      await startUsul(u, speed)
      if (run !== runRef.current) return
      setClock({ usul: u, bpm: speed, startedAt: performance.now() + HIGHLIGHT_LATENCY_MS })
    } catch {
      if (run !== runRef.current) return
      setClock(null)
      setPlaying(false)
      releaseWakeLock()
      setWarn(SOUND_WARNING)
    }
  }

  function stop() {
    runRef.current++
    stopUsul()
    releaseWakeLock()
    setClock(null)
    setPlaying(false)
  }

  function choose(u: Usul) {
    setSelectedId(u.id)
    if (playing) void start(u, bpm)
  }

  return (
    <main class="screen">
      <h1>🥁 Usuller</h1>
      <p class="muted">Bir usul seç, hızını ayarla, çal.</p>

      <div class="usul-list" role="group" aria-label="Usuller">
        {USULLER.map((u) => (
          <button
            key={u.id}
            type="button"
            class={u.id === selectedId ? 'tool usul-pick usul-pick-on' : 'tool usul-pick'}
            aria-pressed={u.id === selectedId}
            onClick={() => choose(u)}
          >
            {u.name}
            <small class="muted">{` ${u.zaman}/${u.mertebe}`}</small>
            {ONERILEN_SEVIYE.usul[u.id] !== undefined && (
              <small class="seviye-etiket">{`Seviye ${ONERILEN_SEVIYE.usul[u.id]}`}</small>
            )}
          </button>
        ))}
      </div>

      <h2>{`${usul.name} · ${usul.zaman}/${usul.mertebe}`}</h2>
      <VurusDiagram usul={usul} active={clock?.usul.id === usul.id ? active : null} />

      <label class="usul-speed">
        <span>{`Hız: ${usul.mertebe === 8 ? '♪' : '♩'} = ${bpm}`}</span>
        <input
          type="range"
          min={BPM_MIN}
          max={BPM_MAX}
          step={1}
          value={bpm}
          onInput={(e) => setBpm(Number(e.currentTarget.value))}
          // Bırakınca yeniden başlar: sürüklerken her adımda kesilmesin.
          onChange={(e) => {
            const next = Number(e.currentTarget.value)
            setBpm(next)
            if (playing) void start(usul, next)
          }}
        />
      </label>

      <div class="tools">
        {playing ? (
          <button type="button" class="primary" onClick={stop}>
            ■ Durdur
          </button>
        ) : (
          <button type="button" class="primary" disabled={!settings} onClick={() => void start(usul, bpm)}>
            ▶ Çal
          </button>
        )}
      </div>
      {warn && (
        <p class="notice" role="status">
          {warn}
        </p>
      )}

      <div class="tools usul-links">
        {dersById(usulDersId(usul.id)) && (
          <a class="tool" href={`#/ders/${encodeURIComponent(usulDersId(usul.id))}`}>
            📖 Ders
          </a>
        )}
        {usul.vurus !== null && (
          <a class="tool" href={`#/usul/vur/${usul.id}`}>
            👏 Vurarak çalış
          </a>
        )}
      </div>

      <div class="links">
        <a class="back" href="#/">
          Ana ekrana dön
        </a>
      </div>
    </main>
  )
}
