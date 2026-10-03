#!/bin/bash
# Abre Tetris en el navegador predeterminado (macOS). Se ejecuta con doble clic.
# Busca index.html junto a este archivo (zip de la release) o en ../dist (repositorio).
# Arranca el servidor local (records_server.pl, con el Perl de macOS) que sirve el juego y
# guarda el ranking en records.json: junto a index.html en el zip y en la raíz del
# repositorio si se juega desde ahí. Sin Perl, abre index.html y los récords quedan en el
# navegador.
# Con TETRIS_LAUNCHER_DRY_RUN=1 solo muestra la ruta del juego y la del ranking, sin abrir nada.
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

GAME_DIR="$(dirname "$GAME")"
if [ "$GAME_DIR" = "$DIR" ]; then
  RECORDS="$DIR/records.json"
else
  RECORDS="$(cd "$DIR/.." && pwd)/records.json"
fi

if [ "${TETRIS_LAUNCHER_DRY_RUN:-}" = "1" ]; then
  echo "$GAME"
  echo "$RECORDS"
  exit 0
fi

if command -v perl >/dev/null 2>&1; then
  exec perl "$DIR/records_server.pl" "$GAME_DIR" "$RECORDS" --open open
fi
echo "No se encuentra Perl: el juego se abre sin servidor y los récords se guardan en el navegador." >&2
open "$GAME"
