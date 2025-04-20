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
        mode === 'production'
          ? 'https://www.capitaltracker.app/api'
          : env.VITE_API_BASE || 'http://localhost:3001/api'
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
      },
    },
  };
});
