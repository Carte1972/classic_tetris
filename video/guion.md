# Guion del vídeo explicativo de ТЕТРИС

**Estado:** borrador 2, pendiente de aprobación.

**Cambios tras la primera versión montada (pedidos por el autor):**

- **Velocidad única:** todas las frases van a la misma velocidad, 170 palabras por minuto, la de la primera frase, para que la voz suene continua. Se mantienen los tonos de cada frase; las velocidades de las tablas pasan a ser todas 170.
- **Frase 4.3:** ahora dice «Y con la P, pausas el juego» (antes «Y con la P… ¡pausa!»).
- **Frase 6.3:** sin los puntos suspensivos iniciales, porque la voz los leía como «punto». Queda «Y hay más sorpresas por descubrir».
- **Frase 6.4 dividida:** «¿Te atreves a superarlas?» pasa a ser **«¡Atrévete a superarlas!»** (frase 6.5). La voz no sube el tono al final de las preguntas: medido, baja entre un 20 y un 29 %, y las variantes con `[[pbas]]` tampoco convencieron al autor.
- **Escena 4:** termina poco después de «pausas el juego», unos 10 s en total. Se quita el tramo sin narración que venía detrás.
- **Cierre:** el aviso queda en «ТЕТРИС es un homenaje independiente.».
- **«¡Tetris!» (2.3), la única excepción:** más lenta (120) y 5 dB más fuerte, para remarcar el nombre con efusividad. El autor eligió esta versión de oído entre cuatro candidatas.
- **Pausas:** 0,2 s más de pausa entre frases.
- **Duración:** la narración real dura unos 111 s y el vídeo, 2 min 18 s.

**Cambios respecto al borrador 1:**

- **Sin subtítulos:** quitada la columna de subtítulos y retirados del vídeo el `.srt` y la versión subtitulada.
- **Aviso de marca:** aprobado el texto que nombra a Tetris Holding.
- **Año de creación:** confirmado 1984.

## Resumen

- **Duración estimada:** **2 min 18 s** (138 s). La narración tiene 228 palabras, que a 150 palabras por minuto son 1 min 31 s. El resto son tramos sin voz: la apertura, el montaje de eventos y el adelanto del cosaco.
- **Formato:** 1920×1080 a 30 fps. Narración con la Voz 1 de Siri (`say` sin `-v`). Música del juego renderizada desde `src/audio/`. Sin subtítulos, por decisión del autor.
- **Escenas:**

| #   | Escena                    | Duración estimada (narración + tramos sin voz) |
| --- | ------------------------- | ---------------------------------------------- |
| 1   | Apertura                  | 5 s                                            |
| 2   | Origen y localización     | 24 s (54 palabras ≈ 22 s)                      |
| 3   | Cómo se juega y fases     | 42 s (92 palabras ≈ 37 s)                      |
| 4   | Controles                 | 15 s (20 palabras ≈ 8 s)                       |
| 5   | La Plaza Roja y su música | 26 s (26 palabras ≈ 10 s y 18 s de eventos)    |
| 6   | Premios y ranking         | 18 s (27 palabras ≈ 11 s y 4 s del cosaco)     |
| 7   | Cierre                    | 8 s (9 palabras ≈ 4 s)                         |

**Cómo leer las tablas**

- **Narración** es el texto exacto que leerá la voz, con grafías pensadas para la síntesis (por eso aparecen palabras como «Páshitnov», «Guéim Boi», «zeta» o «pe»). Entre corchetes van el tono y la velocidad de `say -r` (palabras por minuto), que es 170 en todas las frases salvo «¡Tetris!» (120).
- **Pausas:** las pausas entre frases las controla el montaje, porque cada frase es un clip independiente.
- **Volúmenes** (respecto a la voz, 0 dB):
  - música bajo la voz: −20 dB (ducking);
  - música sin voz: −8 dB;
  - efectos del juego: −6 dB.

  Al final se normaliza todo a −16 LUFS.

- **Plaza limpia:** la Plaza Roja sin la interfaz del juego. Se graba con una opción nueva del modo test (`window.__tetris.setInterfaceHidden(true)`) que solo oculta los paneles y no cambia el juego normal.

## Escena 1 — Apertura (≈5 s)

|                     |                                                                                                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Narración**       | _(sin narración)_                                                                                                                                                                                                        |
| **Imagen**          | Plaza limpia de día (`extracto_plaza_titulo`). Sobre ella, rótulo animado `rotulo_titulo`: las letras de ТЕТРИС se forman con bloques del juego que caen uno a uno, con los mismos colores y biseles que el título real. |
| **Rótulos**         | ТЕТРИС, formado con bloques que caen.                                                                                                                                                                                    |
| **Música y sonido** | Korobéiniki desde el primer fotograma, a −8 dB. Efecto de pieza fijada (`pieceLocked`) cada vez que cae una letra, a −6 dB.                                                                                              |

