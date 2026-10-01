import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config';

// Configuración de `npm run screenshots`: genera las capturas del README en
// docs/screenshots/ con el mismo build y servidor que los tests e2e.
export default defineConfig({
  ...base,
  testDir: 'tests/screenshots',
  fullyParallel: false,
  workers: 1,
  projects: [
    {
      name: 'screenshots',
      use: { ...devices['Desktop Chrome'], viewport: base.use?.viewport ?? null },
    },
  ],
});
