// The three palettes: the castle hall's (the day palette's sky made a dim stone wall, the brick and dirt darker), the
// day's (the Starters' own, for the cliff) and the night's (for the fire on the hill). They change only colors of
// ramps; every block, the hero and the monsters use the same color numbers in all three, so a level may load any.
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';

type RGB = [number, number, number];

/** Sets a ramp's colors (8 bits a channel; the palette holds 6). */
function ramp(pal: Pal, name: string, rgb: RGB[]): void {
  rgb.forEach((v, i) => {
    const at = pal.c(name, i) * 3;
    for (let k = 0; k < 3; k++) pal.pal[at + k] = v[k] >> 2;
  });
}

/** Scales a ramp's colors toward black. */
function dim(pal: Pal, name: string, n: number, by: number): void {
  for (let i = 0; i < n; i++) {
    const at = pal.c(name, i) * 3;
    for (let k = 0; k < 3; k++) pal.pal[at + k] = Math.round(pal.pal[at + k] * by);
  }
}

/** The hall: a dim violet-gray wall, floor bricks and dirt darker. */
export function hallPalette(): Pal {
  const pal = buildStarterPalette();
  ramp(pal, 'sky', [
    [18, 14, 30],
    [26, 20, 40],
    [38, 30, 54],
    [48, 38, 64],
    [66, 54, 84],
    [96, 82, 112],
  ]);
  dim(pal, 'brick', 6, 0.72);
  dim(pal, 'dirt', 6, 0.55);
  return pal;
}

/** The day: the Starters' palette as it is. */
export function dayPalette(): Pal {
  return buildStarterPalette();
}

/** The night: a dark blue sky, grass and dirt darker. */
export function nightPalette(): Pal {
  const pal = buildStarterPalette();
  ramp(pal, 'sky', [
    [8, 10, 40],
    [12, 16, 60],
    [16, 22, 78],
    [20, 28, 96],
    [44, 56, 130],
    [84, 100, 170],
  ]);
  dim(pal, 'grass', 6, 0.55);
  dim(pal, 'dirt', 6, 0.55);
  return pal;
}
