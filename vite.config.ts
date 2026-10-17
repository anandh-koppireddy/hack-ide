import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Replace 'hack-ide' with your exact repo name if different
export default defineConfig({
  plugins: [react()],
  base: '/hack-ide/',
});