import { describe, expect, it } from 'vitest';
import { HORIZON_Y, SCENE_HEIGHT, SCENE_WIDTH } from '../../../src/config/scene_config';
import { createGround } from '../../../src/scene/red_square/ground';
import { createGum } from '../../../src/scene/red_square/gum';
import { createKremlin } from '../../../src/scene/red_square/kremlin';
import { LAMPS, drawLamp } from '../../../src/scene/red_square/lamps';
import { createHistoricalMuseum } from '../../../src/scene/red_square/museum';
import { createStBasil } from '../../../src/scene/red_square/st_basil';
import {
  createRedSquareScene,
  type LayerContext,
  type SceneContext,
} from '../../../src/scene/red_square_scene';
import { createSkyLayout, drawSky } from '../../../src/scene/sky';
import { drawWeatherParticles } from '../../../src/scene/weather_particles';
import { createFakeContext, type FillCall } from '../render/fake_context';

/** Contexto falso de capa o de pantalla, con registro de capas dibujadas. */
function createFakeSceneContext() {
  const { ctx, calls } = createFakeContext();
  const images: { source: unknown; alpha: number; afterCalls: number }[] = [];
  const scene = Object.assign(ctx, {
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    drawImage(source: unknown) {
      images.push({ source, alpha: scene.globalAlpha, afterCalls: calls.length });
    },
  });
  return { ctx: scene as unknown as SceneContext & LayerContext, calls, images };
}

/** Comprueba que los rectángulos caen dentro de la escena. */
function expectInsideScene(calls: readonly FillCall[]): void {
  for (const call of calls) {
    expect(call.x + call.width).toBeGreaterThan(-1);
    expect(call.x).toBeLessThanOrEqual(SCENE_WIDTH);
    expect(call.y).toBeLessThanOrEqual(SCENE_HEIGHT);
  }
}

describe('edificios de la Plaza Roja', () => {
  it.each([
    ['San Basilio', createStBasil],
    ['Kremlin', createKremlin],
    ['GUM', createGum],
    ['Museo Histórico', createHistoricalMuseum],
  ])('%s se dibuja dentro de la escena y registra ventanas y tejados', (_, create) => {
    const piece = create();
    const { ctx, calls } = createFakeContext();
    piece.draw(ctx);
    expect(calls.length).toBeGreaterThan(20);
    expectInsideScene(calls);
    expect(piece.windows.length).toBeGreaterThan(0);
    expect(piece.roofs.length).toBeGreaterThan(0);
  });

  it('el suelo cubre desde el fondo de la plaza hasta abajo', () => {
    const { ctx, calls } = createFakeContext();
    createGround().draw(ctx);
    expect(Math.min(...calls.map((c) => c.y))).toBeLessThanOrEqual(HORIZON_Y);
    expect(Math.max(...calls.map((c) => c.y + c.height))).toBeGreaterThanOrEqual(SCENE_HEIGHT);
  });

  it('las farolas brillan solo cuando están encendidas y crecen al acercarse', () => {
    for (const lamp of LAMPS) {
      const off = createFakeContext();
      drawLamp(off.ctx, lamp, 0);
      const on = createFakeContext();
      drawLamp(on.ctx, lamp, 1);
      expect(on.calls.length).toBeGreaterThan(off.calls.length);
      expectInsideScene(on.calls);
    }
    const near = LAMPS.reduce((a, b) => (b.baseY > a.baseY ? b : a));
    const far = LAMPS.reduce((a, b) => (b.baseY < a.baseY ? b : a));
    expect(near.height).toBeGreaterThan(far.height);
  });
});

