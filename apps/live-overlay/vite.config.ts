import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative asset paths: the admin host serves the overlay under /overlay/,
  // and the screens check serves the build from the root.
  base: './',
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
