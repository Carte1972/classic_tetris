# Especificación: piloto automático de ТЕТРИС con el algoritmo de Pierre Dellacherie

Proyecto destino: [Carte1972/classic_tetris](https://github.com/Carte1972/classic_tetris) (TypeScript + React + Canvas, motor puro en `src/engine/`).

## Objetivo

Añadir al juego un **piloto automático** que el jugador puede activar y desactivar en cualquier momento con un botón visible en la pantalla de partida. Mientras está activo, el juego juega solo con el algoritmo de Pierre Dellacherie, también al cambiar de nivel, hasta que el jugador lo desactive.

El trabajo tiene dos partes:

1. **Algoritmo de decisión:** dado el tablero y la pieza activa, elige la mejor colocación alcanzable.
2. **Piloto automático en el juego:** convierte esa decisión en entradas frame a frame, la integra en la partida y añade el botón.

---

## Comportamiento acordado

| Situación | Comportamiento |
|---|---|
| Activar / desactivar | Solo con el **botón** (clic). No hay tecla de atajo. |
| Cuándo se puede pulsar | En cualquier momento de la pantalla de partida: jugando, en pausa, durante la celebración de nivel y en game over. |
| Teclas de juego con el piloto activo | **Se ignoran** (flechas, ↓ y Z). Siguen funcionando P (pausa), M (sonido), ESC (menú), ENTER (reiniciar en game over) y las teclas de saltar la celebración. |
| Cambio de nivel | El piloto **sigue activo**: la celebración se muestra como siempre y, al empezar el nivel siguiente, el piloto juega solo desde la primera pieza, hasta que se desactive. |
| Activarlo a mitad de una pieza | Toma el control de la pieza que está cayendo en ese momento, desde su posición actual. |
| Desactivarlo a mitad de una pieza | Devuelve el control al jugador en el acto; la pieza se queda donde está y sigue cayendo por gravedad. |
| Game over con el piloto activo | Se queda en la pantalla de game over como siempre. Si el jugador reinicia con ENTER, el piloto sigue activado y juega la partida nueva. |
| Récords | Si el piloto se ha activado **en algún momento** de la partida, esa partida **no entra** en la tabla de récords ni cuenta para el récord que muestra el marcador. La pantalla de game over lo indica. |
| Persistencia | El estado del piloto vive en el controlador durante la sesión; **no** se guarda en `localStorage`. |

---

## Encaje en el proyecto

### Archivos nuevos

| Archivo | Contenido |
|---|---|
| `src/ai/dellacherie.ts` | Algoritmo de decisión: colocaciones, métricas, puntuación y elección. Puro. |
| `src/ai/autopilot.ts` | Piloto: convierte la colocación elegida en `FrameInput` frame a frame. Puro. |
| `src/config/autopilot_config.ts` | Pesos de la fórmula y constantes del piloto (sin números mágicos). |
| `src/ui/AutopilotButton.tsx` | Botón de activar/desactivar. |
| `tests/unit/ai/dellacherie.test.ts` | Métricas y decisiones sobre escenarios reales. |
| `tests/unit/ai/autopilot.test.ts` | Generación de entradas y partidas completas con el motor real. |
| `tests/e2e/autopilot.spec.ts` | Botón y comportamiento en el juego real. |

### Archivos que se modifican

| Archivo | Cambio |
|---|---|
| `src/app/game_session.ts` | Puede tomar la entrada del piloto en lugar de la del teclado. |
| `src/app/app_controller.ts` | Estado del piloto, `toggleAutopilot()`, partidas con piloto fuera de récords. |
| `src/ui/GameScreen.tsx` y `src/ui/App.tsx` | Muestran el botón y le pasan la acción del controlador. |
| `src/config/texts.ts` | Textos del botón y del aviso de game over. |
| `src/config/palette.ts` | Colores del botón si hacen falta. |
| `src/ui/styles.css` | Estilo del botón, coherente con el pixel-art del juego. |
| `vitest.config.ts` | Umbral de cobertura del 90 % también para `src/ai/**`. |
| `README.md` y `prompt_tetris.md` | Documentar el piloto automático (en `prompt_tetris.md`, como cambio acordado, igual que los anteriores). |

El motor (`src/engine/`) **no se modifica** y sigue siendo puro. `src/ai/` depende del motor, nunca al revés.

### Convenciones del repositorio (obligatorias)

- TypeScript estricto: nada de `any`, tipos explícitos y JSDoc **en español** en todo lo exportado.
- Código en inglés; comentarios y documentación en español.
- Archivos en `snake_case`, salvo componentes de React en `PascalCase`.
- Sin números mágicos: constantes en `src/config/`. Textos en `src/config/texts.ts`.
- Funciones puras e inmutables en `src/ai/`, como en el motor.
- Sin `console.log`, `TODO` ni `FIXME`.
- Commits pequeños con Conventional Commits, tipo en inglés y descripción en español. Ejemplos: `feat(ai): añade el algoritmo de Dellacherie`, `feat(ui): añade el botón de piloto automático`.

### Qué se reutiliza del motor (no duplicar)

| Necesidad | Función existente |
|---|---|
| Tipos | `Board`, `Cell`, `ActivePiece`, `PieceType`, `FrameInput`, `GameState` (`src/engine/types.ts`) |
| Dimensiones | `BOARD_COLUMNS`, `TOTAL_ROWS`, `HIDDEN_ROWS` (`src/config/board_config.ts`) |
| Orientaciones | `getRotationCount`, `getPieceCells` (`src/engine/tetrominoes.ts`) |
| Colisiones | `collides` (`src/engine/collision.ts`) |
| Mover y rotar con reglas NES | `tryMove`, `tryRotate` (`src/engine/movement.ts`) |
| Fijar pieza y borrar líneas | `lockPiece`, `findFullRows`, `removeRows` (`src/engine/board.ts`) |
| Entrada vacía | `EMPTY_INPUT` (`src/engine/step.ts`) |

---

## Parte 1: algoritmo de decisión (`src/ai/dellacherie.ts`)

### Particularidades del juego que hay que respetar

1. **Tablero.** `Board` tiene 22 filas (`TOTAL_ROWS`) de 10 celdas; la fila 0 es la de arriba y las 2 primeras están ocultas. Cada celda es `null` o la letra de la pieza. "Ocupada" = `cell !== null`.
2. **Alturas.** Desde el suelo: una celda en la fila `y` tiene altura `TOTAL_ROWS - y`.
3. **Piezas.** `ActivePiece` = `{ type, rotation, x, y }`, con `x`/`y` del **pivote**. `getRotationCount` da las orientaciones distintas (O = 1; I, S, Z = 2; T, J, L = 4).
4. **Sin hard drop.** Clon NES: la pieza cae por gravedad; solo se puede desplazar, rotar y hacer soft drop.
5. **Rotación NES sin wall kicks.** Si una rotación choca, se descarta (`tryRotate` devuelve `null`).

### Cómo funciona

Para la pieza activa, desde su posición actual:

1. **Generar colocaciones alcanzables.** Para cada orientación alcanzable rotando con `tryRotate`, desplazar con `tryMove` columna a columna a izquierda y derecha hasta chocar. Cada posición es un candidato.
2. **Dejar caer cada candidato** con `tryMove(board, piece, 0, 1)` hasta que devuelva `null` (simulación interna).
3. **Simular** con `lockPiece`, `findFullRows` y `removeRows`.
4. **Puntuar** con la fórmula.
5. **Elegir** la de mayor puntuación, con desempate.

Solo se usa la pieza activa; `nextPiece` queda fuera de esta versión.

### La fórmula

```
puntuación =
    -1 × alturaDeAterrizaje
    +1 × celdasErosionadas
    -1 × transicionesDeFilas
    -1 × transicionesDeColumnas
    -4 × huecos
    -1 × pozosAcumulados
```

```ts
/** Pesos de la heurística de Pierre Dellacherie. */
export const DELLACHERIE_WEIGHTS = {
  landingHeight: -1,
  erodedPieceCells: 1,
  rowTransitions: -1,
  columnTransitions: -1,
  holes: -4,
  cumulativeWells: -1,
} as const;
```

La altura de aterrizaje y las celdas erosionadas dependen de la jugada; las otras cuatro métricas se calculan sobre el tablero **después** de fijar la pieza y borrar líneas, en las 22 filas.

### Métricas

1. **Altura de aterrizaje:** media entre la altura de la celda más baja y la de la más alta de la pieza ya caída, antes de borrar líneas.
2. **Celdas erosionadas:** `(líneas eliminadas) × (celdas de la pieza en esas líneas)`; 0 si no elimina ninguna.
3. **Transiciones de filas:** cambios ocupado↔vacío recorriendo cada fila de izquierda a derecha. Las paredes cuentan como ocupadas.
4. **Transiciones de columnas:** cambios ocupado↔vacío recorriendo cada columna de arriba abajo. El suelo cuenta como ocupado; el borde superior, como vacío.
5. **Huecos:** celdas vacías con alguna celda ocupada encima en su columna.
6. **Pozos acumulados:** celda de pozo = vacía con vecinos izquierdo y derecho ocupados (paredes incluidas). Por cada secuencia vertical de pozo de profundidad `d` se suma `d × (d + 1) / 2`.

### Desempate

Menos acciones desde la posición actual: menor `|x − xActual|`; a igualdad, menos rotaciones; si persiste, la de la izquierda. Resultado determinista.

### Interfaz

```ts
/** Colocación elegida por el algoritmo. */
export interface PlacementChoice {
  /** Orientación final (índice en PIECE_ROTATIONS). */
  readonly rotation: number;
  /** Columna final del pivote. */
  readonly x: number;
  /** Pieza ya caída en su posición final. */
  readonly landed: ActivePiece;
  /** Puntuación de Dellacherie de la colocación. */
  readonly score: number;
}

/**
 * Elige la mejor colocación alcanzable para la pieza activa.
 * @param board Tablero actual de la partida.
 * @param piece Pieza activa en su posición actual.
 * @returns La mejor colocación, o `null` si no hay ninguna válida.
 */
export function findBestPlacement(board: Board, piece: ActivePiece): PlacementChoice | null;
```

Auxiliares exportadas para tests: `getLandingHeight`, `getErodedPieceCells`, `getRowTransitions`, `getColumnTransitions`, `getHoles`, `getCumulativeWells`, `generatePlacements` y `evaluatePlacement`.

---

## Parte 2: piloto automático en el juego

### 2.1 Generador de entradas (`src/ai/autopilot.ts`)

Módulo puro que, frame a frame, produce el `FrameInput` que llevaría la pieza activa a la colocación elegida.

```ts
/** Estado del piloto entre frames. */
export interface AutopilotState { /* objetivo de la pieza actual, etc. */ }

/** Estado inicial, sin objetivo. */
export const INITIAL_AUTOPILOT_STATE: AutopilotState;

/**
 * Calcula la entrada del piloto para el siguiente frame.
 * @param autopilot Estado del piloto del frame anterior.
 * @param game Estado del motor antes del frame.
 * @returns Entrada del frame y nuevo estado del piloto.
 */
export function nextAutopilotInput(
  autopilot: AutopilotState,
  game: GameState,
): { readonly input: FrameInput; readonly autopilot: AutopilotState };
```

Reglas:

- **Fuera de la fase `falling`** devuelve `EMPTY_INPUT` y olvida el objetivo.
- **Pieza nueva** (o primera pieza tras activar el piloto): llama a `findBestPlacement` y guarda el objetivo.
- **Cada frame**: si la orientación no es la del objetivo, pide una rotación (en el sentido más corto); si la columna no es la del objetivo, pide un desplazamiento hacia ella. El motor aplica desplazamiento y rotación en el mismo frame, así que se pueden pedir ambos.
- **Ya alineada**: pide `softDrop` hasta que la pieza se fije.
- **Soft drop tras fijar una pieza**: el motor bloquea el soft drop hasta que se suelta (`softDropReleaseRequired`). El piloto debe enviar al menos un frame con `softDrop: false` al empezar cada pieza.
- **Si un movimiento previsto falla** (la gravedad la ha bajado contra la pila o una rotación choca, algo que pasa en niveles altos con gravedad de 1 a 2 frames por fila), recalcula el objetivo desde la posición actual.
- El piloto no usa el DAS del teclado: desplaza como mucho una columna por frame, que es lo que el motor admite.

### 2.2 Sesión de juego (`src/app/game_session.ts`)

- La sesión recibe un modo de entrada: teclado o piloto. Añadir `setAutopilot(enabled: boolean)` a `GameSession`.
- En cada frame lógico:
  - **Siempre** se llama a `sampleFrameInput(keyboard, das)`, para consumir las pulsaciones de rotación y mantener el DAS al día. Así, al desactivar el piloto, no se aplica de golpe una rotación pulsada mientras estaba activo.
  - Con el piloto activo, esa entrada de teclado se **descarta** y se usa la de `nextAutopilotInput`.
- Al activar el piloto se reinicia su estado (`INITIAL_AUTOPILOT_STATE`) para que planifique desde la posición actual de la pieza.
- `startNextLevel` no cambia el modo de entrada: el piloto sigue activo en el nivel siguiente.

### 2.3 Controlador (`src/app/app_controller.ts`)

- Nuevo estado `autopilotEnabled` (sesión de la aplicación, no se guarda en `localStorage`) y `autopilotUsed` (de la partida en curso).
- Nueva acción pública `toggleAutopilot(): void` en `AppController`:
  - Solo tiene efecto en las pantallas de partida: `playing`, `paused`, `celebrating` y `gameOver`.
  - Cambia `autopilotEnabled`, lo aplica a la sesión con `setAutopilot` y, si se activa, marca `autopilotUsed = true`.
  - Publica el cambio para que la interfaz se repinte.
- `startGame()`: crea la sesión con el piloto en el estado de `autopilotEnabled` (si estaba activo, la partida nueva empieza ya con piloto) y pone `autopilotUsed = autopilotEnabled`.
- `finishGame()`: si `autopilotUsed`, **no** llama a `insertRecord` ni guarda récords; el resultado lleva `autopilotUsed: true` y `rank: null`.
- `buildSnapshot()`: añade `autopilotEnabled` al `AppSnapshot`, y `autopilotUsed` a `GameResult`. Si la partida en curso ha usado el piloto, el récord del marcador (`hud.best`) es solo `records[0]?.score ?? 0`, sin contar la puntuación actual.
- Actualizar `snapshotsEqual` con los campos nuevos.
- La celebración de nivel no cambia: se muestra igual, se puede saltar igual y, al terminar, `endLevelTransition` empieza el nivel siguiente, donde el piloto sigue jugando.

### 2.4 Botón (`src/ui/AutopilotButton.tsx`)

- Elemento `<button type="button">` real, con `aria-pressed` según el estado y texto visible:
  - Desactivado: `PILOTO AUTOMÁTICO: NO`.
  - Activado: `PILOTO AUTOMÁTICO: SÍ`, con un estilo destacado claramente distinto (por ejemplo, el color de acento y un parpadeo suave, como los avisos del juego).
- **Visible en la pantalla de partida** en todos sus estados (`playing`, `paused`, `celebrating`, `gameOver`), en un sitio fijo que no tape el pozo, por ejemplo bajo el marcador. Durante la celebración, que ocupa toda la pantalla, el botón debe seguir **visible y pulsable por encima** de ella.
- Al hacer clic llama a `controller.toggleAutopilot()`. `App.tsx` pasa esa acción a `GameScreen` como propiedad.
- **El botón no debe quedarse con el foco**: el juego usa ENTER y ESPACIO (reiniciar, saltar la celebración), y un botón enfocado se activaría con ellas. Evitarlo (por ejemplo, impidiendo el foco al hacer clic con el ratón y quitándolo tras el clic), y comprobarlo en los e2e.
- Textos en `TEXTS` (`src/config/texts.ts`), colores en la paleta y estilos en `styles.css`, siguiendo la escala `--ui-scale` del resto de la interfaz.
- La pantalla de game over muestra, si `autopilotUsed`, un aviso del tipo `PARTIDA CON PILOTO AUTOMÁTICO: NO CUENTA PARA RÉCORDS`, en lugar de los avisos de récord.
- En la pantalla de CONTROLES, añadir una fila informativa: `BOTÓN PILOTO` → `EL JUEGO JUEGA SOLO`.

---

## Pruebas: siempre sobre escenarios reales

Nada de tableros de juguete ni formatos inventados. Todos los tests usan **el tablero real del juego (22 × 10, tipo `Board`)**, las **piezas y rotaciones reales** de `PIECE_ROTATIONS` y, cuando se juega, **el motor real** (`createInitialState`, `tick`, `step`, `startNextLevel`). Los e2e usan **el juego real** en el navegador con el modo test (`?seed=N&test=1`) que ya existe.

### Cómo construir los escenarios

- Tableros concretos con `boardFromRows` de `src/app/test_mode.ts` (formato de texto de los e2e: `.` vacío y la letra de la pieza en cada bloque), con pilas que puedan darse en una partida.
- Situaciones de partida **extraídas de partidas reales**: arrancar `createInitialState({ seed, startLevel })` con semillas fijas, jugar con el piloto y tomar el `GameState` en el momento que interese. Guardar esos tableros como fixtures, con un comentario que diga de qué semilla y pieza salen.

### Tests unitarios del algoritmo (`tests/unit/ai/dellacherie.test.ts`)

**Métricas**, cada una con su valor esperado calculado a mano y explicado en un comentario:

- Tablero tras unas cuantas piezas sin huecos → `getHoles` = 0.
- Pila con una celda tapada por un saliente (una S mal colocada) → huecos y transiciones de columnas correctos.
- Pozo de una columna junto a la pared derecha listo para una I → `getCumulativeWells` correcto.
- Altura de aterrizaje de una I horizontal y de una I vertical sobre la misma pila.
- Celdas erosionadas al completar 1, 2 y 4 líneas con piezas reales.

**Decisiones**:

- Pila de 4 filas completas salvo la columna derecha, pieza I recién aparecida → elige la I vertical en esa columna y completa 4 líneas.
- Una colocación completa una línea y otra deja un hueco → elige la que no deja hueco.
- Tablero vacío de una partida recién empezada con semilla fija → colocación válida que no colisiona.
- Junto a la pared, una orientación imposible por la rotación NES sin wall kicks no aparece en `generatePlacements`.
- Tablero real casi lleno, sin movimientos posibles → `null`.
- Determinismo: misma entrada, misma salida.
- `findBestPlacement` no modifica el tablero recibido.

### Tests unitarios del piloto (`tests/unit/ai/autopilot.test.ts`)

- Fuera de `falling` (en `lineClear`, `entryDelay`, `levelComplete` y `gameOver`) devuelve `EMPTY_INPUT`.
- Avanzando con `tick` y las entradas del piloto, la pieza termina fijada exactamente en la colocación que eligió `findBestPlacement`.
- Envía un frame sin soft drop al empezar cada pieza, y el soft drop funciona en esa pieza.
- En un nivel con gravedad de 1 frame por fila (nivel 29), si el objetivo deja de ser alcanzable, recalcula y la pieza se fija en una posición válida.
- **Partidas completas** con el motor real (el piloto conduce `tick` y se llama a `startNextLevel` en `levelComplete`):
  - Con 3 semillas fijas y nivel inicial 0, juega hasta un máximo de piezas sin `gameOver`, supera un mínimo de líneas y **pasa al menos dos cambios de nivel** sin perder el control. Los umbrales se fijan **después de medir** el rendimiento real con esas semillas, con margen, y nunca por debajo de 100 líneas por partida.
  - Misma semilla → exactamente la misma partida (líneas y puntuación) en dos ejecuciones.
  - Ninguna colocación elegida colisiona ni sale del tablero.
  - Rendimiento: el tiempo medio de `findBestPlacement` sobre los tableros reales de esas partidas queda muy por debajo de un frame (16,7 ms); si la medida en CI es inestable, se comprueba un límite holgado.

### Tests unitarios de sesión y controlador

Ampliar `tests/unit/app/game_session.test.ts` y `tests/unit/app/app_controller.test.ts`:

- Con el piloto activo, las teclas de juego (flechas, ↓, Z) no mueven la pieza; P, M y ESC siguen funcionando.
- Al desactivarlo, una rotación pulsada mientras estaba activo no se aplica.
- `toggleAutopilot` no hace nada fuera de las pantallas de partida.
- Tras `levelUp`, la celebración y `startNextLevel`, el piloto sigue activo y la primera pieza del nivel nuevo la juega el piloto.
- Una partida con el piloto usado en algún momento no entra en récords, y `hud.best` no cuenta su puntuación.
- Reiniciar con ENTER tras un game over con el piloto activo empieza una partida nueva con el piloto activo.

### Tests end-to-end (`tests/e2e/autopilot.spec.ts`)

Con el juego real, semilla fija y los ayudantes de `tests/e2e/helpers.ts`:

- El botón se ve en la pantalla de partida en `playing`, `paused`, `celebrating` y `gameOver`, y no en el menú.
- Clic → `aria-pressed="true"` y, sin pulsar ninguna tecla, las líneas del marcador suben solas.
- Con el piloto activo, pulsar flechas y Z no cambia la jugada.
- **Cambio de nivel**: con `patchGame` dejar el objetivo a una línea de completarse; el piloto la completa, sale la celebración, el botón sigue activo y, al empezar el nivel nuevo, las líneas siguen subiendo solas.
- Clic otra vez → `aria-pressed="false"` y la pieza vuelve a responder al teclado.
- Tras hacer clic en el botón, pulsar ENTER o ESPACIO no lo vuelve a cambiar (no se queda con el foco).
- Game over con el piloto (forzado con `patchGame`, como en `forceGameOver`) → aparece el aviso de que no cuenta para récords y la tabla de récords no cambia.
- Sin errores de consola (`collectErrors`).

### Cobertura y documentación

- Umbral de cobertura del 90 % para `src/ai/**`, como en `src/engine/**`.
- README: explicar el piloto automático (qué es, el botón, que no puntúa para récords y una línea sobre el algoritmo de Dellacherie) y añadir `src/ai/` a la arquitectura y a la estructura de carpetas.
- Regenerar las capturas con `npm run screenshots` y añadir una de una partida con el piloto activo.
- Registrar el cambio en `prompt_tetris.md` como cambio acordado.

### Comprobaciones antes de dar el trabajo por terminado

```bash
npx tsc --noEmit
npm run lint
npx prettier --check .
npm run test:coverage
npm run test:e2e
npm run build
```

No se desactivan tests, reglas de lint ni umbrales de cobertura para que algo pase.
