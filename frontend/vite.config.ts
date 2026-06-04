import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  cacheDir: '.vite-cache',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
})
