// What the character's preview stage shows behind the hero: a dark or light grid, or a level of the
// game (the map around where the hero arrives, its monsters included), so a move can be
// judged against real scenery. The choice is kept in the companion file, never in the .chr.
import { h } from '../../core/ui';
import { paintIndexed } from '../../core/draw';
import { ADVTYPE } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { mapPixels } from '../../../gfx/levelPicture';
import { normalize } from '../../../project/files';
import type { Project } from '../../core/project';
import { sceneName } from '../../core/uses';
import { arrival } from '../integrator/board';
import { BLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';

interface StageBackdrop {
  el: HTMLElement;
  /** Draws the chosen level onto the stage; false when a grid is chosen (or the level can't be drawn). */
  draw(ctx: CanvasRenderingContext2D): boolean;
  /** Which grid to paint when no level is drawn. */
  grid(): 'dark' | 'light';
}

/** The stage choices that aren't levels, kept as negative numbers in the companion file. */
const DARK = -1;
const LIGHT = -2;

export function stageBackdrop(project: Project, file: string, w: number, h_: number, onChange: () => void): StageBackdrop {
  const game = project.game();
  const levels = game.scenes.map((_, i) => i).filter((i) => game.scenes[i].gametype === ADVTYPE && game.scenes[i].files[1]);
  // the levels that use this hero first
  const mine = (i: number) => normalize(game.scenes[i].files[5] ?? '') === file;
  levels.sort((a, b) => Number(mine(b)) - Number(mine(a)));
  let scene = project.extras<number>(file, 'stage', -1);
  if (scene !== LIGHT && !levels.includes(scene)) scene = DARK;
  let shot: HTMLCanvasElement | undefined;
  const build = () => {
    shot = undefined;
    if (scene < 0) return;
    const s = game.scenes[scene];
    const at = arrival(game, scene);
    const cols = Math.ceil(w / BLEN);
    const rows = Math.ceil(h_ / BLEN);
    const pic = mapPixels(project.files, game, s.files[1], at.x - (cols >> 1), at.y - (rows >> 1), cols, rows);
    if (!pic) return;
    shot = document.createElement('canvas');
    paintIndexed(shot, pic.pixels, pic.width, pic.height, pic.palette);
  };
  build();
  const sel = h(
    'select',
    {
      onchange: () => {
        scene = Number(sel.value);
        project.setExtras(file, 'stage', scene === DARK ? undefined : scene);
        build();
        onChange();
      },
    },
    h('option', { value: String(DARK), selected: scene === DARK }, 'Dark grid'),
    h('option', { value: String(LIGHT), selected: scene === LIGHT }, 'Light grid'),
    ...levels.map((i) => h('option', { value: String(i), selected: i === scene }, `${sceneName(project, i)}${mine(i) ? '' : ' (another hero)'}`)),
  );
  return {
    el: h('label', { class: 'field chr-stage-bg', title: 'What the hero is shown in front of' }, h('span', null, 'Behind'), sel),
    draw(ctx) {
      if (!shot) return false;
      ctx.drawImage(shot, 0, 0);
      return true;
    },
    grid: () => (scene === LIGHT ? 'light' : 'dark'),
  };
}
