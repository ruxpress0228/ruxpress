import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { config as loadEnv } from 'dotenv'
import path from 'path'

// .env 파일 로드 (VITE_ 프리픽스만 클라이언트로 노출)
loadEnv()

const API_TARGET = process.env.VITE_API_TARGET || 'http://localhost:8080'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // nginx(127.0.0.1:3000) 프록시가 붙을 수 있게 0.0.0.0에 바인딩 (Windows에서 502 방지)
    host: true,
    // npm run dev로 도커 실행 없을 경우 해당 옵션 적용함
    port: Number(process.env.VITE_PORT) || 3000,
    proxy: {
      // /api -> 백엔드
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        // 개발 서버에서도 /api 프리픽스를 그대로 유지 (rewrite 없음)
      },
    },
  },
})
