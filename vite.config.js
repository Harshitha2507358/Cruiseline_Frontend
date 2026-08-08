import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev server runs on 5173 — the origin the backend gateway already allows in CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
})
