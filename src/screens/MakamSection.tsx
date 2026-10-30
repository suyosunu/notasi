import { useState } from 'preact/hooks'
import { MAKAM_TOPICS } from '../content/makam-topics'
import { MAKAMLAR } from '../content/makamlar'
import { ONERILEN_SEVIYE } from '../content/seviyeler'
import { DersKapisi } from '../ders/DersKapisi'
import { makeQuestion } from '../learning/questions'
import type { Question } from '../learning/questions'
import { seededRng, shuffle } from '../util/rng'
import { FreeRound } from './DayPractice'

const QUIZ_COUNT = 8
const QUIZ_TITLE = '🧭 Makam'
const BACK = { href: '#/makam', label: 'Makam bölümüne dön' }

/** Makam bölümü: sekiz makam kartı ve sorulara bağlantı. */
export function MakamSection() {
  return (
    <main class="screen">
      <h1>🧭 Makam</h1>
      <p class="muted">Bir makama dokunarak dizisine bak, dinle.</p>
      <ul class="topic-list">
        {MAKAMLAR.map((m) => (
          <li key={m.id}>
            <a class="topic" href={`#/makam/${m.id}`}>
              <span class="topic-title">{m.name}</span>
              <small class="muted">{`Durak: ${m.durak} · Güçlü: ${m.guclu}`}</small>
              {ONERILEN_SEVIYE.makam[m.id] !== undefined && (
                <small class="seviye-etiket">{`Seviye ${ONERILEN_SEVIYE.makam[m.id]}`}</small>
              )}
            </a>
          </li>
        ))}
      </ul>
      <a class="primary link-button" href="#/makam/sorular">
        Sorularla çalış
      </a>
      <div class="links">
        <a class="back" href="#/">
          Ana ekrana dön
        </a>
      </div>
    </main>
  )
}

/** Önce "Makam nedir?" dersi (ders kuralı), sonra makam kartlarından 8 soruluk serbest tur. */
export function MakamQuiz() {
  return (
    <DersKapisi dersId="makam:giris" geri={BACK}>
      <MakamSoruTuru />
    </DersKapisi>
  )
}

/** Makam kartlarından (dizi, durak, güçlü) karıştırılıp dönülen 8 soruluk serbest tur. */
function MakamSoruTuru() {
  const [questions] = useState<Question[]>(() => {
    const rng = seededRng(Date.now())
    const cards = shuffle(
      MAKAM_TOPICS.flatMap((t) => t.cards),
      rng,
    )
    return Array.from({ length: QUIZ_COUNT }, (_, i) => makeQuestion(cards[i % cards.length]!, rng))
  })
  return <FreeRound questions={questions} title={QUIZ_TITLE} emptyMessage="Soru bulunamadı." back={BACK} />
}
