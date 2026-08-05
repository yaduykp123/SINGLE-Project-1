import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  build: {
    // ✅ Code splitting chunks
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
          'vendor-ui': ['lucide-react', 'react-hot-toast'],
        },
      },
    },
    // ✅ Minify better with esbuild
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger'],
    },
    // ✅ Enable brotli compression
    brotliSize: true,
  },
})