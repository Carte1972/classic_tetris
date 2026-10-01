import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Genera un único index.html autocontenido que funciona abierto desde file://.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
});
