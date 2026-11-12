import { fileURLToPath, URL } from 'node:url'

import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const BACKEND = process.env.VITE_BACKEND_ORIGIN ?? 'http://localhost:8080'
const GO2RTC = process.env.VITE_GO2RTC_ORIGIN ?? 'http://localhost:1984'
// 녹화 재생은 MediaMTX 가 직접 내보낸다. 영상처럼 백엔드를 거치지 않는다
const PLAYBACK = process.env.VITE_PLAYBACK_ORIGIN ?? 'http://localhost:9996'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': { target: BACKEND, changeOrigin: true },
      // changeOrigin 을 켜면 WebSocket 업그레이드가 ECONNABORTED 로 끊긴다
      '/go2rtc': {
        target: GO2RTC,
        ws: true,
        rewrite: (path) => path.replace(/^\/go2rtc/, ''),
      },
      '/playback': {
        target: PLAYBACK,
        rewrite: (path) => path.replace(/^\/playback/, ''),
      },
    },
  },
})
