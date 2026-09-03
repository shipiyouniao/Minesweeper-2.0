import { defineConfig } from 'vite'

/** Keep the default native build and both A/B variants on the same bundler settings. */
export default defineConfig(({ mode }) => {
  const benchmark = mode === 'ab-native' || mode === 'ab-legacy'
  const variant = mode === 'ab-legacy' ? 'legacy' : 'native'
  const entry = variant === 'legacy' ? '/src/main.ts' : '/.bench/ab/native/app/main.js'

  return {
    base: '/Minesweeper-2.0/',
    server: { host: '127.0.0.1', port: 5173, strictPort: true },
    preview: { host: '127.0.0.1', port: 4173, strictPort: true },
    cacheDir: benchmark ? `.bench/ab/cache-${variant}` : 'node_modules/.vite',
    build: {
      target: 'es2023',
      outDir: benchmark ? `.bench/ab/${variant}/dist` : 'dist',
      emptyOutDir: true,
    },
    plugins: benchmark
      ? [
          {
            name: 'ab-application-entry',
            transformIndexHtml: {
              order: 'pre',
              /** Switch only the entry module; both variants retain identical HTML/assets. */
              handler(html) {
                return html.replace('/.native/app/main.js', entry)
              },
            },
          },
        ]
      : [],
  }
})
