# Notası — Nota Paketi A: Dizi okuma, Perde isimleri, Karışık antrenman

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nota bölümüne üç ek getirmek: 3–4 notalık dizileri okuma, Türk müziği perde adları ve öğrenilen her şeyi karıştıran antrenman.

**Architecture:** Mevcut ders/kart/soru çerçevesi genişletilir. Yeni kart türleri `seq:` (dizi), `perde:` (nota → perde adı) ve `perde-ters:` (perde adı → nota) olur. Yeni konular `NOTA_TOPICS` sonuna eklenir; doğrusal açılma kuralı aynen geçerlidir. Karışık antrenman, öğrenilmiş konuların kartlarından ağırlıklı seçim yapan saf bir fonksiyon ve bir serbest-tur ekranıdır.

**Tech Stack:** Mevcut (Vite, Preact, TypeScript, Vitest).

**Spec:** `docs/superpowers/specs/2026-10-13-ney-ogrenme-design.md` (§6.1 müfredat: perde isimleri 4. adım; §6.3 tekrar). Kullanıcı bu üç eki 2026-10-18'de sohbette onayladı.

## Global Constraints

- Sürüm 1 planının Global Constraints bölümü geçerlidir (`docs/superpowers/plans/2026-10-13-notasi-surum-1.md`).
- Perde adları tam olarak şöyledir: Sol4 = Rast, La4 = Dügâh, Si4 = Bûselik, Do5 = Çârgâh, Re5 = Nevâ, Mi5 = Hüseynî, Fa5 = Acem, Sol5 = Gerdâniye, La5 = Muhayyer.
- Dizi seçeneklerinde solfej adları `' – '` (boşluk, en tire, boşluk) ile birleştirilir. Örnek: `Re – Do – Si – La`.
- Oktav ayrımı gereken seçeneklerde Sol5 `tiz Sol`, La5 `tiz La` olarak yazılır. Diğer notalar düz solfej adıyla yazılır.
- Yeni konular mevcut 8 konunun **arkasına** şu sırayla eklenir: `dizi-1`, `perde-1`, `dizi-2`, `perde-2`.

## Review Focus

1. **Uzun seçenek metinleri** (dizi cevapları) telefonda taşmamalı. Düğmeler satır kaydırmalı, en az 44 px yükseklikte olmalı. Test: Task 18.
2. **Portesiz soru** (`perde-ters`): Staff çizilmez, 🔊 Dinle gizlenir. Test: Task 19.
3. **Karışık havuz boşsa** (henüz öğrenilmiş konu yok): kart devre dışıdır ve açıklama gösterilir, boş tur başlamaz. Test: Task 20.
4. **Eski oturumlar:** Kayıtlı bir gündüz oturumundaki eski türden sorular yeni kodla da çizilebilmeli. Test: Task 18.

---

### Task 18: Dizi okuma

**Files:**
- Modify: `src/content/nota-topics.ts`, `src/learning/cards.ts`, `src/learning/questions.ts`, `src/screens/DayPractice.tsx`, `src/styles.css`
- Test: `src/learning/cards.test.ts`, `src/learning/questions.test.ts`, `src/screens/DayPractice.test.tsx`

**Interfaces:**
- `Topic.kind` şu tiplerden biri olur: `'note-name' | 'duration' | 'sequence' | 'perde-name'`. Bu görev `'sequence'` tipini ekler, `'perde-name'` tipini Task 19 kullanır.
- `cardToEvents(cardId: string): MusicEvent[]` fonksiyonu tüm kart türleri için olay listesi döner. `seq:` kartında her nota dörtlüktür. Mevcut `cardToEvent` geriye dönük uyumluluk için korunur ve tek olaylı kartlarda çalışmaya devam eder.
- `Question.events`, `cardToEvents` sonucunu kullanır.

