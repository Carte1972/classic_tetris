import { describe, expect, it } from 'vitest';
import { MAX_RENDER_SCALE, MIN_RENDER_SCALE } from '../../../src/config/render_config';
import { getViewportRenderScale } from '../../../src/render/viewport_scale';

describe('getViewportRenderScale', () => {
  it('usa la escala de referencia en una ventana de 1280 × 720', () => {
    expect(getViewportRenderScale(1280, 720)).toBe(4);
  });

  it('agranda la zona de juego en pantallas más altas', () => {
    expect(getViewportRenderScale(1512, 900)).toBe(5);
    expect(getViewportRenderScale(1920, 1080)).toBe(6);
    expect(getViewportRenderScale(2560, 1440)).toBe(8);
  });

  it('se limita por el ancho si la ventana es estrecha', () => {
    expect(getViewportRenderScale(900, 1080)).toBe(4);
  });

  it('no baja del mínimo ni sube del máximo', () => {
    expect(getViewportRenderScale(200, 200)).toBe(MIN_RENDER_SCALE);
    expect(getViewportRenderScale(20000, 20000)).toBe(MAX_RENDER_SCALE);
  });
});
