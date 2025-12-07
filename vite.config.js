import { defineConfig } from 'vite';

export default defineConfig({
  base: '/my-2d-game/',
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
});
