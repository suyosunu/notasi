import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks'
import { playCode, playWritten, setDilBelirginligi, setNeySesi, setUsulSesi, stopAudio, unlockAudio } from '../audio/player'
import type { NeySesi } from '../audio/pattern'
import { type SesTuru, sesSec, soylemeyiDurdur, soyleUsul } from '../audio/soyle'
import { buildUsulOnceCode } from '../audio/usul'
import type { UsulSesi } from '../audio/usulSamples'
import { USULLER } from '../content/usuller'
import { SOUND_OFF, SOUND_WARNING } from '../content/ses-mesajlari'
import { AHENKLER } from '../music/ahenk'
import type { AhenkId } from '../music/ahenk'
import { BackupError, importBackup, shareOrDownloadBackup } from '../store/backup'
import { getSettings, saveSettings } from '../store/db'
import type { Settings as SettingsData } from '../store/db'
import type { MusicEvent } from '../music/notation'

const INVALID_FILE = 'Bu dosya geçerli bir Notası yedeği değil.'
const CONFIRM_RESTORE = 'Mevcut ilerlemenin yerine yedek yüklenecek. Emin misiniz?'

const NEY_SESI_SECENEKLERI: { id: NeySesi; label: string }[] = [
  { id: 'mevcut', label: 'Mevcut' },
  { id: 'nefesli', label: 'Nefesli' },
  { id: 'shakuhachi', label: 'Shakuhachi' },
]

/** "▶ Dene" dizisi: Dügâh, Segâh, Çârgâh, Nevâ (Segâh = Si4 koma bemolü), dörtlüklerle. */
const DENEME_DIZISI: MusicEvent[] = [
  { kind: 'note', pitch: { step: 'A', octave: 4, acc: 0 }, dur: 'quarter' },
  { kind: 'note', pitch: { step: 'B', octave: 4, acc: -1 }, dur: 'quarter' },
  { kind: 'note', pitch: { step: 'C', octave: 5, acc: 0 }, dur: 'quarter' },
  { kind: 'note', pitch: { step: 'D', octave: 5, acc: 0 }, dur: 'quarter' },
]
const DENEME_BPM = 72

/** Dil belirginliği "▶ Dene": Nevâ Çârgâh Segâh Çârgâh önce dilli, sonra bağlı (fark duyulsun), sekizliklerle. */
const DIL_DENEME: MusicEvent[] = (() => {
  const yazim = [
    { step: 'D', octave: 5, acc: 0 },
    { step: 'C', octave: 5, acc: 0 },
    { step: 'B', octave: 4, acc: -1 },
    { step: 'C', octave: 5, acc: 0 },
  ] as const
  const dilli = yazim.map((pitch): MusicEvent => ({ kind: 'note', pitch, dur: 'eighth' }))
  const bagli = yazim.map((pitch, i): MusicEvent => ({ kind: 'note', pitch, dur: 'eighth', ...(i < 3 ? { bag: true } : {}) }))
  return [...dilli, { kind: 'rest', dur: 'quarter' }, ...bagli]
})()

const USUL_SESI_SECENEKLERI: { id: UsulSesi; label: string }[] = [
  { id: 'oryantal', label: 'Oryantal' },
  { id: 'konga', label: 'Konga' },
  { id: 'tahta', label: 'Tahta' },
  { id: 'darbuka', label: 'Darbuka' },
]
/** Usul sesi "▶ Dene": Sofyan'ın bir ölçüsü (düm te ke), ♩ = 80. */
const DENEME_USUL = USULLER.find((u) => u.id === 'sofyan')!
const DENEME_USUL_BPM = 80
/** "▶ Söyle" (deneme): Sofyan iki ölçü, cihazın hazır Türkçe sesiyle (bkz. audio/soyle.ts). */
const SOYLE_OLCU = 2
const SOYLE_YOK = 'Bu cihazda hazır konuşma sesi bulunamadı.'

interface Message {
  kind: 'ok' | 'error'
  text: string
}

