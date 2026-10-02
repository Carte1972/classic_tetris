# Proyecto: vídeo explicativo de ТЕТРИС

## Objetivo

Crea un vídeo explicativo de **ТЕТРИС**, el juego de este repositorio, pensado para alguien que nunca ha jugado a Tetris. El vídeo debe estar narrado en español con la voz de Siri de mi Mac (**Voz 1 de Siri**) y montado con extractos reales del juego: partidas, pantallas, fondos de la Plaza Roja, eventos y celebraciones de los bailarines.

Este vídeo se hace en la misma sesión en la que desarrollaste el juego, así que ya conoces el código y el modo test (`?seed=` y `?test=1` con `window.__tetris`). Apóyate en ese conocimiento y reutiliza lo que ya existe. Si la conversación se ha compactado y te falta algún detalle concreto, consulta solo los archivos que necesites, sin releer el proyecto entero.

**Importante:** el material visual del vídeo son **grabaciones de vídeo** del juego en movimiento, no GIF ni capturas estáticas. Esas grabaciones se montan, se narran y se acompañan de música.

## Contenido y guion

Duración: **la mínima necesaria, con un máximo de 3 minutos** (objetivo orientativo: unos 2 minutos y medio). Resolución 1920×1080 a 30 fps.

**Criterio de brevedad:** cada frase de la narración tiene que ganarse su sitio. Cuenta solo lo imprescindible para que alguien que nunca ha jugado entienda el juego y quiera probarlo; lo demás lo enseñan las imágenes. Prefiere frases cortas, evita repetir lo que ya se ve en pantalla y usa montajes rápidos en lugar de explicar cada elemento por separado. Si una idea no cabe, se recorta, no se alarga el vídeo.

1. **Apertura (≈5 s):** título ТЕТРИС construido con bloques que caen sobre la Plaza Roja, con Korobeiniki de fondo. Sin narración.
2. **Origen y localización (≈25 s):**
   - En dos o tres frases: quién lo creó, cuándo y dónde (Moscú), y cómo llegó a todo el mundo con las versiones de Game Boy y NES de 1989.
   - Una frase que justifique la Plaza Roja como escenario: el juego nació en Moscú.
   - Contrasta cada dato histórico con al menos dos fuentes fiables en la web y anótalas en `video/fuentes.md`. Si un dato no se puede verificar, no lo incluyas.
3. **Cómo se juega y fases (≈40 s):**
   - Lo esencial: caen piezas de 7 formas, se giran y se colocan para completar líneas, que desaparecen y dan puntos (más puntos cuantas más a la vez); la partida acaba si las piezas llegan arriba.
   - **Fases:** cada nivel tiene un objetivo de líneas (10 en el primero y 2 más en cada nivel siguiente); al cumplirlo se pasa al siguiente con el tablero vacío. No hay final: se juega hasta perder.
   - **Dificultad:** en una sola frase, que cada nivel es más rápido, salen más piezas difíciles y, a partir del nivel 15, no se ve la siguiente pieza.
   - Imágenes: partida en curso, una limpieza de 4 líneas y el panel OBJETIVO avanzando.
4. **Controles (≈15 s):** rótulo con la tabla de teclas sobre una grabación en la que se ve cada acción. La narración solo nombra las principales (flechas para mover y bajar, flecha arriba y Z para girar, P para pausa).
5. **La Plaza Roja y su música (≈25 s):** montaje rápido de los 6 eventos (unos 3 segundos cada uno) con su nombre en un rótulo. La narración, en dos frases, cuenta que la plaza cambia con el día, el tiempo y las fiestas rusas, y que suenan Korobeiniki y Kalinka, canciones populares rusas. Sin explicar cada evento por separado.
6. **Premios y ranking (≈20 s):**
   - **Los bailarines son una sorpresa del juego: no los desveles.** Muestra solo un adelanto breve (unos 3–4 segundos) del primero, el cosaco, en plena prisiadka, con Kalinka de fondo. La narración dice en una frase que al superar cada nivel te espera una celebración, y deja la intriga de que hay más sorpresas por descubrir, sin decir cuántas ni quiénes son.
   - No menciones ni muestres el resto de personajes ni sus escenarios en ninguna parte del vídeo (tampoco en la miniatura ni en los subtítulos).
   - La pantalla de RÉCORDS con el top 10, preparada con datos de ejemplo verosímiles, y una frase sobre ella.
7. **Cierre (≈8 s):** URL del repositorio https://github.com/Carte1972/classic_tetris y el aviso «ТЕТРИС es un homenaje independiente; Tetris es una marca registrada de The Tetris Company». Una sola frase de narración invitando a jugar.

## Guion (requiere mi aprobación)

