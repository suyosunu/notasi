# Adım 2 — Satır Satır Çalışma Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Etüt ve parça ekranlarında bölüm seçip (satıra dokunarak) o bölümü çalmak, döngüde tekrarlamak, her turda hızlanmak, çalan notayı ses saatine bağlı vurgulamak; parçaya "Usulle çal" (yalnız eşlik) eklemek. İki ekranın çalma kodu tek bileşende birleşir.

**Architecture:** Yeni `src/audio/calisma.ts` tek kod üreticisi (`buildCalismaCode`) `etut.ts` ve `piece.ts`'in yerini alır: her çalım bir ölçü giriş sayımı + seçili ölçüler, isteğe bağlı usul/metronom eşliği ve bir "ses saati işareti" katmanı. İşaret, sessiz bir Strudel sesidir (`src/audio/sesSaati.ts`); tetiklendiğinde desenin başladığı ses-saati anını kaydeder, vurgu `AudioContext.currentTime`'dan hesaplanır. `ScoreView` satır seçimi ve vurgu alır. Yeni `CalismaPaneli` bileşeni (ayarlar, nota, hız, eşlik, tekrar, hızlan, dinle/eşlikle çal/durdur, vurgu) hem `EtutCalisma` hem `ParcaDetail` tarafından kullanılır. Döngü JS'te sıralı `playCode` çağrılarıdır (her tur bir giriş sayımıyla başlar).

**Tech Stack:** Preact + TypeScript (erasableSyntaxOnly: enum ve parametre özelliği yok), Vite, Vitest (jsdom), Strudel (`@strudel/web`, superdough `registerSound`).

**Spec:** `docs/superpowers/specs/2026-10-30-notasi-yol-haritasi.md` §3 Adım 2 (onaylı). Kullanıcı sözü: "araçlarla başla, tek tek kontrollerle ilerle, eksikleri tamamla". Ayrıntı kararları bu plandadır (kullanıcı özerk karar verilmesini istedi).

## Global Constraints

