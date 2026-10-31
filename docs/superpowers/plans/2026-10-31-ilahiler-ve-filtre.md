# Notası — İlahiler, otomatik parça seviyesi ve filtreler

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Kullanıcının hocasıyla çalıştığı neyzen.com ilahilerini uygulamaya koymak ve Parçalar sayfasını seviye, makam ve usule göre süzülebilir yapmak.

Kapsam:
- Hüseynî Seviye 2'ye taşınır.
- Parça seviyesi elle verilmez; parçanın perde ve sürelerinden hesaplanır.
- Parçalar sayfasına Seviye, Makam ve Usul filtreleri gelir.
- PDF'ten elle yazılan parçalar için altyapı kurulur, ilk beş eser yazılır. Seviye 1 bölümleri ayrı parça olarak görünür.

**Kullanıcı kararları (2026-10-31):**
- "Seviye 2'ye al": Hüseynî Seviye 2'de öğretilir.
- "Telife bakmana gerek yok, koy bunları, sonra bakarız": telif kontrolü yapılmaz. Kaynak (neyzen.com PDF adresi) her parçada yazılır.
- Parçalar sayfasında seviye, makam ve usul filtreleri olacak; aynı parçanın farklı seviyede sürümleri olabilir.

**Kaynaklar:**
- Notalar: `ignore/notalar/*.pdf`, git dışındadır. Kullanıcı bunları https://www.neyzen.com/ney_ilahiler.html adresinden indirdi.
- Katalog: `docs/superpowers/notes/2026-10-31-neyzen-nota-katalogu.md`. Her eserin ölçü sayısı, aralığı ve Seviye 1 bölümleri burada.
- PDF'ler taranmış görüntüdür, metin ya da nota verisi içermez. Yazım elle yapılır.

## Global Constraints

- Önceki aşamaların Global Constraints'i geçerli: sade Türkçe, kilit yok, eski kayıtlar hatasız açılır, her görev sonunda `npx vitest run` ve `npm run build` temiz.
- **Perde seviyesi** tek kaynaktan gelir: bir perde, `uzun-ses` hedefi hangi seviyenin `hedefler` listesindeyse o seviyedendir (`SEVIYELER`).
  - Bu görevlerden sonra Seviye 1: Nevâ, Çârgâh, Segâh, Dügâh, Rast.
  - Seviye 2: Bûselik, Kürdî, Dik Kürdî, Nim Hicaz, **Hüseynî**.
  - Seviye 3: öteki 3. kademe perdeleri.
  - Seviye 4: 4. kademe perdeleri.
- **Ritim seviyesi:**
  - Yalnız birlik, ikilik, dörtlük, sekizlik ve noktalıları varsa 1.
  - Onaltılık, noktalı sekizlik ya da üçleme varsa 2.
  - Otuzikilik varsa 4.
- **Parça seviyesi** = max(perde seviyelerinin en büyüğü, ritim seviyesi).
- Uygulamada karşılığı olmayan bir nota varsa seviye `null` olur ve etiket "Seviye ?" gösterir.
- Elle yazımda **yaklaştırma yapılmaz**: notada ne yazıyorsa o yazılır.
  - Okunamayan ya da işareti belirsiz nota yazılmaz; o parça ya da bölüm eklenmez ve raporda söylenir.
  - Çarpma (süs notası) yazılmaz; parça yorumunda "çarpmalar gösterilmez" denir.
  - Tekrar işaretleri (`|: :|`, D.C., segno) açılmaz; nota bir kez, yazıldığı sırayla yazılır.
  - Usulün ölçü süresi her ölçüde tutmalıdır. Yalnız ilk ölçü eksik (anacrusis) olabilir.
