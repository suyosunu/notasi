import type { ComponentChildren } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { dersById } from '../content/dersler'
import { getSettings } from '../store/db'
import { DersView } from './DersView'

type Geri = { href: string; label: string }
type Kimlik = string | readonly string[] | null | undefined

const VARSAYILAN_GERI: Geri = { href: '#/', label: 'Ana ekrana dön' }

/**
 * Ders kuralı: bir birimin dersi okunmadan alıştırması gelmez. Ders yoksa ya da okunduysa çocuklar doğrudan
 * görünür; okunmadıysa ders gösterilir ve "Anladım"dan sonra çocuklara geçilir. Okundu kaydı yazılamasa bile
 * (DersView `onDone`'u yine çağırır) kullanıcı takılmaz. `dersId` dizi olabilir: dersler sırayla, her biri
 * yalnızca okunmamışsa gösterilir. `geri` kapıdaki dersten okundu işaretlemeden çıkış bağlantısıdır.
 */
export function DersKapisi(props: { dersId: Kimlik; geri?: Geri; children: ComponentChildren }) {
  const { dersId, geri, children } = props
  const idler = typeof dersId === 'string' ? [dersId] : (dersId ?? [])
  if (idler.length > 1) {
    return (
      <DersKapisi dersId={idler[0]} geri={geri}>
        <DersKapisi dersId={idler.slice(1)} geri={geri}>
          {children}
        </DersKapisi>
      </DersKapisi>
    )
  }
  // Kimlik değişince önceki dersin durumu (okundu, geçti) sıfırlansın.
  return (
    <Kapi key={idler[0] ?? ''} dersId={idler[0]} geri={geri ?? VARSAYILAN_GERI}>
      {children}
    </Kapi>
  )
}

function Kapi(props: { dersId: string | undefined; geri: Geri; children: ComponentChildren }) {
  const { dersId, geri, children } = props
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
  return <DersView ders={ders} onDone={() => setGecti(true)} geri={geri} />
}
