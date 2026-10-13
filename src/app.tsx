import type { ComponentChildren } from 'preact'
import { useRoute } from './router'
import { DayPractice } from './screens/DayPractice'

function Placeholder({ title }: { title: string }) {
  return (
    <main class="screen">
      <h1>{title}</h1>
      <p class="muted">Bu ekran henüz hazırlanıyor.</p>
      <a class="back" href="#/">
        Ana ekrana dön
      </a>
    </main>
  )
}

function Home() {
  return (
    <main class="screen">
      <h1>Notası</h1>
      <p class="muted">Nota okumayı ve ney çalmayı adım adım öğren.</p>
      <nav class="cards">
        <a class="card card-day" href="#/gunduz">
          <strong>Gündüz</strong>
          <span>Günlük kısa ders</span>
        </a>
        <a class="card card-night" href="#/aksam">
          <strong>Akşam</strong>
          <span>Ney ile çalışma</span>
        </a>
      </nav>
      <nav class="links">
        <a href="#/nota">Nota</a>
        <a href="#/ney">Ney</a>
        <a href="#/ayarlar">Ayarlar</a>
        <a href="#/hakkinda">Hakkında</a>
      </nav>
    </main>
  )
}

const routes: Record<string, () => ComponentChildren> = {
  '/': () => <Home />,
  '/gunduz': () => <DayPractice />,
  '/aksam': () => <Placeholder title="Akşam" />,
  '/nota': () => <Placeholder title="Nota" />,
  '/ney': () => <Placeholder title="Ney" />,
  '/ayarlar': () => <Placeholder title="Ayarlar" />,
  '/hakkinda': () => <Placeholder title="Hakkında" />,
  '/kalibrasyon': () => <Placeholder title="Kalibrasyon" />,
  '/baslangic': () => <Placeholder title="Başlangıç" />,
  '/yoklama': () => <Placeholder title="Yoklama" />,
  '/oturum-sonu': () => <Placeholder title="Oturum sonu" />,
}

export function App() {
  const route = useRoute()
  const screen = routes[route]
  return screen ? screen() : <Placeholder title="Sayfa bulunamadı" />
}
