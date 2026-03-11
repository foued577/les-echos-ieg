import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    target: 'es2015'
  },
  define: {
    'import.meta.env': {
      VITE_API_URL: process.env.NODE_ENV === 'production' 
        ? 'https://les-echos-ieg.onrender.com/api' 
        : (process.env.VITE_API_URL || 'http://localhost:5000/api')
    }
  }
});