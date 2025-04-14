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
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return {
    plugins: [react(), copyRedirects()],
    define: {
      __APP_ENV__: JSON.stringify(process.env.APP_ENV),
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        },
      },
    },
    server: {
      proxy: {
        '/api': {
          target: process.env.API_BASE || 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