- Arayüz metni Türkçe ve sade; mevcut ekranların üslubu (emoji + kısa etiket).
- Yeni bağımlılık yok.
- Yorumlar mevcut kod gibi Türkçe JSDoc; yoğunluğu çevredeki kodla aynı.
- iOS: `unlockAudio()` dokunuş işleyicisinde, ilk `await`'ten ÖNCE eşzamanlı çağrılır (mevcut `calis`/`listen` deseni).
- 375 px genişlikte yatay kaydırma yok.
- Döngü adımı: `HIZ_ADIMI = 5` (♩). Hızlanma ekranın üst sınırında durur (etüt 90, parça 100).
- Giriş sayımı: her turun başında bir ölçü (seçim kısa bir ilk ölçüyle başlıyorsa `2·ölçü − lead`: tıklar ölçü ızgarasında kalır; son düzeltme turu). Ölçü uzunluğu (dörtlük cinsinden) usul varsa `zaman × 4 / mertebe`, yoksa 4.
- Usul katmanının tempo birimi: `buildUsulBody(usul, bpm × mertebe / 4, usulSesi)` (parçadaki mevcut kural; mertebe 4'te bpm).
- `npm run build` (tsc --noEmit + vite build) ve `npx vitest run` temiz kalır.

## Review Focus

1. Tur sırasında Durdur'a basılır ya da sayfadan çıkılır → sonraki tur başlamaz, ses susar, vurgu kalkar.
2. Parçada seçim 0. ölçüden (anacrusis, kısa ilk ölçü) başlar → usul katmanı ilk TAM ölçüde başlar; seçim 1. ölçüden başlarsa kayma yok.
3. Çalarken seçim, hız ya da eşlik değişir → çalım durur (mevcut kaydırıcı davranışı gibi).
4. İşaret hiç tetiklenmez (ses kapalı, Strudel hatası, test ortamı) → vurgu yok, hata yok.
5. Kesirli ölçü (Aksak 9/8 = 4,5 dörtlük) → giriş sayımı 9 sekizlik tık, toplam süre doğru.

---

### Task 1: Ortak çalışma kodu (`calisma.ts`)

**Files:**
- Create: `src/audio/calisma.ts`, `src/audio/calisma.test.ts`
- Delete: `src/audio/etut.ts`, `src/audio/etut.test.ts`, `src/audio/piece.ts`, `src/audio/piece.test.ts` (testleri önce taşınır)
- Modify: `src/screens/EtutDetail.tsx`, `src/screens/ParcaDetail.tsx` yalnızca içe aktarmalar ve çağrılar yeni işleve geçecek kadar (davranış Task 4'te değişir); `src/audio/player.ts` yorumu (`buildPieceCode` → `buildCalismaCode`).

**Interfaces:**
- Produces:
  ```ts
  export type Eslik = 'usul' | 'metronom' | 'yok'
  export interface CalismaSecenek {
    /** false: yalnız eşlik ("Usulle/Metronomla çal": kullanıcı neyle çalar). */
    melodi: boolean
    /** 'yok': yalnız giriş sayımı tıklar. 'usul' usulsüz çağrıda 'metronom' gibi davranır. */
    eslik: Eslik
    voice: NeySesi
    usul?: Usul
    /** Verilmezse Ayarlar'daki seçim (getUsulSesi()). */
    usulSesi?: UsulSesi
    /** Varsayılan true: başa ses saati işareti katmanı (`s("notasi_isaret")`). */
    isaret?: boolean
  }
  export interface CalismaKodu { code: string; durationMs: number; /** giriş sayımı (dörtlük) */ girisVurus: number; /** seçili ölçülerin toplamı (dörtlük) */ toplamVurus: number }
  export function measureBeats(u: Usul): number          // piece.ts'ten taşınır, aynı tanım
  export function olcuVurusu(usul?: Usul): number          // usul ? measureBeats(usul) : 4
  export function buildCalismaCode(olcu: MusicEvent[][], tuning: Tuning, bpm: number, s: CalismaSecenek): CalismaKodu
  /** Seçimin başından `vurus` dörtlük sonra çalan olay; aralık dışında null. Sus da olaydır. */
  export function konumBul(olcu: MusicEvent[][], bas: number, vurus: number): { olcu: number; nota: number } | null
  ```
- `ISARET_SESI = 'notasi_isaret'` sabiti Task 2'de `sesSaati.ts`'te tanımlanır; bu görevde `calisma.ts` içinde `const ISARET_KATMANI = 's("notasi_isaret")'` yazılır, Task 2 bunu `ISARET_SESI`'den türetecek biçimde değiştirir.

Kod kuralları (`buildCalismaCode`):
- `tones = toToneEvents(olcu.flat(), tuning)`, `total` = tonların vuruş toplamı. `total > 0` ve `bpm > 0` değilse `RangeError`. `melodi: false` ve `eslik: 'yok'` → `RangeError`.
- `olcuV = olcuVurusu(usul)`, `giris = olcuV`, `cycle = giris + total`, tempo `${ONE_SHOT}.cpm(${bpm / cycle})`, `durationMs = cycle × 60000 / bpm`.
- Tık: usul varsa `metronomeBody(usul.zaman, bpm × usul.mertebe / 4)`, yoksa `metronomeBody(4, bpm)`. Sayım: `${click}.compress(0, ${giris} / ${cycle})`.
- Melodi: `freq("~@${giris} ${toneSteps(tones)}")${melodyChain(voice, tones, { lead: giris, bpm })}`.
- `eslik: 'metronom'` ya da usulsüz `'usul'`: `${click}.fast(${cycle / olcuV})` (sayım ayrıca eklenmez).
- `eslik: 'usul'` (usul var): sayım + `${buildUsulBody(usul, bpm × usul.mertebe / 4, usulSesi)}.fast(${repeats}).compress(${giris + lead} / ${cycle}, 1)`; `lead` = ilk seçili ölçünün vuruşu `olcuV`'den kısaysa o vuruş, değilse 0; `repeats = (total − lead) / olcuV`; `repeats ≤ 0` ise usul katmanı eklenmez.
- `eslik: 'yok'`: yalnız sayım.
- İşaret (varsayılan açık): katmanlara `s("notasi_isaret")` eklenir.
- Birden çok katman `stack(...)` içinde; tek katmanda doğrudan.

- [ ] **Step 1:** `etut.test.ts` ve `piece.test.ts`'i oku; hâlâ geçerli her iddiayı `calisma.test.ts`'e taşı (etüt: giriş sayımı, metronom kapalı → yalnız sayım, usullü etüt; parça: anacrusis `compress`, mertebe 8 tempo ölçeği, Dolap metronomu, gerçek Strudel çekirdeğinde zamanlama testleri). Parça artık giriş sayımıyla çalar: beklenen değerleri buna göre güncelle.
- [ ] **Step 2:** Yeni testler ekle:
  - `buildCalismaCode(etutOlcu, t, 60, { melodi: true, eslik: 'usul', voice: 'shakuhachi', usul: sofyan, isaret: false })` kodunda `.compress(4 / ${4 + total}, 1)` var; `girisVurus` 4.
  - Aksak (zaman 9, mertebe 8): `girisVurus` 4.5, sayım `metronomeBody(9, bpm × 2)` ile; `durationMs = (4.5 + total) × 60000 / bpm`.
  - Varsayılan `isaret` açıkken kod `s("notasi_isaret")` içerir; `isaret: false` iken içermez.
  - `melodi: false, eslik: 'yok'` → `RangeError`.
  - Gerçek Strudel çekirdeğinde (mevcut usul/piece testlerindeki `evalScope`/`evaluate` deseni): Yürük Semâî (6/8) parçası 0. ölçüden anacrusis'le seçilince ilk usul hap'i `giris + lead` vuruşunda.
  - `konumBul`: `[[q, q], [h]]` için `konumBul(olcu, 0, 0) → {olcu:0,nota:0}`, `(…, 0, 1.5) → {olcu:0,nota:1}`, `(…, 0, 2) → {olcu:1,nota:0}`, `(…, 0, 4) → null`, `(…, 0, -0.1) → null`; `bas = 1` iken `(…, 1, 0) → {olcu:1,nota:0}`.
- [ ] **Step 3:** Testleri çalıştır, yeni olanların başarısız olduğunu gör.
- [ ] **Step 4:** `calisma.ts`'i yaz; `EtutDetail.tsx` (`buildCalismaCode(etut.olcu, …, { melodi, eslik: melodi ? (metronom ? 'usul' : 'yok') : 'usul', voice, usul, isaret: false })` — usulsüz etütte 'usul' metronoma düşer) ve `ParcaDetail.tsx` (`{ melodi: true, eslik: withUsul ? 'usul' : 'yok', voice, usul, isaret: false }`) çağrılarını geçir; eski dört dosyayı sil.
- [ ] **Step 5:** `npx vitest run src/audio src/screens/EtutDetail.test.tsx src/screens/ParcaDetail.test.tsx` geçer (parça testlerinde beklenen süre/kod giriş sayımı nedeniyle değiştiyse güncelle); `npx tsc --noEmit` temiz.
- [ ] **Step 6:** Commit: `refactor(ses): etüt ve parça çalımı tek kod üreticisinde (calisma.ts)`

### Task 2: Ses saati işareti (`sesSaati.ts`) ve player

**Files:**
- Create: `src/audio/sesSaati.ts`, `src/audio/sesSaati.test.ts`
- Modify: `src/audio/player.ts`, `src/audio/player.test.ts`, `src/audio/soyle.ts` (sessiz düğümü ortak yardımcıdan alır), `src/audio/calisma.ts` (`ISARET_SESI` kullanır)

**Interfaces:**
- Consumes: `SampleHost` (`usulSamples.ts`).
- Produces:
  ```ts
  export const ISARET_SESI = 'notasi_isaret'
  /** Sessiz kısa ses düğümü (superdough zinciri bir kaynak bekler); insan sesi heceleri ve işaret kullanır. */
  export function sessizSes(host: SampleHost, time: number, onended: () => void): { node: AudioNode; stop: () => void; nodes: { source: AudioScheduledSourceNode[] } }
  export function kaydetIsaret(host: SampleHost): void    // tetiklenince sonIsaret = time
  export function sonIsaret(): number | null               // ses saati (sn); hiç tetiklenmediyse null
  export function isaretiSifirla(): void
  // player.ts:
  /** Ses saati (sn), çıkış gecikmesi düşülmüş: ctx.currentTime − (ctx.outputLatency || 0). Strudel yüklenmediyse null. */
  export function sesSaatiSimdi(): number | null
  ```
- `sessizSes`'in gövdesi `soyle.ts`'teki mevcut ConstantSource düğümüdür (offset 0, `start(time)`, `stop(time + 0.01)`, `onceEnded` → `releaseAudioNode` + `onended`); `soyle.ts` onu çağıracak biçimde sadeleşir, davranışı değişmez.
- player: `ensureSounds` kod `s("${ISARET_SESI}")` içeriyorsa `kaydetIsaret(m)`; `stopAudio` `isaretiSifirla()` çağırır.

- [ ] **Step 1:** Testler: `kaydetIsaret` sahte host'ta `notasi_isaret` adını kaydeder; tetik `(12.5, …)` → `sonIsaret() === 12.5`; `isaretiSifirla()` → `null`; player testinde işaretli kod çalınınca işaret kaydedilir (insan sesi testindeki desen) ve `stopAudio()` sonrası `sonIsaret()` null; `sesSaatiSimdi()` Strudel yüklenmeden null. `soyle.test.ts` değişmeden geçer.
- [ ] **Step 2:** Başarısız olduğunu gör, uygula, geçtiğini gör; `npx tsc --noEmit` temiz.
- [ ] **Step 3:** Commit: `feat(ses): ses saati işareti`

### Task 3: ScoreView'da satır seçimi ve vurgu

**Files:**
- Create: `src/notation/secim.ts`, `src/notation/secim.test.ts`
- Modify: `src/notation/ScoreView.tsx`, `src/notation/ScoreView.test.tsx`, `src/styles.css`

**Interfaces:**
- Produces:
  ```ts
  // secim.ts
  export interface Secim { bas: number; son: number }   // ölçü indisleri, ikisi de dahil, bas ≤ son
  /**
   * Satıra dokunuş: seçim yoksa satır seçilir; tek satırlık seçim varken başka satıra dokunulursa ikisini kapsayan
   * aralık; aynı tek satıra dokunulursa seçim kalkar (null = tümü); aralık varken dokunulan satır tek başına seçilir.
   */
  export function secimGuncelle(secim: Secim | null, satir: Secim): Secim | null
  // ScoreView.tsx
  export interface ScoreRow { events; barlinesAfter; syllables?; baseWidth; olcuBas: number; olcuSon: number }
  ScoreView props += {
    secim?: Secim | null
    /** Verilirse satırlar dokunulabilir olur (role="button"). */
    onSatirDokun?: (satir: Secim) => void
    vurgu?: { olcu: number; nota: number } | null
  }
  ```
- `secimGuncelle` kuralları (doc yorumundaki sözel kuralın kesin hali): önceki seçim null → `satir`; önceki seçim `satir`'a eşit → null; `satir` önceki seçimin dışında → ikisini kapsayan aralık `{ min(bas), max(son) }`; `satir` önceki seçimin içinde ve seçim ondan geniş → `satir`.
- Satır dokunulabilirken: `role="button"`, `tabIndex={0}`, `aria-pressed` (satır seçimin içindeyse), `aria-label` "3–4. ölçüleri seç" (tek ölçüde "3. ölçüyü seç"), tıklama ve Enter/Boşluk `onSatirDokun({ bas: olcuBas, son: olcuSon })`. Seçimin içindeki satır `class="score-row secili"`.
- `vurgu`: o olayın satırı bulunur, satırdaki sırası `Staff`'ın mevcut `highlightIndex`'ine verilir.
- CSS: `.score-row[role='button'] { cursor: pointer; border-radius: 6px }`, `.score-row.secili { background: color-mix(in srgb, var(--accent) 14%, transparent) }`; odak halkası görünür.

- [ ] **Step 1:** Testler: `secimGuncelle` dört kural (null→satır; eşit→null; dışarıda→kapsayan aralık [ör. {0,1} + {4,5} → {0,5}, {4,5} + {0,1} → {0,5}]; geniş seçimin içindeki satır→o satır). ScoreView: `onSatirDokun` yokken `role="button"` yok (mevcut testler aynen geçer); varken 3 satırlık bir etütte 2. satıra tıklama `{bas:2,son:3}` (olcuPerSatir 2) gönderir, `aria-pressed` ve `secili` sınıfı seçime göre; `vurgu={{olcu:2,nota:1}}` 2. satırın Staff'ında `data-highlight` olan tek olayı üretir; `scoreLayout` satırları doğru `olcuBas/olcuSon` taşır (tek tek bölünen gruplar dahil).
- [ ] **Step 2:** Başarısız olduğunu gör, uygula, geçtiğini gör.
- [ ] **Step 3:** Commit: `feat(nota): satır seçimi ve çalan nota vurgusu`

### Task 4: `CalismaPaneli` — bölüm, döngü, hızlanma, vurgu; etüt ve parça ekranları

**Files:**
- Create: `src/screens/CalismaPaneli.tsx`, `src/screens/CalismaPaneli.test.tsx`
- Modify: `src/screens/EtutDetail.tsx` (`EtutCalisma` paneli kullanır; dışa açık imzası aynı), `src/screens/ParcaDetail.tsx`, ilgili testler (`EtutDetail.test.tsx`, `ParcaDetail.test.tsx`, `EveningPractice.test.tsx` yalnız etiket/akış değiştiyse), `src/styles.css` (gerekirse)

**Interfaces:**
- Consumes: Task 1 `buildCalismaCode`, `konumBul`, `olcuVurusu`; Task 2 `sonIsaret`, `sesSaatiSimdi` (player'dan), `playCode`, `stopAudio`, `unlockAudio`, `getNeySesi`; Task 3 `ScoreView` (`secim`, `onSatirDokun`, `vurgu`), `secimGuncelle`.
- Produces:
  ```ts
  export function CalismaPaneli(props: {
    olcu: MusicEvent[][]
    soz?: string[][]
    usul?: Usul
    varsayilanBpm: number
    bpmMin: number
    bpmMax: number
    olcuPerSatir?: number
    beamBeats?: number
  }): JSX.Element
  ```
  `EtutCalisma` = başlık + `CalismaPaneli` (bpm 40–90, `etut.bpm`, mevcut `olcuPerSatir` kuralı, kiriş 1) + "Çaldım" bölümü. `ParcaDetail` = başlık bilgileri + `CalismaPaneli` (`soz`, usul, bpm 40–100, varsayılan 60, `beamBeatsFor(usul)`) + kaynak satırı.

Panel davranışı:
- Ayarlar `getSettings()` ile (okunamazsa `DEFAULT_SETTINGS`); `soundOn` kapalıysa `SOUND_OFF`, hata olursa `SOUND_WARNING` (mevcut metinler).
- Nota: `ScoreView` + `secim`, `onSatirDokun` (→ `secimGuncelle`; çalıyorsa durdur), `vurgu`. Notanın altında ipucu: "Bir satıra dokun: yalnız o bölüm çalar. Başka bir satıra da dokunursan aradaki bölüm seçilir." Seçim varken: "Bölüm: 3–4. ölçüler" (tek ölçüde "3. ölçü") ve "Tümü" düğmesi (seçimi kaldırır; çalıyorsa durdurur).
- Hız kaydırıcısı (mevcut davranış: bırakınca çalıyorsa durur).
- Eşlik anahtarı: etiket `usul ? \` 🥁 Usul eşliği (${usul.name})\` : ' 🥁 Metronom'`; usulün vuruş kalıbı yoksa (`usul.vurus === null`) mevcut not: "Bu usulün vuruş kalıbı bilinmediği için eşlik metronomla yapılır." Değişince çalıyorsa durur.
- "🔁 Tekrarla" anahtarı; açıkken altında "⏫ Her turda hızlan (♩ +5)" anahtarı. İkisi çalarken değiştirilebilir ve **durdurmaz**: tur sonunda okunur (ref).
- Düğmeler: çalmıyorken "▶ Dinle" (melodi + eşlik anahtarına göre `'usul'|'yok'`) ve `usul ? '🥁 Usulle çal' : '🎵 Metronomla çal'` (melodi yok, eşlik `'usul'`); çalarken "⏹ Durdur". Tekrar açıkken çalarken: "Tur 2 · ♩ = 65" (`role="status"`).
- Döngü: dokunuşta `unlockAudio()` eşzamanlı (ilk await'ten önce); her tur `buildCalismaCode(seçili olcu dilimi, tuning, tempo, …)` + `await playCode(code, durationMs)`; tur bittiğinde güncel değilse (durduruldu/çıkıldı/yeni çalım) çık; tekrar kapalıysa çık; hızlan açıksa `tempo = min(bpmMax, tempo + HIZ_ADIMI)` ve `setBpm(tempo)` (kaydırıcı ulaşılan hızı gösterir).
- Vurgu: çalarken `requestAnimationFrame` döngüsü (yoksa 50 ms `setTimeout`); `t0 = sonIsaret()`, `simdi = sesSaatiSimdi()`; ikisi de varsa `vurus = (simdi − t0) × tempo / 60 − girisVurus`; `konumBul(olcu, secim?.bas ?? 0, vurus)` (dönen `olcu` tüm parçadaki indistir) değiştiyse `setVurgu`. Çalma bitince/durunca vurgu `null`, döngü durur. Tur değişiminde yeni turun `girisVurus` ve tempo'su kullanılır (`isaretiSifirla` stopAudio'da olduğu için eski işaret kullanılmaz).
- Çıkışta (useLayoutEffect temizliği): `runRef` artar, `stopAudio()`, `releaseWakeLock()`, vurgu döngüsü iptal.
- Wake lock: çalım başında al, döngü bitince bırak (mevcut desen).

- [ ] **Step 1:** Testler (player ve sesSaati sahte; mevcut EtutDetail/ParcaDetail test desenleri):
  - Satıra dokunup Dinle → `buildCalismaCode`'a (ya da `playCode` koduna) yalnız seçili ölçüler gider (ör. seçim `{2,3}` → 2 ölçülük süre).
  - Tekrarla açık, hızlan açık, `playCode` hemen çözülen sahte: 3 tur sonra Durdur → `playCode` en az 3 kez, tempo 60, 65, 70; kaydırıcı 70'i gösterir; Durdur'dan sonra yeni çağrı yok.
  - Tekrar kapalı → tek `playCode`.
  - Çalarken satıra dokunma → `stopAudio` çağrılır, döngü biter.
  - Hızlanma `bpmMax`'ta durur.
  - `unlockAudio` tıklamayla aynı eşzamanlı akışta çağrılır (ilk `await`'ten önce).
  - Vurgu: `sonIsaret` 10, `sesSaatiSimdi` 10 + (girisVurus + 1.5)·60/tempo döndürünce ikinci olayın `data-highlight`'ı var; `sonIsaret` null iken hiçbir olay vurgulu değil.
  - Parça: "🥁 Usulle çal" düğmesi var, melodisiz kod üretir.
  - Sayfadan çıkınca `stopAudio` çağrılır ve bekleyen tur başlamaz.
- [ ] **Step 2:** Başarısız olduğunu gör; `CalismaPaneli`'ni yaz, `EtutCalisma` ve `ParcaDetail`'i ona geçir; eski testleri yeni etiketlere göre güncelle (davranış iddialarını silmeden).
- [ ] **Step 3:** `npx vitest run` tamamı ve `npm run build` temiz.
- [ ] **Step 4:** Commit: `feat(calisma): bölüm seçme, tekrar, hızlanma ve çalan nota vurgusu`
