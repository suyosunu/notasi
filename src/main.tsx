import { render } from 'preact'
import { App } from './app'
import { preloadAudio } from './audio/player'
import './styles.css'

render(<App />, document.getElementById('app')!)

// Ses isteğe bağlı: yükleme başarısız olursa uygulama çalışmaya devam eder.
preloadAudio().catch(() => {})
