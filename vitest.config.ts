import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['lib/readers/__tests__/**', 'app/**/__tests__/**'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname),
    },
  },
});
