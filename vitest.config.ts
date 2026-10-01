import { defineConfig } from 'vitest/config';

/** Umbral mínimo de cobertura (%) exigido en el motor. */
const ENGINE_COVERAGE_THRESHOLD = 90;

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      reporter: ['text', 'html', 'json-summary'],
      thresholds: {
        'src/engine/**': {
          statements: ENGINE_COVERAGE_THRESHOLD,
          branches: ENGINE_COVERAGE_THRESHOLD,
          functions: ENGINE_COVERAGE_THRESHOLD,
          lines: ENGINE_COVERAGE_THRESHOLD,
        },
      },
    },
  },
});
