import type { ComponentChildren } from 'preact'
import { NOTA_TOPICS } from './content/nota-topics'
import { useRoute } from './router'
import { DayPractice } from './screens/DayPractice'
import { Home } from './screens/Home'
import { NotaSection } from './screens/NotaSection'
import { SessionEnd } from './screens/SessionEnd'

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

const routes: Record<string, () => ComponentChildren> = {
  '/': () => <Home />,
  '/gunduz': () => <DayPractice />,
  '/aksam': () => <Placeholder title="Akşam" />,
  '/nota': () => <NotaSection />,
  '/ney': () => <Placeholder title="Ney" />,
  '/ayarlar': () => <Placeholder title="Ayarlar" />,
  '/hakkinda': () => <Placeholder title="Hakkında" />,
  '/kalibrasyon': () => <Placeholder title="Kalibrasyon" />,
  '/baslangic': () => <Placeholder title="Başlangıç" />,
  '/yoklama': () => <Placeholder title="Yoklama" />,
  '/oturum-sonu': () => <SessionEnd />,
}

const FREE_PREFIX = '/nota/'

export function App() {
  const route = useRoute()
  if (Object.hasOwn(routes, route)) return routes[route]!()
  if (route.startsWith(FREE_PREFIX)) {
    const topicId = route.slice(FREE_PREFIX.length)
    if (NOTA_TOPICS.some((t) => t.id === topicId)) return <DayPractice topicId={topicId} />
  }
  return <Placeholder title="Sayfa bulunamadı" />
}
