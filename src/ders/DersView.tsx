import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks'
import { playCode, playWritten, stopAudio, unlockAudio } from '../audio/player'
import { buildUsulOnceCode } from '../audio/usul'
import { getUsulSesi } from '../audio/usulSamples'
import { NEY_PERDELER, visibleFingering } from '../content/ney-perdeler'
import { SOUND_OFF, SOUND_WARNING } from '../content/ses-mesajlari'
import { USULLER } from '../content/usuller'
import type { Usul } from '../content/usuller'
import type { Ders, DersBlok } from '../content/dersler/types'
import type { MusicEvent } from '../music/notation'
import { FingeringDiagram } from '../ney/Fingering'
import { Staff } from '../notation/Staff'
import { VurusDiagram } from '../notation/VurusDiagram'
import { DEFAULT_SETTINGS, getSettings, isaretEkle } from '../store/db'
import type { Settings } from '../store/db'
import { Gorsel } from './Gorseller'

const STAFF_WIDTH = 320
const VARSAYILAN_BPM = 60
/** Ders portelerindeki örnekler 4/4'tür: bir dörtlük içindeki sekizlikler kirişlenir. */
const DERS_VURUS = 1
/** Usul örneği ♩ = 60'ta (her zaman 1 sn) ve bir ölçü iki kez çalınır. */
const USUL_BPM = 60
const USUL_OLCU = 2

function sesliMi(olaylar: MusicEvent[]): boolean {
  return olaylar.some((e) => e.kind === 'note')
}

/**
 * Tek ders sayfası: kısa anlatım, görseller, "▶ Dinle" örnekleri, "Kendin dene" kutusu ve en sonda
 * "Anladım, alıştırmaya geç". Hem ders kapısında hem `/ders/:id` rotasında aynı görünür.
 * `geri` yalnız rota kipinde verilir (kapıda ders, alıştırmanın önünde durur).
 */