describe('cielo y partículas', () => {
  it('genera estrellas y nubes dentro del cielo', () => {
    const layout = createSkyLayout(4);
    expect(layout.stars.every((s) => s.y < HORIZON_Y)).toBe(true);
    expect(layout.clouds.length).toBeGreaterThan(0);
  });

  it('las estrellas solo se ven de noche', () => {
    const layout = createSkyLayout(4);
    const frame = { colors: { top: '#000000', bottom: '#111111' }, overcast: 0, timeMs: 0 };
    const day = createFakeContext();
    drawSky(day.ctx, layout, { ...frame, timeOfDay: 0.5, daylight: 1 });
    const night = createFakeContext();
    drawSky(night.ctx, layout, { ...frame, timeOfDay: 0.95, daylight: 0 });
    expect(night.calls.length).toBeGreaterThan(day.calls.length + layout.stars.length / 2);
  });

  it('la lluvia y la nieve dibujan más partículas cuanto más intensas', () => {
    const none = createFakeContext();
    drawWeatherParticles(none.ctx, 'clear', 1, 0);
    expect(none.calls).toHaveLength(0);
    const light = createFakeContext();
    drawWeatherParticles(light.ctx, 'rain', 0.2, 1000);
    const heavy = createFakeContext();
    drawWeatherParticles(heavy.ctx, 'snow', 1, 1000);
    expect(heavy.calls.length).toBeGreaterThan(light.calls.length);
    expectInsideScene(heavy.calls);
  });
});

describe('createRedSquareScene', () => {
  /** Crea una escena con capas falsas. */
  function setup() {
    const layers: ReturnType<typeof createFakeSceneContext>[] = [];
    const scene = createRedSquareScene(8, () => {
      const layer = createFakeSceneContext();
      layers.push(layer);
      return { canvas: layer as unknown as CanvasImageSource, context: layer.ctx };
    });
    return { scene, layers };
  }

  it('prepara en caché las capas de día y de noche del fondo y de San Basilio, y la de nieve', () => {
    const { layers } = setup();
    expect(layers).toHaveLength(5);
    layers.forEach((layer) => expect(layer.calls.length).toBeGreaterThan(100));
  });

  it('de día solo pinta las capas de día y de noche mezcla también las de noche', () => {
    const { scene } = setup();
    const day = createFakeSceneContext();
    scene.setConditions({ timeOfDay: 0.5, weather: 'clear' });
    scene.draw(day.ctx);
    expect(day.images).toHaveLength(2);
    const night = createFakeSceneContext();
    scene.setConditions({ timeOfDay: 0.95 });
    scene.draw(night.ctx);
    expect(night.images).toHaveLength(4);
    expect(night.images[1]?.alpha).toBe(1);
    expect(night.images[3]?.alpha).toBe(1);
  });

  it('pinta San Basilio entre la gente que pasa por detrás y la que pasa por delante', () => {
    const { scene } = setup();
    const frame = createFakeSceneContext();
    scene.setConditions({ timeOfDay: 0.5, weather: 'clear' });
    scene.draw(frame.ctx);
    const background = frame.images[0];
    const cathedral = frame.images[1];
    if (background === undefined || cathedral === undefined) {
      throw new Error('Faltan capas');
    }
    expect(cathedral.afterCalls).toBeGreaterThan(background.afterCalls);
    expect(frame.calls.length).toBeGreaterThan(cathedral.afterCalls);
  });

  it('con nieve acumulada pinta la capa de nieve; con humedad, charcos', () => {
    const { scene } = setup();
    const plain = createFakeSceneContext();
    scene.setConditions({ timeOfDay: 0.5, weather: 'clear', snowCover: 0, wetness: 0 });
    scene.draw(plain.ctx);
    const snowy = createFakeSceneContext();
    scene.setConditions({ snowCover: 0.8, wetness: 0.8 });
    scene.draw(snowy.ctx);
    expect(snowy.images.length).toBe(plain.images.length + 1);
    expect(snowy.calls.length).toBeGreaterThan(plain.calls.length);
  });

  it('avanza el tiempo y la gente', () => {
    const { scene } = setup();
    const before = createFakeSceneContext();
    scene.draw(before.ctx);
    scene.advance(60_000);
    const after = createFakeSceneContext();
    scene.draw(after.ctx);
    expect(after.calls).not.toEqual(before.calls);
  });
});
