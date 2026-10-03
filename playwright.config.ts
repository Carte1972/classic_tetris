import { defineConfig, devices } from '@playwright/test';
import {
  E2E_RECORDS_FILE,
  PREVIEW_PORT,
  RECORDS_SERVER_PORT,
  RECORDS_SERVER_URL,
} from './tests/e2e/servers';

/** Resolución de las pruebas y capturas (16:9). */
const VIEWPORT = { width: 1280, height: 720 };

// Los tests e2e se ejecutan contra el build de producción (el mismo index.html que se
// distribuye), servido por Vite y también por el servidor de récords de los lanzadores.
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
  webServer: [
    {
      command: `npm run build && npx vite preview --port ${PREVIEW_PORT} --strictPort`,
      url: `http://localhost:${PREVIEW_PORT}`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      // Lee dist/index.html en cada petición, así que puede arrancar antes de que acabe el build.
      command: `perl launchers/records_server.pl dist ${E2E_RECORDS_FILE} --port ${RECORDS_SERVER_PORT}`,
      url: `${RECORDS_SERVER_URL}/api/records`,
      reuseExistingServer: false,
      timeout: 30_000,
    },
  ],
});
