import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      mermaid: path.resolve(dir, 'node_modules/mermaid'),
      dompurify: path.resolve(dir, 'node_modules/dompurify'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
});
