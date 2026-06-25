import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  base: '/Ultron/',
  plugins: [react()],
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 5174,
    strictPort: true,
  },
  resolve: {
    alias: {
      // Pin to a single instance — prevents duplicate module errors with file: local deps
      'react': resolve('./node_modules/react'),
      'react-dom': resolve('./node_modules/react-dom'),
      'clsx': resolve('./node_modules/clsx'),
    },
  },
});
