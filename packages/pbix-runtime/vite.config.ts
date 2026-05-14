import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@duckdb/duckdb-wasm',
        'duckdb-wasm-kit',
        'zustand',
        'zustand/traditional',
        '@tanstack/react-query',
        '@tanstack/react-virtual',
        'react-router-dom',
        'recharts',
        'lucide-react',
      ],
    },
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    environment: 'node',
    globals: true,
  },
})
