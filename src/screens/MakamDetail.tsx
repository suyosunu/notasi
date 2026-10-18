import { useEffect, useState } from 'preact/hooks'
import { playWritten, stopAudio, unlockAudio } from '../audio/player'
import { MAKAMLAR } from '../content/makamlar'
import { SOUND_OFF, SOUND_WARNING } from '../content/ses-mesajlari'
import { ACCIDENTAL_NAMES } from '../music/accidentals'
import { cikisInisEvents, diziEvents } from '../music/makam'
import { SOLFEJ } from '../music/pitch'
import type { Accidental, WrittenPitch } from '../music/pitch'
import { Staff } from '../notation/Staff'
import { getSettings } from '../store/db'
import type { Settings } from '../store/db'

const LISTEN_BPM = 80
const STAFF_WIDTH = 320

function donanimAdi(p: WrittenPitch): string {
  return `${SOLFEJ[p.step]} ${ACCIDENTAL_NAMES[p.acc as Exclude<Accidental, 0 | 9 | -9>]}`
}

/** Tek makam: dizisi, durak/güçlü/yeden/donanım bilgileri, seyir, dizi sesi ve sorulara bağlantı. */
export function MakamDetail({ makamId }: { makamId: string }) {
  const makam = MAKAMLAR.find((m) => m.id === makamId)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [soundWarn, setSoundWarn] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    void getSettings().then((cfg) => {
      if (alive) setSettings(cfg)
    })
    return () => {
      alive = false
    }
  }, [])

  // Sayfadan çıkınca çalan dizi susar.
  useEffect(() => () => stopAudio(), [])

  if (!makam) {
    return (
      <main class="screen">
        <p class="muted">Makam bulunamadı.</p>
        <a class="back" href="#/makam">
          Makam bölümüne dön
        </a>
      </main>
    )
  }
  const dizi = makam.dizi

  async function listen() {
    if (!settings) return
    setSoundWarn(null)
    if (!settings.soundOn) {
      setSoundWarn(SOUND_OFF)
      return
    }
    try {
      // unlockAudio dokunuş işleyicisinde, ilk iş olarak çağrılmalıdır (iOS).
      await unlockAudio()
      await playWritten(cikisInisEvents(dizi), settings.tuning, LISTEN_BPM)
    } catch {
      setSoundWarn(SOUND_WARNING)
    }
  }

  return (
    <main class="screen">
      <h1>🧭 {makam.name}</h1>
      <div class="staff-wrap">
        <Staff events={diziEvents(makam.dizi, 'quarter')} width={STAFF_WIDTH} />
      </div>

      <dl class="makam-info">
        <div>
          <dt>Durak</dt>
          <dd>{makam.durak}</dd>
        </div>
        <div>
          <dt>Güçlü</dt>
          <dd>{makam.guclu}</dd>
        </div>
        <div>
          <dt>Yeden</dt>
          <dd>{makam.yeden}</dd>
        </div>
        <div>
          <dt>Donanım</dt>
          <dd>{makam.donanim.map(donanimAdi).join(', ')}</dd>
        </div>
      </dl>

      <h2>Seyir</h2>
      <p>{makam.seyir}</p>

      <div class="tools">
        <button type="button" class="tool" disabled={!settings} onClick={() => void listen()}>
          🔊 Diziyi dinle
        </button>
      </div>
      {soundWarn && (
        <p class="notice" role="status">
          {soundWarn}
        </p>
      )}

      <a class="primary link-button" href="#/makam/sorular">
        Sorularla çalış
      </a>
      <div class="links">
        <a class="back" href="#/makam">
          Makam bölümüne dön
        </a>
      </div>
    </main>
  )
}
