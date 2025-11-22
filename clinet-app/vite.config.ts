import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  server:{
    port:3000,
   // https: true, // Use HTTP in development to avoid mixed content issues with HTTP backend
  },
  plugins: [react()],
})