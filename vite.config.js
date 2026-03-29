import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // tells Vite to inject a fake `process.env` so Babel packages don't crash
    'process.env': {},
    'process.env.NODE_ENV': '"production"',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.js',
  },
})