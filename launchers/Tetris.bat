@echo off
rem Abre Tetris en el navegador predeterminado (Windows). Se ejecuta con doble clic.
rem Busca index.html junto a este archivo (zip de la release) o en ..\dist (repositorio).
rem Arranca el servidor local (records_server.ps1, con PowerShell) que sirve el juego y
rem guarda el ranking en records.json: junto a index.html en el zip y en la raiz del
rem repositorio si se juega desde ahi. Si no arranca, abre index.html y los records quedan
rem en el navegador.
rem Con TETRIS_LAUNCHER_DRY_RUN=1 solo muestra la ruta del juego y la del ranking, sin abrir nada.
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
for %%I in ("%GAME%") do set "GAME_DIR=%%~dpI"
set "RECORDS=%DIR%..\records.json"
if /i "%GAME_DIR%"=="%DIR%" set "RECORDS=%DIR%records.json"
for %%I in ("%RECORDS%") do set "RECORDS=%%~fI"
rem Sin la barra final: delante de unas comillas, PowerShell la tomaria por un escape.
set "GAME_DIR=%GAME_DIR:~0,-1%"
if not "%TETRIS_LAUNCHER_DRY_RUN%"=="1" goto open
echo(%GAME%
echo(%RECORDS%
exit /b 0

:open
powershell -NoProfile -ExecutionPolicy Bypass -File "%DIR%records_server.ps1" -GameDir "%GAME_DIR%" -RecordsFile "%RECORDS%" -OpenBrowser
if errorlevel 1 start "" "%GAME%"
