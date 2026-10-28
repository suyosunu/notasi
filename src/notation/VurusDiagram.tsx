import type { Usul } from '../content/usuller'

const DOLAP_NOTE = 'Bu usulün vuruş kalıbı kaynaklarda bulunamadı; yalnızca zaman sayılır (12/8).'

/**
 * Düm ayrı, tek/te/ke ayrı renkte; genişlik süreyle orantılıdır. `active` sırasındaki vuruş `data-active` ile
 * vurgulanır (usul bölümünde çalan vuruş; vurma ekranında sıradaki vuruş). Usulün vuruş kalıbı yoksa (Dolap)
 * kutu yerine açıklama gösterilir.
 */
export function VurusDiagram({ usul, active }: { usul: Usul; active?: number | null }) {
  if (usul.vurus === null) return <p class="notice">{DOLAP_NOTE}</p>
  return (
    <div class="vurus-row" role="img" aria-label={usul.vurus.map((x) => x.ses).join(' ')}>
      {usul.vurus.map((x, i) => (
        <span
          key={i}
          data-testid="vurus"
          data-active={i === active ? 'true' : undefined}
          class={x.ses === 'düm' ? 'vurus vurus-dum' : 'vurus vurus-tek'}
          style={{ width: `${(x.sure / usul.zaman) * 100}%` }}
        >
          {x.ses}
        </span>
      ))}
    </div>
  )
}