export function Settings() {
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [message, setMessage] = useState<Message | null>(null)
  const [soundWarn, setSoundWarn] = useState<string | null>(null)
  const [usulWarn, setUsulWarn] = useState<string | null>(null)
  const [soyleyen, setSoyleyen] = useState<string | null>(null)
  const [dilWarn, setDilWarn] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let alive = true
    void getSettings().then((s) => {
      if (alive) setSettings(s)
    })
    return () => {
      alive = false
    }
  }, [])

  async function changeAhenk(ahenk: AhenkId) {
    if (!settings || ahenk === settings.tuning.ahenk) return
    setSettings(await saveSettings({ tuning: { ...settings.tuning, ahenk }, calibrated: false }))
  }

  // Sayfadan çıkınca deneme sesi susar.
  // Bekleyen bir "Dene" (unlockAudio sürerken) çıkıştan sonra çalmaya başlamasın. Preact edilgen (useEffect)
  // temizliklerini çizimden sonraya erteler; bu yüzden geçersiz kılma eşzamanlı çalışan useLayoutEffect'tedir.
  const runRef = useRef(0)
  useLayoutEffect(
    () => () => {
      runRef.current++
      stopAudio()
      soylemeyiDurdur()
    },
    [],
  )

  async function changeNeySesi(neySesi: NeySesi) {
    setNeySesi(neySesi) // hemen uygulanır; kayıt arkadan gelir
    setSettings(await saveSettings({ neySesi }))
  }

  async function tryVoice(voice: NeySesi) {
    if (!settings) return
    setSoundWarn(null)
    if (!settings.soundOn) {
      setSoundWarn(SOUND_OFF)
      return
    }
    const run = ++runRef.current
    try {
      // unlockAudio dokunuş işleyicisinde, ilk iş olarak çağrılmalıdır (iOS).
      await unlockAudio()
      if (run !== runRef.current) return
      await playWritten(DENEME_DIZISI, settings.tuning, DENEME_BPM, voice)
    } catch {
      if (run === runRef.current) setSoundWarn(SOUND_WARNING)
    }
  }

  /** Kaydırırken hemen uygulanır (ekrandaki yüzde ve çalım); bırakınca kaydedilir. */
  function previewDil(yuzde: number) {
    setDilBelirginligi(yuzde / 100)
    setSettings((s) => (s ? { ...s, dilBelirginligi: yuzde } : s))
  }

  async function changeDil(yuzde: number) {
    previewDil(yuzde)
    setSettings(await saveSettings({ dilBelirginligi: yuzde }))
  }

  async function tryDil() {
    if (!settings) return
    setDilWarn(null)
    if (!settings.soundOn) {
      setDilWarn(SOUND_OFF)
      return
    }
    const run = ++runRef.current
    try {
      // unlockAudio dokunuş işleyicisinde, ilk iş olarak çağrılmalıdır (iOS).
      await unlockAudio()
      if (run !== runRef.current) return
      await playWritten(DIL_DENEME, settings.tuning, DENEME_BPM, settings.neySesi)
    } catch {
      if (run === runRef.current) setDilWarn(SOUND_WARNING)
    }
  }

  async function changeUsulSesi(usulSesi: UsulSesi) {
    setUsulSesi(usulSesi) // hemen uygulanır; kayıt arkadan gelir
    setSettings(await saveSettings({ usulSesi }))
  }

  /** Ney sesi denemesiyle aynı kurallar: iOS dokunuşu, soundOn, SOUND_WARNING, çıkışta ve yeni Dene'de iptal. */
  async function tryUsulVoice(ses: UsulSesi) {
    if (!settings) return
    setUsulWarn(null)
    if (!settings.soundOn) {
      setUsulWarn(SOUND_OFF)
      return
    }
    const run = ++runRef.current
    soylemeyiDurdur()
    try {
      // unlockAudio dokunuş işleyicisinde, ilk iş olarak çağrılmalıdır (iOS).
      await unlockAudio()
      if (run !== runRef.current) return
      const { code, durationMs } = buildUsulOnceCode(DENEME_USUL, DENEME_USUL_BPM, ses)
      await playCode(code, durationMs)
    } catch {
      if (run === runRef.current) setUsulWarn(SOUND_WARNING)
    }
  }

  /** Usulü cihazın hazır Türkçe sesiyle söyler (deneme). İlk hece dokunuş içinde, eşzamanlı söylenir (iOS). */
  async function trySoyle(tur: SesTuru) {
    if (!settings) return
    setUsulWarn(null)
    if (!settings.soundOn) {
      setUsulWarn(SOUND_OFF)
      return
    }
    ++runRef.current
    stopAudio()
    const soyleme = soyleUsul(DENEME_USUL, DENEME_USUL_BPM, SOYLE_OLCU, tur)
    try {
      setSoyleyen(sesSec(tur).ad)
    } catch {
      // Konuşma sesi yok: `soyleme` reddedilir, uyarı aşağıda.
    }
    try {
      await soyleme
    } catch {
      setSoyleyen(null)
      setUsulWarn(SOYLE_YOK)
    }
  }

  async function changeSound(soundOn: boolean) {
    setSettings(await saveSettings({ soundOn }))
  }

  async function backup() {
    setMessage(null)
    try {
      await shareOrDownloadBackup()
    } catch {
      setMessage({ kind: 'error', text: 'Yedek kaydedilemedi.' })
    }
  }

  async function restore(file: File) {
    setMessage(null)
    let json: unknown
    try {
      json = JSON.parse(await file.text())
    } catch {
      setMessage({ kind: 'error', text: INVALID_FILE })
      return
    }
    if (!window.confirm(CONFIRM_RESTORE)) return
    try {
      await importBackup(json)
    } catch (err) {
      if (err instanceof BackupError) {
        setMessage({ kind: 'error', text: INVALID_FILE })
        return
      }
      throw err
    }
    const restored = await getSettings()
    setNeySesi(restored.neySesi) // oynatıcı sesleri geri yüklenen ayarla eşleşsin
    setUsulSesi(restored.usulSesi)
    setDilBelirginligi(restored.dilBelirginligi / 100)
    setSettings(restored)
    setMessage({ kind: 'ok', text: 'Yedek yüklendi.' })
  }

  function onFileChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (file) {
      void restore(file).catch(() => setMessage({ kind: 'error', text: INVALID_FILE }))
    }
    // Aynı dosya tekrar seçilebilsin.
    input.value = ''
  }

  if (!settings) return null

  return (
    <main class="screen">
      <a class="back-top" href="#/">
        ← Ana ekran
      </a>
      <h1>Ayarlar</h1>

      <section class="setting">
        <label class="setting-label" for="ahenk">
          Ney ahengi
        </label>
        <select
          id="ahenk"
          class="select"
          value={settings.tuning.ahenk}
          onChange={(e) => void changeAhenk((e.currentTarget as HTMLSelectElement).value as AhenkId)}
        >
          {AHENKLER.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        {!settings.calibrated && (
          <p class="hint">
            <a href="#/kalibrasyon">Yeniden kalibre edin</a>
          </p>
        )}
      </section>

      <section class="setting">
        <label class="switch">
          <input
            type="checkbox"
            checked={settings.soundOn}
            onChange={(e) => void changeSound((e.currentTarget as HTMLInputElement).checked)}
          />
          <span>Sesler açık</span>
        </label>
      </section>

      <section class="setting" aria-labelledby="ney-sesi">
        <h2 id="ney-sesi" class="setting-label">
          Ney sesi
        </h2>
        <div class="voice-options" role="radiogroup" aria-labelledby="ney-sesi">
          {NEY_SESI_SECENEKLERI.map((o) => (
            <div key={o.id} class="voice-option">
              <label class="radio">
                <input
                  type="radio"
                  name="neySesi"
                  value={o.id}
                  checked={settings.neySesi === o.id}
                  onChange={() => void changeNeySesi(o.id)}
                />
                <span>{o.label}</span>
              </label>
              <button
                type="button"
                class="tool"
                aria-label={`▶ Dene (${o.label})`}
                onClick={() => void tryVoice(o.id)}
              >
                ▶ Dene
              </button>
            </div>
          ))}
        </div>
        {soundWarn && (
          <p class="notice" role="alert">
            {soundWarn}
          </p>
        )}
      </section>

      <section class="setting" aria-labelledby="dil-belirginligi">
        <h2 id="dil-belirginligi" class="setting-label">
          Dil belirginliği
        </h2>
        <div class="voice-option">
          <label class="usul-speed">
            <span>{`Dil (tu): %${settings.dilBelirginligi}`}</span>
            <input
              type="range"
              min={0}
              max={100}
              step={10}
              value={settings.dilBelirginligi}
              aria-label="Dil belirginliği (yüzde)"
              onInput={(e) => previewDil(Number(e.currentTarget.value))}
              onChange={(e) => void changeDil(Number(e.currentTarget.value))}
            />
          </label>
          <button type="button" class="tool" aria-label="▶ Dene (Dil belirginliği)" onClick={() => void tryDil()}>
            ▶ Dene
          </button>
        </div>
        <p class="hint">
          Bağsız notalar arasındaki "tu" ayrımı. %0'da sesler birbirine yapışık çalar; arttıkça her notadan önce kısa
          bir dil boşluğu duyulur. Bağlı notalar etkilenmez. Dene önce dört notayı dilli, sonra aynılarını bağlı çalar.
        </p>
        {dilWarn && (
          <p class="notice" role="alert">
            {dilWarn}
          </p>
        )}
      </section>

      <section class="setting" aria-labelledby="usul-sesi">
        <h2 id="usul-sesi" class="setting-label">
          Usul sesi
        </h2>
        <div class="voice-options" role="radiogroup" aria-labelledby="usul-sesi">
          {USUL_SESI_SECENEKLERI.map((o) => (
            <div key={o.id} class="voice-option">
              <label class="radio">
                <input
                  type="radio"
                  name="usulSesi"
                  value={o.id}
                  checked={settings.usulSesi === o.id}
                  onChange={() => void changeUsulSesi(o.id)}
                />
                <span>{o.label}</span>
              </label>
              <button
                type="button"
                class="tool"
                aria-label={`▶ Dene (${o.label})`}
                onClick={() => void tryUsulVoice(o.id)}
              >
                ▶ Dene
              </button>
            </div>
          ))}
        </div>
        <div class="voice-option">
          <span>İnsan sesi (hazır ses, deneme)</span>
          <button type="button" class="tool" aria-label="▶ Kadın (İnsan sesi)" onClick={() => void trySoyle('kadin')}>
            ▶ Kadın
          </button>
          <button type="button" class="tool" aria-label="▶ Erkek (İnsan sesi)" onClick={() => void trySoyle('erkek')}>
            ▶ Erkek
          </button>
        </div>
        <p class="hint">
          Sofyan'ı telefonun hazır Türkçe sesiyle "düüüm te ke" diye söyler. Telefonda erkek ses yoksa kadın ses
          kalınlaştırılır. Yalnız deneme içindir: derslerde çalmaz, zamanlaması tempoya tam oturmayabilir.
        </p>
        {soyleyen && <p class="hint">Söyleyen ses: {soyleyen}</p>}
        {usulWarn && (
          <p class="notice" role="alert">
            {usulWarn}
          </p>
        )}
      </section>

      <section class="setting setting-actions">
        <button type="button" class="tool" onClick={() => void backup()}>
          Yedeği kaydet
        </button>
        <button type="button" class="tool" onClick={() => fileInput.current?.click()}>
          Yedeği geri yükle
        </button>
        <input ref={fileInput} type="file" accept="application/json" hidden onChange={onFileChange} />
        {message && (
          <p class={message.kind === 'error' ? 'notice' : 'hint'} role={message.kind === 'error' ? 'alert' : 'status'}>
            {message.text}
          </p>
        )}
      </section>

      <a class="back" href="#/hakkinda">
        Hakkında
      </a>
    </main>
  )
}
