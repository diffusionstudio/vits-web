import path from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'vits-web',
      formats: ['es']
    },
    rollupOptions: {
      external: [
        '**/*.spec.ts',
        'onnxruntime-web'
      ],
    },
  },
  plugins: [dts({ exclude: "**/*.spec.ts" })],
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
});