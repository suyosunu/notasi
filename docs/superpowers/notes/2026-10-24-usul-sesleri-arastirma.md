# Notası: usul sesleri için lisanslı kayıt araştırması

Tarih: 2026-10-24. Tüm URL'ler bu oturumda gerçekten çekildi/indirildi (curl veya WebFetch). Ses analizleri (süre, spektrum) ffprobe/ffmpeg + numpy ile yapıldı; kulakla dinleme YAPILMADI.

## 1. Özet tablo

| Seçenek | Kaynak | Lisans | Doğrudan indirme | Dosyalar ve boyutlar |
|---|---|---|---|---|
| **Darbuka (önerilen)** | VCSL `Membranophones/Struck Membranophones/Darbuka/` | **CC0 1.0** | **Evet** (raw.githubusercontent.com, giriş yok) | 20 WAV, 44.1 kHz / 16 bit / stereo, her biri 89-221 KB (toplam ~2.4 MB); 5 vuruş tipi x 2 şiddet x 2 round-robin. Mono + kırpılmış mp3 64 kbps: doum ~6 KB, tek ~3.8 KB, ka ~3.4 KB |
| Konga (önerilen) | WebAudioFont GM `12864`, `12863`, `12862` | MIT (FluidR3 + webaudiofontdata) | Evet | mp3 gömülü JS; 14.2 / 15.5 / 7.1 KB (JS), ses 10.4 / 11.4 / 5.1 KB |
| Tahta (önerilen) | WebAudioFont GM `12876`, `12877` | MIT | Evet | 7.5 / 7.9 KB (JS), ses 5.4 / 5.7 KB |
| Bongo (isteğe bağlı) | WebAudioFont GM `12860`, `12861` | MIT | Evet | 8.1 / 9.5 KB (JS), ses 5.8 / 6.8 KB |
| Darbuka yedek 1 | Freesound, gregstullsoundlab "Doumbek" paketi (5 tek vuruş) | **CC0** | **Hayır, indirme için giriş şart**; herkese açık HQ mp3 önizleme (128 kbps, stereo) girişsiz inebilir | Doum 2.2 s, Tek 1.6 s, TekHi 1.1 s, mid 1.9 s, mute 0.66 s; 44.1 kHz / 32 bit stereo WAV; önizleme mp3 14-43 KB |
| Darbuka yedek 2 | Wikimedia Commons `Derbake Agudo.ogg`, `Derbake Grave.ogg` | CC BY-SA 4.0 | Evet | 9.7 KB (0.42 s) ve 11.4 KB (0.57 s), mono Vorbis 44.1 kHz |
| Reddedilen | Freesound barisbozkurt (CompMusic) `basic_strokes_darbuka.wav`, `basicStrokes_def_.wav` | CC BY-NC 4.0 | Hayır (giriş) | 3.2 / 3.3 s, 44.1 kHz 16 bit stereo; NC lisansı AGPL depoyla uyumsuz, kullanmayın |
| Reddedilen | Freesound xserra `darbuka.wav` | CC BY 4.0 | Hayır (giriş) | 22.7 s performans kaydı (tek vuruş değil) |
| Reddedilen | Freesound hollandm "Doumbek" paketi | CC0 | Hayır (giriş) | Hepsi 4 sn'lik 120 bpm döngü, tek vuruş yok |
| Reddedilen | archive.org | yok | n/a | Arama sonuçlarında kullanılabilir darbuka tek vuruş yok (sadece konser kayıtları, NC/ND) |

## 2. A. WebAudioFont / FluidR3_GM davul dosyaları

### 2.1 Gerçek URL'ler (hepsi HTTP 200 döndü, boyutlar bayt)

