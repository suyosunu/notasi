import { useState } from 'preact/hooks'
import { isStandalone } from '../audio/ios'
import { unlockAudio } from '../audio/player'
import { replaceRoute } from '../router'
import { saveSettings } from '../store/db'

type Step = 'karsilama' | 'rehber'

export function Onboarding() {
  const [step, setStep] = useState<Step>('karsilama')
  const [busy, setBusy] = useState(false)

  async function finish() {
    if (busy) return
    setBusy(true)
    try {
      await saveSettings({ onboarded: true })
    } catch {
      setBusy(false)
      return
    }
    // Geri tuşu yeniden başlangıç ekranına düşmesin.
    replaceRoute('/')
  }

  function start() {
    // Ses kilidi kullanıcı dokunuşunun içinde, eşzamanlı başlatılmalı; hata yutulur.
    try {
      void Promise.resolve(unlockAudio()).catch(() => undefined)
    } catch {
      // ses açılamadı; uygulama sessiz de kullanılabilir
    }
    if (isStandalone()) void finish()
    else setStep('rehber')
  }

  if (step === 'rehber') {
    return (
      <main class="screen">
        <h1>Ana ekrana ekleyin</h1>
        <p>
          Safari'de alttaki Paylaş ⬆︎ düğmesine, sonra 'Ana Ekrana Ekle'ye dokunun. Böylece uygulama tam ekran
          açılır ve verileriniz korunur.
        </p>
        <button type="button" class="primary" disabled={busy} onClick={() => void finish()}>
          Devam
        </button>
      </main>
    )
  }

  return (
    <main class="screen">
      <h1>Hoş geldiniz</h1>
      <p>Notası ile nota okumayı ve neyi adım adım öğrenirsiniz. Her gün on dakika yeter.</p>
      <button type="button" class="primary" onClick={start}>
        Başla
      </button>
    </main>
  )
}
