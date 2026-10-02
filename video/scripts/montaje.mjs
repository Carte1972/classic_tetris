// Monta el vídeo explicativo con ffmpeg: cada escena del guion (video/guion.md) con sus
// tramos de grabación y sus rótulos, y la mezcla de narración, música y efectos con la
// música bajando bajo la voz y el volumen final normalizado a −16 LUFS.
//
// Uso: node video/scripts/montaje.mjs
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const path = (relative) => new URL(relative, root).pathname;

/** Fotogramas por segundo y tamaño del vídeo. */
const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;

/** Frecuencia de muestreo del audio final (Hz). */
const SAMPLE_RATE = 48000;

/** Volumen integrado objetivo (LUFS) y pico verdadero máximo (dBTP). */
const TARGET_LUFS = -16;
const TRUE_PEAK = -1.5;

/** Fundido corto entre escenas y de los rótulos (s). */
const SCENE_FADE_S = 0.25;
const ROTULO_FADE_S = 0.3;

/** Volúmenes (dB) de la música y de cada efecto antes de normalizar. */
const MUSIC_DB = -6.5;
const SFX_DB = {
  lock: -14,
  move: -16,
  rotate: -16,
  lineClear: -7,
  tetris: -5,
  levelUp: -7,
  gameOver: -6,
};

/** Bajada de la música bajo la voz (ducking): umbral, proporción y tiempos. */
const DUCKING = 'threshold=0.015:ratio=10:attack=20:release=450:makeup=1';

/** Carpetas. */
const CLIPS = path('video/extractos/');
const AUDIO = path('video/audio/');
const ROTULOS = path('video/tmp/rotulos/');
const WORK = path('video/tmp/montaje/');
const OUTPUT = path('video/salida/tetris_video_explicativo.mp4');

/**
 * Ejecuta ffmpeg y falla mostrando su error.
 * @param {string[]} args Argumentos.
 * @returns {string} Salida de error (ffmpeg informa por ahí).
 */
function ffmpeg(args) {
  const result = spawnSync('ffmpeg', ['-y', '-hide_banner', ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`ffmpeg falló:\n${result.stderr.slice(-3000)}`);
  }
  return result.stderr;
}

/**
 * Lee un JSON.
 * @param {string} file Archivo.
 * @returns {any} Contenido.
 */
function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

/**
 * Inicio y fin de una frase de la narración dentro de su archivo de escena.
 * @param {number} escena Escena.
 * @param {string} id Frase.
 * @returns {{ inicio: number, fin: number }} Tiempos (s).
 */
function frase(escena, id) {
  const data = readJson(`${AUDIO}narracion_${String(escena).padStart(2, '0')}.json`);
  const found = data.frases.find((f) => f.id === id);
  if (found === undefined) {
    throw new Error(`Falta la frase ${id}`);
  }
  return found;
}

/**
 * @typedef {object} Tramo
 * @property {string} [clip] Extracto (sin extensión); si falta, es un tramo en negro.
 * @property {number} desde Segundo del extracto donde empieza.
 * @property {number} en Segundo de la escena donde empieza.
 * @property {number} dur Duración (s).
 * @property {boolean} [fundidoEntrada] Fundido desde negro al empezar.
 * @property {boolean} [fundidoSalida] Fundido a negro al acabar.
 */

/**
 * @typedef {object} Superposicion
 * @property {string} archivo Rótulo PNG o carpeta de fotogramas (animado).
 * @property {number} en Segundo de la escena donde aparece.
 * @property {number} hasta Segundo donde desaparece.
 */

/**
 * @typedef {object} Escena
 * @property {number} numero Número de la escena del guion.
 * @property {number} duracion Duración (s).
 * @property {number | null} voz Segundo de la escena donde empieza su narración.
 * @property {Tramo[]} tramos Grabaciones (o negro), en orden.
 * @property {Superposicion[]} rotulos Rótulos.
 * @property {{ efecto: string, en: number }[]} [efectos] Efectos fijados a mano.
 */

/**
 * Primer suceso de un tipo en un extracto.
 * @param {string} clip Extracto.
 * @param {string} tipo Tipo de suceso.
 * @param {string} [detalle] Detalle (por ejemplo, la tecla).
 * @returns {number} Instante (s).
 */
