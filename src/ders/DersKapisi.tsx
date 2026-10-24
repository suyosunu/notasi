import type { ComponentChildren } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { dersById } from '../content/dersler'
import { getSettings } from '../store/db'
import { DersView } from './DersView'

/**
 * Ders kuralı: bir birimin dersi okunmadan alıştırması gelmez. Ders yoksa ya da okunduysa çocuklar doğrudan
 * görünür; okunmadıysa ders gösterilir ve "Anladım"dan sonra çocuklara geçilir. Okundu kaydı yazılamasa bile
 * (DersView `onDone`'u yine çağırır) kullanıcı takılmaz.
 */
export function DersKapisi(props: { dersId: string | null | undefined; children: ComponentChildren }) {
  // Kimlik değişince önceki dersin durumu (okundu, geçti) sıfırlansın.
  return <Kapi key={props.dersId ?? ''} {...props} />
}

function Kapi(props: { dersId: string | null | undefined; children: ComponentChildren }) {
  const { dersId, children } = props
  const ders = dersId ? dersById(dersId) : undefined
  const kimlik = ders?.id
  /** null: ayarlar henüz okunmadı; true/false: ders okunmuş mu. */
  const [okundu, setOkundu] = useState<boolean | null>(null)
  const [gecti, setGecti] = useState(false)

  useEffect(() => {
    if (!kimlik) return
    let alive = true
    getSettings()
      .then((s) => s.okunanDersler.includes(kimlik))
      .catch(() => false) // ayarlar okunamazsa ders gösterilir; düğme yine geçirir
      .then((v) => {
        if (alive) setOkundu(v)
      })
    return () => {
      alive = false
    }
  }, [kimlik])

  if (!ders || gecti) return <>{children}</>
  if (okundu === null) {
    return (
      <main class="screen">
        <p class="muted">Yükleniyor…</p>
      </main>
    )
  }
  if (okundu) return <>{children}</>
  return <DersView ders={ders} onDone={() => setGecti(true)} />
}
