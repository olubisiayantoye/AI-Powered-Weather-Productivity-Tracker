import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    envDir: resolve(__dirname), // Critical fix
    root: resolve(__dirname, 'src'),
    publicDir: resolve(__dirname, 'public'),
    build: {
        outDir: resolve(__dirname, 'dist'),
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'src/index.html')
            }
        }
    },
    server: {
        port: 5173
    },
    optimizeDeps: {
        include: ['localforage', 'axios']
    },
   
});