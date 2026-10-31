import type { Parca } from '../types'
import { ellePiecesFrom } from './tur'
import type { ElleParca } from './tur'

export type { ElleBolum, ElleParca } from './tur'

/** `eserler/` klasöründeki her dosya bir eser verir; yeni eser yalnız yeni dosya ekleyerek gelir. */
const dosyalar = import.meta.glob<{ default: ElleParca }>('./eserler/*.ts', { eager: true })

/** Elle yazılmış parçalar (başlığa göre sıralı, bölümler ana parçanın arkasında). Bozuk eser yüklemeyi durdurur. */
export const ELLE_PARCALAR: Parca[] = ellePiecesFrom(Object.values(dosyalar).map((m) => m.default))
