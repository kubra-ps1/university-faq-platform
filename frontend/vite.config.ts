import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Docker dışından erişim için şart (0.0.0.0 yapar)
    port: 5173,
    watch: {
      usePolling: true, // Windows/WSL2 üzerinde anlık değişiklik takibi için
    },
  },
})
