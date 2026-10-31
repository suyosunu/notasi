import { useMemo, useState } from 'preact/hooks'
import { MAKAMLAR } from '../content/makamlar'
import { PARCALAR } from '../content/parcalar'
import type { Parca } from '../content/parcalar'
import { USULLER } from '../content/usuller'
import { parcaSeviyesi } from '../learning/parca-seviye'

export const makamAdi = (p: Parca): string => MAKAMLAR.find((m) => m.id === p.makam)?.name ?? p.makam
export const usulAdi = (p: Parca): string => USULLER.find((u) => u.id === p.usul)?.name ?? p.usul

const FILTRE_ANAHTAR = 'notasi.parcaFiltre'
/** Seçili değer: '' = Tümü; seviyede '1'–'4' ya da '?' (seviyesi hesaplanamayan parçalar). */
interface Filtre {
  seviye: string
  makam: string
  usul: string
}
const BOS_FILTRE: Filtre = { seviye: '', makam: '', usul: '' }

function filtreOku(): Filtre {
  try {
    const ham = JSON.parse(localStorage.getItem(FILTRE_ANAHTAR) ?? 'null') as Partial<Filtre> | null
    const dizgi = (v: unknown): string => (typeof v === 'string' ? v : '')
    return { seviye: dizgi(ham?.seviye), makam: dizgi(ham?.makam), usul: dizgi(ham?.usul) }
  } catch {
    return BOS_FILTRE
  }
}

function filtreYaz(f: Filtre): void {
  try {
    localStorage.setItem(FILTRE_ANAHTAR, JSON.stringify(f))
  } catch {
    // Kayıt yazılamazsa seçim yalnız bu açılışta geçerli kalır.
  }
}

const seviyeDizgisi = (s: number | null): string => (s === null ? '?' : String(s))

interface Secenek {
  deger: string
  ad: string
}

/** Listede bulunan değerler (ad sırasıyla); kayıtlı seçim artık yoksa Tümü sayılır. */
const bulunanlar = (parcalar: Parca[], deger: (p: Parca) => string, ad: (p: Parca) => string): Secenek[] =>
  [...new Map(parcalar.map((p) => [deger(p), ad(p)])).entries()]
    .map(([d, a]) => ({ deger: d, ad: a }))
    .sort((a, b) => a.ad.localeCompare(b.ad, 'tr'))

/** Parçalar bölümü: seviye, makam, usul filtreleriyle parça listesi (ad, makam, usul, besteci, seviye). */
export function ParcalarSection() {
  // Seviye notadan hesaplanır; liste seviyeye, aynı seviyede mevcut sıraya göre dizilir (seviyesizler sonda).
  const satirlar = useMemo(
    () =>
      PARCALAR.map((p, sira) => ({ p, seviye: parcaSeviyesi(p.olcu), sira })).sort(
        (a, b) => (a.seviye ?? Infinity) - (b.seviye ?? Infinity) || a.sira - b.sira,
      ),
    [],
  )
  const [kayitli, setKayitli] = useState(filtreOku)

  const seviyeler: Secenek[] = [1, 2, 3, 4].map((n) => ({ deger: String(n), ad: String(n) }))
  if (satirlar.some((s) => s.seviye === null)) seviyeler.push({ deger: '?', ad: '?' })
  const makamlar = bulunanlar(PARCALAR, (p) => p.makam, makamAdi)
  const usuller = bulunanlar(PARCALAR, (p) => p.usul, usulAdi)
  const gecerli = (deger: string, secenekler: Secenek[]): string => (secenekler.some((s) => s.deger === deger) ? deger : '')
  const filtre: Filtre = {
    seviye: gecerli(kayitli.seviye, seviyeler),
    makam: gecerli(kayitli.makam, makamlar),
    usul: gecerli(kayitli.usul, usuller),
  }
  const degistir = (alan: keyof Filtre, deger: string) => {
    const yeni = { ...filtre, [alan]: deger }
    setKayitli(yeni)
    filtreYaz(yeni)
  }

  const gorunen = satirlar.filter(
    ({ p, seviye }) =>
      (filtre.seviye === '' || seviyeDizgisi(seviye) === filtre.seviye) &&
      (filtre.makam === '' || p.makam === filtre.makam) &&
      (filtre.usul === '' || p.usul === filtre.usul),
  )

  const secim = (alan: keyof Filtre, ad: string, secenekler: Secenek[]) => (
    <label class="parca-filtre-alan">
      <span class="setting-label">{ad}</span>
      <select class="select" value={filtre[alan]} onChange={(e) => degistir(alan, e.currentTarget.value)}>
        <option value="">Tümü</option>
        {secenekler.map((s) => (
          <option key={s.deger} value={s.deger}>
            {s.ad}
          </option>
        ))}
      </select>
    </label>
  )

  return (
    <main class="screen">
      <h1>🎧 Parçalar</h1>
      <p class="muted">Bir parçaya dokunarak notasına bak, usulüyle birlikte dinle.</p>
      <div class="parca-filtre">
        {secim('seviye', 'Seviye', seviyeler)}
        {secim('makam', 'Makam', makamlar)}
        {secim('usul', 'Usul', usuller)}
      </div>
      {gorunen.length === 0 ? (
        <p class="muted">Bu seçime uyan parça yok.</p>
      ) : (
        <ul class="topic-list">
          {gorunen.map(({ p, seviye }) => (
            <li key={p.id}>
              <a class="topic" href={`#/parcalar/${p.id}`}>
                <span class="topic-title">{p.title}</span>
                <small class="muted">{`${makamAdi(p)} · ${usulAdi(p)} · ${p.composer}`}</small>
                <small class="seviye-etiket">{`Seviye ${seviyeDizgisi(seviye)}`}</small>
              </a>
            </li>
          ))}
        </ul>
      )}
      <div class="links">
        <a class="back" href="#/">
          Ana ekrana dön
        </a>
      </div>
    </main>
  )
}
