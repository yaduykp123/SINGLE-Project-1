import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          darkMode: 'class',
          content: [
            './index.html',
            './src/**/*.{js,ts,jsx,tsx}',
          ],
          theme: {
            extend: {
              screens: {
                xs: '480px',
              },
              fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'sans-serif'],
                heading: ['"Outfit"', 'sans-serif'],
              },
              colors: {
                emerald: {
                  50: '#ecfdf5',
                  100: '#d1fae5',
                  500: '#10b981',
                  600: '#059669',
                  700: '#047857',
                }
              }
            },
          },
        }),
        autoprefixer(),
      ],
    },
  },
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