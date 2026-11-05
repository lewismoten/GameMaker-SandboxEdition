// FIREWORKS' palette: the Starter palette with its sky made a deep night blue and the grass and dirt darker, plus two
// ramps of its own for what a burst leaves behind: 'ember' (a spark cooling from orange to a dull red) and 'smoke'
// (a gray-blue only a little lighter than the sky). The bright ramps every Starter has (red, gold, green, blue,
// purple, pink, teal, white) are the stars of the bursts.
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';

type RGB = [number, number, number];

/** The night sky, darkest first. The sky block is shade 3. */
const SKY: RGB[] = [
  [4, 6, 22],
  [8, 10, 34],
  [12, 14, 46],
  [14, 18, 56],
  [36, 44, 100],
  [70, 84, 150],
];

export function nightPalette(): Pal {
  const pal = buildStarterPalette((b) => {
    b.ramp('ember', 4, [70, 18, 22], [250, 150, 60], [170, 60, 30]);
    b.ramp('smoke', 3, [30, 34, 70], [80, 84, 120]);
  }, 'fireworks');
  const set = (name: string, i: number, rgb: RGB) => {
    const at = pal.c(name, i) * 3;
    for (let k = 0; k < 3; k++) pal.pal[at + k] = rgb[k] >> 2; // the palette holds 6 bits a color
  };
  SKY.forEach((rgb, i) => set('sky', i, rgb));
  for (const ramp of ['grass', 'dirt'] as const)
    for (let i = 0; i < 6; i++) {
      const at = pal.c(ramp, i) * 3;
      for (let k = 0; k < 3; k++) pal.pal[at + k] = Math.round(pal.pal[at + k] * 0.5);
    }
  return pal;
}
