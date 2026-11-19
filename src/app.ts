import Assets from './assets';
import Input from './input';
import renderInterface from './interface/Interface';
import createWorld from './game/world/world';
import createPort from './game/port/port';

import state from './state/state';
import { updateGeneral } from './state/actionsPort';
import { setDockedFleetPositions } from './state/actionsWorld';
import { localizeDocument, subscribeLocale } from './localization';
import { runWorldFrame } from './game/world/runWorldFrame';
import './combat/combatEvents';

localizeDocument();
subscribeLocale(localizeDocument);

const start = async () => {
  await Assets.load();
  Input.setup();

  await renderInterface();

  updateGeneral();

  setDockedFleetPositions();

  let portCanvasVisible: boolean | null = null;

  const loop = () => {
    const cameraCanvas = document.getElementById(
      'camera',
    ) as HTMLCanvasElement | null;
    const portCanvas = document.getElementById(
      'camera-port',
    ) as HTMLCanvasElement | null;

    if (!cameraCanvas || !portCanvas) {
      requestAnimationFrame(loop);
      return;
    }

    const inPort = state.portId !== null;
    if (portCanvasVisible !== inPort) {
      portCanvasVisible = inPort;
      cameraCanvas.hidden = inPort;
      portCanvas.hidden = !inPort;
    }

    if (state.portId !== null) {
      if (!state.port) {
        state.port = createPort(state.portId);
      }

      if (state.buildingId === null) {
        if (!Input.isSuspended()) state.port.update();
        state.port.draw();
      }
    }

    if (state.portId === null) {
      if (!state.world) {
        state.world = createWorld();
      }

      runWorldFrame(state.world);
    }

    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
};

start();
