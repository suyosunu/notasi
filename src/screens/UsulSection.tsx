import { useEffect, useRef, useState } from 'preact/hooks'
import { startUsul, stopUsul } from '../audio/usul'
import { SOUND_OFF, SOUND_WARNING } from '../content/ses-mesajlari'
import { USULLER } from '../content/usuller'
import type { Usul } from '../content/usuller'
import { getSettings } from '../store/db'
import type { Settings } from '../store/db'

const BPM_MIN = 40
const BPM_MAX = 120
const BPM_DEFAULT = 60
const DOLAP_NOTE = 'Bu usulün vuruş kalıbı kaynaklarda bulunamadı; yalnızca zaman sayılır (12/8).'

/** Düm ayrı, tek/te/ke ayrı renkte; genişlik süreyle orantılıdır. */
function VurusDiagram({ usul }: { usul: Usul }) {
  if (usul.vurus === null) return <p class="notice">{DOLAP_NOTE}</p>
  return (
    <div class="vurus-row" role="img" aria-label={usul.vurus.map((x) => x.ses).join(' ')}>
      {usul.vurus.map((x, i) => (
        <span
          key={i}
          data-testid="vurus"
          class={x.ses === 'düm' ? 'vurus vurus-dum' : 'vurus vurus-tek'}
          style={{ width: `${(x.sure / usul.zaman) * 100}%` }}
        >
          {x.ses}
        </span>
      ))}
    </div>
  )
}

/** Usul bölümü: usul listesi, vuruş şeması, hız kaydırıcısı ve döngü çalma. */
export function UsulSection() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [selectedId, setSelectedId] = useState(USULLER[0]!.id)
  const [bpm, setBpm] = useState(BPM_DEFAULT)
  const [playing, setPlaying] = useState(false)
  const [warn, setWarn] = useState<string | null>(null)
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
  useEffect(() => () => stopUsul(), [])

  const usul = USULLER.find((u) => u.id === selectedId)!

  /** Dokunuş işleyicisinden çağrılır (startUsul, unlockAudio'yu eşzamanlı başlatır). */
  async function start(u: Usul, speed: number) {
    const run = ++runRef.current
    setWarn(null)
    if (!settings?.soundOn) {
      setPlaying(false)
      setWarn(SOUND_OFF)
      return
    }
    setPlaying(true)
    try {
      await startUsul(u, speed)
    } catch {
      if (run !== runRef.current) return
      setPlaying(false)
      setWarn(SOUND_WARNING)
    }
  }

  function stop() {
    runRef.current++
    stopUsul()
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
          </button>
        ))}
      </div>

      <h2>{`${usul.name} · ${usul.zaman}/${usul.mertebe}`}</h2>
      <VurusDiagram usul={usul} />

      <label class="usul-speed">
        <span>{`Hız: ${bpm}`}</span>
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

      <div class="links">
        <a class="back" href="#/">
          Ana ekrana dön
        </a>
      </div>
    </main>
  )
}
