import { useEffect, useState } from 'preact/hooks'
import { SEVIYELER } from '../content/seviyeler'
import type { Hedef, Seviye } from '../content/seviyeler'
import { hedefDurumlari, loadIlerleme, mevcutSeviye } from '../learning/seviye'
import type { HedefDurumu, IlerlemeGirdisi } from '../learning/seviye'
import { isaretEkle, isaretKaldir } from '../store/db'

const HEDEFSIZ = 'Bu seviyenin hedefleri sonraki aşamalarda gelecek.'
const ONERI_NOTU = 'Sayılar öneridir; bir ney hocasıyla doğrulanması iyi olur.'

function HedefSatiri(props: {
  hedef: Hedef
  durum: HedefDurumu
  onay: (hedef: Hedef, isaretli: boolean) => void
}) {
  const { hedef, durum } = props
  return (
    <li class="yolum-hedef" data-tamam={durum.tamam}>
      {hedef.olcut.tur === 'onay' ? (
        <label class="yolum-metin">
          <input
            type="checkbox"
            checked={durum.tamam}
            onChange={(e) => props.onay(hedef, e.currentTarget.checked)}
          />
          <span>{hedef.metin}</span>
        </label>
      ) : (
        <>
          <span class="yolum-simge" role="img" aria-label={durum.tamam ? 'tamam' : 'eksik'}>
            {durum.tamam ? '✓' : '○'}
          </span>
          <span class="yolum-metin">
            <span>{hedef.metin}</span>
            {durum.ilerleme && <small class="muted">{durum.ilerleme}</small>}
          </span>
        </>
      )}
      {hedef.rota && (
        <a class="yolum-git" href={`#${hedef.rota}`}>
          Git
        </a>
      )}
    </li>
  )
}

function Hedefler(props: {
  seviye: Seviye
  durumlar: Record<string, HedefDurumu>
  onay: (hedef: Hedef, isaretli: boolean) => void
}) {
  const { seviye } = props
  if (seviye.hedefler.length === 0) {
    return (
      <>
        <p>{seviye.ozet}</p>
        <p class="muted">{HEDEFSIZ}</p>
      </>
    )
  }
  return (
    <ul class="yolum-liste">
      {seviye.hedefler.map((h) => (
        <HedefSatiri key={h.id} hedef={h} durum={props.durumlar[h.id]!} onay={props.onay} />
      ))}
    </ul>
  )
}

/** Yolum ekranı: mevcut seviye açık, diğer seviyeler katlanır; hedefler uygulama verisinden ya da kullanıcı onayıyla işaretlenir. */
export function Yolum() {
  const [girdi, setGirdi] = useState<IlerlemeGirdisi | null>(null)

  useEffect(() => {
    let alive = true
    loadIlerleme()
      .then((g) => {
        if (alive) setGirdi(g)
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])

  /** Onay kutusu hemen değişir; kayıt yazılamazsa eski haline döner. */
  function onayla(hedef: Hedef, isaretli: boolean) {
    const ayarla = (liste: boolean) =>
      setGirdi((g) => {
        if (!g) return g
        const onaylar = new Set(g.onaylar)
        if (liste) onaylar.add(hedef.id)
        else onaylar.delete(hedef.id)
        return { ...g, onaylar }
      })
    ayarla(isaretli)
    const yaz = isaretli ? isaretEkle : isaretKaldir
    yaz('onaylananHedefler', hedef.id).catch(() => ayarla(!isaretli))
  }

  if (!girdi) return null

  const durumlar = hedefDurumlari(SEVIYELER, girdi)
  const mevcut = mevcutSeviye(SEVIYELER, durumlar)

  return (
    <main class="screen">
      <h1>🗺️ Yolum</h1>
      <section class="yolum-mevcut">
        <h2>{`Seviye ${mevcut.no} · ${mevcut.ad}`}</h2>
        <p class="muted">{mevcut.sure}</p>
        <Hedefler seviye={mevcut} durumlar={durumlar} onay={onayla} />
      </section>

      <h2 class="yolum-diger">Diğer seviyeler</h2>
      {SEVIYELER.filter((s) => s.no !== mevcut.no).map((s) => (
        <details key={s.no} class="yolum-seviye">
          <summary>
            {`Seviye ${s.no} · ${s.ad}`}
            <small class="muted">{s.sure}</small>
          </summary>
          <Hedefler seviye={s} durumlar={durumlar} onay={onayla} />
        </details>
      ))}

      <p class="muted">{ONERI_NOTU}</p>
      <div class="links">
        <a class="back" href="#/">
          Ana ekrana dön
        </a>
      </div>
    </main>
  )
}
