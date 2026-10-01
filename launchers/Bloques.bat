@echo off
rem Abre Bloques en el navegador predeterminado (Windows). Se ejecuta con doble clic.
rem Busca index.html junto a este archivo (zip de la release) o en ..\dist (repositorio).
rem Con BLOQUES_LAUNCHER_DRY_RUN=1 solo muestra la ruta del juego, sin abrir el navegador.
setlocal
set "DIR=%~dp0"
set "GAME="
if exist "%DIR%index.html" set "GAME=%DIR%index.html"
if not defined GAME if exist "%DIR%..\dist\index.html" set "GAME=%DIR%..\dist\index.html"
if defined GAME goto found
echo No se encuentra index.html. Si has clonado el repositorio, ejecuta antes: npm run build 1>&2
exit /b 1

:found
for %%I in ("%GAME%") do set "GAME=%%~fI"
if not "%BLOQUES_LAUNCHER_DRY_RUN%"=="1" goto open
echo(%GAME%
exit /b 0

:open
start "" "%GAME%"
