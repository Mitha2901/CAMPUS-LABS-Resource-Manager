import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
<<<<<<< HEAD
import {viteSingleFile} from 'vite-plugin-singlefile';

export default defineConfig(({ command }) => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      command === 'build' ? viteSingleFile() : null
    ].filter(Boolean),
=======

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
>>>>>>> c913b0e1f5a3147bd12e65191d3779a45abf9ace
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
