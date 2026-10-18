import type { ComponentChildren } from 'preact'
import { MAKAMLAR } from './content/makamlar'
import { NEY_PERDELER } from './content/ney-perdeler'
import { NOTA_TOPICS } from './content/nota-topics'
import { useRoute } from './router'
import { About } from './screens/About'
import { Calibration } from './screens/Calibration'
import { DayPractice } from './screens/DayPractice'
import { EveningPractice } from './screens/EveningPractice'
import { Home } from './screens/Home'
import { MakamDetail } from './screens/MakamDetail'
import { MakamQuiz, MakamSection } from './screens/MakamSection'
import { NeyPerdePractice, NeySection } from './screens/NeySection'
import { MixedPractice } from './screens/MixedPractice'
import { NotaSection } from './screens/NotaSection'
import { Onboarding } from './screens/Onboarding'
import { Placement } from './screens/Placement'
import { SessionEnd } from './screens/SessionEnd'
import { Settings } from './screens/Settings'

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
  '/aksam': () => <EveningPractice />,
  '/nota': () => <NotaSection />,
  '/ney': () => <NeySection />,
  '/makam': () => <MakamSection />,
  '/makam/sorular': () => <MakamQuiz />,
  '/ayarlar': () => <Settings />,
  '/hakkinda': () => <About />,
  '/kalibrasyon': () => <Calibration />,
  '/baslangic': () => <Onboarding />,
  '/yoklama': () => <Placement />,
  '/oturum-sonu': () => <SessionEnd />,
}

const FREE_PREFIX = '/nota/'
const MIXED_ROUTE = '/nota/karisik'
const PERDE_PREFIX = '/ney/'
const MAKAM_PREFIX = '/makam/'

export function App() {
  const route = useRoute()
  if (Object.hasOwn(routes, route)) return routes[route]!()
  // Karışık antrenman, konu eşlemesinden önce gelir.
  if (route === MIXED_ROUTE) return <MixedPractice />
  if (route.startsWith(FREE_PREFIX)) {
    const topicId = route.slice(FREE_PREFIX.length)
    if (NOTA_TOPICS.some((t) => t.id === topicId)) return <DayPractice topicId={topicId} />
  }
  if (route.startsWith(PERDE_PREFIX)) {
    const perdeId = route.slice(PERDE_PREFIX.length)
    if (NEY_PERDELER.some((p) => p.id === perdeId)) return <NeyPerdePractice key={perdeId} perdeId={perdeId} />
  }
  if (route.startsWith(MAKAM_PREFIX)) {
    const makamId = route.slice(MAKAM_PREFIX.length)
    if (MAKAMLAR.some((m) => m.id === makamId)) return <MakamDetail key={makamId} makamId={makamId} />
  }
  return <Placeholder title="Sayfa bulunamadı" />
}
