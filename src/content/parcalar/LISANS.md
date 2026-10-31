# Parça verisinin lisansı

Bu klasördeki parça dosyaları (`*.json`) **SymbTr** veri derleminden türetilmiştir ve
**CC BY-NC-SA 4.0** (Creative Commons Atıf-GayriTicari-AynıLisanslaPaylaş 4.0 Uluslararası)
lisansı altındadır: https://creativecommons.org/licenses/by-nc-sa/4.0/

Uygulamanın kaynak kodu AGPL-3.0-or-later lisanslıdır. Bu klasördeki veri ise ayrı bir eserdir.
AGPL kapsamına girmez ve ticari amaçla kullanılamaz.

## Kaynak

M. Kemal Karaosmanoğlu. *A Turkish makam music symbolic database for music information retrieval:
SymbTr.* In Proceedings of 13th International Society for Music Information Retrieval Conference
(ISMIR), pages 223–228, 2012.

Depo: https://github.com/MTG/SymbTr (CC BY-NC-SA 4.0)

| Parça | Makam / usul | Besteci | SymbTr dosyası |
|---|---|---|---|
| Benim Adım Dertli Dolap | Uşşak / Dolap (12/8) | Anonim (güfte: Yunus Emre) | https://raw.githubusercontent.com/MTG/SymbTr/master/txt/ussak--ilahi--dolap--benim_adim--.txt |
| Yine Bağlandı Dil (aranağme) | Nevâ / Yürük Semâî (6/8) | Zekâî Dede | https://raw.githubusercontent.com/MTG/SymbTr/master/txt/neva--sarki--yuruksemai_ii--yine_baglandi--zekai_dede.txt |
| Hak Teâlâ | Uşşak / Sofyan (4/4) | Ali Ufkî | https://raw.githubusercontent.com/MTG/SymbTr/master/txt/ussak--ilahi--sofyan--hak_taala--ali_ufki.txt |
| Dağlar ile Taşlar ile | Hicaz / Sofyan (4/4) | Kutbî Dede (güfte: Yunus Emre) | https://raw.githubusercontent.com/MTG/SymbTr/master/txt/hicaz--ilahi--sofyan--daglar_ile--kutbi_dede.txt |
| Allah Emrin Tutalım | Uşşak / Düyek (8/8) | Zekâî Dede | https://raw.githubusercontent.com/MTG/SymbTr/master/txt/ussak--ilahi--duyek--allah_emrin--zekai_dede.txt |
| Hicran Oku (aranağme) | Hüseynî / Türk Aksağı (5/8) | Şevki Bey | https://raw.githubusercontent.com/MTG/SymbTr/master/txt/huseyni--sarki--turkaksagi--hicran_oku--sevki_bey.txt |
| Gül Yüzlülerin (1–16. ölçü) | Bayâtî / Yürük Semâî (6/4) | Tab'î Mustafa Efendi | https://raw.githubusercontent.com/MTG/SymbTr/master/txt/beyati--yuruksemai--yuruksemai--gul_yuzlulerin--tabi_mustafa_efendi.txt |
| Çeçen Kızı | Hüseynî / Nim Sofyan (2/4) | Tanburi Cemil Bey | https://raw.githubusercontent.com/MTG/SymbTr/master/txt/huseyni--oyunhavasi--nimsofyan--cecen_kizi--tanburi_cemil_bey.txt |

## Yapılan değişiklikler

- SymbTr txt dosyaları `scripts/symbtr-to-json.mjs` ile bu uygulamanın JSON biçimine dönüştürüldü.
- Perdeler NotaAE/KomaAE sütunlarından, süreler Pay/Payda sütunlarından alındı. Notalar ölçülere
  bölündü, heceler (Soz1) ölçü başına notalarla hizalandı. Hecelerdeki boşluklar atıldı, ulama
  işareti `_` yerine `‿` yazıldı.
- Tek bir nota değeriyle yazılamayan süreler (ör. 5/8) aynı ölçü içinde bağlı notalara bölündü
  (5/8 → ikilik + sekizlik). Toplam süre ve perde değişmedi.
- "Yine Bağlandı Dil" şarkısından yalnız ölçü 1–20 (aranağme, saz bölümü) alındı; söz gösterilmez. Nota
  satırlarından Kod 9, 10 (ardçarpmalı nota) ve 11 (sessiz çarpma) süreli nota olarak alındı; Kod 8
  (süresiz çarpma) satırları alınmadı.
- "Hicran Oku" şarkısından yalnız ölçü 1–16 (aranağme) ve "Gül Yüzlülerin" eserinden yalnız ölçü 1–16 alındı.
  Gül Yüzlülerin'de Kod 4, 7 ve 12 satırları da süreli nota olarak alındı (Pay > 0); Kod 8 satırları alınmadı.
- "Çeçen Kızı"ndaki 3/32 + 1/32 figürleri (ölçü 41–47) noktalı onaltılık + otuzikilik olarak yazıldı.
- "Allah Emrin Tutalım": TDV bu ilahiyi Nim Sofyan usulünde anar; SymbTr dosyası Düyek'tir. Uygulama dosyanın
  usulünü (Düyek, 8/8) kullanır. İki 7/8'lik nota bağlı noktalı ikilik + sekizliğe bölündü.
- Söz: güfte sahibi bulunamadığı için söz gösterilmez (Allah Emrin Tutalım, Hicran Oku, Gül Yüzlülerin). Çeçen Kızı zaten sözsüzdür.
- Ms, LNS, Bas ve Nota53/Koma53 sütunları alınmadı.

Bu dosyaları paylaşırken ya da değiştirirken aynı lisansı ve yukarıdaki atfı koruyun.

## Elle yazılan parçalar (neyzen.com)

`elle/eserler/*.ts` dosyalarındaki parçalar SymbTr'den değildir. Kaynak sayfa: https://www.neyzen.com/ney_ilahiler.html

- neyzen.com notalarından elle yazıldı; telif kontrolü kullanıcı kararıyla sonraya bırakıldı (2026-10-31).
- Her parçanın kaynağı (neyzen.com PDF adresi) kendi dosyasında `kaynak` alanında yazılıdır.
- Çarpmalar (süs notaları) yazılmadı, tekrar işaretleri açılmadı; uygulama bunu parça sayfasında "Çarpmalar gösterilmez" diye söyler.
- Yukarıdaki CC BY-NC-SA 4.0 atfı bu parçalar için geçerli değildir.
