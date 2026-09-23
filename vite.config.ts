import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';

// The version shown in bug reports: the commit the site was built from
try {
  process.env.VITE_APP_VERSION ??= execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  // not a git checkout
}

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    open: true,
  },
});
