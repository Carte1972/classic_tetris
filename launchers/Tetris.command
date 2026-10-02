#!/bin/bash
# Abre Tetris en el navegador predeterminado (macOS). Se ejecuta con doble clic.
# Busca index.html junto a este archivo (zip de la release) o en ../dist (repositorio).
# Con TETRIS_LAUNCHER_DRY_RUN=1 solo muestra la ruta del juego, sin abrir el navegador.
set -euo pipefail

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

open "$GAME"
