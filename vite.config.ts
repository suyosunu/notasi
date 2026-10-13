import preact from '@preact/preset-vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [preact()],
  // Strudel ayrı, tembel yüklenen bir parça (≈650 kB); uyarıyı bilerek yükseltiyoruz.
  build: { chunkSizeWarningLimit: 800 },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // Strudel paketleri ham .mjs; inline edilince vi.mock bağımlılıklarına da uygulanır.
    server: { deps: { inline: [/@strudel\//] } },
  },
})
