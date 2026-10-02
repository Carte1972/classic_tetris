// Genera la narración del vídeo con la voz del sistema (`say` sin `-v`): un clip por
// frase, tratamiento ligero de voz con ffmpeg y un archivo por escena
// (video/audio/narracion_0N.aiff) con sus tiempos (narracion_0N.json).
//
// Uso: node video/scripts/narrar.mjs [número de escena ...]  (sin argumentos, todas)
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { NARRACION, VELOCIDAD } from '../narracion.mjs';

const root = new URL('../../', import.meta.url);
const audioDir = new URL('video/audio/', root);
const clipsDir = new URL('video/audio/frases/', root);

/** Frecuencia de muestreo de todo el audio del vídeo (Hz). */
const SAMPLE_RATE = 48000;

/**
 * Pausa mínima que se añade entre dos frases seguidas, además de la del guion (ms).
 * El autor la pidió tras escuchar la muestra de la escena 3.
 */
const EXTRA_PAUSE_MS = 200;

/**
 * Tratamiento ligero de la voz: quita graves inútiles, da algo de presencia y comprime
 * suavemente, sin cambiar el timbre.
 */
const VOICE_FILTER = [
  'highpass=f=80',
  'equalizer=f=3000:t=q:w=1:g=2',
  'acompressor=threshold=-18dB:ratio=2.5:attack=5:release=80:makeup=1.5',
  `aresample=${SAMPLE_RATE}`,
].join(',');

/**
 * Ejecuta un programa y falla con su salida si algo va mal.
 * @param {string} program Programa.
 * @param {string[]} args Argumentos.
 * @returns {string} Salida estándar.
 */
function run(program, args) {
  return execFileSync(program, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

/**
 * Duración de un archivo de audio en segundos.
 * @param {URL} file Archivo.
 * @returns {number} Duración.
 */
function duration(file) {
  return Number(
    run('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'csv=p=0',
      file.pathname,
    ]).trim(),
  );
}

/**
 * Genera y trata el clip de una frase.
 * @param {import('../narracion.mjs').Frase} frase Frase.
 * @returns {URL} Clip tratado en WAV.
 */
function narrarFrase(frase) {
  const nombre = `frase_${frase.id.replace('.', '_')}`;
  const bruto = new URL(`${nombre}.aiff`, clipsDir);
  const tratado = new URL(`${nombre}.wav`, clipsDir);
  // Nunca `-v`: la voz es la del sistema (Voz 1 de Siri).
  run('say', ['-r', String(frase.velocidad ?? VELOCIDAD), '-o', bruto.pathname, frase.texto]);
  if (duration(bruto) < 0.3) {
    throw new Error(`La frase ${frase.id} ha salido vacía`);
  }
  run('ffmpeg', [
    '-y',
    '-v',
    'error',
    '-i',
    bruto.pathname,
    '-af',
    frase.ganancia === undefined ? VOICE_FILTER : `${VOICE_FILTER},volume=${frase.ganancia}dB`,
    '-ac',
    '1',
    tratado.pathname,
  ]);
  return tratado;
}

/**
 * Genera un silencio de la duración indicada.
 * @param {number} ms Duración.
 * @returns {URL} Archivo WAV.
 */
function silencio(ms) {
  const file = new URL(`silencio_${ms}.wav`, clipsDir);
  run('ffmpeg', [
    '-y',
    '-v',
    'error',
    '-f',
    'lavfi',
    '-i',
    `anullsrc=r=${SAMPLE_RATE}:cl=mono`,
    '-t',
    String(ms / 1000),
    '-c:a',
    'pcm_s16le',
    file.pathname,
  ]);
  return file;
}

/**
 * Genera la narración de una escena: sus frases separadas por sus pausas.
 * @param {import('../narracion.mjs').EscenaNarrada} escena Escena.
 */
function narrarEscena(escena) {
  const partes = [];
  const tiempos = [];
  let t = 0;
  escena.frases.forEach((frase, index) => {
    const clip = narrarFrase(frase);
    const dur = duration(clip);
    tiempos.push({ id: frase.id, inicio: Number(t.toFixed(3)), fin: Number((t + dur).toFixed(3)) });
    partes.push(clip);
    t += dur;
    const last = index === escena.frases.length - 1;
    const pausa = last ? frase.pausaMs : frase.pausaMs + EXTRA_PAUSE_MS;
    if (pausa > 0) {
      partes.push(silencio(pausa));
      t += pausa / 1000;
    }
  });
  const numero = String(escena.escena).padStart(2, '0');
  const lista = new URL(`lista_${numero}.txt`, clipsDir);
  writeFileSync(lista, partes.map((p) => `file '${p.pathname}'`).join('\n') + '\n');
  const salida = new URL(`narracion_${numero}.aiff`, audioDir);
  run('ffmpeg', [
    '-y',
    '-v',
    'error',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    lista.pathname,
    '-c:a',
    'pcm_s16be',
    salida.pathname,
  ]);
  writeFileSync(
    new URL(`narracion_${numero}.json`, audioDir),
    JSON.stringify(
      { escena: escena.escena, duracion: Number(duration(salida).toFixed(3)), frases: tiempos },
      null,
      2,
    ) + '\n',
  );
  process.stdout.write(
    `Escena ${escena.escena}: ${duration(salida).toFixed(2)} s (${escena.frases.length} frases)\n`,
  );
}

mkdirSync(clipsDir, { recursive: true });
const pedidas = process.argv.slice(2).map(Number);
for (const escena of NARRACION) {
  if (pedidas.length === 0 || pedidas.includes(escena.escena)) {
    narrarEscena(escena);
  }
}
