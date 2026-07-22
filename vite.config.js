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
        },
        // Proxy Gemini API calls server-side to avoid CORS and keep key hidden
        '/gemini-api': {
          target: 'https://generativelanguage.googleapis.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/gemini-api/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              // Inject the API key as a query param server-side
              const url = proxyReq.path;
              const sep = url.includes('?') ? '&' : '?';
              proxyReq.path = `${url}${sep}key=${env.VITE_GEMINI_API_KEY || ''}`;
            });
          }
        },
        // Proxy Cloudflare Workers AI calls to hide token and avoid CORS
        '/cf-ai': {
          target: 'https://api.cloudflare.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/cf-ai/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('Authorization', `Bearer ${env.VITE_CF_API_TOKEN || ''}`);
            });
          }
        }
      }
    }
  };
})
