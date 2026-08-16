import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 7573,
    proxy: {
      '/api': 'http://localhost:7400',
    },
  },
});
