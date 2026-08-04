import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // The only remaining large files are deferred feature routes (Math Helper
    // and AAC Board), not the startup bundle. Keep the warning useful without
    // flagging those intentional, on-demand bundles.
    chunkSizeWarningLimit: 1400,
  },
});