Antes de grabar, narrar o montar nada, escribe el guion completo del vídeo en `video/guion.md` y **para hasta que yo lo apruebe**.

El guion debe incluir:

- Un resumen inicial con la duración total estimada (calculada a partir del número de palabras de la narración, a unas 150 palabras por minuto) y la lista de escenas. Si supera los 3 minutos, recorta antes de presentármelo.
- Para cada escena, una tabla con:
  - Número y título de la escena, y duración estimada.
  - **Narración:** el texto exacto que leerá la voz, tal y como se escribirá para la síntesis de voz.
  - **Subtítulos:** el mismo texto con la ortografía correcta.
  - **Imagen:** qué grabación del juego se ve en cada momento y cómo se prepara (situación del modo test, nivel, evento, bailarín…).
  - **Rótulos:** textos que aparecen en pantalla.
  - **Música y sonido:** qué suena y a qué volumen respecto a la voz.
- Al final, la lista de todas las grabaciones que hay que hacer, con su duración, y los datos históricos que aparecen junto a sus fuentes.

Proceso de aprobación:

1. Preséntame el guion y espera mis comentarios.
2. Aplica los cambios que te pida y vuelve a presentármelo, indicando qué ha cambiado.
3. Repite hasta que te diga explícitamente que el guion está **aprobado**.
4. Una vez aprobado, el guion es la referencia del vídeo: no cambies textos, escenas ni orden sin preguntarme. Si durante la producción ves que algo no funciona (por ejemplo, una escena que dura demasiado), propónme el cambio en el guion y espera mi aprobación.

## Narración con la Voz 1 de Siri

- La voz del sistema de mi Mac **ya está configurada como Voz 1 de Siri**; no me pidas configurarla. El comando `say` no permite elegir las voces de Siri con `-v`, pero sí usa la voz del sistema si no se indica ninguna, así que **nunca uses `-v`**.
- Antes de narrar todo, genera una prueba con `say -o video/audio/prueba_voz.aiff "Hola, esto es una prueba de la narración de ТЕТРИС"` y comprueba con `ffprobe` que dura más de 2 segundos y no es silencio. Si falla o el archivo sale vacío, para y dime las alternativas en lugar de elegir otra voz por tu cuenta.
- Genera **un archivo de audio por escena** (`video/audio/narracion_01.aiff`, `narracion_02.aiff`…) a partir del guion, para poder regenerar solo la escena que cambie.
- Escribe el texto de la narración pensando en cómo lo leerá la voz: números en palabras cuando convenga, pausas con puntuación y grafías fonéticas para palabras rusas y nombres propios (Pázhitnov, prisiadka, Maslénitsa, Korobéiniki, Kalinka, Snegúrochka). Los subtítulos usan la grafía correcta.
- Ajusta la velocidad con la opción `-r` de `say` si hace falta para un ritmo natural y documenta el valor elegido.

### Locución expresiva

La narración tiene que sonar **expresiva y con energía**, como la de un tráiler de videojuego retro, no como una lectura plana. Las voces de macOS no tienen control de emociones, así que la expresividad se consigue combinando estas técnicas:

1. **Escritura para el oído:** frases cortas, exclamaciones e interrogaciones donde tengan sentido («¿Te atreves?», «¡Y aquí empieza lo bueno!»), comas y puntos suspensivos para crear pausas y ritmo, y palabras con fuerza. La puntuación es lo que más cambia la entonación de la voz de Siri.
2. **Comandos embebidos de `say`:** prueba si la Voz 1 de Siri respeta `[[slnc 400]]` (silencio en ms), `[[rate 200]]` (velocidad) y `[[emph +]]` (énfasis). Genera una prueba con y sin cada comando y compara duraciones con `ffprobe` para ver cuáles tienen efecto. Usa solo los que funcionen y documenta el resultado.
3. **Un clip por frase:** genera cada frase como un audio independiente, con su propia velocidad (`-r` más alto en los momentos de acción y más bajo en la historia o el cierre), y controla las pausas entre frases en el montaje. Así el ritmo no depende de la voz.
4. **Sincronía con la imagen:** haz coincidir las frases clave con lo que ocurre en pantalla (una limpieza de 4 líneas, la entrada del cosaco) y deja que la música y los efectos del juego suban en esos huecos.
5. **Tratamiento de audio ligero** con ffmpeg: compresión suave y ecualización para que la voz tenga presencia sobre la música, sin distorsionarla ni cambiar su timbre.

En el guion, marca en la columna de narración el tono de cada frase (por ejemplo: _[intriga]_, _[energía]_, _[pausa]_) y la velocidad prevista, para que pueda revisarlo al aprobarlo. Antes de narrar todo el vídeo, genera la escena 3 completa como muestra y avísame para que la escuche; si no me convence, ajustamos texto y velocidades antes de seguir.

