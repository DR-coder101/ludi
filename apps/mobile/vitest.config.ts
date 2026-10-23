import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    {
      name: 'stub-mp3',
      enforce: 'pre',
      resolveId(source) {
        if (source.split('?')[0].endsWith('.mp3')) {
          return `\0stub-mp3:${source}`;
        }
      },
      load(id) {
        if (id.startsWith('\0stub-mp3:')) {
          return 'export default "theme.mp3";';
        }
      },
    },
  ],
});
