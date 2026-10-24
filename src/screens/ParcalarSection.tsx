import { MAKAMLAR } from '../content/makamlar'
import { PARCALAR } from '../content/parcalar'
import type { Parca } from '../content/parcalar'
import { ONERILEN_SEVIYE } from '../content/seviyeler'
import { USULLER } from '../content/usuller'

export const makamAdi = (p: Parca): string => MAKAMLAR.find((m) => m.id === p.makam)?.name ?? p.makam
export const usulAdi = (p: Parca): string => USULLER.find((u) => u.id === p.usul)?.name ?? p.usul

/** Parçalar bölümü: parça listesi (ad, makam, usul, besteci). */
export function ParcalarSection() {
  return (
    <main class="screen">
      <h1>🎧 Parçalar</h1>
      <p class="muted">Bir parçaya dokunarak notasına bak, usulüyle birlikte dinle.</p>
      <ul class="topic-list">
        {PARCALAR.map((p) => (
          <li key={p.id}>
            <a class="topic" href={`#/parcalar/${p.id}`}>
              <span class="topic-title">{p.title}</span>
              <small class="muted">{`${makamAdi(p)} · ${usulAdi(p)} · ${p.composer}`}</small>
              {ONERILEN_SEVIYE.parca[p.id] !== undefined && (
                <small class="seviye-etiket">{`Seviye ${ONERILEN_SEVIYE.parca[p.id]}`}</small>
              )}
            </a>
          </li>
        ))}
      </ul>
      <div class="links">
        <a class="back" href="#/">
          Ana ekrana dön
        </a>
      </div>
    </main>
  )
}