**Konular** (NOTA_TOPICS'e `nota-5`ten sonra eklenir):

| id | title | kind | cards |
|---|---|---|---|
| `dizi-1` | `Dizi okuma: adım adım` | sequence | `seq:G4-A4-B4-C5`, `seq:D5-C5-B4-A4`, `seq:E5-D5-C5-D5`, `seq:A4-B4-C5-B4`, `seq:C5-D5-E5-F5`, `seq:G5-F5-E5-D5` |
| `dizi-2` | `Dizi okuma: atlamalı` | sequence | `seq:G4-B4-D5-G5`, `seq:D5-B4-G4-B4`, `seq:C5-E5-G5-E5`, `seq:A4-C5-E5-A5`, `seq:F5-D5-B4-G4`, `seq:E5-C5-A4-C5` |

`dizi-2`, `perde-1`'den sonra gelir. Sıranın tamamı Global Constraints'te verilmiştir.

**Soru kuralları:**
- Soru metni: `'Bu dizi nasıl okunur?'`
- Cevap: notaların solfej adları, soldan sağa, `' – '` ile birleştirilmiş.
- Çeldiriciler aşağıdaki adaylardan seçilir. Hepsi cevaptan farklı ve birbirinden farklı olmalıdır. Aday yetmezse farklı iki notayı değiştirerek üretmeye devam edilir. Toplam 4 seçenek olur ve rng ile karıştırılır.
  - Tüm dizinin bir adım yukarı kaydırılmış hali.
  - Tüm dizinin bir adım aşağı kaydırılmış hali.
  - Tek bir notası (rng ile seçilir) bir adım değiştirilmiş hali.
- İpucu: `'Soldan sağa tek tek oku: önce çizgi mi aralık mı olduğuna bak.'`
- 🔊 Dinle düğmesi dizinin tamamını çalar.

**Ekran:** Seçenek düğmeleri uzun metinlerde satır kaydırmalıdır (`white-space: normal`) ve en az 44 px yükseklikte olmalıdır. Staff dört notayı yan yana çizer; bunu mevcut çizici zaten yapıyor.

- [ ] Failing testleri yaz:
  - `cardToEvents('seq:D5-C5-B4-A4')`: 4 dörtlük nota döner; perdeleri sırayla Re5, Do5, Si4, La4.
  - `cardToEvents('note:B4')`: tek olay döner.
  - Hatalı `seq:` kimlikleri (`seq:`, `seq:H4-A4`) hata fırlatır.
  - `makeQuestion('seq:D5-C5-B4-A4', rng)`: cevap `'Re – Do – Si – La'`, 4 farklı seçenek, cevap seçenekler arasında. Aynı seed aynı soruyu üretir.
  - Her `dizi-*` kartı için 20 seed'de 4 farklı seçenek çıkar.
  - `NOTA_TOPICS` sırası mevcut 8 konu, ardından `dizi-1`, `perde-1`, `dizi-2`, `perde-2` olur. `perde-*` konuları Task 19'da eklenir; bu görevde sıra testi yalnızca `dizi-*` konularını doğrular.
  - DayPractice (Review Focus 1): dizi sorusunda 4 nota başı çizilir, seçenek metni tam görünür.
  - Review Focus 4: eski `note:` soruları içeren kayıtlı bir oturum yeni kodla açılır ve çizilir.
- [ ] Çalıştır → FAIL. Uygula → PASS. `npx vitest run` ve `npm run build` (çıkış kodlarına bak).
- [ ] Commit: `feat(nota): dizi okuma konuları`

### Task 19: Perde isimleri

**Files:**
- Modify: `src/content/nota-topics.ts`, `src/learning/cards.ts`, `src/learning/questions.ts`, `src/screens/DayPractice.tsx`
- Create: `src/content/perde-adlari.ts`
- Test: `src/learning/cards.test.ts`, `src/learning/questions.test.ts`, `src/screens/DayPractice.test.tsx`, `src/content/perde-adlari.test.ts`

**Interfaces:**
- `PERDE_ADLARI: Record<string, string>` anahtar olarak `'G4'`, `'A4'` … `'A5'` alır ve Global Constraints'teki adları döner.
- `notaEtiketi(key: string): string` solfej adını döner. `G5` ve `A5` için `'tiz Sol'` ve `'tiz La'` döner.

**Kart türleri:**
- `perde:<nota>` kartında portede tek bir dörtlük nota çizilir.
  - Soru: `'Bu notanın perde adı ne?'`
  - Seçenekler: 4 farklı perde adı (cevap + 3 çeldirici).
- `perde-ters:<nota>` kartında porte çizilmez (`events: []`).
  - Soru: `'{Perde adı} hangi nota?'`. Örnek: `'Nevâ hangi nota?'`
  - Seçenekler: konudaki notaların `notaEtiketi` değerlerinden 4 farklı etiket. Yetmezse dokuz notanın tamamından tamamlanır.
- İpucu: `'Sırayla: Rast (Sol), Dügâh, Bûselik, Çârgâh, Nevâ, Hüseynî, Acem, Gerdâniye, Muhayyer (tiz La).'`

**Konular:**

| id | title | kind | cards |
|---|---|---|---|
| `perde-1` | `Perde adları: Rast'tan Nevâ'ya` | perde-name | `perde:G4`, `perde:A4`, `perde:B4`, `perde:C5`, `perde:D5`, `perde-ters:G4`, `perde-ters:A4`, `perde-ters:B4`, `perde-ters:C5`, `perde-ters:D5` |
| `perde-2` | `Perde adları: Hüseynî'den Muhayyer'e` | perde-name | `perde:E5`, `perde:F5`, `perde:G5`, `perde:A5`, `perde-ters:E5`, `perde-ters:F5`, `perde-ters:G5`, `perde-ters:A5` |

**Ekran (Review Focus 2):** `events` boşsa Staff çizilmez ve 🔊 Dinle düğmesi gizlenir.

- [ ] Failing testleri yaz:
  - `PERDE_ADLARI` dokuz değeri birebir içerir (Global Constraints).
  - `notaEtiketi('G5') === 'tiz Sol'`, `notaEtiketi('G4') === 'Sol'`.
  - `makeQuestion('perde:D5')` cevabı `'Nevâ'` olur.
  - `makeQuestion('perde-ters:D5')` soru metni `'Nevâ hangi nota?'`, cevabı `'Re'`, `events` boş olur.
  - `perde-ters:A5` cevabı `'tiz La'` olur ve seçeneklerde `'La'` ile karışmaz.
  - Her kartta 4 farklı seçenek çıkar.
  - Sıra testi (Task 18'deki) dört yeni konunun tamamını doğrular.
  - DayPractice: `perde-ters` sorusunda nota başı yoktur ve "🔊 Dinle" görünmez.
- [ ] FAIL → uygula → PASS. `npx vitest run` ve `npm run build`.
- [ ] Commit: `feat(nota): perde isimleri konuları`

### Task 20: Karışık antrenman

**Files:**
- Create: `src/learning/mixed.ts`, `src/screens/MixedPractice.tsx`
- Modify: `src/screens/NotaSection.tsx`, `src/app.tsx`, `src/styles.css`
- Test: `src/learning/mixed.test.ts`, `src/screens/MixedPractice.test.tsx`, `src/screens/NotaSection.test.tsx`, `src/app.test.tsx`

**Interfaces:**
```ts
export const MIXED_COUNT = 12
export function mixedPool(topics: Topic[], statuses: Record<string, TopicStatus>): string[]   // 'ogrenildi' konuların tüm kartları
export function buildMixedQuestions(input: { pool: string[]; attempts: AttemptRec[]; dueCards: string[];
  count: number; rng: () => number }): Question[]
```

**Seçim kuralları:**
1. Havuzdaki due kartlar önce gelir, en fazla `floor(count/2)` tane.
2. Kalan yerler havuzdan ağırlıklı rastgele seçimle dolar. Bir kartın ağırlığı `1 + (o kartın son 5 denemesindeki yanlış sayısı)` olur.
3. Aynı kart art arda iki kez gelmez. Havuzda 1 kart varsa bu kural uygulanmaz.
4. Havuz boşsa sonuç `[]` olur.

**Ekran:** `MixedPractice` serbest tur gibi çalışır. Oturum kaydı yazmaz ve zamanlayıcı kullanmaz, ama attempt yazar (her kartın kendi konusuyla) ve Leitner kartını günceller. Sonunda `'Tur bitti'`, skor ve `#/nota` bağlantısı gösterilir. Mevcut serbest tur bileşeni yeniden kullanılabiliyorsa onu soru listesi alacak şekilde genişlet; kod çoğaltma.

**Nota bölümü:** Listenin en üstünde `'🔀 Karışık antrenman'` kartı bulunur ve `'#/nota/karisik'` adresine gider.
- Havuz boşsa (Review Focus 3) kart devre dışıdır ve altında `'İlk konuyu öğrenince açılır.'` yazar.
- Rota `/nota/karisik`, `/nota/<topicId>` eşlemesinden **önce** tanımlanır.

- [ ] Failing testleri yaz:
  - `mixedPool` yalnızca öğrenilmiş konuların kartlarını döner.
  - `buildMixedQuestions` havuz yeterliyse tam `count` soru döner.
  - 10 due kartla en fazla 6'sı due kartlardan gelir.
  - Aynı kart art arda gelmez.
  - Son 5 denemesi yanlış olan kart, 2000 seed üzerinde hiç yanlışı olmayan karttan belirgin şekilde daha sık seçilir (oran > 3).
  - Boş havuz `[]` döner.
  - Nota bölümünde boş havuzda kart devre dışıdır ve açıklama yazar; dolu havuzda bağlantı `#/nota/karisik` olur.
  - Karışık turda doğru cevap attempt yazar ve kartın Leitner kutusunu günceller.
  - `#/nota/karisik` rotası MixedPractice'i açar, not-found göstermez.
- [ ] FAIL → uygula → PASS. `npx vitest run` ve `npm run build`.
- [ ] Commit: `feat(nota): karışık antrenman`
