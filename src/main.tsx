import { render } from 'preact'
import { App } from './app'
import { preloadAudio, setNeySesi } from './audio/player'
import { getSettings } from './store/db'
import './styles.css'

render(<App />, document.getElementById('app')!)

// Ses isteğe bağlı: yükleme başarısız olursa uygulama çalışmaya devam eder.
preloadAudio().catch(() => {})

// Seçili ney sesi açılışta uygulanır; ayarlar okunamazsa varsayılan ses kalır.
getSettings().then(
  (s) => setNeySesi(s.neySesi),
  () => {},
)
