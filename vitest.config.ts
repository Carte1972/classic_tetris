import { defineConfig } from 'vitest/config';

/** Umbral mínimo de cobertura (%) exigido en el motor y en el piloto automático. */
const COVERAGE_THRESHOLD = 90;

/** Umbral aplicado a las cuatro medidas de cobertura. */
const FULL_THRESHOLD = {
  statements: COVERAGE_THRESHOLD,
  branches: COVERAGE_THRESHOLD,
  functions: COVERAGE_THRESHOLD,
  lines: COVERAGE_THRESHOLD,
};

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      reporter: ['text', 'html', 'json-summary'],
      thresholds: {
        'src/engine/**': FULL_THRESHOLD,
        'src/ai/**': FULL_THRESHOLD,
      },
    },
  },
});
