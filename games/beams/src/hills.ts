// The hills of level 2: three layers of rolling hills, far to near, each two blocks tall (a ridge row, then a fill row), with the
// meadow in front. They are drawn twice, in two zones of the level:
//   zone A  "solid": each layer is covered in one flat pale color. The farther, the paler. The little trees on the hills are gone.
//   zone B  "dither": the same hills with a fog painted over them at 75, 50 and 25 percent. The trees show through the holes.
// Hill blocks are named `hill.<zone>.<layer>.ridge<v>` and `...fill<v>`; v is 0 to 2, because the ridge repeats every 60 pixels
// (three blocks) and the three pictures join: the hill's edge on the right of one is the height at the left of the next.
import { rng, Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { painted, type Density } from './light';

export type Zone = 'solid' | 'dither';
export const ZONES: Zone[] = ['solid', 'dither'];
export const LAYERS = [0, 1, 2] as const; // 0 is the farthest
/** The fog's density on each layer: the farther, the thicker. */
export const FOG: Density[] = [75, 50, 25];

/** The meadow's flat color (the row behind Kit and the doors). */
export const meadow = (pal: Pal): number => pal.c('grass', 3);
/** The pale color of the fog. */
const fogColor = (pal: Pal): number => pal.c('white', 3);
/** The flat colors zone A's layers are covered in: far, mid, near. */
const FLAT = (pal: Pal): number[] => [pal.c('white', 3), pal.c('teal', 4), pal.c('green', 3)];

/** The height of a layer's ridge (pixels from the top of its block) at x; it repeats every 60 pixels, each layer a different wave. */
function ridge(layer: number, x: number): number {
  const t = (Math.PI * 2 * x) / 60;
  const a = [4.5, 5.5, 6][layer];
  return 8 + a * Math.sin(t + layer * 1.7) + (a / 2.5) * Math.sin(2 * t + layer);
}

/** A layer's hill before any fog: the ridge tile `v` (sky above the ridge) or the fill tile, with small dark trees. */
function hillPicture(pal: Pal, layer: number, kind: 'ridge' | 'fill', v: number): Pixels {
  const { c } = pal;
  const sky = skyOf(pal);
  const p = new Pixels(20, 20, sky);
  const base = c('green', 2);
  const top = (x: number) => (kind === 'ridge' ? Math.round(ridge(layer, v * 20 + x)) : 0);
  for (let x = 0; x < 20; x++) for (let y = top(x); y < 20; y++) p.set(x, y, base);
  // trees: little dark round trees, the same on every layer so only the fog tells them apart
  const rand = rng(100 + layer * 10 + v + (kind === 'ridge' ? 5 : 0));
  for (let i = 0; i < 3; i++) {
    const x = 1 + Math.floor(rand() * 13);
    const y = Math.max(top(x), top(x + 4)) + 2 + Math.floor(rand() * 7);
    if (y > 14) continue;
    const tree = c('green', 0);
    p.rect(x + 1, y, 3, 1, tree)
      .rect(x, y + 1, 5, 2, tree)
      .rect(x + 1, y + 3, 3, 1, tree);
  }
  return p;
}

/** The hill with its fog on: pixels of the hill (not the sky) are fog colored where the density paints them, or flat if zone A. */
function fogged(pal: Pal, pic: Pixels, zone: Zone, layer: number): Pixels {
  const sky = skyOf(pal);
  return new Pixels(20, 20).blit(pic, 0, 0).map((x, y, col) => {
    if (col === sky) return col;
    return zone === 'solid' ? FLAT(pal)[layer] : painted(FOG[layer], x, y) ? fogColor(pal) : col;
  });
}

export const hillName = (zone: Zone, layer: number, kind: 'ridge' | 'fill', v: number): string => `hill.${zone}.${layer}.${kind}${v}`;

/** The picture of one hill block (also used for the manual's frames). */
export function hillBlock(pal: Pal, zone: Zone, layer: number, kind: 'ridge' | 'fill', v: number): Pixels {
  return fogged(pal, hillPicture(pal, layer, kind, v), zone, layer);
}

/** The picture of a hill block with no fog at all, for the manual to compare. */
export const clearHill = hillPicture;

/** A door's block with the picture behind it showing where the door is sky colored (`behind` is that block's picture). */
export function onHill(pal: Pal, pic: Pixels, behind: Pixels): Pixels {
  return new Pixels(20, 20).blit(pic, 0, 0).map((x, y, col) => (col === skyOf(pal) ? behind.get(x, y) : col));
}

/** Adds the hills in both zones, the meadow, and the two Starter doors on the hills and the meadow. */
export function addHillBlocks(book: Book, pal: Pal): void {
  const air = { grav: PULL.down };
  for (const zone of ZONES)
    for (const layer of LAYERS)
      for (let v = 0; v < 3; v++) {
        book.add(hillName(zone, layer, 'ridge', v), hillBlock(pal, zone, layer, 'ridge', v), air);
        book.add(hillName(zone, layer, 'fill', v), hillBlock(pal, zone, layer, 'fill', v), air);
      }
  const flat = new Pixels(20, 20, meadow(pal));
  book.add('meadow', flat, air);
}
