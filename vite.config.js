import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  envDir: '..', // 👈 Tells Vite to look for .env in the parent/root folder
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
