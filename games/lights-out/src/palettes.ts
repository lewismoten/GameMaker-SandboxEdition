// The cave's palette: the Starters' palette with three ramps of its own (cave air, rock and floor, each darkest to
// brightest, so a block can be drawn in five brightness steps) and the sky and dirt ramps made dark to match. Every
// block, the hero and the signs keep the same color numbers as in every Starter, so Mia and the signs stay as bright as
// ever: they are what must be readable in the dark.
import type { PaletteBuilder } from '@lewismoten/gamemaker-sandbox-tools/kit/palette';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';

/** Copies the color of ramp `from` at `i` onto ramp `to` at `j` (both are 6-bit palette entries). */
function copy(pal: Pal, from: string, i: number, to: string, j: number): void {
  const a = pal.c(from, i) * 3;
  const b = pal.c(to, j) * 3;
  for (let k = 0; k < 3; k++) pal.pal[b + k] = pal.pal[a + k];
}

/**
 * The cave palette. Air has 6 colors (shade k, with shade k + 1 for dust), rock and floor 8 (shade k uses k to k + 2, a
 * floor's edge k + 3), so two neighbors of different shade never share a color.
 */
const caveRamps = (b: PaletteBuilder): void => {
  b.ramp('cair', 6, [8, 10, 28], [116, 84, 50], [50, 38, 60]);
  b.ramp('crock', 8, [14, 16, 38], [238, 190, 128], [104, 80, 94]);
  b.ramp('cfloor', 8, [22, 22, 50], [252, 218, 156], [112, 92, 102]);
};

/** The Starters' bright palette with the cave's ramps added (the same color numbers as the cave's): for the title, menu and cards. */
export const brightPalette = (): Pal => buildStarterPalette(caveRamps, 'lights-out');

export function cavePalette(): Pal {
  const pal = buildStarterPalette(caveRamps, 'lights-out');
  // the blank sky block and the dirt below every level are the darkest air and rock, so what lies past a level's edge is dark too
  copy(pal, 'cair', 0, 'sky', 3);
  copy(pal, 'crock', 1, 'dirt', 2);
  return pal;
}
