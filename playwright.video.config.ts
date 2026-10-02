import { defineConfig, devices } from '@playwright/test';

/** Puerto del servidor de desarrollo para las páginas auxiliares del vídeo (audio y rótulos). */
const DEV_PORT = 5175;

/** Puerto del build de producción, contra el que se graban los extractos del juego. */
export const VIDEO_PREVIEW_PORT = 4176;

/** Resolución del vídeo. */
export const VIDEO_VIEWPORT = { width: 1920, height: 1080 };

// Configuración de `npm run video`: renderiza el audio, graba los extractos del juego y
// captura los rótulos (todo en video/), con Chromium.
export default defineConfig({
  testDir: 'video/scripts',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 600_000,
  use: {
    baseURL: `http://localhost:${DEV_PORT}`,
    viewport: VIDEO_VIEWPORT,
  },
  projects: [
    {
      name: 'video',
      use: { ...devices['Desktop Chrome'], viewport: VIDEO_VIEWPORT, deviceScaleFactor: 1 },
    },
  ],
  webServer: [
    {
      command: `npx vite --port ${DEV_PORT} --strictPort`,
      url: `http://localhost:${DEV_PORT}/video/paginas/audio.html`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npm run build && npx vite preview --port ${VIDEO_PREVIEW_PORT} --strictPort`,
      url: `http://localhost:${VIDEO_PREVIEW_PORT}`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
