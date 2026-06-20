import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          animation: ['framer-motion', 'canvas-confetti'],
          parsers: ['jszip', 'xlsx', 'mammoth/mammoth.browser.js'],
          db: ['dexie'],
        },
      },
    },
  },
  optimizeDeps: {
    // mammoth는 큰 라이브러리 — pre-bundle로 dev 속도 개선
    include: ['mammoth/mammoth.browser.js'],
  },
})
