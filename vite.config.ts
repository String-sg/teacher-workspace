import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config
export default defineConfig({
  root: 'web',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '~': path.resolve(import.meta.dirname, 'web'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
