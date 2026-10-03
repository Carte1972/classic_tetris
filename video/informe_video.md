# Informe del vídeo explicativo de ТЕТРИС

Fecha: 3 de octubre de 2026 (segunda versión, con el piloto automático). La primera versión se verificó el 2 de octubre en el commit `9bbfc95`.

Entregables en `video/salida/`, copiados a `docs/video/`:

- `tetris_video_explicativo.mp4`: 2 min 21,0 s, 1920 × 1080, 30 fps, H.264 y AAC;
- `miniatura.png`: 1280 × 720.

Por decisión del autor no hay subtítulos: ni `.srt` ni versión subtitulada (ver «Cambios acordados» en `prompt_video.md`).

## Qué cambia en esta versión

A petición del autor, tras la frase de la pausa la escena 4 explica el **botón de piloto automático**:

- **4.4:** «Y bajo el marcador tienes el botón de piloto automático.» Un recuadro y una flecha parpadean alrededor del botón y la tabla de controles añade la fila «BOTÓN · PILOTO AUTOMÁTICO».
- **4.5:** «Le da el control a una inteligencia artificial simbólica, gobernada por el algoritmo de Delasherí.» Justo antes de la frase se pulsa el botón y la partida se juega sola: en esos 6 s el piloto coloca 7 piezas y completa 2 líneas. Bajo el botón, el rótulo «IA SIMBÓLICA · ALGORITMO DE DELLACHERIE».

Además, todas las grabaciones de partida muestran el botón, la del fin de la partida carga antes los récords de ejemplo (para que no salga el formulario del nombre) y los récords de ejemplo llevan nombres.

## Resultado de la verificación final

Una sola pasada, con todo en verde a la primera.

| #   | Paso                       | Resultado | Detalle                                                                                                                                                                                                                                                                                                                                                                                          |
| --- | -------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `npm run video` desde cero | OK        | Borradas `video/salida/`, `video/audio/`, `video/extractos/` y `video/tmp/`. Regenera todo sin errores en 7 min 44 s: narración, 22 tareas de Playwright (audio, 17 grabaciones, rótulos y miniatura) y montaje. El montaje comprueba que el clic del piloto cae entre las frases 4.4 y 4.5.                                                                                                     |
| 2   | Formato con `ffprobe`      | OK        | Vídeo H.264 (High) de 1920 × 1080 a 30/1 fps, 4.228 fotogramas; audio AAC (LC) estéreo a 48 kHz; 140,96 s, por debajo de los 3 minutos.                                                                                                                                                                                                                                                          |
| 3   | Silencios y negros         | OK        | `silencedetect` (−45 dB, 2 s): ninguno. `blackdetect`: el fundido a negro de 0,5 s tras el cosaco (121,93–122,43 s), que pide el guion, y los 4 últimos fotogramas del fundido final de 1,2 s (140,77–140,90 s). Los dos son intencionados.                                                                                                                                                      |
| 4   | Volumen (`ebur128`)        | OK        | Integrado −16,0 LUFS (objetivo −16 ± 1), LRA 6,8 LU. Normalización con `loudnorm` en dos pasadas.                                                                                                                                                                                                                                                                                                |
| 5   | Hoja de contactos          | OK        | Un fotograma cada 10 s (`fps=1/10,tile`), revisados uno a uno, además de los momentos nuevos de la escena 4: la flecha y el recuadro durante 4.4, y el botón en «SÍ» con la etiqueta durante 4.5. La tabla de controles cabe entera (en una prueba anterior se salía por la derecha y se estrechó). El fin de la partida muestra FIN DE LA PARTIDA, sin el formulario del nombre.                |
| 6   | Sincronía                  | OK        | Voz contra imagen: la flecha aparece con el inicio de 4.4 (82,54 s); el clic (86,07 s) cae entre el final de 4.4 (85,88 s) y el inicio de 4.5 (86,38 s), y la etiqueta sale con 4.5. La P de la pausa (80,87 s) cae en «pausas el juego». Las escenas 1–3 y 5–7 no cambian: las 4 líneas en «¡Muchos más puntos!» (41,88 s), el fin de partida en «…se acabó» (47,85 s) y «¡NIVEL 2!» (55,58 s). |
| 7   | Contenidos y bailarines    | OK        | Aparecen el adelanto del cosaco, los 6 eventos con su nombre, la pantalla de RÉCORDS, la tabla de controles (con el piloto) y el aviso final acordado. Ningún otro bailarín aparece ni se nombra; el montaje falla si un tramo que no sea el del cosaco muestra una celebración.                                                                                                                 |
| 8   | Fuentes                    | OK        | Los datos históricos tienen al menos dos fuentes en `video/fuentes.md`, ahora también la atribución del algoritmo a Pierre Dellacherie (Algorta y Şimşek, 2019; Chen y otros, 2026, que cita a Fahey, 2003).                                                                                                                                                                                     |
| 9   | El juego no se ha roto     | OK        | `npm test`: 61 archivos, 559 tests. `npm run lint`: 0 errores y 0 avisos. `npx tsc --noEmit`: sin errores. `npm run test:e2e`: 57 tests en Chromium y WebKit (3 omitidos a propósito: los del archivo de récords solo van en Chromium).                                                                                                                                                          |
| 10  | GitHub                     | OK        | `git status` limpio tras el commit. Solo el vídeo final y la miniatura están en el repositorio (`docs/video/`); `video/audio/`, `video/extractos/`, `video/salida/` y `video/tmp/` siguen en `.gitignore`. CI en verde en el último commit.                                                                                                                                                      |