## Grabaciones de vídeo del juego

- Graba cada extracto como **vídeo** con Playwright contra el build de producción, usando la semilla fija, el modo test y el reloj simulado, para que cada grabación sea reproducible. Guarda cada extracto como un archivo de vídeo independiente en `video/extractos/` (por ejemplo, `extracto_limpieza_4_lineas.mp4`, `extracto_baile_cosaco.mp4`, `extracto_evento_desfile.mp4`).
- Prepara cada situación con `window.__tetris`: tablero casi lleno, limpieza de 4 líneas, nivel a punto de superarse, el momento de la prisiadka del cosaco (solo ese bailarín), cada evento de la Plaza Roja, la pantalla de récords con datos, etc. Para las partidas largas, reutiliza el jugador automático que ya existe en el proyecto (el que juega solo colocando las piezas).
- Si necesitas ampliar el modo test para preparar alguna situación, hazlo sin cambiar el comportamiento normal del juego y con sus tests.
- Graba a 1920×1080 y 30 fps, a partir del canvas a escala entera, para que el pixel-art se vea nítido (sin interpolación al escalar). Si la grabación de Playwright pierde calidad o fotogramas, captura los fotogramas uno a uno avanzando el reloj simulado y únelos con ffmpeg.
- Graba cada extracto con algo más de duración de la necesaria, para tener margen al ajustarlo a la narración durante el montaje.

## Música y sonido

- La grabación de vídeo de Playwright **no captura audio**. Genera la música y los efectos renderizando el propio módulo `src/audio/` con `OfflineAudioContext` y exportándolos a WAV (Korobeiniki, Kalinka y los efectos que hagan falta). No uses grabaciones externas.
- Mezcla: la música baja automáticamente mientras habla la narración (ducking) y sube en los extractos sin voz. Volumen final normalizado a −16 LUFS con el filtro `loudnorm` de ffmpeg.

## Montaje

- Herramientas: **ffmpeg** para el montaje y la mezcla, y Playwright para los extractos y para los rótulos. Los rótulos, títulos y diagramas se hacen como páginas HTML con la estética pixel-art del juego y se capturan con Playwright.
- La duración de cada escena se ajusta a la duración real de su narración más un pequeño margen.
- Transiciones simples (corte o fundido corto); nada de efectos recargados.
- Subtítulos en español en `video/salida/bloques_video_explicativo.srt`, sincronizados con la narración, y una versión del vídeo con los subtítulos incrustados.
- Todo el proceso debe ser reproducible con un único comando: `npm run video`.

## Organización y entregables

- Todo el proyecto del vídeo va en `video/`: `guion.md`, `fuentes.md`, scripts, `audio/`, `extractos/`, `rotulos/` y `salida/`. Nombres de archivo en snake_case.
- Entregables en `video/salida/`:
  - `bloques_video_explicativo.mp4` (H.264 + AAC, 1920×1080, 30 fps).
  - `bloques_video_explicativo_subtitulado.mp4`, con los subtítulos incrustados.
  - `bloques_video_explicativo.srt`.
  - `miniatura.png` (1280×720) para YouTube o la release.
- Añade al README una sección breve "Vídeo explicativo" que explique cómo regenerarlo con `npm run video`.

## GitHub

- Haz commit y push de los scripts, el guion, las fuentes y los rótulos, igual que en el desarrollo del juego (Conventional Commits, push al cerrar cada fase con todo en verde).
- **No subas al repositorio** los vídeos, los audios ni los extractos generados: añádelos al `.gitignore`. Cuando el vídeo esté terminado, pregúntame si quiero adjuntarlo a una GitHub Release.

## Forma de trabajar

1. Antes de hacer nada, muéstrame un plan con las fases, las herramientas y las dependencias que necesitas, y espera mi confirmación.
2. Pídeme permiso antes de instalar cualquier cosa (por ejemplo, `brew install ffmpeg`).
3. Fases: guion y fuentes → **mi aprobación del guion** → prueba técnica de voz y de comandos embebidos → **muestra de la escena 3 para que la escuche** → narración completa → música y efectos → grabaciones de vídeo del juego → rótulos → montaje → subtítulos → verificación final.
4. No generes la narración hasta que yo haya aprobado el guion: cualquier cambio después obliga a regenerar audio y montaje.
5. Cuando tengas una primera versión montada, aunque sea con extractos provisionales, avísame para que la revise antes de pulir.
6. Si algo es ambiguo, pregúntame en lugar de inventar.
7. No toques el comportamiento del juego; si encuentras un error en él, avísame en lugar de corregirlo por tu cuenta.

## Verificación final (obligatoria)

Ejecuta esta lista completa. Si algún paso falla, corrige el problema y vuelve a empezar la lista.

