// Rótulos del vídeo con la estética del juego. Cada rótulo se dibuja en función del
// tiempo (s) con `window.__rotulo.render(t)`, y el script de captura lo fotografía sobre
// fondo transparente. Los bloques y el título usan las funciones de dibujo del juego.
import { PIECE_COLORS } from '../../src/config/palette';
import { CELL_SIZE_PX } from '../../src/config/render_config';
import { PIECE_TYPES } from '../../src/config/tetromino_config';
import { TITLE_GLYPHS, TITLE_LETTER_SPACING } from '../../src/config/title_config';
import { getPieceOffsets } from '../../src/engine/tetrominoes';
import type { PieceType } from '../../src/engine/types';
import { drawBlock } from '../../src/render/draw_block';
import {
  AUTOPILOT_BUTTON_BOX,
  AUTOPILOT_LABEL_AT,
  AUTOPILOT_POINT_AT,
  CONTROL_STEPS,
  type ControlStep,
} from '../scripts/linea_controles';

/** Rótulo: crea su contenido y lo actualiza en cada instante. */
interface Rotulo {
  readonly render: (t: number) => void;
  /** Instantes (s) de los sucesos con sonido, como la caída de cada letra del título. */
  readonly eventos?: readonly number[];
}

/** Celda ocupada en las letras del título. */
const FILLED = '#';

/** Letras del título, en orden. */
const TITLE = 'ТЕТРИС';

/** Momento en que cae cada letra del título animado (s) y lo que tarda en caer. */
const TITLE_LETTER_DELAY_S = 0.42;
const TITLE_FIRST_LETTER_S = 0.5;
const TITLE_FALL_S = 0.5;

/** Escala de los píxeles lógicos del título en pantalla. */
const TITLE_SCALE = 5;

/**
 * Crea un lienzo pixel-art de un tamaño lógico mostrado a una escala entera.
 * @param width Ancho lógico.
 * @param height Alto lógico.
 * @param scale Escala.
 * @returns El lienzo y su contexto.
 */
