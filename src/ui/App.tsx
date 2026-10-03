import { useEffect, useState, useSyncExternalStore, type CSSProperties } from 'react';
import type { AppController, AppSnapshot } from '../app/app_controller';
import type { RenderTargets } from '../app/game_renderer';
import { createAppRuntime } from '../app/runtime';
import { UI_COLORS } from '../config/palette';
import { BackgroundCanvas } from './BackgroundCanvas';
import { ControlsScreen } from './ControlsScreen';
import { GameScreen } from './GameScreen';
import { PressAnyKey } from './PressAnyKey';
import { RecordsScreen } from './RecordsScreen';
import { StartScreen } from './StartScreen';

/** Colores de la paleta expuestos como variables CSS. */
const COLOR_VARIABLES = Object.fromEntries(
  Object.entries(UI_COLORS).map(([name, color]) => [`--color-${name}`, color]),
) as CSSProperties;

/**
 * Pantalla que corresponde al estado actual.
 * @param snapshot Estado de la interfaz.
 * @param targets Registro de canvas de la partida.
 * @param controller Controlador, para las acciones de los botones y formularios.
 * @returns La pantalla.
 */
function renderScreen(
  snapshot: AppSnapshot,
  targets: RenderTargets,
  controller: AppController,
): React.JSX.Element | null {
  switch (snapshot.screen) {
    case 'pressAnyKey':
      return <PressAnyKey />;
    case 'menu':
      return <StartScreen menuIndex={snapshot.menuIndex} preferences={snapshot.preferences} />;
    case 'controls':
      return <ControlsScreen />;
    case 'records':
      return <RecordsScreen records={snapshot.records} />;
    case 'playing':
    case 'paused':
    case 'celebrating':
    case 'nameEntry':
    case 'gameOver':
      return snapshot.hud === null ? null : (
        <GameScreen
          snapshot={snapshot}
          hud={snapshot.hud}
          targets={targets}
          onToggleAutopilot={controller.toggleAutopilot}
          onSubmitRecordName={controller.submitRecordName}
        />
      );
  }
}

/**
 * Componente raíz: arranca la aplicación y pinta la pantalla actual.
 * @returns La interfaz del juego.
 */
export function App(): React.JSX.Element {
  const [runtime] = useState(createAppRuntime);
  useEffect(() => runtime.start(), [runtime]);
  const snapshot = useSyncExternalStore(
    runtime.controller.subscribe,
    runtime.controller.getSnapshot,
  );
  return (
    <main className="app" style={COLOR_VARIABLES}>
      <BackgroundCanvas targets={runtime.targets} />
      <div className="foreground">
        {renderScreen(snapshot, runtime.targets, runtime.controller)}
      </div>
    </main>
  );
}