1. `npm run video` desde cero (borrando `video/salida/`, `video/audio/` y `video/extractos/`) regenera todo sin errores.
2. Con `ffprobe`: resolución 1920×1080, 30 fps, una pista de vídeo H.264 y una de audio AAC, y duración de 3 minutos como máximo.
3. Sin silencios no deseados de más de 2 segundos (`silencedetect`) ni fotogramas negros no intencionados (`blackdetect`).
4. Volumen integrado de −16 LUFS ±1 (`ebur128`).
5. Genera una hoja de contactos (un fotograma cada 10 s con `ffmpeg -vf tile`), revísala imagen a imagen y comprueba que cada escena muestra lo que dice el guion, sin pixel-art borroso, rótulos cortados ni pantallas en blanco.
6. Comprueba la sincronía: el inicio de cada subtítulo coincide con su narración (±0,3 s) y cada escena muestra lo que se está narrando.
7. Comprueba que aparecen el adelanto del cosaco, los 6 eventos, la pantalla de récords, la tabla de controles y el aviso de marca, y que **ningún otro bailarín** aparece ni se menciona en el vídeo, los subtítulos o la miniatura.
8. Revisa que cada dato histórico del guion tiene sus fuentes en `video/fuentes.md`.
9. `npm test`, `npm run lint`, `npx tsc --noEmit` y `npm run test:e2e` siguen pasando (el juego no se ha roto).
10. `git status` limpio, sin vídeos ni audios en el repositorio, y CI en verde en el último commit.

Al terminar, genera `video/informe_video.md` con el resultado de cada paso, la duración de cada escena, los problemas encontrados y cómo se resolvieron, y un checklist de revisión humana: que la voz es la de Siri, se entiende bien y suena expresiva, la pronunciación de las palabras rusas, el equilibrio entre voz y música, el ritmo del vídeo y la exactitud de lo que se cuenta.

## Criterios de aceptación

- El vídeo dura 3 minutos como máximo, cubre las 7 escenas del guion aprobado sin relleno y está narrado con la Voz 1 de Siri.
- Todo lo que se ve son grabaciones de vídeo reales del juego o rótulos con su misma estética.
- Existen las versiones con y sin subtítulos, el `.srt` y la miniatura.
- `npm run video` regenera todo de forma reproducible.
- Existe `video/informe_video.md` con todos los pasos de la verificación en OK.

## Cambios acordados (2 de octubre de 2026)

Estos cambios prevalecen sobre lo anterior:

- **Nombre de los archivos:** `tetris_video_explicativo.mp4` en vez de `bloques_video_explicativo.mp4`.
- **Sin subtítulos:** no se generan ni el `.srt` ni la versión con subtítulos incrustados. Los entregables son `tetris_video_explicativo.mp4` y `miniatura.png`. Los pasos de la verificación sobre subtítulos no aplican; la sincronía se comprueba entre narración e imagen.
- **Aviso del cierre:** «ТЕТРИС es un homenaje independiente.». Primero se corrigió la mención a la marca (es de Tetris Holding, ver `video/fuentes.md`); después, al revisar la primera versión, el autor pidió quitarla del vídeo.
- **Año de creación:** 1984.
- **Plaza limpia:** para mostrar la Plaza Roja sin interfaz, el modo test tendrá una opción que oculta los paneles, con sus tests y sin cambiar el juego normal.
- **Grabación:** fotograma a fotograma avanzando el reloj simulado, en vez de `recordVideo`.
- **Música:**
  - Korobeiniki desde la apertura hasta la escena 5;
  - Kalinka en el adelanto del cosaco;
  - Korobeiniki otra vez en los récords y el cierre.
- **Récords de ejemplo:** se cargan en `localStorage` antes de abrir el juego.
- **Miniatura:** sin ningún bailarín.
- **Intermedios:** los fotogramas van a `video/tmp/`, ignorado por git.
- **Vídeo en el repositorio:** a petición del autor, el vídeo final y su miniatura se suben a `docs/video/` (y se adjuntan a la release v1.0.0). Lo generado durante el proceso (`video/audio/`, `video/extractos/`, `video/salida/`, `video/tmp/`) sigue fuera del repositorio.
- **Guion aprobado:** `video/guion.md`, borrador 2.
- **Revisión de la primera versión:** el autor pidió que la voz fuera a una sola velocidad (170) salvo «¡Tetris!», más lenta y más fuerte; cambiar «Y con la P… ¡pausa!» por «Y con la P, pausas el juego»; quitar los puntos suspensivos leídos en «más sorpresas»; cambiar la pregunta final por «¡Atrévete a superarlas!»; y acortar la escena de controles tras la pausa. Todo está recogido en el guion.