function suceso(clip, tipo, detalle) {
  const found = readJson(`${CLIPS}${clip}.json`).eventos.find(
    (e) => e.tipo === tipo && (detalle === undefined || e.detalle === detalle),
  );
  if (found === undefined) {
    throw new Error(`El extracto ${clip} no tiene el suceso ${tipo}`);
  }
  return found.t;
}

/** Comienzo de la voz de cada escena (s desde el principio de la escena). */
const VOZ = { 2: 0.8, 3: 0.5, 4: 1.0, 5: 0.4, 6: 0.3, 7: 0.8 };

/** Margen después de la última frase de una escena (s). */
const COLA = { 2: 1.0, 3: 1.6, 4: 0, 5: 0, 6: 1.2, 7: 0 };

/** Duración de cada evento en el montaje de la escena 5 (s). */
const EVENTO_S = 2.95;

/**
 * Escenas del guion aprobado. Los tiempos se calculan a partir de la narración real
 * (frases) y de los sucesos de las grabaciones, para que cada frase clave coincida con
 * lo que se ve: el destello de 4 líneas con «¡Muchos más puntos!», el fin de la partida
 * con «…se acabó», el 10 / 10 con el final de la frase del objetivo, etc.
 * @returns {Escena[]} Escenas.
 */
function escenas() {
  const titulo = readJson(`${ROTULOS}rotulo_titulo.json`);
  /** Instante de una frase dentro de su escena (inicio o fin). */
  const f = (escena, id, punto = 'inicio') => VOZ[escena] + frase(escena, id)[punto];
  /** Duración de una escena: hasta el final de su última frase más su margen. */
  const fin = (escena, ultima) => f(escena, ultima, 'fin') + COLA[escena];

  // Escena 2: amanecer, corte a la partida en «¡Tetris!», día y atardecer.
  const tetris = f(2, '2.3') - 0.1;
  const dia = tetris + 2;
  const atardecer = f(2, '2.5') - 0.1;
  const d2 = fin(2, '2.5');

  // Escena 3: cada tramo cambia justo antes de su frase.
  const cuatro = f(3, '3.4') - 0.1;
  const cuidado = f(3, '3.5') - 0.3;
  const objetivo = f(3, '3.6') - 0.3;
  const dificultad = f(3, '3.9') - 0.1;
  const d3 = fin(3, '3.9');
  // El fin de la partida aparece en «…se acabó»; el 10 / 10, al acabar la frase 3.6.
  const finEn = f(3, '3.5', 'fin') - 0.6;
  const finDesde = suceso('extracto_fin_partida', 'gameOver') - (finEn - cuidado);
  const metaEn = f(3, '3.6', 'fin') - 0.2;
  const metaDesde = suceso('extracto_objetivo_nivel', 'lineClear') - (metaEn - objetivo);

  // Escena 4: dura lo que la grabación de controles necesita para enseñar todas las teclas.
  const d4 = 16.5;

  // Escena 5: tras la primera frase, los seis eventos.
  const eventos = ['desfile', 'pascua', 'navidad', 'fuegos', 'maslenitsa', 'olimpiadas'];
  const eventosEn = f(5, '5.1', 'fin') + 0.15;
  const d5 = Math.max(eventosEn + eventos.length * EVENTO_S, fin(5, '5.2') + 0.6);

  // Escena 6: la I completa el nivel, el cosaco en la prisiadka, fundido y récords.
  const d6 = fin(6, '6.4');

  return [
    {
      numero: 1,
      duracion: 5.5,
      voz: null,
      tramos: [{ clip: 'extracto_plaza_titulo', desde: 0, en: 0, dur: 5.5 }],
      rotulos: [{ archivo: 'rotulo_titulo', en: 0, hasta: 5.5 }],
      efectos: titulo.eventos.map((t) => ({ efecto: 'lock', en: t })),
    },
    {
      numero: 2,
      duracion: d2,
      voz: VOZ[2],
      tramos: [
        { clip: 'extracto_plaza_dia_noche', desde: 0, en: 0, dur: tetris },
        { clip: 'extracto_partida_en_curso', desde: 2, en: tetris, dur: 2 },
        { clip: 'extracto_plaza_dia_noche', desde: 11.2, en: dia, dur: atardecer - dia },
        { clip: 'extracto_plaza_dia_noche', desde: 18, en: atardecer, dur: d2 - atardecer },
      ],
      rotulos: [
        { archivo: 'rotulo_fecha_1984.png', en: VOZ[2], hasta: f(2, '2.2', 'fin') },
        { archivo: 'rotulo_fecha_1989.png', en: f(2, '2.4'), hasta: f(2, '2.4', 'fin') + 0.3 },
      ],
    },
    {
      numero: 3,
      duracion: d3,
      voz: VOZ[3],
      tramos: [
        { clip: 'extracto_partida_en_curso', desde: 0, en: 0, dur: cuatro },
        { clip: 'extracto_limpieza_4_lineas', desde: 0, en: cuatro, dur: cuidado - cuatro },
        { clip: 'extracto_fin_partida', desde: finDesde, en: cuidado, dur: objetivo - cuidado },
        {
          clip: 'extracto_objetivo_nivel',
          desde: metaDesde,
          en: objetivo,
          dur: dificultad - objetivo,
        },
        { clip: 'extracto_nivel_15', desde: 0.3, en: dificultad, dur: d3 - dificultad },
      ],
      rotulos: [
        { archivo: 'rotulo_piezas.png', en: VOZ[3], hasta: f(3, '3.1', 'fin') + 0.5 },
        { archivo: 'rotulo_objetivo.png', en: f(3, '3.6'), hasta: f(3, '3.6', 'fin') },
      ],
    },
    {
      numero: 4,
      duracion: d4,
      voz: VOZ[4],
      tramos: [{ clip: 'extracto_controles', desde: 0, en: 0, dur: d4 }],
      rotulos: [{ archivo: 'rotulo_controles', en: 0, hasta: d4 }],
    },
    {
      numero: 5,
      duracion: d5,
      voz: VOZ[5],
      tramos: [
        { clip: 'extracto_plaza_dia_noche', desde: 24.2, en: 0, dur: eventosEn },
        ...eventos.map((nombre, i) => ({
          clip: `extracto_evento_${nombre}`,
          desde: 1,
          en: eventosEn + i * EVENTO_S,
          dur: i === eventos.length - 1 ? d5 - eventosEn - i * EVENTO_S : EVENTO_S,
        })),
      ],
      rotulos: eventos.map((nombre, i) => ({
        archivo: `rotulo_evento_${nombre}.png`,
        en: eventosEn + i * EVENTO_S + 0.15,
        hasta: i === eventos.length - 1 ? d5 - 0.2 : eventosEn + (i + 1) * EVENTO_S - 0.15,
      })),
    },
    {
      numero: 6,
      duracion: d6,
      voz: VOZ[6],
      tramos: [
        { clip: 'extracto_baile_cosaco', desde: 0.3, en: 0, dur: 1.4 },
        { clip: 'extracto_baile_cosaco', desde: 3.0, en: 1.4, dur: 3.6, fundidoSalida: true },
        { en: 5.0, desde: 0, dur: 0.4 },
        { clip: 'extracto_records', desde: 0.5, en: 5.4, dur: d6 - 5.4, fundidoEntrada: true },
      ],
      rotulos: [],
    },
    {
      numero: 7,
      duracion: 8,
      voz: VOZ[7],
      tramos: [{ clip: 'extracto_cierre_plaza', desde: 0.5, en: 0, dur: 8 }],
      rotulos: [{ archivo: 'rotulo_cierre.png', en: 0.3, hasta: 8 }],
    },
  ];
}

