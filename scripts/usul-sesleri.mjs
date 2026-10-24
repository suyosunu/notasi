// Tek seferlik: usul sesi kayıtlarını (Konga, Tahta, Darbuka) indirir ve public/sounds/usul/ altına kısa, mono mp3
// olarak yazar. ffmpeg ve ffprobe (PATH'te) gerekir. Ham indirmeler depo DIŞINDA geçici bir klasöre alınır ve sonda
// silinir; depoya yalnızca üretilen mp3'ler girer.
// Kullanım: node scripts/usul-sesleri.mjs
//
// Kaynaklar ve lisanslar (bkz. public/sounds/usul/LISANS.txt):
// - Konga, Tahta: Fluid R3 GM SoundFont (© Frank Wen, MIT), WebAudioFont dönüşümü (© Srgy Surkv, MIT).
//   JS dosyasındaki tek bölgenin base64 "file" alanı bir mp3'tür; çözülüp yeniden işlenir.
// - Darbuka: Versilian Community Sample Library (VCSL), CC0 1.0. Sert katman (vl2), ilk round-robin (rr1).
//
// İşlem (her dosya): mono, 44.1 kHz → baştaki ve sondaki sessizliği (< SILENCE_DB) kırp → en çok MAX_S saniye,
// son FADE_S saniyede kısa sönüş (doğal tını korunur, döngü yok) → tepe PEAK_DB dBFS'e normalleştir → 64 kbps mp3.
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const OUT_DIR = 'public/sounds/usul'
const MAX_S = 1.2
const FADE_S = 0.03
const PEAK_DB = -1
const SILENCE_DB = -60

const GM = (n) => `https://surikov.github.io/webaudiofontdata/sound/128${n}_0_FluidR3_GM_sf2_file.js`
const VCSL = (n) =>
  'https://raw.githubusercontent.com/sgossner/VCSL/master/Membranophones/Struck%20Membranophones/Darbuka/' +
  `Darbuka_${n}_hit_vl2_rr1.wav`

/** Çıktı adı → kaynak. Tahta'da te/ke, tek kaydını kullanır (ayrı dosyası yoktur). */
const TARGETS = [
  ['konga-dum', GM(64), 'gm'], // GM 64 Low Conga
  ['konga-tek', GM(63), 'gm'], // GM 63 Open Hi Conga
  ['konga-teke', GM(62), 'gm'], // GM 62 Mute Hi Conga
  ['tahta-dum', GM(77), 'gm'], // GM 77 Low Wood Block
  ['tahta-tek', GM(76), 'gm'], // GM 76 Hi Wood Block
  ['darbuka-dum', VCSL(1), 'wav'],
  ['darbuka-tek', VCSL(2), 'wav'],
  ['darbuka-teke', VCSL(3), 'wav'],
]

/** ffmpeg'i çalıştırır; analiz çıktısı (volumedetect, astats) stderr'e yazıldığından stderr döner. */
function ffmpeg(args) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostdin', '-y', ...args], { encoding: 'utf8' })
  if (r.status !== 0) throw new Error(`ffmpeg başarısız: ${r.stderr}`)
  return r.stderr
}

function duration(path) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path], {
    encoding: 'utf8',
  })
  if (r.status !== 0) throw new Error(`ffprobe başarısız: ${r.stderr}`)
  return Number(r.stdout.trim())
}

function maxVolumeDb(path) {
  const m = /max_volume:\s*(-?[\d.]+) dB/.exec(ffmpeg(['-i', path, '-af', 'volumedetect', '-f', 'null', '-']))
  if (!m) throw new Error(`max_volume okunamadı: ${path}`)
  return Number(m[1])
}

/** İlk 300 ms'nin RMS düzeyi (dBFS): seslerin birbirine göre gürlüğünü karşılaştırmak için. */
function rmsDb(path) {
  const err = ffmpeg(['-i', path, '-af', 'atrim=end=0.3,astats=measure_perchannel=none', '-f', 'null', '-'])
  const m = /RMS level dB:\s*(-?[\d.]+)/.exec(err)
  return m ? Number(m[1]) : Number.NaN
}

async function download(url, dest) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
}

/** WebAudioFont JS dosyasındaki tek bölgenin base64 mp3'ünü çıkarır. */
function extractGmMp3(jsPath, mp3Path) {
  const js = readFileSync(jsPath, 'utf8')
  const files = [...js.matchAll(/file:'([A-Za-z0-9+/=]+)'/g)]
  if (files.length !== 1) throw new Error(`${jsPath}: ${files.length} bölge (1 bekleniyordu)`)
  writeFileSync(mp3Path, Buffer.from(files[0][1], 'base64'))
}

const work = mkdtempSync(join(tmpdir(), 'notasi-usul-sesleri-'))
mkdirSync(OUT_DIR, { recursive: true })
const report = []
try {
  for (const [name, url, kind] of TARGETS) {
    const raw = join(work, `${name}.raw.${kind === 'gm' ? 'mp3' : 'wav'}`)
    if (kind === 'gm') {
      const js = join(work, `${name}.js`)
      await download(url, js)
      extractGmMp3(js, raw)
    } else {
      await download(url, raw)
    }
    const rawSeconds = duration(raw)
    // 1) mono, 44.1 kHz; baştaki ve (ters çevirerek) sondaki sessizlik kırpılır.
    const trimmed = join(work, `${name}.trim.wav`)
    const silence = `silenceremove=start_periods=1:start_threshold=${SILENCE_DB}dB:start_silence=0`
    ffmpeg([
      '-i', raw,
      '-af', `aformat=channel_layouts=mono,aresample=44100,${silence},areverse,${silence},areverse`,
      '-ac', '1', '-ar', '44100', '-c:a', 'pcm_s16le', trimmed,
    ])
    // 2) en çok MAX_S saniye, sonda kısa sönüş, tepe PEAK_DB'ye normalleştirme; 64 kbps mono mp3.
    const d = Math.min(duration(trimmed), MAX_S)
    const gainDb = PEAK_DB - maxVolumeDb(trimmed)
    const out = join(OUT_DIR, `${name}.mp3`)
    ffmpeg([
      '-i', trimmed,
      '-af', `atrim=end=${d.toFixed(3)},afade=t=out:st=${(d - FADE_S).toFixed(3)}:d=${FADE_S},volume=${gainDb.toFixed(2)}dB`,
      '-map_metadata', '-1', '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '64k', out,
    ])
    report.push({
      name,
      rawSeconds: Number(rawSeconds.toFixed(3)),
      seconds: Number(duration(out).toFixed(3)),
      bytes: statSync(out).size,
      gainDb: Number(gainDb.toFixed(2)),
      peakDb: maxVolumeDb(out),
      rms300msDb: rmsDb(out),
    })
  }
} finally {
  rmSync(work, { recursive: true, force: true })
}
console.table(report)
