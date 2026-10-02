import type { RenderContext } from '../../render/render_context';
import { fillEllipse, fillPixelRect, fillPolygon, withAlpha } from '../../scene/pixel_shapes';
import { drawOlympicRings } from '../../scene/olympic_rings';
import { drawPixelText, pixelTextWidth } from '../../scene/pixel_text';
import { stableRandom } from './stage_helpers';
import { STAGE_GROUND_Y, STAGE_SIZE, type Stage } from './stage_types';

/**
 * Misha, la mascota de los Juegos de Moscú 1980: oso con gran sonrisa y cinturón con
 * los aros olímpicos en la hebilla, saludando.
 * @param ctx Contexto de dibujo.
 * @param x Centro x.
 * @param baseY Fila de los pies.
 * @param timeMs Tiempo (para el saludo).
 */
function drawMisha(ctx: RenderContext, x: number, baseY: number, timeMs: number): void {
  const outline = '#2a1610';
  const fur = '#8b5a2b';
  const furShade = '#6a421c';
  const muzzle = '#e6c49a';
  // Piernas y cuerpo.
  fillEllipse(ctx, x - 7, baseY - 6, 6, 7, outline);
  fillEllipse(ctx, x + 7, baseY - 6, 6, 7, outline);
  fillEllipse(ctx, x - 7, baseY - 6, 5, 6, fur);
  fillEllipse(ctx, x + 7, baseY - 6, 5, 6, furShade);
  fillEllipse(ctx, x, baseY - 26, 15, 18, outline);
  fillEllipse(ctx, x, baseY - 26, 14, 17, fur);
  fillEllipse(ctx, x + 6, baseY - 26, 6, 15, furShade);
  fillEllipse(ctx, x, baseY - 24, 9, 11, muzzle);
  // Cinturón dorado con los aros en la hebilla.
  fillPixelRect(ctx, x - 14, baseY - 21, 28, 4, '#d9a62a');
  fillPixelRect(ctx, x - 5, baseY - 23, 10, 8, '#f2d27a');
  drawOlympicRings(ctx, x, baseY - 20, 1.6, '#f2d27a');
  // Brazos: uno saluda.
  const wave = Math.sin(timeMs / 180) * 0.5;
  fillEllipse(ctx, x - 16, baseY - 30, 4, 8, outline);
  fillEllipse(ctx, x - 16, baseY - 30, 3, 7, fur);
  const armX = x + 16 + Math.sin(wave) * 4;
  const armY = baseY - 46 - Math.cos(wave) * 2;
  fillEllipse(ctx, armX, armY, 4, 9, outline);
  fillEllipse(ctx, armX, armY, 3, 8, fur);
  // Cabeza con orejas, morro, nariz y gran sonrisa.
  const hy = baseY - 52;
  for (const ex of [-11, 11]) {
    fillEllipse(ctx, x + ex, hy - 9, 5, 5, outline);
    fillEllipse(ctx, x + ex, hy - 9, 4, 4, fur);
    fillEllipse(ctx, x + ex, hy - 9, 2, 2, furShade);
  }
  fillEllipse(ctx, x, hy, 14, 12, outline);
  fillEllipse(ctx, x, hy, 13, 11, fur);
  fillEllipse(ctx, x, hy + 4, 8, 6, muzzle);
  fillEllipse(ctx, x, hy + 1, 3, 2, '#1b1214');
  fillPixelRect(ctx, x - 5, hy - 4, 2, 3, '#1b1214');
  fillPixelRect(ctx, x + 4, hy - 4, 2, 3, '#1b1214');
  fillPolygon(
    ctx,
    [
      { x: x - 6, y: hy + 4 },
      { x: x + 6, y: hy + 4 },
      { x: x, y: hy + 9 },
    ],
    '#9e2f2a',
  );
  fillPixelRect(ctx, x - 5, hy + 4, 10, 1, '#ffffff');
}

/** Pabellón de los Juegos Olímpicos de Moscú 1980: parqué, canasta, gradas con público, aros olímpicos, marcador y Misha. */
export const ARENA_1980: Stage = {
  place: 'EN EL PABELLÓN DE MOSCÚ-80',
  draw: (ctx, timeMs) => {
    fillPixelRect(ctx, 0, 0, STAGE_SIZE.width, 100, '#2a2f44');
    // Gradas con público que se mueve.
    for (let row = 0; row < 7; row++) {
      const y = 44 + row * 8;
      fillPixelRect(ctx, 0, y + 5, STAGE_SIZE.width, 3, '#3e4560');
      for (let i = 0; i < 64; i++) {
        const x = i * 5 + (row % 2) * 2;
        const bob = Math.sin(timeMs / 150 + i * 0.7 + row) > 0.7 ? -1 : 0;
        const shirt =
          ['#d23a3a', '#f2f2f2', '#2f62c8', '#f2c23a', '#3a9a5a'][
            Math.floor(stableRandom(i, row) * 5)
          ] ?? '#d23a3a';
        fillPixelRect(ctx, x, y + 3 + bob, 3, 3, shirt);
        fillPixelRect(ctx, x + 1, y + 1 + bob, 2, 2, '#e8b48a');
      }
    }
    // Pancarta con "МОСКВА-80" y los aros olímpicos.
    fillPixelRect(ctx, 70, 6, 180, 30, '#f4f1e6');
    fillPixelRect(ctx, 70, 6, 180, 2, '#d23a3a');
    fillPixelRect(ctx, 70, 34, 180, 2, '#d23a3a');
    const text = 'МОСКВА-80';
    drawPixelText(ctx, text, 160 - pixelTextWidth(text, 2) / 2 + 30, 13, 2, '#d23a3a');
    drawOlympicRings(ctx, 102, 17, 5, '#f4f1e6');
    // Marcador.
    fillPixelRect(ctx, 270, 8, 40, 26, '#14161e');
    drawPixelText(ctx, '80', 278, 13, 3, '#f2b134');
    fillPixelRect(ctx, 272, 30, 36, 2, withAlpha('#f2b134', 0.6 + 0.4 * Math.sin(timeMs / 200)));
    // Parqué con líneas.
    fillPixelRect(ctx, 0, 100, STAGE_SIZE.width, STAGE_SIZE.height - 100, '#d9a868');
    for (let y = 100; y < STAGE_SIZE.height; y += 6) {
      fillPixelRect(ctx, 0, y, STAGE_SIZE.width, 1, '#c48f52');
    }
    fillPixelRect(ctx, 0, 106, STAGE_SIZE.width, 1, '#f4f1e6');
    fillEllipse(ctx, 160, 140, 40, 10, '#f4f1e6');
    fillEllipse(ctx, 160, 140, 38, 9, '#d9a868');
    fillPolygon(
      ctx,
      [
        { x: 250, y: 106 },
        { x: 320, y: 106 },
        { x: 320, y: 150 },
        { x: 236, y: 150 },
      ],
      withAlpha('#d23a3a', 0.35),
    );
    // Canasta.
    fillPixelRect(ctx, 296, 42, 3, 64, '#5a5a66');
    fillPixelRect(ctx, 276, 44, 26, 18, '#f4f1e6');
    fillPixelRect(ctx, 284, 52, 10, 8, '#d23a3a');
    fillPixelRect(ctx, 285, 53, 8, 6, '#f4f1e6');
    fillPixelRect(ctx, 276, 62, 14, 2, '#e8792b');
    for (let i = 0; i < 4; i++) {
      fillPixelRect(ctx, 277 + i * 3, 64, 1, 7, '#f4f1e6');
    }
    drawMisha(ctx, 40, STAGE_GROUND_Y - 2, timeMs);
  },
};
