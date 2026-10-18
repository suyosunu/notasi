import { useEffect, useState } from 'preact/hooks'
import { neyLevel } from '../learning/long-tone'
import { listLongTones } from '../store/db'

/**
 * `perdeId` perdesinin düzeyi (`neyLevel`: son denemelerde geçiş − başarısız); her `attemptKey`
 * değişiminde (yeni deneme) yeniden okunur, böylece deneme düzeyi öncekilerin sonucuna göre belirlenir.
 * `perdeId` yoksa 0 döner. Okunana dek `null`.
 */
export function useNeyLevel(perdeId: string | null, attemptKey: string | number): number | null {
  const [loaded, setLoaded] = useState<{ key: string; level: number } | null>(null)
  const key = `${perdeId ?? ''}|${attemptKey}`

  useEffect(() => {
    if (perdeId === null) return
    let alive = true
    void listLongTones(perdeId).then((list) => {
      if (alive) setLoaded({ key, level: neyLevel(list) })
    })
    return () => {
      alive = false
    }
  }, [key])

  if (perdeId === null) return 0
  return loaded?.key === key ? loaded.level : null
}
