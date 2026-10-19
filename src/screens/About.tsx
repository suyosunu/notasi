import { SOURCE_URL } from '../config'

export function About() {
  return (
    <main class="screen">
      <a class="back-top" href="#/ayarlar">
        ← Ayarlar
      </a>
      <h1>Hakkında</h1>
      <p>Notası, ney ve nota öğrenmek için kişisel bir uygulamadır.</p>
      <p>
        Parça notaları: <a href="https://github.com/MTG/SymbTr">SymbTr</a> (Karaosmanoğlu 2012),{' '}
        <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a>. Notalar uygulamanın biçimine
        dönüştürülmüştür.
      </p>
      <p>Ses motoru: Strudel (strudel.cc), © Strudel katkıcıları, AGPL-3.0-or-later lisansıyla.</p>
      <p>
        Bu uygulamanın kaynak kodu AGPL-3.0-or-later lisansıyla açıktır:{' '}
        {SOURCE_URL === '' ? '(yakında)' : <a href={SOURCE_URL}>{SOURCE_URL}</a>}
      </p>
    </main>
  )
}