## Duración de cada escena

| Escena                           | Inicio  | Duración    | Voz desde |
| -------------------------------- | ------- | ----------- | --------- |
| 1. Apertura                      | 0,0 s   | 5,5 s       | sin voz   |
| 2. Origen y localización         | 5,5 s   | 23,1 s      | 0,8 s     |
| 3. Cómo se juega y fases         | 28,6 s  | 44,0 s      | 0,5 s     |
| 4. Controles y piloto automático | 72,7 s  | 20,1 s      | 1,0 s     |
| 5. La Plaza Roja y su música     | 92,8 s  | 24,2 s      | 0,4 s     |
| 6. Premios y ranking             | 117,0 s | 16,0 s      | 0,3 s     |
| 7. Cierre                        | 133,0 s | 8,0 s       | 0,8 s     |
| **Total**                        |         | **141,0 s** |           |

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

- **Segunda versión (piloto automático):**
  - la grabación del fin de la partida habría mostrado el formulario del nombre, porque el juego ahora lo pide al entrar en el ranking; se cargan antes los récords de ejemplo para que no entre;
  - el piloto mueve las piezas sin pulsar teclas, así que sus movimientos y giros no quedaban anotados para los efectos de sonido; la grabación los anota comparando la pieza fotograma a fotograma;
  - al añadir la fila del piloto, la tabla de controles se salía por la derecha del encuadre; se estrechó con una letra algo menor;
  - el recuadro que señala el botón usa su posición fija en el fotograma, y la grabación comprueba que el botón está exactamente ahí.

## Checklist de revisión humana

- [ ] La voz es la Voz 1 de Siri en todo el vídeo.
- [ ] La narración se entiende bien y suena expresiva, con «¡Tetris!» remarcado y «¡Atrévete a superarlas!» como reto.
- [ ] La pronunciación de las palabras rusas y los nombres es correcta: Pázhitnov (escrito «Páshitnov» para la voz), Korobeiniki («Korobéiniki»), Kalinka, Game Boy («Guéim Boi») y Dellacherie («Delasherí», elegida por el autor).
- [ ] El equilibrio entre voz, música y efectos es bueno: la música baja bajo la voz y sube en los huecos (apertura, eventos, cosaco).
- [ ] El ritmo del vídeo es bueno: sin tramos muertos y con cortes que acompañan a la narración.
- [ ] Lo que se cuenta es exacto: datos históricos, reglas del juego (objetivo de 10 líneas y 2 más por nivel, vista previa oculta desde el nivel 15), controles y piloto automático (dónde está el botón y qué hace).
- [ ] La miniatura sirve para YouTube o la release.
