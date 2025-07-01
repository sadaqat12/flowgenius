import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: 'src/renderer',
  base: './',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/renderer/index.html')
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
      '@/components': path.resolve(__dirname, 'src/renderer/components'),
      '@/pages': path.resolve(__dirname, 'src/renderer/pages'),
      '@/hooks': path.resolve(__dirname, 'src/renderer/hooks'),
      '@/store': path.resolve(__dirname, 'src/renderer/store'),
      '@/types': path.resolve(__dirname, 'src/renderer/types'),
      '@/utils': path.resolve(__dirname, 'src/renderer/utils'),
      '@/shared': path.resolve(__dirname, 'src/shared')
    }
  },
  server: {
    port: 5173,
    host: 'localhost'
  }
}) 