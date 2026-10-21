import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // The admin host serves the overlay under /overlay/.
  base: '/overlay/',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 4174,
  },
  preview: {
    host: '127.0.0.1',
    port: 4174,
  },
});