export function DersView(props: { ders: Ders; onDone: () => void; geri?: { href: string; label: string } }) {
  const { ders, onDone, geri } = props
  const [settings, setSettings] = useState<Settings | null>(null)
  const [uyari, setUyari] = useState<{ blok: number; mesaj: string } | null>(null)

  useEffect(() => {
    let alive = true
    getSettings()
      .catch(() => DEFAULT_SETTINGS) // ayarlar okunamazsa varsayılanlarla çalınır; Dinle sessizce kilitli kalmaz
      .then((cfg) => {
        if (alive) setSettings(cfg)
      })
    return () => {
      alive = false
    }
  }, [])

  // Sayfadan çıkınca çalan ses susar; bekleyen unlockAudio çıkıştan sonra çalmasın. Preact edilgen (useEffect)
  // temizliklerini çizimden sonraya erteler; bu yüzden geçersiz kılma eşzamanlı çalışan useLayoutEffect'tedir.
  const runRef = useRef(0)
  useLayoutEffect(
    () => () => {
      runRef.current++
      stopAudio()
    },
    [],
  )

  /**
   * Ortak Dinle akışı: ayarlar yüklenmeden çalmaz; ses kapalıysa SOUND_OFF; `unlockAudio` dokunuşta ilk await'tir (iOS);
   * sayfadan çıkıldıysa ya da yeni bir Dinle başladıysa eski çağrı çalmaz; hata SOUND_WARNING olur.
   */
  async function calGuvenli(blok: number, cal: (s: Settings) => Promise<void>) {
    if (!settings) return
    setUyari(null)
    if (!settings.soundOn) {
      setUyari({ blok, mesaj: SOUND_OFF })
      return
    }
    const run = ++runRef.current
    try {
      await unlockAudio()
      if (run !== runRef.current) return
      await cal(settings)
    } catch {
      if (run === runRef.current) setUyari({ blok, mesaj: SOUND_WARNING })
    }
  }

  const dinle = (blok: number, olaylar: MusicEvent[], bpm: number) =>
    calGuvenli(blok, (s) => playWritten(olaylar, s.tuning, bpm))

  const dinleUsul = (blok: number, u: Usul) =>
    calGuvenli(blok, () => {
      const { code, durationMs } = buildUsulOnceCode(u, USUL_BPM, getUsulSesi(), USUL_OLCU)
      return playCode(code, durationMs)
    })

  async function bitir() {
    try {
      await isaretEkle('okunanDersler', ders.id)
    } catch {
      // Kayıt yazılamasa da kullanıcı alıştırmaya geçebilmeli.
    }
    onDone()
  }

  function dinleDugmesi(blok: number, cal: () => Promise<void>) {
    return (
      <>
        <div class="tools">
          <button type="button" class="tool" disabled={!settings} onClick={() => void cal()}>
            ▶ Dinle
          </button>
        </div>
        {uyari?.blok === blok && (
          <p class="notice" role="status">
            {uyari.mesaj}
          </p>
        )}
      </>
    )
  }

  function blokCiz(b: DersBlok, i: number) {
    switch (b.tur) {
      case 'metin':
        return <p key={i}>{b.metin}</p>
      case 'liste':
        return (
          <ul key={i} class="ders-liste">
            {b.maddeler.map((m, j) => (
              <li key={j}>{m}</li>
            ))}
          </ul>
        )
      case 'porte': {
        // Röprizli bölüm iki kez çalınır.
        const calinan = b.ropriz ? [...b.olaylar, ...b.olaylar] : b.olaylar
        return (
          <figure key={i} class="ders-figur">
            <div class="staff-wrap">
              <Staff
                events={b.olaylar}
                width={STAFF_WIDTH}
                beamBeats={DERS_VURUS}
                barlinesAfter={b.olcuCizgileri}
                ropriz={b.ropriz ? { bas: true, son: true } : undefined}
              />
            </div>
            {b.aciklama && <figcaption class="muted">{b.aciklama}</figcaption>}
            {sesliMi(b.olaylar) && dinleDugmesi(i, () => dinle(i, calinan, b.bpm ?? VARSAYILAN_BPM))}
          </figure>
        )
      }
      case 'parmak': {
        const perde = NEY_PERDELER.find((p) => p.id === b.perdeId)
        const fingering = perde ? visibleFingering(perde) : null
        return (
          <figure key={i} class="ders-figur">
            {fingering && (
              <div class="ders-parmak">
                <FingeringDiagram fingering={fingering} />
              </div>
            )}
            {b.aciklama && <figcaption class="muted">{b.aciklama}</figcaption>}
            {perde && dinleDugmesi(i, () => dinle(i, [{ kind: 'note', pitch: perde.written, dur: 'half' }], VARSAYILAN_BPM))}
          </figure>
        )
      }
      case 'gorsel':
        return (
          <figure key={i} class="ders-figur">
            <Gorsel ad={b.ad} />
            {b.aciklama && <figcaption class="muted">{b.aciklama}</figcaption>}
          </figure>
        )
      case 'usul': {
        const u = USULLER.find((x) => x.id === b.usulId)
        return (
          <figure key={i} class="ders-figur">
            {u && <VurusDiagram usul={u} />}
            {b.aciklama && <figcaption class="muted">{b.aciklama}</figcaption>}
            {u?.vurus && dinleDugmesi(i, () => dinleUsul(i, u))}
          </figure>
        )
      }
      case 'dene':
        return (
          <section key={i} class="ders-dene" aria-labelledby={`dene-${i}`}>
            <h2 id={`dene-${i}`}>Kendin dene</h2>
            <ol>
              {b.adimlar.map((a, j) => (
                <li key={j}>{a}</li>
              ))}
            </ol>
          </section>
        )
    }
  }

  return (
    <main class="screen ders">
      <h1>📖 {ders.baslik}</h1>
      {ders.bloklar.map(blokCiz)}
      {ders.kaynaklar.length > 0 && <p class="ders-kaynak">{`Kaynak: ${ders.kaynaklar.join(' · ')}`}</p>}
      <button type="button" class="primary" onClick={() => void bitir()}>
        Anladım, alıştırmaya geç
      </button>
      {geri && (
        <div class="links">
          <a class="back" href={geri.href}>
            {geri.label}
          </a>
        </div>
      )}
    </main>
  )
}
