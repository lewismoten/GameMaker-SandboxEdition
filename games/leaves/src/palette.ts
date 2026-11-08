// LEAVES IN THE WIND's palette: the Starters' own (so the hero, the signs and the doors look as in every Starter) with
// three autumn ramps added after the shared ones, one for each kind of tree, and the grass turned from summer green to
// a dry late-autumn olive. Lightest shade last, as in every ramp.
//   maple    crimson to scarlet to coral       (the maple: big leaves with five points)
//   russet   brown to burnt orange to apricot   (the oak: long leaves with round lobes)
//   ochre    deep gold to butter yellow         (the birch: small leaves shaped like a drop)
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';

/** The tree kinds, each with its ramp. */
export const KINDS = ['maple', 'oak', 'birch'] as const;
export type Kind = (typeof KINDS)[number];
export const RAMP: Record<Kind, string> = { maple: 'maple', oak: 'russet', birch: 'ochre' };

export function autumnPalette(): Pal {
  const pal = buildStarterPalette((b) => {
    b.ramp('maple', 5, [92, 10, 30], [255, 168, 120], [214, 38, 40]);
    b.ramp('russet', 5, [78, 34, 14], [252, 190, 104], [200, 98, 30]);
    b.ramp('ochre', 5, [128, 74, 6], [255, 242, 150], [242, 184, 34]);
  }, 'leaves');
  // the grass: the shared ramp's six shades made a dry olive (6 bits a color, as the palette holds them)
  const olive: [number, number, number][] = [
    [46, 70, 30],
    [70, 98, 38],
    [100, 126, 48],
    [134, 152, 62],
    [170, 182, 84],
    [206, 210, 120],
  ];
  olive.forEach((rgb, i) => {
    const at = pal.c('grass', i) * 3;
    for (let k = 0; k < 3; k++) pal.pal[at + k] = rgb[k] >> 2;
  });
  return pal;
}