## Escena 2 — Origen y localización (≈24 s)

| #   | Narración                                                                                                              | Imagen                                                                                        | Rótulos                 | Música y sonido                                     |
| --- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------- |
| 2.1 | _[intriga · −r 170]_ Moscú... mil novecientos ochenta y cuatro.                                                        | Plaza limpia al amanecer; la luz sube poco a poco (`extracto_plaza_dia_noche`, primer tramo). | «MOSCÚ · 1984»          | Korobéiniki baja a −20 dB al empezar la voz.        |
| 2.2 | _[intriga · −r 170]_ En la Academia de Ciencias, Alexéi Páshitnov crea un juego de bloques que caen...                 | Sigue la plaza amaneciendo; se encienden las nubes y el sol.                                  | —                       | Igual.                                              |
| 2.3 | _[mucha energía · −r 120 · +5 dB]_ ¡Tetris!                                                                            | Corte a una partida en curso con la interfaz (`extracto_partida_en_curso`, 2 s).              | —                       | La música sube a −8 dB durante 1 s tras la palabra. |
| 2.4 | _[narrativo · −r 170]_ En mil novecientos ochenta y nueve, las versiones de Guéim Boi y Nes lo llevan a todo el mundo. | Plaza limpia de día con mucha gente paseando.                                                 | «1989 · GAME BOY Y NES» | −20 dB bajo la voz.                                 |
| 2.5 | _[cálido · −r 170]_ Por eso este Tetris se juega en su casa: ¡la Plaza Roja de Moscú!                                  | Plaza limpia al atardecer, con la Spásskaya y San Basilio iluminados.                         | —                       | La música sube a −8 dB al acabar la frase.          |

_Las grafías «Páshitnov» y «Guéim Boi» se probarán en la prueba de voz. Si la voz las lee mejor de otra forma, te propondré el cambio._

## Escena 3 — Cómo se juega y fases (≈42 s)

| #   | Narración                                                                                                                                        | Imagen                                                                                                                                                                        | Rótulos                                                           | Música y sonido                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 3.1 | _[energía · −r 170]_ Caen piezas de siete formas.                                                                                                | Partida en curso de nivel 1 con el jugador automático (`extracto_partida_en_curso`).                                                                                          | Las 7 piezas en fila, en pixel-art (rótulo `rotulo_piezas`, 2 s). | Korobéiniki a −20 dB.                                                   |
| 3.2 | _[energía · −r 170]_ Gíralas, muévelas... y encájalas para completar líneas.                                                                     | El jugador automático gira y coloca piezas.                                                                                                                                   | —                                                                 | Efectos de mover y girar, a −6 dB.                                      |
| 3.3 | _[energía · −r 170]_ Cada línea completa desaparece y suma puntos.                                                                               | Una limpieza de una línea y la puntuación subiendo.                                                                                                                           | —                                                                 | Efecto de línea.                                                        |
| 3.4 | _[intriga → explosión · −r 170]_ ¿Y si haces cuatro a la vez? ¡Muchos más puntos!                                                                | Una I entra en un hueco de cuatro filas: el pozo destella y salen 4 líneas (`extracto_limpieza_4_lineas`). «¡Muchos más puntos!» cae justo en el destello.                    | —                                                                 | Efecto de 4 líneas en el destello, a −6 dB; la música sube a −8 dB 1 s. |
| 3.5 | _[serio · −r 170]_ Pero cuidado: si las piezas llegan arriba... se acabó.                                                                        | Pila que llega arriba y pantalla FIN DE LA PARTIDA (`extracto_fin_partida`).                                                                                                  | —                                                                 | Efecto de game over en «se acabó».                                      |
| 3.6 | _[explicativo · −r 170]_ Cada nivel tiene un objetivo: diez líneas en el primero, y dos más en cada nivel siguiente.                             | Partida con el panel OBJETIVO en 8 / 10 avanzando a 9 / 10 y 10 / 10 (`extracto_objetivo_nivel`; celebraciones desactivadas en las preferencias, para no mostrar bailarines). | «10 → 12 → 14…»                                                   | —                                                                       |
| 3.7 | _[energía · −r 170]_ Al cumplirlo, pasas al siguiente con el tablero vacío.                                                                      | Rótulo «¡NIVEL 2!» del juego y, después, el pozo vacío con OBJETIVO 0 / 12.                                                                                                   | —                                                                 | Efecto de subida de nivel.                                              |
| 3.8 | _[intriga · −r 170]_ No hay final: se juega hasta perder.                                                                                        | Sigue la partida en el nivel 2.                                                                                                                                               | —                                                                 | —                                                                       |
| 3.9 | _[energía creciente · −r 170]_ Y cada nivel es más rápido, salen más piezas difíciles... y desde el nivel quince, ¡ya no ves la siguiente pieza! | Partida en el nivel 15, con caída rápida y el panel SIGUIENTE en «OCULTA» (`extracto_nivel_15`).                                                                              | —                                                                 | Korobéiniki acelerado, como cuando la pila está alta.                   |

