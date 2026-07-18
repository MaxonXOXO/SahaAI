import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/openai-realtime': {
          target: 'wss://api.openai.com',
          ws: true,
          changeOrigin: true,
          secure: true,
          headers: {
            'Authorization': `Bearer ${env.VITE_OPENAI_API_KEY || ''}`
          },
          rewrite: (path) => path.replace(/^\/openai-realtime/, '')
        }
      }
    }
  };
})
