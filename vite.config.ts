import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Hosted on GitHub Pages under /Memoir/. HashRouter handles client routing,
// so deep-links/refresh do not 404.
export default defineConfig({
  base: '/Memoir/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
  },
});
