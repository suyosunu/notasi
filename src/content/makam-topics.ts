import { diziAnahtari, MAKAMLAR } from './makamlar'
import type { Makam } from './makamlar'

export interface MakamTopic {
  id: string
  section: 'makam'
  title: string
  kind: 'makam-dizi' | 'makam-durak' | 'makam-guclu'
  cards: string[]
}

/**
 * Dizisi başka bir makamla paylaşılmayan makamlar. Uşşak ile Bayâtî, Nevâ ile Hüseynî ve Muhayyer aynı sekiz sesi
 * kullanır; onları yalnız dizi göstererek ayırt etmek mümkün değildir, bu yüzden "Bu dizi hangi makamın?" kartı yoktur.
 */
export const DIZISI_TEK_MAKAMLAR: Makam[] = MAKAMLAR.filter(
  (m) => MAKAMLAR.filter((x) => diziAnahtari(x) === diziAnahtari(m)).length === 1,
)

/**
 * Makam soru kartları. NOTA_TOPICS'in parçası değildir: günlük plana, Nota bölümüne ve karışık
 * havuza girmez; yalnızca /makam/sorular turunda sorulur (Sürüm 3'te bağlanabilir).
 */
export const MAKAM_TOPICS: MakamTopic[] = [
  { id: 'makam-dizi', section: 'makam', title: 'Dizi: hangi makam?', kind: 'makam-dizi', cards: DIZISI_TEK_MAKAMLAR.map((m) => `makam-dizi:${m.id}`) },
  { id: 'makam-durak', section: 'makam', title: 'Durak', kind: 'makam-durak', cards: MAKAMLAR.map((m) => `makam-durak:${m.id}`) },
  { id: 'makam-guclu', section: 'makam', title: 'Güçlü', kind: 'makam-guclu', cards: MAKAMLAR.map((m) => `makam-guclu:${m.id}`) },
]
