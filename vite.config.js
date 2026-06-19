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
          parsers: ['jszip', 'mammoth', 'xlsx'],
          db: ['dexie'],
        },
      },
    },
  },
})
