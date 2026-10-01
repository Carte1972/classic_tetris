import { defineConfig, devices } from '@playwright/test';

/** Puerto del servidor de vista previa del build de producción. */
const PREVIEW_PORT = 4173;

/** Resolución de las pruebas y capturas (16:9). */
const VIEWPORT = { width: 1280, height: 720 };

// Los tests e2e se ejecutan contra el build de producción (el mismo index.html que se distribuye).
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PREVIEW_PORT}`,
    viewport: VIEWPORT,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: VIEWPORT } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: VIEWPORT } },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${PREVIEW_PORT} --strictPort`,
    url: `http://localhost:${PREVIEW_PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
