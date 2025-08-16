// 📁 frontend/vite.config.js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

const copyRedirects = () => ({
  name: 'copy-redirects',
  closeBundle() {
    fs.copyFileSync('public/_redirects', 'dist/_redirects');
  }
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/', // ✅ necesario para dominios personalizados como capitaltracker.app
    plugins: [react(), copyRedirects()],
    define: {
      __API_BASE__: JSON.stringify(
        env.VITE_API_BASE 
          || (mode === 'production' 
                ? 'https://www.capitaltracker.app/api' 
                : '/api') // ✅ dev uses Vite proxy
      )
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        },
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
                // Put all third-party deps into a single vendor chunk to avoid
                // circular import ordering issues in production builds.
                return 'vendor';
              }
          }
        }
      },
    },
  };
});