/**
 * Monta el vídeo (sin audio) de una escena.
 * @param {Escena} escena Escena.
 * @returns {string} Archivo de la escena.
 */
function montarEscena(escena) {
  const args = [];
  const filters = [];
  let input = 0;
  const parts = escena.tramos.map((tramo, i) => {
    if (tramo.clip === undefined) {
      args.push('-f', 'lavfi', '-i', `color=c=black:s=${WIDTH}x${HEIGHT}:r=${FPS}:d=${tramo.dur}`);
    } else {
      const disponible = readJson(`${CLIPS}${tramo.clip}.json`).duracion;
      if (tramo.desde < 0 || tramo.desde + tramo.dur > disponible + 0.01) {
        throw new Error(
          `Escena ${escena.numero}: el tramo de ${tramo.clip} (${tramo.desde.toFixed(2)} s + ${tramo.dur.toFixed(2)} s) se sale de la grabación (${disponible.toFixed(2)} s)`,
        );
      }
      args.push(
        '-ss',
        String(tramo.desde),
        '-t',
        String(tramo.dur),
        '-i',
        `${CLIPS}${tramo.clip}.mp4`,
      );
    }
    const fades = [];
    if (tramo.fundidoEntrada) {
      fades.push(`fade=t=in:st=0:d=0.4`);
    }
    if (tramo.fundidoSalida) {
      fades.push(`fade=t=out:st=${(tramo.dur - 0.4).toFixed(3)}:d=0.4`);
    }
    const label = `t${i}`;
    filters.push(
      `[${input}:v]setpts=PTS-STARTPTS,fps=${FPS},format=yuv420p,trim=duration=${tramo.dur}${fades.length > 0 ? ',' + fades.join(',') : ''}[${label}]`,
    );
    input++;
    return `[${label}]`;
  });
  filters.push(`${parts.join('')}concat=n=${parts.length}:v=1:a=0[base0]`);
  let base = 'base0';
  escena.rotulos.forEach((rotulo, i) => {
    const animated = !rotulo.archivo.endsWith('.png');
    if (animated) {
      args.push('-framerate', String(FPS), '-i', `${ROTULOS}${rotulo.archivo}/frame_%05d.png`);
    } else {
      args.push(
        '-loop',
        '1',
        '-framerate',
        String(FPS),
        '-t',
        String(escena.duracion),
        '-i',
        `${ROTULOS}${rotulo.archivo}`,
      );
    }
    const fade = animated
      ? ''
      : `,fade=t=in:st=${rotulo.en}:d=${ROTULO_FADE_S}:alpha=1,fade=t=out:st=${(rotulo.hasta - ROTULO_FADE_S).toFixed(3)}:d=${ROTULO_FADE_S}:alpha=1`;
    filters.push(`[${input}:v]setpts=PTS-STARTPTS,format=rgba${fade}[r${i}]`);
    const next = `base${i + 1}`;
    filters.push(
      `[${base}][r${i}]overlay=0:0:eof_action=pass:enable='between(t,${rotulo.en},${rotulo.hasta})'[${next}]`,
    );
    base = next;
    input++;
  });
  const last = escena.numero === 7;
  filters.push(
    `[${base}]fade=t=in:st=0:d=${escena.numero === 1 ? 0.5 : SCENE_FADE_S},fade=t=out:st=${(escena.duracion - (last ? 1.2 : SCENE_FADE_S)).toFixed(3)}:d=${last ? 1.2 : SCENE_FADE_S},format=yuv420p[out]`,
  );
  const file = `${WORK}escena_${escena.numero}.mp4`;
  ffmpeg([
    ...args,
    '-filter_complex',
    filters.join(';'),
    '-map',
    '[out]',
    '-t',
    String(escena.duracion),
    '-r',
    String(FPS),
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '16',
    '-pix_fmt',
    'yuv420p',
    file,
  ]);
  return file;
}

