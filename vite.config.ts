import { defineConfig } from 'vite'

export default defineConfig({
  base: '/Minesweeper-2.0/',
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  build: { target: 'es2023' },
})