Desen: `https://surikov.github.io/webaudiofontdata/sound/128<nota>_<kit>_FluidR3_GM_sf2_file.js`
GitHub raw eşleniği: `https://raw.githubusercontent.com/surikov/webaudiofontdata/master/sound/128<nota>_0_FluidR3_GM_sf2_file.js` (12864 için doğrulandı: HTTP 200, Content-Length 14182, Pages sürümüyle aynı boyut).

| GM nota | GM adı | Dosya | JS boyutu | Gömülü ses | SF2 örnek adı (dosya yorumundan) |
|---|---|---|---|---|---|
| 64 | Low Conga | https://surikov.github.io/webaudiofontdata/sound/12864_0_FluidR3_GM_sf2_file.js | 14182 | 10394 B mp3, 0.639 s | "Low Tumba(L)" |
| 63 | Open Hi Conga | https://surikov.github.io/webaudiofontdata/sound/12863_0_FluidR3_GM_sf2_file.js | 15503 | 11385 B mp3, 0.709 s | "High Conga(L)" |
| 62 | Mute Hi Conga | https://surikov.github.io/webaudiofontdata/sound/12862_0_FluidR3_GM_sf2_file.js | 7060 | 5050 B mp3, 0.273 s | "Closed Slap(L)" |
| 60 | Hi Bongo | https://surikov.github.io/webaudiofontdata/sound/12860_0_FluidR3_GM_sf2_file.js | 8066 | 5806 B mp3, 0.315 s | "Bongo Rim(L)" |
| 61 | Low Bongo | https://surikov.github.io/webaudiofontdata/sound/12861_0_FluidR3_GM_sf2_file.js | 9454 | 6849 B mp3, 0.389 s | "Low Bongo(L)" |
| 76 | Hi Wood Block | https://surikov.github.io/webaudiofontdata/sound/12876_0_FluidR3_GM_sf2_file.js | 7479 | 5363 B mp3, 0.303 s | "High Woodblock(L)" |
| 77 | Low Wood Block | https://surikov.github.io/webaudiofontdata/sound/12877_0_FluidR3_GM_sf2_file.js | 7862 | 5650 B mp3, 0.325 s | "Low Woodblock(L)" |

Toplam 7 dosya = 59.6 KB JS. Dizin: https://surikov.github.io/webaudiofontdata/sound/ (200). Not: "_0" standart kit. Repoda `_0`..`_30` arası kit varyantları var (git ağacı: `https://api.github.com/repos/surikov/webaudiofontdata/git/trees/master?recursive=1`); `_0`..`_7` bayt bayt aynı boyutta, `_8+` 2 bayt büyük, `_21` farklı boyutta (farklı örnek). Sadece boyutlara baktım, içeriği karşılaştırmadım; `_0` yeterli.

### 2.2 JS yapısı (12864_0 örneği, birebir)

```js
console.log('load _drum_64_0_FluidR3_GM_sf2_file');
var _drum_64_0_FluidR3_GM_sf2_file={
	zones:[
		{
			midi:128
			,loopStart:0
			,loopEnd:0
			,keyRangeLow:64
			,keyRangeHigh:64
			,sampleRate:44100
			,coarseTune:0
			,fineTune:0
			,originalPitch:6400
			,file:'SUQzBAAAAAAAI1RTU0UA...'   // base64 mp3
			,anchor:0.02859410
			//'Low Tumba(L)
		}
	]
};
```

