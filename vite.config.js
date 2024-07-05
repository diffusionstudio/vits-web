import path from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig(({ command }) => {
  let publicDir = true;
  if (command === 'build') {
    publicDir = false;
  }

  return {
    publicDir,
    build: {
      lib: {
        entry: path.resolve(__dirname, 'src/index.ts'),
        name: 'vits-web',
        formats: ['es'],
        fileName: 'vits-web'
      },
    },
    plugins: [dts()],
    server: {
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
  }
});