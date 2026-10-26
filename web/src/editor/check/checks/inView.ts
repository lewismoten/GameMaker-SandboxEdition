// The level check's "prize in view, out of reach": of the prizes the hero can't get to, the ones
// the screen shows from somewhere the hero can be (PLAYGAME's view is 16 × 10 blocks; with the
// hero near the middle, a prize up to 7 blocks across and 4 up or down is on screen with him).
// A prize nobody can see is a quiet mistake; one in plain view that can't be reached is a tease.
import { MLEN, MWID } from '../../../formats/map';
import { at, type Finding } from '../findings';
import type { SceneData } from '../sceneData';

/** How far from the hero, in blocks, a cell is surely on screen with him. */
const VIEW_X = 7;
const VIEW_Y = 4;

/** The cells (of `cells`) on screen from some cell where `reached` is true; the map wraps. */
export function seenFrom(cells: number[], reached: (cell: number) => boolean): number[] {
  return cells.filter((c) => {
    const x = c % MLEN;
    const y = Math.floor(c / MLEN);
    for (let dy = -VIEW_Y; dy <= VIEW_Y; dy++)
      for (let dx = -VIEW_X; dx <= VIEW_X; dx++) if (reached(((y + dy + MWID) % MWID) * MLEN + ((x + dx + MLEN) % MLEN))) return true;
    return false;
  });
}

/** The finding for prizes of block `n` in view but out of reach (`how`: "sealed in" or "never reached"). */
export function prizeInView(d: SceneData, n: number, cells: number[], how: string): Finding {
  return {
    check: 'prize-in-view',
    severity: 'warning',
    title: `${cells.length} of block ${n} ${cells.length === 1 ? 'is' : 'are'} in view but ${how}, first at ${at(cells[0])}`,
    detail:
      'The screen shows it from where the hero can be, but no way leads to it. Players spend lives trying, then feel teased. Open a way in, move it out of sight, or draw it as scenery.',
    where: { scene: d.scene, map: d.names.map, cell: cells[0], cells, block: { file: d.names.bbl ?? '', n } },
    fix: 'open-gap',
  };
}
