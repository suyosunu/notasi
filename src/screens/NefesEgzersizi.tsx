import { useEffect, useState } from 'preact/hooks'
import { DersKapisi } from '../ders/DersKapisi'
import { NEFES_HEDEF_ID } from '../learning/baspare'
import { isaretEkle } from '../store/db'

/** Bir fazın süresi (sn). */
const FAZ_SN = 4
const FAZLAR = ['Nefes al', 'Nefes tut', 'Nefes ver'] as const
const TUR = 4
/** Çalışmanın toplam süresi: 4 tur × 3 faz × 4 sn. */
const TOPLAM_SN = TUR * FAZLAR.length * FAZ_SN

/** Zamanlayıcı sıklığı; saniye sınırları kaçmasın diye saniyeden sık. */
const TIK_MS = 250

type Durum = 'hazir' | 'calisiyor' | 'bitti'

/**
 * 4-4-4 nefes çalışması: 4 tur, her turda 4 sn al, 4 sn tut, 4 sn ver. Ses kullanılmaz; zamanlayıcı yalnız
 * çalışırken kurulur, "Durdur"da ve sayfadan çıkınca temizlenir. Dördüncü tur bitince hedef işaretlenir.
 */
export function NefesEgzersizi() {
  const [durum, setDurum] = useState<Durum>('hazir')
  /** Başlangıçtan beri geçen tam saniye. */
  const [saniye, setSaniye] = useState(0)

  useEffect(() => {
    if (durum !== 'calisiyor') return
    // Süre tik sayısından değil duvar saatinden hesaplanır: iOS zamanlayıcıyı yavaşlatsa da 48 sn gerçek süredir.
    const baslangic = Date.now()
    const id = setInterval(() => {
      const gecen = Math.min(TOPLAM_SN, Math.floor((Date.now() - baslangic) / 1000))
      setSaniye(gecen)
      if (gecen >= TOPLAM_SN) {
        clearInterval(id)
        setDurum('bitti')
        // Kayıt yazılamazsa da kullanıcı çalışmayı tamamlamıştır; ekran etkilenmez.
        void isaretEkle('onaylananHedefler', NEFES_HEDEF_ID).catch(() => undefined)
      }
    }, TIK_MS)
    return () => clearInterval(id)
  }, [durum])

  function basla() {
    setSaniye(0)
    setDurum('calisiyor')
  }

  const faz = FAZLAR[Math.floor(saniye / FAZ_SN) % FAZLAR.length]!
  const tur = Math.min(TUR, Math.floor(saniye / (FAZLAR.length * FAZ_SN)) + 1)
  const kalan = FAZ_SN - (saniye % FAZ_SN)

  return (
    <DersKapisi dersId="s0:nefes">
      <main class="screen nefes">
        <h1>🫁 4-4-4 nefes</h1>
        {durum === 'hazir' && (
          <p class="muted">
            {`${TUR} tur: her turda ${FAZ_SN} sn nefes al, ${FAZ_SN} sn tut, ${FAZ_SN} sn ver. Karnın öne şişsin, omuzların kalkmasın.`}
          </p>
        )}
        {durum === 'calisiyor' && (
          <div class="nefes-sahne">
            <p class="muted">{`Tur ${tur}/${TUR}`}</p>
            <p class="nefes-faz" role="status" aria-live="polite">
              {faz}
            </p>
            <p class="nefes-sayac" data-testid="nefes-sayac">
              {kalan}
            </p>
          </div>
        )}
        {durum === 'bitti' && (
          <p class="result-ok nefes-bitti" role="status">
            Tamamlandı ✓
          </p>
        )}
        {durum === 'calisiyor' ? (
          <button type="button" class="primary" onClick={() => setDurum('hazir')}>
            Durdur
          </button>
        ) : (
          <button type="button" class="primary" onClick={basla}>
            {durum === 'bitti' ? 'Yeniden başla' : 'Başla'}
          </button>
        )}
        <a class="back" href="#/ogren">
          Öğren bölümüne dön
        </a>
      </main>
    </DersKapisi>
  )
}
