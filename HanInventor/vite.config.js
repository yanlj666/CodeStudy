import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/api/dashscope': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dashscope/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // 添加必要的请求头
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
          });
        }
      }
    }
  }
})
