# Proyecto: clon del Tetris clásico (estilo NES, 1989)

> **Importante:** la sección [Cambios acordados](#cambios-acordados) al final de este documento prevalece sobre cualquier apartado anterior que la contradiga.

## Objetivo
Crea un juego de bloques que caen, fiel a las reglas del Tetris clásico de NES, jugable en el navegador y distribuible como aplicación de escritorio para macOS, Linux y Windows. Nombre del juego: "Bloques" (no uses la marca "Tetris" ni su identidad visual; usa una paleta de colores propia).

## Stack
- TypeScript (modo strict) + Vite
- React 18 solo para la UI (pantalla de inicio, HUD, pausa, game over)
- Canvas 2D para dibujar tablero y piezas, con bucle `requestAnimationFrame` y timestep fijo
- Web Audio API para música y efectos (sintetizados por código, sin archivos de audio)
- Tauri 2 para empaquetar la app de escritorio
- Vitest para tests unitarios, Playwright para tests end-to-end
- ESLint + Prettier para estilo
- Sin librerías de juego externas

## Arquitectura
- `src/engine/`: lógica pura sin dependencias de React ni del DOM (tablero, piezas, rotación, colisiones, gravedad, puntuación, niveles). Estado inmutable o claramente encapsulado, con una función `step(state, input, dt)`.
- `src/render/`: dibujado en Canvas a partir del estado.
- `src/audio/`: secuenciador chiptune con Web Audio (música + efectos), desacoplado del motor.
- `src/input/`: gestión de teclado con DAS (auto-repeat) configurable.
- `src/celebration/`: animaciones de los personajes bailarines al subir de nivel.
- `src/ui/`: componentes React (pantalla de inicio, HUD, pausa, game over).
- `src-tauri/`: configuración de la app de escritorio.
- `tests/e2e/`: tests end-to-end con Playwright.
- Nombres de archivo en snake_case (excepto componentes React, en PascalCase).

## Pantalla de inicio
Primera vista al abrir el juego: título "BLOQUES" con estética retro pixel-art y un menú navegable con teclado (↑ ↓ para moverse, Enter para seleccionar, Esc para volver):
- INICIAR JUEGO
- NIVEL INICIAL (0–9, como en NES)
- MÚSICA (activada / desactivada)
- CELEBRACIONES (activadas / desactivadas)
- CONTROLES (pantalla con la tabla de teclas)
- RÉCORDS (top 10 guardado en localStorage)
- SALIR (solo visible en la app de escritorio)

La opción seleccionada se resalta con parpadeo o cursor. Las preferencias (nivel, música) se guardan en localStorage.

## Audio
- Música: el tema "Korobeiniki" (canción popular rusa del siglo XIX, de dominio público), con un arreglo PROPIO en estilo chiptune de 8 bits (onda cuadrada + triangular). NO copies los arreglos ni grabaciones de las versiones de NES o Game Boy.
- La música suena en la pantalla de inicio y durante la partida; acelera ligeramente cuando el tablero está casi lleno.
- Efectos sintetizados: mover, rotar, fijar pieza, limpiar línea, 4 líneas, subir de nivel, game over.
- Los navegadores bloquean el audio sin interacción previa: muestra "PULSA CUALQUIER TECLA" antes del menú y arranca el AudioContext en esa primera pulsación.
- Tecla M para silenciar/activar en cualquier momento.

## Celebración al superar cada nivel
Homenaje a los bailarines cosacos que aparecían en la versión de NES: cada vez que el jugador sube de nivel (cada 10 líneas), sale a la pantalla un personaje bailando danza cosaca.
- **Coreografía (4 segundos):** entra desde un lateral, hace la *prisiadka* (agachado, lanzando patadas alternas con los brazos cruzados), remata con un salto abierto tocándose las puntas de los pies y sale por el otro lado saludando.
- **Personajes originales e inventados**, uno distinto por nivel en rotación. No uses personas reales ni personajes con copyright:
  1. Cosaco bigotudo con gorro de astracán y botas rojas.
  2. Matrioska que se abre a mitad del baile y de dentro sale otra más pequeña que sigue bailando.
  3. Oso pardo con ushanka y balalaika.
  4. Babushka con pañuelo de flores.
  5. Cosmonauta con escafandra.
  6. Gran maestro de ajedrez con traje y una pieza de rey en la mano.
  7. Soldadito de plomo con gorro de piel.
  8. Bailarina de ballet que intenta la prisiadka con tutú.
- **Estilo:** pixel-art coherente con el juego, con sprites definidos por código (matrices de píxeles en `src/celebration/sprites/`), sin imágenes externas. Animación por fotogramas de al menos 6 frames por movimiento.
- **Música:** durante la celebración suena un fragmento acelerado de "Kalinka" (canción popular rusa de 1860, de dominio público) con arreglo chiptune propio, y la música de partida se reanuda después.
- **Comportamiento:** el juego se congela mientras dura la celebración; Enter o Espacio la saltan. Desactivable desde la opción CELEBRACIONES del menú.
- **Código:** módulo `src/celebration/` desacoplado. El motor solo emite un evento `levelUp(level)` y el módulo decide qué personaje toca (`level % número_de_personajes`) y lo anima.
- **Tests:** unitarios para la selección de personaje por nivel y la máquina de estados de la animación; e2e que fuerce una subida de nivel y compruebe que la celebración aparece, termina y se puede saltar.

## Reglas del juego (clásico NES)
- Tablero de 10 columnas × 20 filas visibles (más 2 ocultas de spawn).
- 7 tetrominós: I, O, T, S, Z, J, L.
- Generador aleatorio clásico: tirada aleatoria y, si se repite la pieza anterior, una segunda tirada. Sin 7-bag.
- Rotación clásica de NES, sin wall kicks y sin SRS.
- Vista previa de la siguiente pieza (solo 1). Sin hold ni hard drop.
- Soft drop con la flecha abajo (suma 1 punto por celda).
- Puntuación por líneas: 40 / 100 / 300 / 1200 × (nivel + 1).
- Subir de nivel cada 10 líneas. La velocidad de caída sigue la tabla de frames de NES a 60 fps.
- Game over cuando una pieza nueva no cabe al aparecer.
- Mostrar puntuación, líneas, nivel y récord.

## Controles
- ← → mover · ↓ soft drop · Z / ↑ rotar antihorario/horario
- P pausa · M silenciar · Esc volver al menú · Enter empezar/reiniciar

## Calidad de código
- Principios SOLID y separación de responsabilidades; funciones pequeñas, puras cuando sea posible y con un único propósito.
- Prohibido `any`; tipos explícitos en las APIs públicas de cada módulo.
- Sin números mágicos: todas las constantes (tamaño del tablero, tabla de velocidades, puntuaciones, teclas, colores) en archivos de configuración dedicados.
- Nombres descriptivos en inglés para el código; comentarios y documentación en español.
- JSDoc en todas las funciones y tipos exportados.
- Sin código muerto, sin `console.log` en producción, sin `TODO` ni `FIXME` pendientes en la entrega.
- ESLint (reglas recomendadas de TypeScript y React Hooks) + Prettier, con scripts `npm run lint` y `npm run format`.
- Commits pequeños y atómicos con mensajes en formato Conventional Commits.

## Tests
- **Unitarios (Vitest):** colisiones, rotaciones de las 7 piezas en los bordes, limpieza de 1–4 líneas, puntuación, cambio de nivel, tabla de velocidades, game over, generador aleatorio (con semilla inyectable para que sea determinista) y lógica de navegación del menú.
- **Cobertura:** ≥ 90 % en `src/engine/` (`npm run test:coverage`); el comando debe fallar si no se alcanza el umbral.
- **End-to-end (Playwright):**
  - La app carga sin errores en consola.
  - Aparece "PULSA CUALQUIER TECLA" y, tras pulsar, el menú con todas sus opciones.
  - Navegación del menú con teclado y cambio de nivel inicial.
  - INICIAR JUEGO arranca la partida y el HUD muestra puntuación, líneas, nivel y siguiente pieza.
  - Pausa y reanudación con P; Esc vuelve al menú.
  - Una partida forzada hasta game over muestra la pantalla final y guarda el récord.
  - Las preferencias persisten tras recargar la página.
- Para los tests e2e, expón un modo de test (por ejemplo `?seed=123`) que fije la semilla del generador.

## Ejecutables (macOS, Linux, Windows)
- Empaqueta con Tauri 2: `.dmg` / `.app` para macOS, `.AppImage` y `.deb` para Linux, `.msi` / `.exe` para Windows.
- Script `npm run build:desktop` que genera el ejecutable del sistema operativo actual.
- Como Tauri no compila de forma cruzada, crea un workflow de GitHub Actions (`.github/workflows/release.yml`) con matriz macos-latest / ubuntu-latest / windows-latest que genere los tres ejecutables al crear un tag `v*` y los adjunte a una GitHub Release.
- Crea también un workflow de CI (`.github/workflows/ci.yml`) que ejecute typecheck, lint, tests unitarios, cobertura, tests e2e y build web en cada push y pull request.
- Icono propio de la app en todos los formatos necesarios.
- La versión web (`npm run build`) debe seguir funcionando de forma independiente.

## Documentación (README.md en español)
- Descripción del proyecto con una captura destacada justo debajo del título.
- Sección "Capturas de pantalla" con las imágenes descritas en el apartado de abajo, cada una con un pie breve.
- Requisitos previos (Node, Rust para el build de escritorio) y cómo instalarlos.
- Instalación, ejecución en desarrollo, tests, lint y build web.
- Cómo generar los ejecutables en cada sistema operativo y cómo publicar una release con el workflow.
- Aviso sobre apps sin firmar: cómo abrirlas en macOS (Gatekeeper) y Windows (SmartScreen).
- Controles y reglas del juego, incluido el sistema de puntuación.
- Arquitectura: diagrama Mermaid de los módulos y explicación del bucle de juego y del flujo de estado.
- Estructura de carpetas comentada.
- Guía para contribuir y licencia (MIT).
- Créditos: "Korobeiniki", melodía tradicional de dominio público; arreglo original del proyecto.

## Capturas de pantalla para el README
- Genera las capturas automáticamente con un script de Playwright (`npm run screenshots`), no a mano, para poder regenerarlas cuando cambie el juego.
- Usa la semilla fija del modo test y un estado preparado para que las imágenes sean reproducibles y muestren una partida interesante (tablero con piezas apiladas y una pieza cayendo, no un tablero vacío).
- Guárdalas en `docs/screenshots/` en PNG, con nombres en snake_case y resolución 1280×720:
  - `pantalla_inicio.png`: título y menú.
  - `partida_en_curso.png`: tablero a media partida con HUD y siguiente pieza.
  - `limpieza_lineas.png`: momento de limpiar varias líneas.
  - `pausa.png`: partida en pausa.
  - `game_over.png`: pantalla final con la puntuación.
  - `controles.png`: pantalla de controles.
  - `celebracion_nivel.png`: un personaje en plena prisiadka.
- Opcional: `partida_demo.gif` de 5–10 segundos de juego (máximo 5 MB), generado a partir de una grabación de Playwright.
- Enlázalas en el README con rutas relativas y texto alternativo descriptivo.

## Control de versiones y GitHub
- Repositorio **público** en mi cuenta de GitHub llamado `classic_tetris`.
- Antes de empezar a programar:
  1. Comprueba que `git` y la CLI de GitHub (`gh`) están instalados y que `gh auth status` muestra una sesión iniciada. Si no, dime qué falta y espera a que lo resuelva yo.
  2. Inicializa el repositorio local con rama `main` y un `.gitignore` adecuado (Node, Vite, Tauri/Rust, Playwright, macOS, Windows, `.env`).
  3. Pídeme confirmación y crea el repositorio remoto con `gh repo create classic_tetris --public --source=. --remote=origin`, con la descripción "Juego de bloques clásico estilo NES hecho con TypeScript, React y Tauri".
- Durante el desarrollo:
  - Haz commit al terminar cada unidad de trabajo coherente (Conventional Commits) y `git push` al terminar cada fase, solo cuando typecheck, lint y tests pasen.
  - Nunca subas secretos, tokens, `.env`, `node_modules`, builds ni binarios generados.
  - Nunca uses `git push --force` ni reescribas el historial ya publicado.
- Al terminar: añade al repo los topics `game`, `typescript`, `react`, `tauri` y `retro`, y crea el tag `v1.0.0` para lanzar el workflow de release **solo cuando yo lo confirme**.

## Forma de trabajar
1. Antes de escribir código, muéstrame un plan con la estructura de carpetas y los módulos, y espera mi confirmación.
2. Pídeme permiso antes de instalar dependencias o herramientas (incluidos Rust y los navegadores de Playwright).
3. Implementa por fases: configuración del repo en GitHub → motor + tests → render → input → audio → UI y pantalla de inicio → celebraciones → tests e2e → empaquetado de escritorio → capturas de pantalla → README → verificación final. Al cerrar cada fase, haz push a GitHub. Ejecuta typecheck, lint y tests al final de cada fase y no avances con fallos pendientes.
4. Si alguna regla es ambigua, pregúntame en lugar de inventar.
5. Nunca desactives un test, una regla de lint o un umbral de cobertura para conseguir que algo pase: corrige la causa.

## Verificación final (obligatoria antes de dar el trabajo por terminado)
Al terminar todas las fases, ejecuta esta lista completa en orden. Si algún paso falla, corrige el problema y vuelve a empezar la lista desde el paso 1.

1. **Instalación limpia:** borra `node_modules` y `dist` y ejecuta `npm ci`, que debe terminar sin errores.
2. **Typecheck:** `npx tsc --noEmit` sin errores.
3. **Lint y formato:** `npm run lint` sin errores ni warnings; `npx prettier --check .` sin diferencias.
4. **Tests unitarios y cobertura:** `npm run test:coverage` en verde y con el umbral cumplido.
5. **Tests e2e:** `npx playwright test` en verde.
6. **Build web:** `npm run build` sin warnings; arranca `npm run preview` y comprueba que la app carga sin errores en consola.
7. **Build de escritorio:** `npm run build:desktop` genera el ejecutable del sistema operativo actual; ábrelo y comprueba que arranca en la pantalla de inicio y que SALIR cierra la app.
8. **Seguridad de dependencias:** `npm audit --omit=dev` sin vulnerabilidades altas ni críticas.
9. **Limpieza:** busca y elimina `console.log`, `TODO`, `FIXME`, `any`, imports sin usar, archivos temporales y código comentado.
10. **Capturas:** ejecuta `npm run screenshots`, abre cada imagen para comprobar que muestra lo que dice su nombre (sin pantallas en blanco, menús cortados ni errores visibles) y verifica que todos los enlaces de imagen del README apuntan a archivos existentes.
11. **README:** sigue sus instrucciones literalmente, paso a paso, como lo haría alguien sin contexto, y corrige cualquier comando o explicación que no funcione o falte.
12. **Criterios de aceptación:** revisa uno por uno los criterios de abajo y confirma que se cumplen.
13. **Workflows:** valida la sintaxis de `.github/workflows/*.yml` (por ejemplo con `actionlint` si está disponible, pidiéndome permiso para instalarlo).
14. **GitHub:** `git status` limpio, todo subido a `origin/main` y el workflow de CI en verde en el último commit (`gh run list --limit 1`). Revisa con `git ls-files` que no se ha subido ningún secreto, build ni binario. Comprueba que el README se ve bien en la página del repositorio, con las capturas cargando.

Al terminar, genera `informe_verificacion.md` en la raíz del proyecto con:
- Resultado de cada paso (OK / corregido / no aplicable) y la salida resumida de cada comando.
- Cobertura alcanzada por módulo.
- Problemas encontrados y cómo se resolvieron.
- Comprobaciones que requieren a una persona (escuchar la música y los efectos, sensación de control y DAS, aspecto visual, prueba de los ejecutables de Linux y Windows), presentadas como checklist para que yo las marque.

## Criterios de aceptación
- `npm run dev` abre la pantalla de inicio con música tras la primera pulsación, y se puede jugar una partida completa hasta el game over.
- `npx tsc --noEmit`, `npm run lint`, `npm run test:coverage` y `npx playwright test` pasan sin errores.
- `npm run build` y `npm run build:desktop` funcionan sin errores.
- El workflow de release está preparado para generar los ejecutables de macOS, Linux y Windows.
- El README permite a alguien sin contexto instalar, jugar, testear y compilar el proyecto, e incluye las capturas de pantalla del juego.
- Al subir de nivel aparece un personaje distinto bailando la danza cosaca, y la celebración se puede saltar o desactivar.
- El código está publicado en el repositorio público `classic_tetris` de GitHub, con CI en verde.
- Existe `informe_verificacion.md` con todos los pasos de la verificación final en OK.

## Cambios acordados

Decisiones tomadas con el autor antes de empezar el desarrollo (1 de octubre de 2026). Prevalecen sobre el resto del documento.

### Plataforma: solo navegador, con lanzadores
- **No hay app de escritorio:** se eliminan Tauri, `src-tauri/`, Rust, `npm run build:desktop` y los ejecutables `.dmg` / `.app` / `.AppImage` / `.deb` / `.msi` / `.exe`.
- `npm run build` genera un único `dist/index.html` autocontenido (con `vite-plugin-singlefile`) que funciona abierto directamente desde `file://`, sin servidor.
- Lanzadores en `launchers/`, que abren el juego en el navegador predeterminado: `Bloques.command` (macOS), `bloques.sh` (Linux, sin archivo `.desktop`) y `Bloques.bat` (Windows). Buscan `index.html` junto a ellos (zip de la release) o en `../dist/` (repositorio clonado); si no lo encuentran, indican que hay que ejecutar `npm run build`. Tienen un modo de prueba (variable de entorno) que comprueba la ruta y la muestra sin abrir el navegador.
- `npm run package` genera un zip con `index.html` y los lanzadores (con permisos de ejecución).
- Se elimina la opción **SALIR** del menú.
- El icono propio pasa a ser el favicon del juego, incrustado en el HTML.
- **Workflows:** `release.yml` usa un único job (sin matriz) que, al crear un tag `v*`, ejecuta build + package y adjunta el zip a la GitHub Release. `ci.yml` añade a lo ya pedido un job con matriz macos-latest / ubuntu-latest / windows-latest que ejecuta cada lanzador en modo de prueba.
- **README:** para jugar basta un navegador moderno (Node solo para desarrollar). Explica los lanzadores y cómo abrirlos: Gatekeeper con el `.command` (clic derecho → Abrir, o `xattr -d com.apple.quarantine`), SmartScreen con el `.bat` y `chmod +x` / "Ejecutar como programa" en Linux.
- **Verificación final, paso 7:** se sustituye por ejecutar `launchers/Bloques.command` en macOS y comprobar que abre el juego en la pantalla de inicio, y por confirmar que el job de lanzadores pasa en CI para Linux y Windows.
- **Criterios de aceptación:** `npm run build:desktop` se sustituye por los lanzadores de los tres sistemas; el workflow de release genera el zip.
- Test e2e adicional: abrir `dist/index.html` desde `file://`, empezar una partida y comprobar que las preferencias persisten.

### Reglas del juego
- **Nivel:** `nivel = max(nivel_inicial, floor(líneas / 10))`, como en NES.
- **Gravedad (frames por fila a 60 fps):** nivel 0: 48 · 1: 43 · 2: 38 · 3: 33 · 4: 28 · 5: 23 · 6: 18 · 7: 13 · 8: 8 · 9: 6 · 10–12: 5 · 13–15: 4 · 16–18: 3 · 19–28: 2 · 29 o más: 1. Sin killscreen.
- **Retardos:** retardo de entrada (ARE) de 10–18 frames según la altura a la que se fija la pieza, como en NES, y animación de limpieza de unos 20 frames con las columnas desapareciendo desde el centro.
- **Soft drop:** una fila cada 2 frames; +1 punto por celda.
- **DAS:** 16 frames de espera inicial y 6 de repetición, configurable solo en archivo de configuración (no en el menú).
- **Filas ocultas:** no se dibujan; la única condición de game over es que la pieza nueva no quepa al aparecer.
- **Aparición:** las piezas aparecen en las dos primeras filas visibles, como en NES; las 2 filas ocultas de encima dejan sitio para rotar a las orientaciones verticales recién aparecida la pieza.
- **Soft drop por pieza:** tras fijarse una pieza, mantener ↓ no afecta a la siguiente; hay que soltar la tecla y volver a pulsarla, como en NES.

### Audio y celebraciones
- **Selección de personaje:** `(level − 1) % número_de_personajes`, para que el primer bailarín (nivel 1) sea el cosaco.
- **El personaje 7 (soldadito de plomo) se sustituye por el "gigante del baloncesto":** personaje inventado, un pívot mucho más alto que los demás, con un gran bigote y camiseta roja de tirantes estilo años 80 con un número genérico, sin siglas ni nombres reales. Bota un balón durante la prisiadka y hace un mate en el aire en el salto final. No representa a ninguna persona real y no se nombra a nadie real ni en el código ni en la documentación.
- **MÚSICA desactivada** apaga solo la música; los efectos siguen sonando. **La tecla M** silencia todo (música y efectos) y su estado se guarda en localStorage.
- **Tablero casi lleno:** cuando hay algún bloque en las 5 filas visibles superiores, el tempo sube un 15 % y vuelve a la normalidad al bajar.
- **Kalinka** respeta la opción MÚSICA. Con CELEBRACIONES desactivadas solo suena el efecto de subir de nivel.

### Interfaz y récords
- **Esc durante la partida** vuelve al menú, abandona la partida y no guarda el récord.
- **Récords:** sin pedir nombre; se guardan automáticamente la puntuación, las líneas, el nivel y la fecha.
- **Pausa:** oculta el tablero.
- **Modo test:** `?seed=N` fija la semilla del generador y `?test=1` expone `window.__bloques` para preparar estados (tablero casi lleno, a punto de subir de nivel, game over, fotograma concreto de la celebración). Va incluido en el build de producción, pero solo se activa con esos parámetros.

### Herramientas y calidad
- **E2E** en Chromium y WebKit.
- **`eslint-plugin-jsdoc`** para exigir JSDoc en todo lo exportado.
- **`.prettierignore`** excluye `prompt_tetris.md`.
- **Node:** CI con Node 24 LTS; `engines` en `package.json`: `>=22`.
- **GIF de demostración:** sí, a partir de fotogramas de Playwright codificados con `gifenc` (máximo 5 MB).
- **Carpetas adicionales:** `src/config/` (constantes), `src/app/` (bucle de juego y conexión entre módulos), `src/storage/` (localStorage), `tests/unit/` (tests unitarios) y `launchers/`. Las capturas se generan con un proyecto específico de Playwright.

### Repositorio y licencia
- **Repositorio:** `classic_tetris` (público), en la cuenta Carte1972, con la descripción "Juego de bloques clásico estilo NES hecho con TypeScript y React, jugable en el navegador".
- **Licencia MIT** a nombre de Carte1972.
- **Commits:** Conventional Commits con el tipo en inglés y la descripción en español (p. ej. `feat(engine): añade detección de colisiones`).
- `prompt_tetris.md` se sube al repositorio; `CLAUDE.md` no (está en `.gitignore`).
