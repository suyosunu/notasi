import { useEffect, useRef, useState } from 'preact/hooks'
import { AHENKLER } from '../music/ahenk'
import type { AhenkId } from '../music/ahenk'
import { BackupError, importBackup, shareOrDownloadBackup } from '../store/backup'
import { getSettings, saveSettings } from '../store/db'
import type { Settings as SettingsData } from '../store/db'

const INVALID_FILE = 'Bu dosya geçerli bir Notası yedeği değil.'
const CONFIRM_RESTORE = 'Mevcut ilerlemenin yerine yedek yüklenecek. Emin misiniz?'

interface Message {
  kind: 'ok' | 'error'
  text: string
}

export function Settings() {
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [message, setMessage] = useState<Message | null>(null)
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
    setSettings(await getSettings())
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