/**
 * Efectos de sonido de una escena: los que registraron las grabaciones en los tramos
 * usados, más los fijados a mano.
 * @param {Escena} escena Escena.
 * @param {number} inicio Segundo del vídeo donde empieza la escena.
 * @returns {{ efecto: string, en: number }[]} Efectos con su instante absoluto.
 */
function efectosDeEscena(escena, inicio) {
  const result = (escena.efectos ?? []).map((e) => ({ efecto: e.efecto, en: inicio + e.en }));
  for (const tramo of escena.tramos) {
    if (tramo.clip === undefined) {
      continue;
    }
    const { eventos } = readJson(`${CLIPS}${tramo.clip}.json`);
    for (const evento of eventos) {
      if (evento.t >= tramo.desde && evento.t < tramo.desde + tramo.dur && evento.tipo in SFX_DB) {
        result.push({ efecto: evento.tipo, en: inicio + tramo.en + (evento.t - tramo.desde) });
      }
    }
  }
  return result;
}

/**
 * @typedef {object} PiezaMusical
 * @property {string} archivo WAV de la música.
 * @property {number} desde Segundo del WAV donde empieza.
 * @property {number} en Segundo del vídeo donde suena.
 * @property {number} dur Duración (s).
 * @property {number} entrada Fundido de entrada (s).
 * @property {number} salida Fundido de salida (s).
 */

/**
 * Música del vídeo por tramos: Korobeiniki (acelerada en la dificultad y parada durante
 * la pausa de los controles), Kalinka en el adelanto del cosaco y Korobeiniki hasta el
 * final.
 * @param {Map<number, number>} inicios Segundo de inicio de cada escena.
 * @param {number} total Duración total del vídeo.
 * @returns {PiezaMusical[]} Tramos de música.
 */
