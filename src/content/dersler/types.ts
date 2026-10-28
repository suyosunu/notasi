import type { PerdeId } from '../ney-perdeler'
import type { MusicEvent } from '../../music/notation'

export type GorselAdi = 'ney-bolumleri' | 'el-yerlesimi' | 'nefes-444'

export type DersBlok =
  | { tur: 'metin'; metin: string }
  | { tur: 'liste'; maddeler: string[] }
  // Staff + notası varsa ▶ Dinle. `ropriz`: iki röpriz çizgisi çizilir, Dinle bölümü iki kez çalar.
  // `olcuCizgileri`: bu olay sıralarından sonra ölçü çizgisi; verilirse satır sonuna da çizgi çizilir.
  | { tur: 'porte'; olaylar: MusicEvent[]; aciklama?: string; bpm?: number; ropriz?: boolean; olcuCizgileri?: number[] }
  | { tur: 'parmak'; perdeId: PerdeId; aciklama?: string } // FingeringDiagram + ▶ Dinle (yarımlık)
  | { tur: 'gorsel'; ad: GorselAdi; aciklama?: string }
  // Usulün düm-tek şeması + bir ölçüsünü ♩ = 60'ta iki kez çalan ▶ Dinle (vuruş kalıbı olmayan usulde şema ve Dinle yok).
  | { tur: 'usul'; usulId: string; aciklama?: string }
  | { tur: 'dene'; adimlar: string[] } // "Kendin dene" kutusu

export interface Ders {
  /** 's0:...', 'nota:<topicId>', 'perde:<PerdeId>', 'etut:<ad>', 'usul:giris', 'usul:<usulId>' */
  id: string
  seviye: number
  baslik: string
  bloklar: DersBlok[]
  /** URL ya da "S4 neyzenim.com Ders 1" gibi kısa künye. */
  kaynaklar: string[]
  /** Dersten sonra gidilecek rota, ör. '/nota/nota-1'. */
  alistirma?: string
}