- Anahtar işareti: bu notalarda Si çizgisindeki koma bemolü bütün Si'lere uygulanır (B4b1). Fa diyezi Eviç'tir (F5#4). Natürel işareti (♮) olan nota işaretsiz yazılır.

## Review Focus

1. **Hüseynî taşınması:** Eski kayıtta Hüseynî'yi geçmiş kullanıcının perdesi `gecildi` kalmalı. Hüseynî, Rast geçilip `perde-4` açılınca açılır. Seviye 2 hedefleri Hüseynî'yi sayar, Seviye 3 hedefleri saymaz.
2. **Otomatik seviye:** Mevcut sekiz parçanın hesaplanan seviyesi raporda listelenir; eski elle verilmiş değerden farklı olanlar açıklanır. Uygulama dışı nota içeren parça çökmez, "Seviye ?" gösterir.
3. **Filtreler:** Üç filtre birlikte çalışır. Sonuç boşsa "Bu seçime uyan parça yok" yazar. Filtre seçimi tarayıcıda hatırlanır; okunamazsa sayfa yine açılır. 375 px'de yatay kaydırma olmaz.
4. **Elle yazılan parça doğrulaması:** Her ölçünün süre toplamı usulle tutar (1e-6). Bütün notalar uygulama perdelerinde. Söz dizisi olaylarla hizalı. Bölümler (`olcuAraligi`) ana parçanın ölçülerinden kesilir ve kendi seviyeleri hesaplanır.

---

### Task 67: Hüseynî Seviye 2'ye

**Files:** `src/content/ney-perdeler.ts` (`huseyni.notaTopicId = 'perde-4'`), `src/content/nota-topics.ts`, `src/learning/questions.ts` (ipuçları), `src/content/seviyeler.ts`, `src/content/dersler/perdeler-3.ts` (`perde:huseyni` seviye 2), `src/content/dersler/nota-2.ts` (`nota:perde-4` ve `nota:perde-2` metinleri), müfredat ve yol haritası belgeleri; ilgili testler.

**Yapılacaklar:**
- `perde:E5` ve `perde-ters:E5` kartları `perde-2`'den `perde-4`'e taşınır.
  - `perde-4` başlığı: "Perdeler: Nim Hicaz, Hicaz, Eviç, Hüseynî".
  - `perde-2` başlığı: "Perde adları: Acem, Gerdâniye, Muhayyer".
- `SEVIYE_2` `ARA_SESLER` listesine Hüseynî eklenir: "Hüseynî: 8 sn uzun ses".
- Seviye 3 perde hedefleri Hüseynî'yi dışarıda bırakır.
- `SEVIYELER[2].ozet` ve `SEVIYELER[3].ozet` güncellenir.
- `perde:huseyni` dersi kademe kavramını anlatmaya devam eder, yalnız `seviye: 2` olur.
- Müfredat §1 tablosu, §2 envanteri ve yol haritası birer cümleyle güncellenir: "Kullanıcının hocasının pratiğine göre Hüseynî Seviye 2'ye alındı (2026-10-31)".

**Testler:**
- `evening-plan`: Rast geçilmiş ve `perde-4` açıkken Hüseynî `acik` olur.
- Eski kayıt: Hüseynî `passed` ise `gecildi` kalır.
- `seviyeler`: s2'de `s2-huseyni-8` var, s3'te `s3-huseyni-8` yok.
- `questions`: `perde:E5` kartı `perde-4` konusundadır ve çeldiricileri önce o konudandır.
- Seviye 3 ve 4 hedef sayısını sabitleyen testler güncellenir.

**Commit:** `feat(mufredat): Hüseynî Seviye 2'ye alındı`

### Task 68: Otomatik parça seviyesi ve Parçalar filtreleri

**Files:** Create `src/learning/parca-seviye.ts`; modify `src/content/seviyeler.ts` (`ONERILEN_SEVIYE.parca` kalkar), `src/screens/ParcalarSection.tsx`, `src/screens/ParcaDetail.tsx` (seviye etiketi gösteriliyorsa), `src/styles.css`; testler.

**Interfaces:**
- `perdeSeviyesi(id: PerdeId): number | null`: `SEVIYELER` uzun-ses hedeflerinden türetilir.
- `parcaSeviyesi(olcu: MusicEvent[][]): number | null`: Global Constraints'teki kural. Nota NEY_PERDELER'e `samePitch` ile eşlenir; eşleşmeyen nota varsa sonuç `null`.

**Parçalar sayfası:**
- Liste üstünde üç `<select>`: Seviye (Tümü, 1–4, ?), Makam (Tümü + listede bulunan makamlar), Usul (Tümü + listede bulunan usuller).
- Seviye etiketi hesaplanan değerden gelir.
- Liste seviyeye, sonra mevcut sıraya göre sıralanır.
- Seçim `localStorage`'da tutulur; okuma ve yazma `try/catch` içindedir.
- Boş sonuçta "Bu seçime uyan parça yok." yazar.

**Testler:**
- `parca-seviye.test.ts`:
  - perde seviyeleri (Hüseynî 2, Acem 3, Tiz Nevâ 4),
  - sekizlikli beş perde parçası 1,
  - onaltılıklı aynı parça 2,
  - otuzikilik 4,
  - E5b1 içeren parça `null`.
- `ParcalarSection.test.tsx`:
  - filtreler süzer, birlikte çalışır,
  - boş mesaj çıkar,
  - localStorage hata atsa da sayfa açılır,
  - mevcut parçaların etiketleri hesaplanan değeri gösterir.
- Rapor: sekiz parçanın eski ve yeni seviyesi.

**Commit:** `feat(parca): seviye parçanın notasından hesaplanır; seviye, makam, usul filtresi`

### Task 69: Elle yazılan parça altyapısı

**Files:** Create `src/content/parcalar/elle/` (tür dosyası ve yükleyici); modify `src/content/parcalar/index.ts`, `src/content/parcalar/types.ts`, `src/content/etutler.ts` (`parseEtut`), `src/screens/ParcaDetail.tsx`, `src/content/parcalar/LISANS.md`; testler.

**Interfaces:**
- `parseEtut` iki yeni belirteç tanır:
  - onaltılık `:16`;
  - bağ (aynı perde, süre birleşir) için nota sonunda `~` (`NoteEvent.tie`). Mevcut `_` legato bağıdır, değişmez.
- `ElleParca`:

  ```ts
  { id, title, makam: ParcaMakam, usul, composer, lyricist?, kaynak: string /* neyzen.com PDF URL */,
    notasyon: string /* parseEtut biçimi, ölçüler | ile */, soz?: string[][] /* ölçü başına, olaylarla hizalı */,
    bolumler?: { id: string; baslik: string; olcuAraligi: [number, number] }[] }
  ```

- Her dosya `src/content/parcalar/elle/<id>.ts`, `export default` bir `ElleParca` verir.
- Yükleyici `import.meta.glob('./elle/*.ts', { eager: true })` ile hepsini alır. Böylece yeni eser yalnız yeni dosya ekleyerek gelir.
- Her `ElleParca` bir `Parca`'ya dönüşür (`source` = kaynak). Her bölüm ayrı bir `Parca` olur:
  - `id`: `<id>--<bolum.id>`;
  - `title`: `<title> (<baslik>)`;
  - ölçüler ve sözler aralıktan kesilir.
- Doğrulama: ölçü süresi usulle tutar, ilk ölçü anacrusis olabilir. Söz uzunlukları olaylarla aynıdır. Bozuksa `Error` fırlatır; testler bunu yakalar.
- `PARCALAR` = SymbTr parçaları + elle parçalar.
- `ParcaDetail` kaynağı neyzen.com ise "Nota: neyzen.com" bağlantısını gösterir, ayrıca "Çarpmalar gösterilmez" notunu.
- `LISANS.md`'ye bir bölüm eklenir: "neyzen.com notalarından elle yazıldı; telif kontrolü kullanıcı kararıyla sonraya bırakıldı (2026-10-31)".

**Testler:**
- `parseEtut` `:16` ve `~`.
- Örnek bir test `ElleParca` doğru dönüşür; bölüm kesilir, sözler kesilir.
- Bozuk ölçü hata verir.
- Genel test: bütün elle parçalar doğrulamadan geçer ve bütün notaları uygulama perdelerindedir.

**Commit:** `feat(parca): neyzen.com notalarından elle yazılan parçalar için altyapı`

### Task 70–74: Beş eser (her biri ayrı dosya, birbirinden bağımsız)

| Task | id | PDF (`ignore/notalar/`) | Katalog no | Beklenen | Bölümler (katalogdan; yazarken notaya göre doğrulanır) |
|---|---|---|---|---|---|
| 70 | `kabenin-yollari` | `kabenin_yollari_ney_v2.pdf` | 27 | Rast, Sofyan, 36 ölçü, G4–E5, sekizlik | Seviye 1 bölümleri: "Benim yüreciğim" (Ö9–16), "Cânım Kâbem" (Ö25–36) |
| 71 | `urumda-acemde` | `urumda_acemde.pdf` | 36 | Uşşak, Sofyan, 24 ölçü, A4–E5, sekizlik | E5'siz en uzun doğal bölüm (yaklaşık 20 ölçü) |
| 72 | `bilmem-nideyim` | `bilmem_nideyim_askin_elinden_ney.pdf` | 14 | Uşşak, Sofyan, 17 ölçü, G4–G5 | yok (Ö1–4 ve Ö14–17 bölüm için kısa) |
| 73 | `ey-asik-i-dildade-rast` | `ey_asiki_dildade_ney.pdf` | 22 | Rast, Sofyan, 18 ölçü, G4–G5 | Seviye 1 bölümü: Ö7–11 ya da Ö14–18, hangisi daha doğal bir cümleyse |
| 74 | `sol-cennetin-irmaklari-segah` | `sol_cennetin_irmaklari_munir_nureddin.pdf` | 32 | Segâh, Yürük Semâî 6/8, 24 ölçü, G4–E5, onaltılık | yok |

- Bestekâr ve güfte yazarı PDF başlığından alınır. "?" ise "Bilinmiyor" yazılır.
- Sözler ilk kıtadan, hecelere bölünmüş olarak yazılır. Hizalama zorsa `soz` yazılmaz ve raporda söylenir.
- Makam: Segâh `ParcaMakam`'da yoksa eklenir; `makamlar.ts`'te Segâh makamı yoksa parça makamı yalnız ad olarak gösterilir. Hangi yolun seçildiği raporda yazılır.
- Her task yalnız kendi dosyasını ve kendi kısa testini ekler: ölçü sayısı, aralık, beklenen seviye.
- Yazıcı her ölçüyü PDF'le iki kez karşılaştırır. Belirsiz kalan yerleri raporda ölçü numarasıyla listeler.

**Commit:** `feat(parca): <eser adı> (neyzen.com, elle yazıldı)`

### Bitiş

1. Opus genel inceleme ve tek düzeltme dalgası.
2. Test ve build.
3. Push ve canlı doğrulama.
4. Kullanıcıdan ▶ Dinle ile her eseri kulaktan doğrulaması istenir.
