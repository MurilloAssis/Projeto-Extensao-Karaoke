import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'
import process from 'node:process'

// O front chama /api e /ws no próprio endereço e o Vite repassa para a API.
// Assim só a porta do front precisa ser exposta (rede local ou túnel).
const API = process.env.API_PROXY_TARGET ?? 'http://localhost:8080'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    host: true,
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/api': { target: API, changeOrigin: true },
      '/ws': { target: API, changeOrigin: true, ws: true },
    },
  },
})
