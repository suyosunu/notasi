import type { PerdeId } from '../ney-perdeler'
import type { MusicEvent } from '../../music/notation'

export type GorselAdi = 'ney-bolumleri' | 'el-yerlesimi' | 'nefes-444'

export type DersBlok =
  | { tur: 'metin'; metin: string }
  | { tur: 'liste'; maddeler: string[] }
  | { tur: 'porte'; olaylar: MusicEvent[]; aciklama?: string; bpm?: number } // Staff + notası varsa ▶ Dinle
  | { tur: 'parmak'; perdeId: PerdeId; aciklama?: string } // FingeringDiagram + ▶ Dinle (yarımlık)
  | { tur: 'gorsel'; ad: GorselAdi; aciklama?: string }
  | { tur: 'dene'; adimlar: string[] } // "Kendin dene" kutusu

export interface Ders {
  /** 's0:...', 'nota:<topicId>', 'perde:<PerdeId>', 'etut:<ad>' */
  id: string
  seviye: number
  baslik: string
  bloklar: DersBlok[]
  /** URL ya da "S4 neyzenim.com Ders 1" gibi kısa künye. */
  kaynaklar: string[]
  /** Dersten sonra gidilecek rota, ör. '/nota/nota-1'. */
  alistirma?: string
}