function pixelCanvas(
  width: number,
  height: number,
  scale: number,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${width * scale}px`;
  canvas.style.height = `${height * scale}px`;
  canvas.className = 'pixel';
  const ctx = canvas.getContext('2d');
  if (ctx === null) {
    throw new Error('Sin contexto 2D');
  }
  return { canvas, ctx };
}

/**
 * Letras del título con su columna inicial (en celdas).
 * @returns Letras con su dibujo y columna.
 */
function titleLetters(): { glyph: readonly string[]; column: number; type: PieceType }[] {
  let column = 0;
  return [...TITLE].map((letter, index) => {
    const glyph = TITLE_GLYPHS[letter] ?? [];
    const entry = { glyph, column, type: PIECE_TYPES[index % PIECE_TYPES.length] ?? 'T' };
    column += (glyph[0]?.length ?? 0) + TITLE_LETTER_SPACING;
    return entry;
  });
}

/**
 * Dibuja el título con su esquina superior izquierda en (x, y); cada letra cae desde
 * encima del lienzo, acelerando, hasta su sitio.
 * @param ctx Contexto.
 * @param x Columna izquierda (px lógicos).
 * @param y Fila superior (px lógicos).
 * @param t Tiempo (s); `Infinity` para el título ya formado.
 */
function drawFallingTitle(ctx: CanvasRenderingContext2D, x: number, y: number, t: number): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const fallFrom = -(y + 5 * CELL_SIZE_PX);
  titleLetters().forEach((letter, index) => {
    const start = TITLE_FIRST_LETTER_S + index * TITLE_LETTER_DELAY_S;
    if (t < start) {
      return;
    }
    const progress = Math.min(1, (t - start) / TITLE_FALL_S);
    const offset = Math.round(fallFrom * (1 - progress * progress));
    letter.glyph.forEach((row, gy) => {
      [...row].forEach((cell, gx) => {
        if (cell === FILLED) {
          drawBlock(
            ctx,
            x + (letter.column + gx) * CELL_SIZE_PX,
            y + offset + gy * CELL_SIZE_PX,
            PIECE_COLORS[letter.type],
          );
        }
      });
    });
  });
}

/**
 * Instantes en que cae cada letra del título (para el efecto de pieza fijada).
 * @returns Segundos.
 */
function titleLandings(): number[] {
  return [...TITLE].map(
    (_, index) => TITLE_FIRST_LETTER_S + index * TITLE_LETTER_DELAY_S + TITLE_FALL_S,
  );
}

/** Ancho lógico del título en píxeles. */
function titleWidth(): number {
  const letters = titleLetters();
  const last = letters[letters.length - 1];
  return last === undefined ? 0 : (last.column + (last.glyph[0]?.length ?? 0)) * CELL_SIZE_PX;
}

/**
 * Coloca un elemento en posición absoluta.
 * @param element Elemento.
 * @param style Estilos.
 * @returns El elemento.
 */
function place<T extends HTMLElement>(element: T, style: Partial<CSSStyleDeclaration>): T {
  Object.assign(element.style, style);
  return element;
}

/**
 * Crea un panel con texto HTML.
 * @param html Contenido.
 * @param style Posición y tamaño.
 * @returns El panel.
 */
function panel(html: string, style: Partial<CSSStyleDeclaration>): HTMLDivElement {
  const div = document.createElement('div');
  div.className = 'panel';
  div.innerHTML = html;
  return place(div, style);
}

/**
 * Título animado de la apertura: ТЕТРИС formándose con bloques que caen.
 * @param root Contenedor.
 * @returns Rótulo.
 */
function rotuloTitulo(root: HTMLElement): Rotulo {
  const width = 1920 / TITLE_SCALE;
  const height = 1080 / TITLE_SCALE;
  const { canvas, ctx } = pixelCanvas(width, height, TITLE_SCALE);
  root.append(place(canvas, { position: 'absolute', left: '0', top: '0' }));
  const x = Math.round((width - titleWidth()) / 2);
  const y = Math.round(height * 0.3);
  return { render: (t) => drawFallingTitle(ctx, x, y, t), eventos: titleLandings() };
}

/**
 * Rótulo de fecha y lugar (escena 2).
 * @param root Contenedor.
 * @param text Texto.
 * @returns Rótulo.
 */
function rotuloFecha(root: HTMLElement, text: string): Rotulo {
  root.append(
    panel(`<span class="titulo-grande acento">${text}</span>`, { left: '96px', bottom: '96px' }),
  );
  return { render: () => undefined };
}

/**
 * Las 7 piezas del juego en dos filas, con sus colores.
 * @param root Contenedor.
 * @returns Rótulo.
 */
function rotuloPiezas(root: HTMLElement): Rotulo {
  const scale = 3;
  const cell = CELL_SIZE_PX;
  const { canvas, ctx } = pixelCanvas(cell * 20, cell * 7, scale);
  const rows: PieceType[][] = [
    ['I', 'O', 'T', 'S'],
    ['Z', 'J', 'L'],
  ];
  rows.forEach((row, r) => {
    row.forEach((type, i) => {
      const offsets = getPieceOffsets(type, 0);
      const minX = Math.min(...offsets.map((o) => o.x));
      const minY = Math.min(...offsets.map((o) => o.y));
      offsets.forEach((o) => {
        drawBlock(
          ctx,
          (i * 5 + (r === 1 ? 2 : 0) + o.x - minX) * cell,
          (r * 4 + o.y - minY) * cell,
          PIECE_COLORS[type],
        );
      });
    });
  });
  const box = panel('<div class="tenue" style="font-size:30px;margin-bottom:20px">7 PIEZAS</div>', {
    left: '1292px',
    top: '400px',
  });
  box.append(canvas);
  root.append(box);
  return { render: () => undefined };
}

/**
 * Objetivo de líneas por nivel (escena 3).
 * @param root Contenedor.
 * @returns Rótulo.
 */
function rotuloObjetivo(root: HTMLElement): Rotulo {
  root.append(
    panel(
      '<div class="tenue" style="font-size:30px">OBJETIVO DE LÍNEAS</div><div class="titulo-grande acento" style="margin-top:12px">10 → 12 → 14…</div>',
      { left: '1292px', top: '420px' },
    ),
  );
  return { render: () => undefined };
}

/**
 * Filas de la tabla de controles: teclas que la resaltan, símbolo y acción. La del piloto
 * automático no tiene tecla: se resalta desde que la narración habla del botón.
 */
const CONTROL_ROWS: readonly {
  keys: readonly ControlStep['key'][];
  label: string;
  action: string;
  from?: number;
}[] = [
  { keys: ['ArrowLeft', 'ArrowRight'], label: '← →', action: 'MOVER' },
  { keys: ['ArrowDown'], label: '↓', action: 'BAJAR' },
  { keys: ['ArrowUp'], label: '↑', action: 'GIRAR' },
  { keys: ['KeyZ'], label: 'Z', action: 'GIRAR AL REVÉS' },
  { keys: ['KeyP'], label: 'P', action: 'PAUSA' },
  { keys: [], label: 'BOTÓN', action: 'PILOTO AUTOMÁTICO', from: AUTOPILOT_POINT_AT },
];

/** Periodo del parpadeo del recuadro que señala el botón del piloto (s). */
const POINTER_BLINK_S = 0.4;

/** Margen del recuadro alrededor del botón del piloto (px). */
const POINTER_MARGIN_PX = 8;

/** Color de acento de la interfaz del juego. */
const ACCENT = '#f2b134';

/** Color de los paneles de la interfaz del juego. */
const PANEL = '#0b0d17';

/**
 * Señales del piloto automático sobre la grabación: durante la frase 4.4, un recuadro y
 * una flecha que parpadean alrededor del botón; durante la 4.5, una etiqueta debajo con
 * qué es y qué algoritmo lo gobierna.
 * @param root Contenedor.
 * @returns Función que muestra u oculta las señales en cada instante.
 */
function autopilotPointer(root: HTMLElement): (t: number) => void {
  const box = AUTOPILOT_BUTTON_BOX;
  const frame = place(document.createElement('div'), {
    position: 'absolute',
    left: `${box.x - POINTER_MARGIN_PX}px`,
    top: `${box.y - POINTER_MARGIN_PX}px`,
    width: `${box.width + POINTER_MARGIN_PX * 2}px`,
    height: `${box.height + POINTER_MARGIN_PX * 2}px`,
    border: `6px solid ${ACCENT}`,
    boxSizing: 'border-box',
  });
  const arrow = place(document.createElement('div'), {
    position: 'absolute',
    left: `${box.x - 110}px`,
    top: `${box.y + box.height / 2 - 40}px`,
    fontSize: '72px',
    lineHeight: '80px',
    color: ACCENT,
    textShadow: `4px 4px 0 ${PANEL}`,
  });
  arrow.textContent = '▶';
  const label = panel(
    '<div class="acento" style="font-size:30px">IA SIMBÓLICA</div><div style="font-size:30px;margin-top:8px">ALGORITMO DE DELLACHERIE</div>',
    { left: '120px', top: `${box.y + box.height + 36}px` },
  );
  root.append(frame, arrow, label);
  return (t) => {
    const pointing = t >= AUTOPILOT_POINT_AT && t < AUTOPILOT_LABEL_AT;
    const lit = Math.floor((t - AUTOPILOT_POINT_AT) / POINTER_BLINK_S) % 2 === 0;
    frame.style.visibility = pointing && lit ? 'visible' : 'hidden';
    arrow.style.visibility = pointing && lit ? 'visible' : 'hidden';
    label.style.visibility = t >= AUTOPILOT_LABEL_AT ? 'visible' : 'hidden';
  };
}

/** Tiempo que una fila sigue resaltada tras pulsar su tecla (s). */
const HIGHLIGHT_S = 0.45;

/**
 * Tabla de teclas que resalta la fila de cada tecla al pulsarla en el extracto.
 * @param root Contenedor.
 * @returns Rótulo.
 */
function rotuloControles(root: HTMLElement): Rotulo {
  const box = panel(
    '<div class="tenue" style="font-size:30px;margin-bottom:18px">CONTROLES</div>',
    { left: '1262px', top: '340px', width: '540px' },
  );
  const rows = CONTROL_ROWS.map((row) => {
    const line = document.createElement('div');
    line.style.display = 'grid';
    line.style.gridTemplateColumns = '130px 1fr';
    line.style.fontSize = '32px';
    line.style.padding = '10px 14px';
    line.innerHTML = `<span class="acento">${row.label}</span><span>${row.action}</span>`;
    box.append(line);
    return { row, line };
  });
  root.append(box);
  const showPointer = autopilotPointer(root);
  return {
    render: (t) => {
      showPointer(t);
      rows.forEach(({ row, line }) => {
        const pressed = CONTROL_STEPS.some((step) => {
          const end = step.at + Math.max(HIGHLIGHT_S, step.hold ?? 0);
          return row.keys.includes(step.key) && t >= step.at && t < end;
        });
        const active = pressed || (row.from !== undefined && t >= row.from);
        line.style.background = active ? ACCENT : 'transparent';
        line.style.color = active ? PANEL : '';
        const label = line.firstElementChild as HTMLElement | null;
        if (label !== null) {
          label.style.color = active ? PANEL : '';
        }
      });
    },
  };
}

/**
 * Nombre de un evento de la plaza (escena 5).
 * @param root Contenedor.
 * @param text Nombre.
 * @returns Rótulo.
 */
function rotuloEvento(root: HTMLElement, text: string): Rotulo {
  const box = panel(`<span class="titulo-grande">${text}</span>`, {
    left: '50%',
    top: '72px',
    transform: 'translateX(-50%)',
    whiteSpace: 'nowrap',
  });
  root.append(box);
  return { render: () => undefined };
}

/**
 * Cierre: título, URL del repositorio y aviso de homenaje independiente.
 * @param root Contenedor.
 * @returns Rótulo.
 */
function rotuloCierre(root: HTMLElement): Rotulo {
  const { canvas, ctx } = pixelCanvas(titleWidth(), 5 * CELL_SIZE_PX, TITLE_SCALE);
  drawFallingTitle(ctx, 0, 0, Number.POSITIVE_INFINITY);
  const box = panel('', {
    left: '50%',
    top: '240px',
    transform: 'translateX(-50%)',
    textAlign: 'center',
    padding: '48px 64px',
  });
  box.append(canvas);
  box.insertAdjacentHTML(
    'beforeend',
    '<div class="acento" style="font-size:44px;margin-top:40px;text-transform:none">github.com/Carte1972/classic_tetris</div>' +
      '<div class="tenue" style="font-size:30px;margin-top:36px;text-transform:none;letter-spacing:0.04em">ТЕТРИС es un homenaje independiente.</div>',
  );
  root.append(box);
  return { render: () => undefined };
}

/**
 * Miniatura del vídeo (1280 × 720): título sobre la plaza y un pozo con piezas.
 * @param root Contenedor.
 * @param background Imagen de fondo (fotograma de la plaza).
 * @returns Rótulo.
 */
function rotuloMiniatura(root: HTMLElement, background: string): Rotulo {
  root.style.width = '1280px';
  root.style.height = '720px';
  const img = place(document.createElement('img'), {
    position: 'absolute',
    inset: '0',
    width: '1280px',
    height: '720px',
    imageRendering: 'pixelated',
  });
  img.src = background;
  root.append(img);
  // Pozo con una pila de piezas y una T cayendo.
  const cell = CELL_SIZE_PX;
  const { canvas, ctx } = pixelCanvas(10 * cell, 14 * cell, 3);
  ctx.fillStyle = '#0b0d17';
  ctx.fillRect(0, 0, 10 * cell, 14 * cell);
  const stack = [
    '....TTT...',
    '.....T....',
    '',
    '',
    '',
    '',
    '',
    'J.......OO',
    'JJJ.SS..OO',
    'IIIISSZZLL',
    'OOTTTZZLL.',
    'OOLTJJJSSI',
    'ZZLLLJSSOI',
  ];
  stack.forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c !== '.' && c !== '') {
        drawBlock(ctx, x * cell, (y + 1) * cell, PIECE_COLORS[c as PieceType]);
      }
    });
  });
  const board = place(canvas, {
    position: 'absolute',
    left: '520px',
    top: '300px',
    border: '4px solid #3a3f5c',
  });
  root.append(board);
  const title = pixelCanvas(titleWidth(), 5 * cell, 3);
  drawFallingTitle(title.ctx, 0, 0, Number.POSITIVE_INFINITY);
  const box = panel('', {
    left: '50%',
    top: '60px',
    transform: 'translateX(-50%)',
    padding: '28px 40px',
  });
  box.append(title.canvas);
  root.append(box);
  return { render: () => undefined };
}

/** Rótulos por nombre. */
const ROTULOS: Readonly<Record<string, (root: HTMLElement, params: URLSearchParams) => Rotulo>> = {
  titulo: rotuloTitulo,
  fecha_1984: (root) => rotuloFecha(root, 'MOSCÚ · 1984'),
  fecha_1989: (root) => rotuloFecha(root, '1989 · GAME BOY Y NES'),
  piezas: rotuloPiezas,
  objetivo: rotuloObjetivo,
  controles: rotuloControles,
  evento: (root, params) => rotuloEvento(root, params.get('texto') ?? ''),
  cierre: rotuloCierre,
  miniatura: (root, params) => rotuloMiniatura(root, params.get('fondo') ?? ''),
};

declare global {
  interface Window {
    /** Rótulo cargado, para el script de captura. */
    __rotulo?: Rotulo;
  }
}

const params = new URLSearchParams(location.search);
const root = document.getElementById('rotulo');
const create = ROTULOS[params.get('nombre') ?? ''];
if (root !== null && create !== undefined) {
  window.__rotulo = create(root, params);
  window.__rotulo.render(0);
}
