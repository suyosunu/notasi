import preact from '@preact/preset-vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      // Testlerde servis çalışanı üretilmesin.
      disable: !!process.env.VITEST,
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'icons/icon.svg'],
      manifest: {
        name: 'Notası — Ney ve Nota',
        short_name: 'Notası',
        lang: 'tr',
        display: 'standalone',
        start_url: '/',
        background_color: '#fbf8f2',
        theme_color: '#c08a2c',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // Strudel tembel yüklenen ayrı bir parça; çevrimdışı ses için o da önbelleğe alınır.
        // mp3: yerel shakuhachi kaydı (public/sounds), "Shakuhachi" ney sesi çevrimdışı da çalsın.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,mp3}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
    }),
  ],
  // Strudel ayrı, tembel yüklenen bir parça (≈650 kB); uyarıyı bilerek yükseltiyoruz.
  build: { chunkSizeWarningLimit: 800 },
  test: {
    environment: 'jsdom',
    // Kalıcı modül önbelleği `import.meta.glob` sonucunu da saklar: elle yazılan parçalar klasörüne yeni dosya eklenince
    // (src/content/parcalar/elle/eserler) eski liste kalır ve yeni eser testlerde görünmez.
    fsModuleCache: false,
    setupFiles: ['./vitest.setup.ts'],
    // Strudel paketleri ham .mjs; inline edilince vi.mock bağımlılıklarına da uygulanır.
    server: { deps: { inline: [/@strudel\//] } },
  },
})
