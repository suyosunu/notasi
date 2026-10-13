const DAY_MS = 86_400_000

/** 'YYYY-MM-DD' → UTC gün numarası (saat dilimi kayması olmaz). */
function dayNumber(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS)
}

/**
 * Bugünden geriye kesintisiz çalışılan gün sayısı. Bugün henüz çalışılmadıysa
 * dünden başlayarak sayılır. Tekrarlar ve sıralama önemsizdir; gelecek günler sayılmaz.
 */
export function streakDays(completedDates: string[], today: string): number {
  const days = new Set(completedDates.map(dayNumber))
  let day = dayNumber(today)
  if (!days.has(day)) day -= 1
  let streak = 0
  while (days.has(day)) {
    streak++
    day -= 1
  }
  return streak
}