function musica(inicios, total) {
  const at = (escena, t) => (inicios.get(escena) ?? 0) + t;
  const rapidaEn = at(3, VOZ[3] + frase(3, '3.9').inicio - 0.1);
  const rapidaFin = at(4, 0);
  const [pausa, reanuda] = readJson(`${CLIPS}extracto_controles.json`)
    .eventos.filter((e) => e.tipo === 'tecla' && e.detalle === 'KeyP')
    .map((e) => e.t);
  const pausaIni = at(4, pausa ?? 0);
  const pausaFin = at(4, reanuda ?? 0);
  const kalinkaEn = at(6, -0.6);
  const kalinkaFin = at(6, 5.0);
  const vueltaEn = at(6, 5.4);
  const k = 'musica_korobeiniki.wav';
  return [
    { archivo: k, desde: 0, en: 0, dur: rapidaEn, entrada: 0.05, salida: 0.3 },
    {
      archivo: 'musica_korobeiniki_rapida.wav',
      desde: 0,
      en: rapidaEn,
      dur: rapidaFin - rapidaEn,
      entrada: 0.3,
      salida: 0.3,
    },
    {
      archivo: k,
      desde: rapidaEn,
      en: rapidaFin,
      dur: pausaIni - rapidaFin,
      entrada: 0.3,
      salida: 0.05,
    },
    {
      archivo: k,
      desde: rapidaEn + (pausaIni - rapidaFin),
      en: pausaFin,
      dur: kalinkaEn + 0.6 - pausaFin,
      entrada: 0.05,
      salida: 0.8,
    },
    {
      archivo: 'musica_kalinka.wav',
      desde: 0,
      en: kalinkaEn,
      dur: kalinkaFin - kalinkaEn,
      entrada: 0.6,
      salida: 0.6,
    },
    { archivo: k, desde: 60, en: vueltaEn, dur: total - vueltaEn, entrada: 0.6, salida: 2.0 },
  ];
}

/**
 * Mezcla el audio del vídeo (sin normalizar) en un WAV estéreo.
 * @param {Escena[]} lista Escenas.
 * @param {Map<number, number>} inicios Segundo de inicio de cada escena.
 * @param {number} total Duración total.
 * @returns {string} WAV de la mezcla.
 */
function mezclar(lista, inicios, total) {
  const args = [];
  const filters = [];
  const fmt = `aformat=sample_rates=${SAMPLE_RATE}:channel_layouts=stereo`;
  let input = 0;
  const ms = (s) => Math.max(0, Math.round(s * 1000));
  // Narración: un archivo por escena, colocado donde empieza su voz.
  const voces = [];
  for (const escena of lista) {
    if (escena.voz === null) {
      continue;
    }
    args.push('-i', `${AUDIO}narracion_${String(escena.numero).padStart(2, '0')}.aiff`);
    const delay = ms((inicios.get(escena.numero) ?? 0) + escena.voz);
    filters.push(`[${input}:a]${fmt},adelay=${delay}|${delay}[v${input}]`);
    voces.push(`[v${input}]`);
    input++;
  }
  filters.push(
    `${voces.join('')}amix=inputs=${voces.length}:normalize=0,apad=whole_dur=${total},asplit=2[voz][vozsc]`,
  );
  // Música por tramos.
  const piezas = musica(inicios, total).map((pieza, i) => {
    args.push('-i', `${AUDIO}${pieza.archivo}`);
    const delay = ms(pieza.en);
    filters.push(
      `[${input}:a]${fmt},atrim=start=${pieza.desde}:duration=${pieza.dur},asetpts=PTS-STARTPTS,afade=t=in:d=${pieza.entrada},afade=t=out:st=${Math.max(0, pieza.dur - pieza.salida)}:d=${pieza.salida},volume=${MUSIC_DB}dB,adelay=${delay}|${delay}[m${i}]`,
    );
    input++;
    return `[m${i}]`;
  });
  filters.push(`${piezas.join('')}amix=inputs=${piezas.length}:normalize=0[musica]`);
  filters.push(`[musica][vozsc]sidechaincompress=${DUCKING}[musicad]`);
  // Efectos: cada archivo una vez, repartido con asplit a todos sus instantes.
  const efectos = lista.flatMap((escena) =>
    efectosDeEscena(escena, inicios.get(escena.numero) ?? 0),
  );
  const porTipo = new Map();
  for (const e of efectos) {
    porTipo.set(e.efecto, [...(porTipo.get(e.efecto) ?? []), e.en]);
  }
  const sfxLabels = [];
  for (const [tipo, instantes] of porTipo) {
    args.push('-i', `${AUDIO}efecto_${tipo}.wav`);
    const splits = instantes.map((_, j) => `[s_${tipo}_${j}]`);
    filters.push(
      `[${input}:a]${fmt},volume=${SFX_DB[tipo]}dB,asplit=${instantes.length}${splits.join('')}`,
    );
    instantes.forEach((t, j) => {
      const delay = ms(t);
      filters.push(`[s_${tipo}_${j}]adelay=${delay}|${delay}[e_${tipo}_${j}]`);
      sfxLabels.push(`[e_${tipo}_${j}]`);
    });
    input++;
  }
  filters.push(`${sfxLabels.join('')}amix=inputs=${sfxLabels.length}:normalize=0[efectos]`);
  filters.push(
    `[voz][musicad][efectos]amix=inputs=3:normalize=0,apad,atrim=duration=${total}[mezcla]`,
  );
  const file = `${WORK}mezcla.wav`;
  writeFileSync(`${WORK}mezcla_filtros.txt`, filters.join(';\n'));
  ffmpeg([
    ...args,
    '-filter_complex_script',
    `${WORK}mezcla_filtros.txt`,
    '-map',
    '[mezcla]',
    '-c:a',
    'pcm_s16le',
    file,
  ]);
  writeFileSync(`${WORK}efectos.json`, JSON.stringify(efectos, null, 2) + '\n');
  return file;
}