## Escena 4 — Controles (≈15 s)

| #   | Narración                                               | Imagen                                                                                                      | Rótulos                                                                                                                                          | Música y sonido                            |
| --- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| 4.1 | _[ágil · −r 170]_ Las flechas mueven y bajan la pieza.  | Grabación guionizada (`extracto_controles`): la pieza va a la izquierda, a la derecha y baja con soft drop. | Tabla de teclas (`rotulo_controles`) a un lado; se resalta cada tecla cuando se usa: ← → MOVER · ↓ BAJAR · ↑ GIRAR · Z GIRAR AL REVÉS · P PAUSA. | Efectos de mover a −6 dB; música a −20 dB. |
| 4.2 | _[ágil · −r 170]_ La flecha arriba y la zeta, la giran. | La pieza gira en un sentido y en el otro.                                                                   | Se resaltan ↑ y Z.                                                                                                                               | Efecto de girar.                           |
| 4.3 | _[ágil · −r 170]_ Y con la pe, pausas el juego.         | El juego entra en PAUSA (el pozo se oculta) y vuelve.                                                       | Se resalta P.                                                                                                                                    | La música se corta en la pausa y vuelve.   |

## Escena 5 — La Plaza Roja y su música (≈26 s)

| #   | Narración                                                                                                   | Imagen                                                                                                                            | Rótulos                                                                                                                                               | Música y sonido                                                                                        |
| --- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 5.1 | _[asombro · −r 170]_ Y mientras juegas, la Plaza Roja cambia con el día, el tiempo... ¡y las fiestas rusas! | Plaza limpia en un paso rápido del día a la noche y de la lluvia a la nieve (`extracto_plaza_dia_noche`, tramo rápido).           | —                                                                                                                                                     | Korobéiniki a −20 dB.                                                                                  |
| —   | _(sin voz, unos 3 s por evento)_                                                                            | Plaza limpia con cada evento: desfile, Pascua, Navidad, fuegos, Maslenitsa y campeones (`extracto_evento_*`), con cortes rápidos. | Nombre de cada evento abajo: DESFILE DE LA VICTORIA · PASCUA ORTODOXA · NAVIDAD Y AÑO NUEVO · FUEGOS ARTIFICIALES · MASLENITSA · CAMPEONES OLÍMPICOS. | Korobéiniki sube a −8 dB.                                                                              |
| 5.2 | _[cálido · −r 170]_ De fondo suenan Korobéiniki y Kalinka, dos canciones populares rusas.                   | Va sobre los dos últimos eventos (Maslenitsa y campeones).                                                                        | —                                                                                                                                                     | La música baja a −20 dB; al final de la frase entra un fragmento de Kalinka que da paso a la escena 6. |

## Escena 6 — Premios y ranking (≈18 s)

| #   | Narración                                                             | Imagen                                                                                                                        | Rótulos | Música y sonido                      |
| --- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------ |
| 6.1 | _[intriga · −r 170]_ ¿Y al superar cada nivel?                        | Pozo con una I a punto de completar el objetivo del nivel 1.                                                                  | —       | Kalinka a −20 dB.                    |
| 6.2 | _[intriga · −r 170]_ Te espera una celebración...                     | Adelanto de unos 4 s del cosaco en plena prisiadka, en la estepa (`extracto_baile_cosaco`). Es el único bailarín que aparece. | —       | Kalinka sube a −8 dB mientras baila. |
| 6.3 | _[misterio · −r 170]_ Y hay más sorpresas por descubrir.              | Fundido corto a negro desde el baile.                                                                                         | —       | Kalinka baja y se funde.             |
| 6.4 | _[energía · −r 170]_ Tus diez mejores partidas quedan en los récords. | Pantalla RÉCORDS con un top 10 de ejemplo (`extracto_records`).                                                               | —       | Vuelve Korobéiniki a −20 dB.         |
| 6.5 | _[reto, exclamación · −r 170]_ ¡Atrévete a superarlas!                | Sigue la pantalla RÉCORDS.                                                                                                    | —       | Korobéiniki a −20 dB.                |

## Escena 7 — Cierre (≈8 s)

