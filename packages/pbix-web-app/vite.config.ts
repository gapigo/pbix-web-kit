import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rolldownOptions: {
      external: [
        '@pbix/runtime',
        '@duckdb/duckdb-wasm',
        'duckdb-wasm-kit',
        'zustand',
        '@tanstack/react-query',
        '@tanstack/react-virtual',
        'react-router-dom',
        'recharts',
        'lucide-react',
      ],
    },
    target: 'es2022',
  },
})