/**
 * Normaliza la mezcla a −16 LUFS en dos pasadas (medida y corrección lineal).
 * @param {string} mezcla WAV de la mezcla.
 * @returns {string} WAV normalizado.
 */
function normalizar(mezcla) {
  const loudnorm = `loudnorm=I=${TARGET_LUFS}:TP=${TRUE_PEAK}:LRA=11`;
  const report = ffmpeg(['-i', mezcla, '-af', `${loudnorm}:print_format=json`, '-f', 'null', '-']);
  const json = report.slice(report.lastIndexOf('{'), report.lastIndexOf('}') + 1);
  const m = JSON.parse(json);
  const file = `${WORK}mezcla_normalizada.wav`;
  ffmpeg([
    '-i',
    mezcla,
    '-af',
    `${loudnorm}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=${SAMPLE_RATE}`,
    '-c:a',
    'pcm_s16le',
    file,
  ]);
  return file;
}

rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });
mkdirSync(path('video/salida/'), { recursive: true });
const lista = escenas();
const inicios = new Map();
let total = 0;
for (const escena of lista) {
  inicios.set(escena.numero, total);
  total += escena.duracion;
}
const archivos = lista.map((escena) => {
  const file = montarEscena(escena);
  process.stdout.write(`Escena ${escena.numero}: ${escena.duracion.toFixed(2)} s\n`);
  return file;
});
writeFileSync(`${WORK}escenas.txt`, archivos.map((f) => `file '${f}'`).join('\n') + '\n');
ffmpeg([
  '-f',
  'concat',
  '-safe',
  '0',
  '-i',
  `${WORK}escenas.txt`,
  '-c',
  'copy',
  `${WORK}video_mudo.mp4`,
]);
const audio = normalizar(mezclar(lista, inicios, total));
ffmpeg([
  '-i',
  `${WORK}video_mudo.mp4`,
  '-i',
  audio,
  '-map',
  '0:v',
  '-map',
  '1:a',
  '-c:v',
  'copy',
  '-c:a',
  'aac',
  '-b:a',
  '192k',
  '-shortest',
  '-movflags',
  '+faststart',
  OUTPUT,
]);
writeFileSync(
  `${WORK}escenas.json`,
  JSON.stringify(
    lista.map((e) => ({
      escena: e.numero,
      inicio: inicios.get(e.numero),
      duracion: e.duracion,
      voz: e.voz,
    })),
    null,
    2,
  ) + '\n',
);
process.stdout.write(`Vídeo: ${OUTPUT} (${total.toFixed(2)} s)\n`);
