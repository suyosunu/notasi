import { useEffect, useState } from 'preact/hooks'
import { listLongTones } from '../store/db'

/**
 * `perdeId` perdesinde geçilmiş (`passed`) uzun ses sayısı; her `attemptKey` değişiminde
 * (yeni deneme) yeniden okunur, böylece deneme düzeyi öncekilerin sonucuna göre belirlenir.
 * `perdeId` yoksa 0 döner. Okunana dek `null`.
 */
export function usePassCount(perdeId: string | null, attemptKey: string | number): number | null {
  const [loaded, setLoaded] = useState<{ key: string; count: number } | null>(null)
  const key = `${perdeId ?? ''}|${attemptKey}`

  useEffect(() => {
    if (perdeId === null) return
    let alive = true
    void listLongTones(perdeId).then((list) => {
      if (alive) setLoaded({ key, count: list.filter((r) => r.passed).length })
    })
    return () => {
      alive = false
    }
  }, [key])

  if (perdeId === null) return 0
  return loaded?.key === key ? loaded.count : null
}
