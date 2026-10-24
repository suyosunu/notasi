import { useEffect, useState } from 'preact/hooks'
import { DERSLER } from '../content/dersler'
import { SEVIYELER } from '../content/seviyeler'
import { getSettings } from '../store/db'

/** `Seviye N · <ad>`; `SEVIYELER`de olmayan seviye yalnız `Seviye N` olur. */
function seviyeBasligi(seviye: number): string {
  const s = SEVIYELER.find((x) => x.no === seviye)
  return s ? `Seviye ${s.no} · ${s.ad}` : `Seviye ${seviye}`
}

/** Öğren bölümü: dersler seviyeye göre gruplanır; okunanlar ✓, okunmayanlar 📖 ile gösterilir. */
export function OgrenSection() {
  const [okunan, setOkunan] = useState<string[] | null>(null)

  useEffect(() => {
    let alive = true
    getSettings()
      .then((s) => s.okunanDersler)
      .catch(() => [] as string[]) // okundu bilgisi alınamazsa hepsi okunmamış görünür
      .then((liste) => {
        if (alive) setOkunan(liste)
      })
    return () => {
      alive = false
    }
  }, [])

  const seviyeler = [...new Set(DERSLER.map((d) => d.seviye))].sort((a, b) => a - b)

  return (
    <main class="screen">
      <h1>📖 Öğren</h1>
      <p class="muted">Her konunun kısa dersi burada. İstediğin zaman yeniden okuyabilirsin.</p>
      {/* Okundu bilgisi gelmeden liste çizilmez; yoksa her ders bir an 📖 görünürdü. */}
      {okunan !== null && DERSLER.length === 0 && <p class="muted">Dersler yakında burada olacak.</p>}
      {okunan !== null &&
        seviyeler.map((seviye) => (
          <section key={seviye}>
            <h2>{seviyeBasligi(seviye)}</h2>
            <ul class="topic-list">
              {DERSLER.filter((d) => d.seviye === seviye).map((d) => {
                const okundu = okunan.includes(d.id)
                return (
                  <li key={d.id}>
                    <a class="topic" href={`#/ders/${encodeURIComponent(d.id)}`} data-okundu={okundu}>
                      <span role="img" aria-label={okundu ? 'okundu' : 'okunmadı'}>
                        {okundu ? '✓' : '📖'}
                      </span>
                      <span class="topic-title">{d.baslik}</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </section>
      ))}
      <div class="links">
        <a class="back" href="#/">
          Ana ekrana dön
        </a>
      </div>
    </main>
  )
}
