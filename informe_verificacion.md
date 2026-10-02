# Informe de verificación final — ТЕТРИС v1.0.0 (tercera iteración)

Fecha: 2 de octubre de 2026. Commit verificado: `5db4930` (rama `main`, ya en `origin/main`). Se verificó como `87168ab`: cambió de identificador al quitar del historial la coautoría de Claude, sin cambiar ningún archivo (ver [Problemas encontrados](#problemas-encontrados-y-cómo-se-resolvieron)).

Este informe sustituye al de la segunda iteración. La tercera iteración trae estos cambios:

- el juego pasa a llamarse **ТЕТРИС**;
- el pozo, el marcador y la siguiente pieza son **opacos y crecen con la ventana**;
- la **Plaza Roja se ve desde San Basilio**, con el encuadre de la foto del autor;
- hay **seis eventos típicos** que van ocupando la plaza.

Después volví a ejecutar la lista completa de 14 pasos de `prompt_tetris.md`, con el paso 7 cambiado según "Cambios acordados". **Todos los pasos salieron bien a la primera**, así que no hubo que reiniciar la lista.

Entorno local: macOS 15 (Darwin 24.6), Node 26.0.0, npm 11.12.1, Playwright 1.63 (Chromium y WebKit), actionlint 1.7.12. CI: GitHub Actions con Node 24 en Ubuntu, macOS y Windows.

## Resultado de cada paso

| #   | Paso                                                                     | Resultado                         | Salida resumida                                                                                                                                                                                                                                                                                                                                                                    |
| --- | ------------------------------------------------------------------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Instalación limpia (`rm -rf node_modules dist && npm ci`)                | OK                                | Sin errores ni avisos; `found 0 vulnerabilities`.                                                                                                                                                                                                                                                                                                                                  |
| 2   | Typecheck (`npx tsc --noEmit`)                                           | OK                                | Sin errores (TypeScript estricto con `noUncheckedIndexedAccess`).                                                                                                                                                                                                                                                                                                                  |
| 3   | Lint y formato (`npm run lint`, `npx prettier --check .`)                | OK                                | ESLint con `--max-warnings 0`: 0 errores y 0 avisos. Prettier: `All matched files use Prettier code style!`                                                                                                                                                                                                                                                                        |
| 4   | Tests unitarios y cobertura (`npm run test:coverage`)                    | OK                                | 57 archivos, **487 tests** en verde. Cobertura de `src/engine/`: 98,29 % sentencias, 94,51 % ramas, 100 % funciones, 98,16 % líneas (umbral 90 %).                                                                                                                                                                                                                                 |
| 5   | Tests e2e (`npx playwright test`)                                        | OK                                | **32 tests** (16 escenarios × Chromium y WebKit) en verde en 22 s.                                                                                                                                                                                                                                                                                                                 |
| 6   | Build web y vista previa (`npm run build`, `npm run preview`)            | OK                                | `dist/index.html 275.08 kB │ gzip: 93.62 kB`, un único archivo; 0 avisos. Con `npm run preview` la pestaña se titula «ТЕТРИС», la partida responde al teclado, los eventos forzados se dibujan y hay **0 errores y 0 avisos en consola**.                                                                                                                                          |
| 7   | Lanzadores (sustituye al build de escritorio, según "Cambios acordados") | OK (falta tu confirmación visual) | `launchers/Tetris.command` en modo prueba devuelve `…/06_tetris/dist/index.html`; ejecutado de verdad termina con código 0 y abre el juego en el navegador. En CI, el job `launchers` prueba `Tetris.command`, `tetris.sh` y `Tetris.bat` en macOS, Ubuntu y Windows, desde el repositorio y desde el zip: todo en verde.                                                          |
| 8   | Seguridad (`npm audit --omit=dev`)                                       | OK                                | `found 0 vulnerabilities` (también contando las dependencias de desarrollo).                                                                                                                                                                                                                                                                                                       |
| 9   | Limpieza                                                                 | OK                                | 0 `console.*`, 0 `TODO`/`FIXME`, 0 `any`, 0 `debugger`, 0 `@ts-ignore`/`eslint-disable`, 0 código comentado; `tsc --noUnusedLocals --noUnusedParameters` sin nada sin usar. Borré los temporales ignorados (`.playwright-mcp/`, `release/`, `test-results/`).                                                                                                                      |
| 10  | Capturas (`npm run screenshots`)                                         | OK                                | 14 tests en verde. Las **14 PNG de 1280×720** (las 7 de la especificación, las 2 de celebraciones y una de cada evento) y `partida_demo.gif` (1,9 MB, menos de 5 MB) salen **idénticas byte a byte** a las del repositorio. Las revisé una a una. Las 15 imágenes locales del README existen y están enlazadas.                                                                    |
| 11  | README al pie de la letra                                                | OK                                | En un clon nuevo de `https://github.com/Carte1972/classic_tetris.git` funcionan todos los comandos: `npm ci`, los tests, la cobertura, lint, Prettier, typecheck, build, instalación de navegadores, e2e, `npm run package` (`release/tetris-v1.0.0.zip`, 6 archivos), los lanzadores, los tres ejemplos de "un solo test" y `npm run dev`.                                        |
| 12  | Criterios de aceptación                                                  | OK                                | Revisados uno a uno [más abajo](#criterios-de-aceptación).                                                                                                                                                                                                                                                                                                                         |
| 13  | Workflows (`actionlint`)                                                 | OK                                | `ci.yml` y `release.yml` sin problemas.                                                                                                                                                                                                                                                                                                                                            |
| 14  | GitHub                                                                   | OK                                | `git status` limpio y `main` sincronizada con `origin/main`. **CI en verde** en ese commit con sus 5 jobs. `git ls-files`: sin secretos, builds, `node_modules` ni ejecutables; los únicos binarios son las capturas. En la página del repositorio el título es «ТЕТРИС», cargan las 17 imágenes sin ninguna rota, el diagrama Mermaid se dibuja y los enlaces internos funcionan. |

## Cobertura por módulo

Salida de `npm run test:coverage` (Vitest + v8), agrupada por carpeta. El umbral obligatorio del 90 % solo se aplica a `src/engine/`.

| Módulo                  | Sentencias  | Ramas       | Funciones   | Líneas      |
| ----------------------- | ----------- | ----------- | ----------- | ----------- |
| **src/engine**          | **98,29 %** | **94,51 %** | **100 %**   | **98,16 %** |
| src/scene               | 99,80 %     | 90,22 %     | 100 %       | 99,79 %     |
| src/scene/red_square    | 100 %       | 94,74 %     | 100 %       | 100 %       |
| src/scene/events        | 94,80 %     | 87,00 %     | 95,19 %     | 94,99 %     |
| src/celebration         | 94,00 %     | 100 %       | 92,86 %     | 94,00 %     |
| src/celebration/puppet  | 99,33 %     | 96,34 %     | 100 %       | 99,27 %     |
| src/celebration/dancers | 99,31 %     | 95,35 %     | 100 %       | 99,29 %     |
| src/celebration/stages  | 100 %       | 92,11 %     | 100 %       | 100 %       |
| src/audio (y canciones) | 97,30 %     | 97,70 %     | 92,11 %     | 97,80 %     |
| src/input               | 100 %       | 96,67 %     | 100 %       | 100 %       |
| src/render              | 100 %       | 92,86 %     | 100 %       | 100 %       |
| src/storage             | 100 %       | 100 %       | 100 %       | 100 %       |
| src/config              | 99,17 %     | 100 %       | 0 %         | 99,17 %     |
| src/app                 | 84,70 %     | 92,66 %     | 78,57 %     | 84,62 %     |
| src/ui                  | 22,58 %     | 26,67 %     | 11,76 %     | 23,08 %     |
| **Total**               | **95,17 %** | **88,01 %** | **91,29 %** | **95,14 %** |

- En `src/engine/` solo quedan sin cubrir guardas defensivas de índices imposibles, que exige `noUncheckedIndexedAccess`.
- `src/ui/` (componentes React, incluido el hook de escala), `src/app/runtime.ts` y `src/app/test_api.ts` (composición con el navegador real) no tienen tests unitarios a propósito: los cubren los 32 tests e2e y las capturas.
- El 0 % de funciones de `src/config/` corresponde a la función de texto «¡NIVEL N!», que solo se ejecuta en la interfaz.

## Problemas encontrados y cómo se resolvieron

La verificación final no encontró problemas. Estos son los relevantes de la tercera iteración, todos resueltos antes de verificar:

- **El cirílico, mal codificado en el renombrado**: la sustitución automática del nombre metió «ТЕТРИС» como texto ilegible en cinco archivos. Lo detecté y lo corregí antes de confirmar. El `.bat` sigue en ASCII puro.
- **Commits con cambios ajenos**: dos veces se coló en un commit algo preparado antes: los lanzadores renombrados en el commit de la especificación, y el borrado de una captura en el commit de tests. Los rehíce antes de subirlos, y cada commit se comprobó por separado (typecheck, lint y tests).
- **Coautoría de Claude en GitHub**: todos los commits llevaban la línea `Co-Authored-By: Claude`, y GitHub mostraba el proyecto como hecho por Carte1972 y Claude. Por petición expresa del autor, que levantó para esto la regla de no reescribir el historial publicado, quité esa línea de los 72 commits y subí el historial con `git push --force`. El autor, las fechas y el contenido no cambian (el árbol final es idéntico); solo cambian los identificadores de los commits. Los commits nuevos ya no llevan esa línea.
- **Noche iluminada en la vista previa**: mi herramienta de previsualización no implementaba `destination-out`. En el navegador era correcto; arreglé la herramienta, no el juego.
- **Nieve de los tejados encima de la noche**: la primera versión volvía a pintar la capa de día del fondo al dibujar la nieve de los tejados. Separé la nieve en su propia función.
- **Focos que tapaban las ventanas**: la luz de los focos de los eventos nocturnos se pintaba después de las ventanas encendidas. Ahora se aplica antes.
- **Ajustes visuales tras revisar cada evento**:
  - halos de las velas más pequeños;
  - fuegos artificiales más grandes y rellenos;
  - vehículos del desfile a la misma velocidad que las tropas, para que no las alcancen;
  - cartel olímpico por encima de las cabezas de los campeones;
  - título «SIGUIENTE» con su tamaño correcto.

## Criterios de aceptación

| Criterio                                                                                                                                | Estado   | Evidencia                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev` abre la pantalla de inicio con música tras la primera pulsación, y se puede jugar una partida completa hasta el game over | Cumplido | `npm run dev` sirve el juego (paso 11); los e2e recorren todas las pantallas; test unitario de una partida completa. Falta escuchar la música (checklist).                                                                                                                                                                                                                                                                                     |
| `npx tsc --noEmit`, `npm run lint`, `npm run test:coverage` y `npx playwright test` pasan sin errores                                   | Cumplido | Pasos 2 a 5.                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `npm run build` funciona; los lanzadores sustituyen a `npm run build:desktop`                                                           | Cumplido | Pasos 6 y 7, y job `launchers` del CI.                                                                                                                                                                                                                                                                                                                                                                                                         |
| El workflow de release está preparado para generar el paquete (zip)                                                                     | Cumplido | `release.yml` validado con `actionlint` y adaptado a `tetris-vX.Y.Z.zip`; `npm run package` lo genera. La publicación real se probará al crear el tag.                                                                                                                                                                                                                                                                                         |
| El README permite a alguien sin contexto instalar, jugar, testear y compilar, e incluye las capturas                                    | Cumplido | Paso 11 en un clon limpio; paso 10. Documenta el nombre, la zona de juego, la plaza y sus eventos.                                                                                                                                                                                                                                                                                                                                             |
| Al superar un nivel aparece un personaje distinto bailando la danza cosaca, y la celebración se puede saltar o desactivar               | Cumplido | Tests de celebraciones y e2e de aparición, fin, salto y rótulo de 2 s; sin cambios en esta iteración.                                                                                                                                                                                                                                                                                                                                          |
| Tercera iteración: nombre ТЕТРИС, zona de juego opaca y más grande, plaza vista desde San Basilio con eventos rotativos                 | Cumplido | Título, pestaña, lanzadores, zip y README renombrados (e2e del título incluido). Tests de la escala según la ventana (4 en 1280×720, 6 en 1920×1080). Tests de la escena: grupos de capas, San Basilio tapando a quien pasa por detrás, perspectiva y césped. Tests del calendario de eventos (hora, espera, fundidos, todos los eventos en 30 minutos), del tiempo pedido y de cada evento. Rendimiento medido: 120 fps con cualquier evento. |
| El código está publicado en el repositorio público `classic_tetris`, con CI en verde                                                    | Cumplido | Paso 14.                                                                                                                                                                                                                                                                                                                                                                                                                                       |

## Comprobaciones que requieren a una persona

Marca cada punto cuando lo hayas comprobado:

- [ ] **Paso 7**: al ejecutar `launchers/Tetris.command` se abrió ТЕТРИС en tu navegador, en la pantalla «PULSA CUALQUIER TECLA».
- [ ] **Zona de juego**: en tu pantalla, el pozo, el marcador y la siguiente pieza se ven más grandes y opacos, y no se cortan al cambiar el tamaño de la ventana.
- [ ] **Plaza Roja**: la vista desde San Basilio se parece a la de la foto y los edificios se reconocen (Spásskaya, muralla, San Basilio, Museo Histórico, GUM).
- [ ] **Eventos**: durante una partida larga van apareciendo los seis (aproximadamente cada 2–3 minutos) y se reconocen:
  - el desfile con tanques y aviones;
  - la procesión de Pascua con velas;
  - el mercadillo de Navidad;
  - los fuegos artificiales;
  - la quema del muñeco de Maslenitsa;
  - la fiesta olímpica.
- [ ] **Equilibrio**: los eventos distraen sin impedir leer el pozo.
- [ ] **Celebraciones**: los 9 bailarines con sus escenarios siguen viéndose bien a pantalla completa.
- [ ] **Música y sonido**: Korobeiniki, Kalinka y los efectos suenan bien; M silencia todo y la opción MÚSICA apaga solo la música.
- [ ] **Control**: el DAS, el soft drop y las rotaciones se sienten como en NES.
- [ ] **Rendimiento en tu equipo**: el juego va fluido con los eventos más cargados (desfile y fuegos).
- [ ] **Linux y Windows**: el zip de la release abre el juego con doble clic en `tetris.sh` y en `Tetris.bat` (en CI solo se probaron en modo de prueba).
- [ ] **macOS desde la release**: el zip descargado abre con doble clic en `Tetris.command` tras el paso de Gatekeeper.
- [ ] **Otros navegadores**: una partida en Firefox y en Safari.
- [ ] **Release**: tras crear el tag `v1.0.0`, la GitHub Release aparece con `tetris-v1.0.0.zip` adjunto.
