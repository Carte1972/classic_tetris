#!/bin/sh
# Abre Tetris en el navegador predeterminado (Linux).
# Busca index.html junto a este archivo (zip de la release) o en ../dist (repositorio).
# Con TETRIS_LAUNCHER_DRY_RUN=1 solo muestra la ruta del juego, sin abrir el navegador.
set -eu

DIR="$(cd "$(dirname "$0")" && pwd)"
GAME=""
for CANDIDATE in "$DIR/index.html" "$DIR/../dist/index.html"; do
  if [ -f "$CANDIDATE" ]; then
    GAME="$(cd "$(dirname "$CANDIDATE")" && pwd)/index.html"
    break
  fi
done

if [ -z "$GAME" ]; then
  echo "No se encuentra index.html. Si has clonado el repositorio, ejecuta antes: npm run build" >&2
  exit 1
fi

if [ "${TETRIS_LAUNCHER_DRY_RUN:-}" = "1" ]; then
  echo "$GAME"
  exit 0
fi

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$GAME" >/dev/null 2>&1 &
else
  echo "No se encuentra xdg-open. Abre este archivo en tu navegador: $GAME" >&2
  exit 1
fi
