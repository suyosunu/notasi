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
| Hak Teâlâ | Uşşak / Sofyan (4/4) | Ali Ufkî | https://raw.githubusercontent.com/MTG/SymbTr/master/txt/ussak--ilahi--sofyan--hak_taala--ali_ufki.txt |

## Yapılan değişiklikler

- SymbTr txt dosyaları `scripts/symbtr-to-json.mjs` ile bu uygulamanın JSON biçimine dönüştürüldü.
- Perdeler NotaAE/KomaAE sütunlarından, süreler Pay/Payda sütunlarından alındı. Notalar ölçülere
  bölündü, heceler (Soz1) ölçü başına notalarla hizalandı.
- Ms, LNS, Bas ve Nota53/Koma53 sütunları alınmadı. Nota ya da süre değiştirilmedi.

Bu dosyaları paylaşırken ya da değiştirirken aynı lisansı ve yukarıdaki atfı koruyun.
