import type { ComponentChildren } from 'preact'
import { MAKAMLAR } from './content/makamlar'
import { NEY_PERDELER } from './content/ney-perdeler'
import { NOTA_TOPICS } from './content/nota-topics'
import { PARCALAR } from './content/parcalar'
import { dersById } from './content/dersler'
import { DersView } from './ders/DersView'
import { navigate, useRoute } from './router'
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
import { OgrenSection } from './screens/OgrenSection'
import { Onboarding } from './screens/Onboarding'
import { ParcaDetail } from './screens/ParcaDetail'
import { ParcalarSection } from './screens/ParcalarSection'
import { Placement } from './screens/Placement'
import { SessionEnd } from './screens/SessionEnd'
import { Settings } from './screens/Settings'
import { UsulSection } from './screens/UsulSection'

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
  '/ogren': () => <OgrenSection />,
  '/nota': () => <NotaSection />,
  '/ney': () => <NeySection />,
  '/makam': () => <MakamSection />,
  '/makam/sorular': () => <MakamQuiz />,
  '/usul': () => <UsulSection />,
  '/parcalar': () => <ParcalarSection />,
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
const PARCA_PREFIX = '/parcalar/'
const DERS_PREFIX = '/ders/'

/** `/ders/<kodlanmış kimlik>` yolundaki kimlik; bozuk kodlama (ör. `%E0%A4%A`) kimliksiz sayılır. */
function dersKimligi(route: string): string | null {
  try {
    return decodeURIComponent(route.slice(DERS_PREFIX.length))
  } catch {
    return null
  }
}

/**
 * Rotanın ekranı; bilinmeyen rotada `null`. `App` ve `rotaBilinir` aynı çözümlemeyi kullanır:
 * yeni rotalar yalnızca buraya eklenir.
 */
function cozumle(route: string): (() => ComponentChildren) | null {
  if (Object.hasOwn(routes, route)) return routes[route]!
  // Karışık antrenman, konu eşlemesinden önce gelir.
  if (route === MIXED_ROUTE) return () => <MixedPractice />
  if (route.startsWith(FREE_PREFIX)) {
    const topicId = route.slice(FREE_PREFIX.length)
    if (NOTA_TOPICS.some((t) => t.id === topicId)) return () => <DayPractice topicId={topicId} />
  }
  if (route.startsWith(PERDE_PREFIX)) {
    const perdeId = route.slice(PERDE_PREFIX.length)
    if (NEY_PERDELER.some((p) => p.id === perdeId)) return () => <NeyPerdePractice key={perdeId} perdeId={perdeId} />
  }
  if (route.startsWith(MAKAM_PREFIX)) {
    const makamId = route.slice(MAKAM_PREFIX.length)
    if (MAKAMLAR.some((m) => m.id === makamId)) return () => <MakamDetail key={makamId} makamId={makamId} />
  }
  if (route.startsWith(PARCA_PREFIX)) {
    const parcaId = route.slice(PARCA_PREFIX.length)
    if (PARCALAR.some((p) => p.id === parcaId)) return () => <ParcaDetail key={parcaId} parcaId={parcaId} />
  }
  if (route.startsWith(DERS_PREFIX)) {
    const dersId = dersKimligi(route)
    if (dersId !== null && dersById(dersId)) return () => <DersRoute key={dersId} dersId={dersId} />
  }
  return null
}

/** Sabit rotalar ya da bilinen önek + var olan kimlik için `true`; `App` ile aynı çözümlemeyi kullanır. */
export function rotaBilinir(path: string): boolean {
  return cozumle(path) !== null
}

/** `/ders/:id` ekranı: ders, sonunda alıştırmaya (yoksa Öğren bölümüne) götürür. */
function DersRoute({ dersId }: { dersId: string }) {
  const ders = dersById(dersId)!
  return (
    <DersView
      ders={ders}
      onDone={() => navigate(ders.alistirma ?? '/ogren')}
      geri={{ href: '#/ogren', label: 'Öğren bölümüne dön' }}
    />
  )
}

function DersBulunamadi() {
  return (
    <main class="screen">
      <h1>Ders bulunamadı</h1>
      <p class="muted">Bu ders yok ya da kaldırılmış.</p>
      <a class="back" href="#/ogren">
        Öğren bölümüne dön
      </a>
    </main>
  )
}

export function App() {
  const route = useRoute()
  const screen = cozumle(route)
  if (screen) return screen()
  if (route.startsWith(DERS_PREFIX)) return <DersBulunamadi />
  return <Placeholder title="Sayfa bulunamadı" />
}
