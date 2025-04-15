import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

const copyRedirects = () => ({
  name: 'copy-redirects',
  closeBundle() {
    fs.copyFileSync('public/_redirects', 'dist/_redirects');
  }
});

export default defineConfig({
  plugins: [react(), copyRedirects()],
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
});