|                     |                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| **Narración**       | _[cálido y entusiasta · −r 170]_ ¡Ven a jugar a Tetris en la Plaza Roja!                                |
| **Imagen**          | Plaza limpia al anochecer, con las farolas encendiéndose (`extracto_cierre_plaza`), y el título ТЕТРИС. |
| **Rótulos**         | ТЕТРИС · github.com/Carte1972/classic_tetris · y el aviso de marca (ver la nota de abajo).              |
| **Música y sonido** | Korobéiniki sube a −8 dB tras la frase y termina con un fundido de 2 s.                                 |

**Aviso final (decidido por el autor tras ver la primera versión):**

> ТЕТРИС es un homenaje independiente.

Antes incluía la mención a la marca («Tetris es una marca registrada de Tetris Holding, con licencia a The Tetris Company»). El autor pidió quitarla del vídeo; el README la mantiene.

## Grabaciones necesarias

Todas se graban fotograma a fotograma a 1920×1080 y 30 fps, contra el build, con `?seed=123&test=1` y el reloj simulado. Llevan algo de margen sobre lo que se usa.

| Archivo en `video/extractos/`                                                 | Contenido y preparación                                                                                                             | Duración     |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| `extracto_plaza_titulo.mp4`                                                   | Plaza limpia de día, vida normal.                                                                                                   | 8 s          |
| `extracto_plaza_dia_noche.mp4`                                                | Plaza limpia: amanecer lento (escena 2), después día, atardecer y noche rápidos, con lluvia y nieve (`setScene` en cada fotograma). | 40 s         |
| `extracto_partida_en_curso.mp4`                                               | Partida de nivel 1 con el jugador automático y una pila de media altura.                                                            | 25 s         |
| `extracto_limpieza_4_lineas.mp4`                                              | Tablero con un hueco de 4 filas; la I cae y limpia 4 líneas.                                                                        | 8 s          |
| `extracto_fin_partida.mp4`                                                    | Pila casi llena; la siguiente pieza no cabe y aparece FIN DE LA PARTIDA.                                                            | 7 s          |
| `extracto_objetivo_nivel.mp4`                                                 | Celebraciones desactivadas, OBJETIVO en 8 / 10; se completan dos líneas, sale «¡NIVEL 2!» y el tablero vacío con 0 / 12.            | 14 s         |
| `extracto_nivel_15.mp4`                                                       | Partida en el nivel 15 con el jugador automático y el panel SIGUIENTE oculto.                                                       | 10 s         |
| `extracto_controles.mp4`                                                      | Pulsaciones guionizadas: ←, →, ↓, ↑, Z, P y P otra vez.                                                                             | 18 s         |
| `extracto_evento_desfile.mp4` … `extracto_evento_olimpiadas.mp4` (6 archivos) | Plaza limpia con cada evento fijado con `setScene({ event, eventElapsedMs, timeOfDay, weather })`, a su hora y con su tiempo.       | 5 s cada uno |
| `extracto_baile_cosaco.mp4`                                                   | Se supera el nivel 1 (`patchGame` como en las capturas) y se graba la celebración del cosaco desde la prisiadka (≈1,5 s).           | 6 s          |
| `extracto_records.mp4`                                                        | Pantalla RÉCORDS con 10 récords de ejemplo cargados en `localStorage` antes de abrir el juego.                                      | 8 s          |
| `extracto_cierre_plaza.mp4`                                                   | Plaza limpia al anochecer, con las farolas encendiéndose.                                                                           | 10 s         |

**Rótulos** (HTML en `video/rotulos/`, capturados con Playwright): `rotulo_titulo` (animado), `rotulo_fecha` (1984 y 1989), `rotulo_piezas`, `rotulo_objetivo`, `rotulo_controles`, `rotulo_evento` (los 6 nombres) y `rotulo_cierre`.

**Miniatura:** título ТЕТРИС sobre la plaza con la Spásskaya y San Basilio y un pozo con piezas; sin bailarines.

## Datos históricos y fuentes

Detalle completo en [`fuentes.md`](fuentes.md).

| Dato del guion                                                              | Fuentes                                                                                    |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Alekséi Pázhitnov creó Tetris en 1984, en la Academia de Ciencias, en Moscú | The Tetris Company, Computer History Museum, The Strong National Museum of Play, Wikipedia |
| En 1989, las versiones de Game Boy y NES lo llevaron a todo el mundo        | Wikipedia (Game Boy y NES), The Strong National Museum of Play, TetrisWiki                 |
| Korobéiniki y Kalinka son canciones populares rusas                         | Wikipedia y Mfiles, para cada una                                                          |
| Titular de la marca Tetris (aviso del cierre)                               | tetris.com y Wikipedia (The Tetris Company)                                                |