- Her dosyada TEK zone; loop yok (`loopStart:0, loopEnd:0`); `sampleRate:44100`; `originalPitch` = nota*100 (6400, 6300, 6200, 6000, 6100, 7600, 7700); `coarseTune/fineTune:0`; `keyRangeLow == keyRangeHigh == nota`.
- `file` alanı base64 kodlu **MP3** (`ID3` ile başlar; ffprobe: mp3, 44100 Hz, **mono**, ~126 kbps, ID3 + Xing + LAME 3.96 başlığı). Ogg değil. Base64 çözülünce 5-11 KB ham mp3.
- `anchor` alanı: 0.003-0.029 aralığında sayı (ses başındaki küçük bir ofset; yorumlanışı doğrulanmadı).
- Kullanım: dosya global bir `var _drum_<nota>_0_FluidR3_GM_sf2_file` tanımlar; WebAudioFont oynatıcısı `decodeAfterLoading` ile mp3'ü `decodeAudioData`'dan geçirir. Notası'da halihazırda shakuhachi için aynı mekanizma kullanılıyorsa aynen çalışır; alternatif: base64'ü çözüp `.mp3` olarak paketlemek (JS'e göre %25 küçük).
- Not: sesler kısa (0.27-0.71 s), tek velocity katmanı, mono: davul gibi sönen doğal seslerdir ama sentez/örnekleme niteliği "General MIDI sınıfı", VCSL'den daha az gerçekçi.

### 2.3 Lisans kanıtı

- webaudiofontdata: https://raw.githubusercontent.com/surikov/webaudiofontdata/master/LICENSE
  Alıntı: "MIT License / Copyright (c) 2017 Srgy Surkv / Permission is hereby granted, free of charge, to any person obtaining a copy of this software ... The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software."
- README (https://raw.githubusercontent.com/surikov/webaudiofontdata/master/README.md) FluidR3 lisansına şuraya bağlanır: "FluidR3.sf2 license" -> https://github.com/musescore/MuseScore/blob/master/share/sound/FluidR3Mono_License.md
- FluidR3 lisansı (o sayfa, WebFetch ile okundu): "Mono version: Copyright (c) 2014-16 Michael Cowgill Copyright (c) 2000-2002, 2008 Frank Wen getfrank@gmail.com" ve MIT izin metni: "Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files ... to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies ... The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software."
- Debian telif dosyası (https://people.debian.org/~tg/sf/FluidR3Mono_GM/copyright): FluidR3 mono için ayrıca "Temple Blocks instrument: Ethan Winer (2002)" ve "Drumline Percussion: Michael Schorsch (2016)" telif satırları var, aynı MIT başlığı altında; ayrı bir istisna şartı yazmıyor. (Tahta blok sesleri Temple Blocks'tan türemiş olabilir; doğrulanmadı. Yine MIT altında.)
- Yükümlülük: telif + izin metni dağıtımda korunmalı. Önerilen NOTICE/Hakkında satırı: "GM davul/ahşap örnekleri: FluidR3_GM, Copyright (c) 2000-2002, 2008 Frank Wen (MIT), WebAudioFont dönüşümü Copyright (c) 2017 Srgy Surkv (MIT), https://github.com/surikov/webaudiofontdata". MIT metnini LICENSES/ altına koyun.

## 3. B. Darbuka tek vuruşları

### 3.1 VCSL (Versilian Community Sample Library): EN İYİ SEÇENEK

- Repo: https://github.com/sgossner/VCSL , klasör: https://github.com/sgossner/VCSL/tree/master/Membranophones/Struck%20Membranophones/Darbuka
- Lisans (README): "The Versilian Community Sample Library is an open CC0 general-purpose sample library ..." ve "This collection is under a Creative Commons 0 license. Essentially it's Public Domain- you can do whatever you want with these sounds (even make commercial software), no royalties, no credit, no special terms." `LICENSE` dosyası = CC0 1.0 Universal ("Creative Commons Legal Code / CC0 1.0 Universal") https://raw.githubusercontent.com/sgossner/VCSL/master/LICENSE . Atıf zorunlu değil (yine de "VCSL, Versilian Studios, CC0" kredisi nezaket olarak eklenebilir).
- Doğrudan indirme: Evet, giriş yok. Örnek: `https://raw.githubusercontent.com/sgossner/VCSL/master/Membranophones/Struck%20Membranophones/Darbuka/Darbuka_1_hit_vl2_rr1.wav` (20 dosya indirildi, bayt boyutları git ağacıyla birebir aynı; Git LFS yok, gerçek WAV).
- Format: hepsi 44.1 kHz, 16 bit, stereo WAV. Klasörde README/SFZ yok; vuruş tipi adı dosya adında geçmiyor (hit numarası 1-5). Aşağıdaki sınıflandırma SPEKTRUM ANALİZİNDEN çıkarım, kulakla doğrulanmadı.

Dosya adı: `Darbuka_<N>_hit_vl<1|2>_rr<1|2>.wav` (vl2 = sert/yüksek şiddet, rr = round-robin).

| N | Süre (s) | vl2_rr1 boyut | Zirve (vl2) | Spektrum özeti | Çıkarım |
|---|---|---|---|---|---|
| 1 | 1.07-1.25 | 221192 B | 0.64-0.73 | Enerjinin ~%100'ü <300 Hz, baskın 144 Hz, -30 dB'ye 0.52 s | **DÜM (doum)**, saf bas |
| 2 | 0.59-0.65 | 103708 B | 0.30-0.41 | Atak 1-3 kHz, baskın 728 Hz, merkez 1.7-2.3 kHz, kuru, -30 dB 0.13 s | **TEK** (kenara parlak vuruş) |
| 3 | 0.50-0.52 | 91936 B | 0.16-0.17 | Atak 300-1000 Hz, gövde 150-740 Hz, -30 dB 0.10 s, kısa/mat | **KA / TE-KE adayı** (zayıf el, mat/parmak) |
| 4 | 0.61-0.73 | 128996 B | 0.18-0.19 | Atak bas+orta (100-3 kHz) + uzun 144 Hz kuyruk | slap veya pa türü (bas+tiz karışık) |
| 5 | 0.54-0.64 | 98860 B | 0.06-0.09 | Atak 1-8 kHz parlak, bas kuyruk | slap/parlak "tak" türü |

Dosya bazlı tam liste (bayt): 1: vl1_rr1 188300, vl1_rr2 211692, vl2_rr1 221192, vl2_rr2 215640 | 2: 113988, 114964, 103708, 109480 | 3: 90756, 88580, 91936, 90244 | 4: 108392, 106952, 128996, 114672 | 5: 95288, 112332, 98860, 106304.

Uyarılar: N=3,4,5 kayıtları sessiz (zirve 0.04-0.19), pakete girmeden normalleştirme (ör. -18 LUFS veya tepe 0.9) şart. Hangisinin "te" ve "ke" için uygun olduğuna kulakla karar verilmeli (ben 3'ü ka, 2'yi tek varsaydım).

Paketleme tahmini (ffmpeg ile denendi: mono, vl2_rr1, 44.1 kHz, loudnorm -18, 50 ms fade-out): doum 0.7 s mp3 64k = 6103 B (ogg q2 8086 B); tek 0.4 s = 3804 B (ogg 6367); ka 0.35 s = 3386 B (ogg 6027); N=4: 3804 B; N=5: 3804 B. Üç vuruş x 2 round-robin = ~25-35 KB mp3. Safari/PWA için mp3 en güvenlisi.

### 3.2 Freesound adayları (gregstullsoundlab, CC0, tek vuruşlar) : en iyi yedek

Paket: https://freesound.org/people/gregstullsoundlab/packs/16580/ ("Doumbek", 5 ses, 31 Mart 2015). Her sayfada lisans satırı "Creative Commons 0" (lisans linki http://creativecommons.org/publicdomain/zero/1.0/), açıklama "Doumbek One-Shot Sample".

| Ses | URL | Süre | Format | Önizleme-analiz |
|---|---|---|---|---|
| Doumbek_Doum.wav | https://freesound.org/people/gregstullsoundlab/sounds/268708/ | 2.206 s | 44.1 kHz, 32 bit, stereo | merkez 376 Hz, baskın 108 Hz, -30 dB 0.82 s (düm) |
| Doumbek_Tek.wav | https://freesound.org/people/gregstullsoundlab/sounds/268707/ | 1.622 s | aynı | merkez 1035 Hz, baskın 448 Hz, 0.32 s (tek) |
| Doumbek_TekHi.wav | https://freesound.org/people/gregstullsoundlab/sounds/268706/ | 1.090 s | aynı | merkez 1254 Hz, 0.21 s (parlak tek) |
| Doumbek_mid.wav | https://freesound.org/people/gregstullsoundlab/sounds/268705/ | 1.874 s | aynı | merkez 658 Hz, baskın 108 Hz, 0.52 s (orta ton) |
| Doumbek_mute.wav | https://freesound.org/people/gregstullsoundlab/sounds/268709/ | 0.661 s | aynı | merkez 972 Hz, 0.09 s (mat / ka-te adayı) |

- **İndirme için giriş gerekir**: sayfada "Login to download"; `.../sounds/268708/download/268708__gregstullsoundlab__doumbek_doum.wav` adresi girişsiz istendiğinde HTTP 200 ile "Freesound - Login" HTML'i döndü (WAV değil). Yani otomasyonla çekilemez; kullanıcı hesabıyla elle indirmeli.
- **Girişsiz herkese açık önizleme**: `https://cdn.freesound.org/previews/268/268705_5097405-hq.mp3` (aynı desen 268706, 268707, 268708, 268709; hepsi inildi; HQ mp3, 44.1 kHz stereo, ~153 kbps, 13.8-42.8 KB). CC0 olduğundan önizlemeyi paketlemek hukuken sorun değil, ama kalite WAV'dan düşük; tepe değerleri >1.0 (clip riski), normalleştirin. Ayrıca `-lq.mp3`/`-lq.ogg` de var.
- Aynı sesin archive.org / Commons yansısı bulunamadı (archive.org aramaları sonuçsuz).

Diğer Freesound sonuçları (kullanılamaz):
- hollandm "Doumbek / darbuka / goblet drum" paketi https://freesound.org/people/hollandm/packs/38695/ : CC0 ama 4 sn'lik 120 bpm döngüler/parmak vuruşları (ör. https://freesound.org/people/hollandm/sounds/691765/ Fingertap2-120.wav, https://freesound.org/people/hollandm/sounds/691763/ Fingerdrum-120.wav: CC0, 4.000 s, 44.1 kHz 16 bit stereo, giriş şart). Tek vuruş değil.
- xserra https://freesound.org/people/xserra/sounds/115396/ darbuka.wav: CC BY 4.0, 22.7 s, 44.1 kHz/16/stereo, İstanbul'da Hamza Zeytinoglu'nun evinde kayıt; performans, tek vuruş değil; giriş şart.
- goldendiaphragm 242717/242718/242720: CC0 ama 176-188 bpm döngü/fill.
- barisbozkurt (CompMusic, Barış Bozkurt / Eren Ergen): https://freesound.org/people/barisbozkurt/sounds/140446/ basic_strokes_darbuka.wav ("düm, tek, tokat", 3.223 s, 44.1/16/stereo) ve https://freesound.org/people/barisbozkurt/sounds/140783/ basicStrokes_def_.wav ("düm, tek, tokat, zil", 3.335 s) — içerik tam istediğimiz (Türk darbuka/def vuruşları) ama lisans satırı "Attribution NonCommercial 4.0"; depo AGPL ve herkesin ticari kullanımına izin verdiği için NC varlığı paketlenemez. Ayrıca giriş şart. CompMusic usul kayıtları sayfası: https://compmusic.upf.edu/hi/node/115 (CC BY-NC-ND 3.0 ES).
- Pixabay/samplefocus/coyotus vb. aramada çıktı, lisans metinleri doğrulanmadı, kullanılmadı.

### 3.3 Wikimedia Commons

Arama (API, ses dosyaları): sadece birkaç darbuka kaydı var, hepsi CC BY-SA 4.0 (SA: türev eserlere aynı lisansı şart koşar; atıf gerekir).
- https://commons.wikimedia.org/wiki/File:Derbake_Agudo.ogg : "CC BY-SA 4.0", yazar ZappaMidiPF, 0.418 s, mono Vorbis 44.1 kHz, 9747 B. Doğrudan: https://upload.wikimedia.org/wikipedia/commons/4/40/Derbake_Agudo.ogg . Merkez ~373 Hz (düşük/orta vuruş).
- https://commons.wikimedia.org/wiki/File:Derbake_Grave.ogg : CC BY-SA 4.0, ZappaMidiPF, 0.574 s, 11352 B. Doğrudan: https://upload.wikimedia.org/wikipedia/commons/2/20/Derbake_Grave.ogg . Merkez ~645 Hz (analiz isimle çelişkili: "Grave" bas olmalı ama düm kadar derin değil; kulakla bakılmalı).
- https://commons.wikimedia.org/wiki/File:Darbuka.ogg : CC BY-SA 4.0, yazar Cassa342, 16.6 s serbest çalış (tek vuruş değil).
- Derbake kullanıcısının "Baladi/Malfuf/... Ejemplo.ogg" ritim örnekleri (CC BY-SA 4.0, ~10 s) döngü, tek vuruş değil.
- Değerlendirme: tek vuruş sayısı az, kalite düşük, SA yükü var: VCSL varken gerek yok.

### 3.4 VCSL'de diğer ilgili klasörler (hepsi CC0, aynı raw desen)

- Frame Drum (`Membranophones/Struck Membranophones/Frame Drum/`): `HDrumL_Hit_v2_rr1_Sum.wav` 659856 B, `HDrumL_HitMuted_v2_rr1_Sum.wav` 305388 B, `HDrumS_Hit_v2_rr1_Sum.wav` 456272 B, `HDrumS_HitMuted_v2_rr1_Sum.wav` 180420 B, `HDrumL_Hand_rr1_Sum.wav` 205484 B vb. (def/bendir benzeri; Türk def için de kullanılabilir).
- Conga (`.../Conga/`): `Conga_HitN_v2_rr1_Sum.wav` 140012 B (açık), `Conga_HitFM_v2_rr1_Sum.wav` 159004 B (parmak/mat?), `Quinto_HitN_*`, `Tumba_HitN_*` (92-231 KB, stereo).
- Bongos (`.../Bongos/`): `BongoH_Hit1_v2_rr1_Mid.wav` 209356 B, `BongoL_Hit1_v2_rr1_Mid.wav` 168720 B, `BongoH_HitMuted1_*`, `BongoL_HitMuted2_*`.
- Woodblock (`Idiophones/Struck Idiophones/Woodblock/`): `wood_click_ff.wav` 200608 B, `wood_click_mp.wav` 134674 B, `wood_click3_vl1.wav` 186874 B, `wood_click_pp_rr1.wav` 107200 B.
- Riq/tar/doumbek/derbeke klasörü VCSL'de YOK (Membranophones altında sadece Bass Drum, Bongos, Conga, Darbuka, Frame Drum, Snare, Timpani, Tom, Ocean Drum; Idiophones altında Tambourine 1-5, Cajon, Woodblock). Riq/tar için en yakını Tambourine ve Frame Drum.
- Bunlar CC0, GM örneklerinden daha gerçekçi ve lisans yükü yok, ama WAV stereo ve daha büyük (kırpıp mono mp3'e çevrilirse 3-8 KB). Konga/Tahta için GM yerine VCSL de seçilebilir; bu bir tercih (MIT atıf yükü vs gerçekçilik).

## 4. Öneri

### 4.1 "Darbuka" sesi: VCSL Darbuka (CC0)
Kaynak: https://github.com/sgossner/VCSL/tree/master/Membranophones/Struck%20Membranophones/Darbuka

| Vuruş | Dosya (sert katman) | Round-robin | Notlar |
|---|---|---|---|
| düm | `Darbuka_1_hit_vl2_rr1.wav` | + `Darbuka_1_hit_vl2_rr2.wav` | 0.7 s'ye kırp, 50 ms fade; saf 144 Hz bas |
| tek | `Darbuka_2_hit_vl2_rr1.wav` | + `Darbuka_2_hit_vl2_rr2.wav` | 0.4 s |
| te / ke (zayıf el) | `Darbuka_3_hit_vl2_rr1.wav` | + `Darbuka_3_hit_vl2_rr2.wav` | 0.35 s, normalleştir (kayıt sessiz, zirve 0.17). ke için `vl1` katmanı (daha yumuşak) kullanılabilir |
| (isteğe bağlı, tokat/vurgu) | `Darbuka_5_hit_vl2_rr1.wav` | | parlak slap, +normalleştir |

- Önce kulakla doğrulayın (özellikle 3, 4, 5 numaraları: spektrumdan çıkarım). Gerekirse kırpılmış mono mp3 (64 kbps) olarak paketleyin: ~25-35 KB toplam.
- Lisans: CC0, atıf zorunlu değil; "Hakkında"da nezaket kredisi: "Darbuka örnekleri: Versilian Community Sample Library (VCSL), Versilian Studios, CC0".
- Yedek (CC0 ama elle giriş yapıp indirmek gerekir): Freesound gregstullsoundlab Doum 268708, Tek 268707 (veya TekHi 268706), mute 268709.

### 4.2 "Konga" sesi: GM / FluidR3 (MIT), WebAudioFont
- düm (bas): GM 64 Low Conga = https://surikov.github.io/webaudiofontdata/sound/12864_0_FluidR3_GM_sf2_file.js ("Low Tumba", 0.64 s, 10.4 KB ses)
- tek (açık/parlak): GM 63 Open Hi Conga = https://surikov.github.io/webaudiofontdata/sound/12863_0_FluidR3_GM_sf2_file.js ("High Conga", 0.71 s, 11.4 KB ses)
- te/ke (mat): GM 62 Mute Hi Conga = https://surikov.github.io/webaudiofontdata/sound/12862_0_FluidR3_GM_sf2_file.js ("Closed Slap", 0.27 s, 5.1 KB ses)
- (Bongo ek seçenek olarak GM 60 `12860_0` ve 61 `12861_0`.)
- Toplam 3 dosya = 36.7 KB JS (~26.8 KB ses). Tek zone, döngüsüz, mp3 mono 44.1 kHz.

### 4.3 "Tahta" sesi: GM Woodblock (MIT), WebAudioFont
- yüksek (tek/te): GM 76 Hi Wood Block = https://surikov.github.io/webaudiofontdata/sound/12876_0_FluidR3_GM_sf2_file.js (0.30 s, 5.4 KB ses)
- alçak (düm): GM 77 Low Wood Block = https://surikov.github.io/webaudiofontdata/sound/12877_0_FluidR3_GM_sf2_file.js (0.33 s, 5.7 KB ses)
- Eşleme önerisi: düm -> 77, tek -> 76, te/ke -> 76 daha kısa/yumuşak (aynı örnek, düşük gain ve/veya playbackRate). İki dosya = 15.3 KB JS.

### 4.4 Atıf ve NOTICE
- GM sesleri (Konga/Tahta/Bongo): MIT, telif + izin metni korunmalı (bkz. 2.3).
- Darbuka (VCSL): CC0, yükümlülük yok.
- NC lisanslı CompMusic (barisbozkurt) ve CC BY-SA Commons kayıtları AGPL depoya girmemeli/gerekirse ayrı lisans notu gerektirir.
- Ses dosyalarının indirilen kopyaları bu araştırma sırasında sadece oturum scratchpad'ine alındı, depoya hiçbir şey eklenmedi.
