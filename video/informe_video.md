# Informe del vídeo explicativo de ТЕТРИС

Fecha: 2 de octubre de 2026. Commit verificado: `9bbfc95` (rama `main`, ya en `origin/main`).

Entregables en `video/salida/` (no se suben al repositorio):

- `tetris_video_explicativo.mp4`: 2 min 10,7 s, 1920 × 1080, 30 fps, H.264 y AAC;
- `miniatura.png`: 1280 × 720.

Por decisión del autor no hay subtítulos: ni `.srt` ni versión subtitulada (ver «Cambios acordados» en `prompt_video.md`).

## Resultado de la verificación final

Hubo dos pasadas. En la primera, el paso 7 encontró un riesgo: la partida automática llegaba a una celebración en el segundo 12,2 de su grabación, apenas 0,5 s después del último fotograma usado en el vídeo. No aparecía en el vídeo, pero bastaba un pequeño cambio en la narración para que se colara un bailarín. Lo corregí (ver [Problemas](#problemas-encontrados-y-cómo-se-resolvieron)) y **repetí la lista entera desde el paso 1**. Esta es la segunda pasada, con todo en verde.

| #   | Paso                       | Resultado | Detalle                                                                                                                                                                                                                                                                                                                                                                           |
| --- | -------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `npm run video` desde cero | OK        | Borradas `video/salida/`, `video/audio/`, `video/extractos/` y `video/tmp/`. Regenera todo sin errores en 7 min: narración, 22 tareas de Playwright (audio, 17 grabaciones, rótulos y miniatura) y montaje.                                                                                                                                                                       |
| 2   | Formato con `ffprobe`      | OK        | Vídeo H.264 (High) de 1920 × 1080 a 30/1 fps, 3.919 fotogramas; audio AAC (LC) estéreo a 48 kHz; 130,66 s, por debajo de los 3 minutos.                                                                                                                                                                                                                                           |
| 3   | Silencios y negros         | OK        | `silencedetect` (−45 dB, 2 s): ninguno. `blackdetect`: un único tramo de 0,5 s (111,63–112,13 s), el fundido a negro intencionado tras el cosaco, que pide el guion.                                                                                                                                                                                                              |
| 4   | Volumen (`ebur128`)        | OK        | Integrado −16,0 LUFS (objetivo −16 ± 1), LRA 7,0 LU, pico −1,3 dBFS. Normalización con `loudnorm` en dos pasadas.                                                                                                                                                                                                                                                                 |
| 5   | Hoja de contactos          | OK        | Un fotograma cada 10 s (`fps=1/10,tile`), revisados uno a uno, además del centro de cada evento. Cada escena muestra lo que dice el guion. El pixel-art está a múltiplos enteros (plaza × 3, pozo × 6) y se ve nítido a tamaño real. Ningún rótulo sale cortado ni hay pantallas en blanco.                                                                                       |
| 6   | Sincronía                  | OK        | Sin subtítulos (acordado), se comprueba voz contra imagen: en el centro de cada una de las 25 frases se ve lo que se narra. Los sucesos clave caen en su frase: las 4 líneas (41,88 s) en «¡Muchos más puntos!»; el fin de partida (47,85 s) en «…se acabó»; «¡NIVEL 2!» (55,58 s) entre la frase del objetivo y «Al cumplirlo…»; la P de la pausa a 0,01 s de «pausas el juego». |
| 7   | Contenidos y bailarines    | OK        | Aparecen el adelanto del cosaco (unos 4 s, en la prisiadka), los 6 eventos con su nombre, la pantalla de RÉCORDS, la tabla de controles y el aviso final acordado («ТЕТРИС es un homenaje independiente.»). Ningún otro bailarín aparece ni se nombra en la narración, los rótulos o la miniatura. El montaje falla si un tramo que no sea el del cosaco muestra una celebración. |
| 8   | Fuentes                    | OK        | Los tres datos históricos tienen al menos dos fuentes en `video/fuentes.md`: Pázhitnov, 1984 y Moscú; Game Boy y NES en 1989; Korobeiniki y Kalinka, canciones populares rusas.                                                                                                                                                                                                   |
| 9   | El juego no se ha roto     | OK        | `npm test`: 58 archivos, 489 tests. `npm run lint`: 0 errores y 0 avisos. `npx tsc --noEmit`: sin errores. `npm run test:e2e`: 34 tests en Chromium y WebKit.                                                                                                                                                                                                                     |
| 10  | GitHub                     | OK        | `git status` limpio y sincronizado con `origin/main`. Al verificar no había vídeos ni audios en el repositorio: `video/audio/`, `video/extractos/`, `video/salida/` y `video/tmp/` están en `.gitignore`. Después, a petición del autor, se subieron el vídeo final y su miniatura a `docs/video/`. CI en verde en el último commit.                                              |

## Duración de cada escena

| Escena                       | Inicio  | Duración    | Voz desde |
| ---------------------------- | ------- | ----------- | --------- |
| 1. Apertura                  | 0,0 s   | 5,5 s       | sin voz   |
| 2. Origen y localización     | 5,5 s   | 23,1 s      | 0,8 s     |
| 3. Cómo se juega y fases     | 28,6 s  | 44,0 s      | 0,5 s     |
| 4. Controles                 | 72,7 s  | 9,8 s       | 1,0 s     |
| 5. La Plaza Roja y su música | 82,4 s  | 24,2 s      | 0,4 s     |
| 6. Premios y ranking         | 106,6 s | 16,0 s      | 0,3 s     |
| 7. Cierre                    | 122,7 s | 8,0 s       | 0,8 s     |
| **Total**                    |         | **130,7 s** |           |

## Cómo se hizo

- **Voz:** `say` sin `-v`, con la voz del sistema (Voz 1 de Siri, confirmada por el autor).
  - Una frase por clip, todas a 170 palabras por minuto, salvo «¡Tetris!» (120 y +5 dB).
  - Tratamiento ligero: paso alto, +2 dB de presencia y compresión 2,5:1.
  - Detalle de las pruebas en `video/pruebas_voz.md`.
- **Música y efectos:** renderizados con `OfflineAudioContext` usando el mismo código de `src/audio/` que suena al jugar. La música baja bajo la voz con `sidechaincompress`.
- **Grabaciones:** 17 extractos fotograma a fotograma contra el build de producción, con `?seed=123&test=1` y el reloj simulado de Playwright.
  - Ventana de 1280 × 720 a densidad 1,5, para obtener 1920 × 1080 con la composición de referencia del juego.
  - Las animaciones CSS se sincronizan con el reloj simulado.
  - Cada grabación guarda sus sucesos en un JSON (líneas, fin de partida, nivel, celebración, teclas), que el montaje usa para colocar efectos y comprobar contenidos.
- **Rótulos:** páginas HTML con la estética del juego que reutilizan `drawBlock` y las letras del título. Se capturan con fondo transparente; el título y la tabla de controles, como animaciones.
- **Montaje:** `video/scripts/montaje.mjs` calcula los tiempos de cada escena a partir de la duración real de las frases y de los sucesos de las grabaciones. Por eso un cambio de texto o de velocidad no descuadra la sincronía.

## Problemas encontrados y cómo se resolvieron

- **Aviso de marca inexacto en la especificación:** la marca «Tetris» es de Tetris Holding, con licencia a The Tetris Company. Se corrigió, y después el autor pidió dejar solo «ТЕТРИС es un homenaje independiente.».
- **Año discutido:** la Wikipedia en inglés da 1985; The Tetris Company, el Computer History Museum y The Strong dan 1984. El autor confirmó 1984.
- **`recordVideo` de Playwright:** graba en tiempo real, con pérdida de calidad y de fotogramas. Se grabó fotograma a fotograma desde el principio, que la especificación permite.
- **Menús pequeños a 1920 × 1080:** los menús del juego no se escalan como la partida, así que la pantalla de RÉCORDS salía pequeña. Se grabó a 1280 × 720 con densidad 1,5.
- **«¡NIVEL 2!» invisible:** al congelar las animaciones CSS en su estado final, el rótulo de nivel salía ya desvanecido. Ahora cada animación se coloca en su instante según el reloj simulado.
- **Celebraciones donde no tocaban:** en la limpieza de 4 líneas se cumplía el objetivo del nivel y salía un bailarín. Se cambió el objetivo de esa grabación y, en la segunda pasada, todas las partidas grabadas salvo la del cosaco tienen las celebraciones desactivadas; el montaje lo vigila.
- **Escenas cortas o con silencio al final:**
  - la grabación de récords era más corta que su escena; ahora el montaje valida que cada tramo cabe en su grabación;
  - la compresión que baja la música cortaba el audio cuando terminaba la voz; se prolonga la señal de control.
- **Cambios pedidos por el autor tras ver la primera versión:**
  - una sola velocidad de voz;
  - «¡Tetris!» más lenta y fuerte (elegida de oído entre 4 candidatas);
  - «Y con la P, pausas el juego»;
  - quitar el «punto» leído en «más sorpresas»;
  - cambiar la pregunta final por «¡Atrévete a superarlas!», porque la voz no entona preguntas: medido, baja el tono entre un 20 y un 29 % al final;
  - acortar la escena de controles tras la pausa;
  - simplificar el aviso final.

## Checklist de revisión humana

- [ ] La voz es la Voz 1 de Siri en todo el vídeo.
- [ ] La narración se entiende bien y suena expresiva, con «¡Tetris!» remarcado y «¡Atrévete a superarlas!» como reto.
- [ ] La pronunciación de las palabras rusas y los nombres es correcta: Pázhitnov (escrito «Páshitnov» para la voz), Korobeiniki («Korobéiniki»), Kalinka, Game Boy («Guéim Boi»).
- [ ] El equilibrio entre voz, música y efectos es bueno: la música baja bajo la voz y sube en los huecos (apertura, eventos, cosaco).
- [ ] El ritmo del vídeo es bueno: sin tramos muertos y con cortes que acompañan a la narración.
- [ ] Lo que se cuenta es exacto: datos históricos, reglas del juego (objetivo de 10 líneas y 2 más por nivel, vista previa oculta desde el nivel 15) y controles.
- [ ] La miniatura sirve para YouTube o la release.
