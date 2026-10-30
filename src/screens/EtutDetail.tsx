import { useEffect, useRef, useState } from 'preact/hooks'
import { etutDersleri } from '../content/dersler'
import { ETUTLER } from '../content/etutler'
import type { Etut } from '../content/etutler'
import { USULLER } from '../content/usuller'
import { DersKapisi } from '../ders/DersKapisi'
import { DEFAULT_SETTINGS, getSettings, isaretEkle } from '../store/db'
import { CalismaPaneli } from './CalismaPaneli'

const BPM_MIN = 40
const BPM_MAX = 90
/** Etütlerin mertebesi 4'tür: dörtlük içindeki sekizlikler kirişlenir. */
const KIRIS_VURUSU = 1
/** Satırdaki ölçü sayısı: 2/4 ve 3/4'te kısa ölçüler üçer, diğerlerinde ikişer (telefon genişliği). */
const olcuPerSatir = (zaman: number) => (zaman === 2 || zaman === 3 ? 3 : 2)

/**
 * Etüdün çalışma bölümü (etüt ekranında ve akşam planında ortak): başlık, çalışma paneli (nota, bölüm seçimi, hız,
 * metronom ya da usul eşliği, tekrar ve hızlanma, mikrofonla takip denemesi) ve "Çaldım" işareti. `baslikGizle`: başlığı üst ekran gösteriyorsa
 * (akşam adımı) çizilmez.
 */
export function EtutCalisma(props: { etut: Etut; onDone?: () => void; baslikGizle?: boolean }) {
  const { etut, onDone, baslikGizle } = props
  /** Usullü etütte eşlik usul sesidir; usulsüzde (ya da usul bulunamazsa) 4/4 metronom. */
  const usul = etut.usulId ? USULLER.find((u) => u.id === etut.usulId) : undefined
  const [calindi, setCalindi] = useState(false)
  /** Panelin durdurma işlevi: "Çaldım" çalan sesi keser. */
  const durdurRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    let alive = true
    getSettings()
      .catch(() => DEFAULT_SETTINGS)
      .then((cfg) => {
        if (alive) setCalindi(cfg.calinanEtutler.includes(etut.id))
      })
    return () => {
      alive = false
    }
  }, [etut.id])

  async function caldim() {
    durdurRef.current?.()
    try {
      await isaretEkle('calinanEtutler', etut.id)
      setCalindi(true)
    } catch {
      // Kayıt yazılamasa da kullanıcı sonraki adıma geçebilmeli.
    }
    onDone?.()
  }

  return (
    <>
      {!baslikGizle && <h1>🎼 {etut.baslik}</h1>}
      <CalismaPaneli
        olcu={etut.olcu}
        usul={usul}
        varsayilanBpm={etut.bpm}
        bpmMin={BPM_MIN}
        bpmMax={BPM_MAX}
        olcuPerSatir={olcuPerSatir(usul?.zaman ?? 4)}
        beamBeats={KIRIS_VURUSU}
        durdurRef={durdurRef}
        takip
      />

      <div class="tools etut-caldim">
        <button type="button" class="tool" onClick={() => void caldim()}>
          ✓ Çaldım
        </button>
        {calindi && <span class="etut-rozet">Çalındı ✓</span>}
      </div>
    </>
  )
}

/** `/etut/:id`: etüt, dersleri (`etutDersleri`) okunduktan sonra açılır. */
export function EtutDetail({ etutId }: { etutId: string }) {
  const etut = ETUTLER.find((e) => e.id === etutId)
  if (!etut) {
    return (
      <main class="screen">
        <p class="muted">Etüt bulunamadı.</p>
        <a class="back" href="#/ney">
          Ney bölümüne dön
        </a>
      </main>
    )
  }
  return (
    <DersKapisi dersId={etutDersleri(etut)} geri={{ href: '#/ney', label: 'Ney bölümüne dön' }}>
      <main class="screen">
        <EtutCalisma etut={etut} />
        <div class="links">
          <a class="back" href="#/ney">
            Ney bölümüne dön
          </a>
        </div>
      </main>
    </DersKapisi>
  )
}
