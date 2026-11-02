// The starting sheet's F2 preview uses the native player renderer and this project's patches.
import { Screen } from '@lewismoten/gamemaker-sandbox-engine/gfx/screen';
import { drawStatus } from '@lewismoten/gamemaker-sandbox-engine/engine/funcKeys';
import { playerLook } from '@lewismoten/gamemaker-sandbox-engine/engine/playerLook';
import type { Character } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Palette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import type { Project } from '../../core/project';
import { companionPatches } from '../../../dosPlayer/playerRecord';

export function drawCharacterStatus(canvas: HTMLCanvasElement, project: Project, character: Character, blocks: Block[], palette: Palette): void {
  const screen = new Screen(canvas);
  screen.setPalette(palette);
  screen.clear(0);
  drawStatus(
    screen,
    {
      palette,
      bg: blocks,
      clock: 0,
      ci: { inv: Array.from(character.inv), score: 0, meter: character.meter, hitpts: character.meter[0], lives: character.meter[1] },
    },
    playerLook(companionPatches(project.companion, project.gam)),
  );
  screen.present();
}
