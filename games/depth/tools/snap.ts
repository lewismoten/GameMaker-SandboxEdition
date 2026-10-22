// Draws the scene the simulator is in the way PLAYGAME draws it, into a PNG (for checking art).
import { Pixels } from '../../kit/pixels';
import { writePng } from '../../kit/png';
import { Screen } from '../../../web/src/gfx/screen';
import { renderWorld } from '../../../web/src/engine/render';
import { headlessCanvas } from '../../../web/src/walkthrough/runtime';
import type { GameSim } from './sim';

export function snap(sim: GameSim, file: string, scale = 2): void {
  const screen = new Screen(headlessCanvas());
  // the simulator doesn't load palettes: take the scene's .PAL
  const pal = sim.files.get(sim.game.scenes[sim.scene].files[0]) ?? sim.w.palette;
  screen.setPalette(pal);
  renderWorld(screen, sim.w);
  const p = new Pixels(320, 200);
  p.px.set(screen.pixels);
  writePng(file, p, pal, scale);
}
