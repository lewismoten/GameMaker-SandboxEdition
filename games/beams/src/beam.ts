// The beams of level 1: a cone of light that opens from each lamp to the floor, its edges running at an angle across the blocks.
// A block can't be see-through, so the beam is made of twins of the wall (and lamp, and floor) blocks with the light painted over them.
// A block the beam covers all over is one of the plain twins (wallLit25..100); a block the slanted edge cuts through gets a twin of its own
// whose painted pixels follow the edge, pixel by pixel. The dither pattern is the same one on both sides of every join (light.ts).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { lightColor } from './hall';
import { painted, type Density } from './light';

export type BeamKind = 'solid' | 'checker' | 'soft';

/** The cone: it starts just under the bulb (a pixel row, counted from the top of the room), 3 pixels either side, and opens half a pixel for every pixel down (so each two block rows of an edge are the same picture, one block over). */
const TOP = 36;
const HALF0 = 3;
const SLOPE = 0.5;
const halfAt = (y: number): number => HALF0 + SLOPE * (y - TOP);

/** The density of light at a point of the beam, `dx` pixels from its middle and `y` pixels down the room (0 outside the cone). */
export function beamDensity(kind: BeamKind, dx: number, y: number): 0 | Density {
  const half = halfAt(y);
  if (y < TOP || Math.abs(dx) > half) return 0;
  if (kind === 'solid') return 100;
  if (kind === 'checker') return 50;
  // the soft beam fades toward its slanted edges, in bands that run along them: 25 at the rim, 50, then 75 in the middle
  const edge = half - Math.abs(dx);
  return Math.abs(dx) <= 4 || edge >= 22 ? 75 : edge >= 10 ? 50 : 25;
}

/** Adds, for each lamp, the blocks of its beam that aren't plain twins, and returns where each block of the beams goes: "x,y" (blocks) to a block name. */
export function addBeams(book: Book, pal: Pal, lamps: readonly number[], kinds: readonly BeamKind[], rows: readonly [number, number]): Map<string, string> {
  const air = { grav: PULL.down };
  const light = lightColor(pal);
  const put = new Map<string, string>();
  const made = new Map<string, string>();
  lamps.forEach((lx, i) => {
    const cx = lx * 20 + 10;
    for (let by = rows[0]; by <= rows[1]; by++) {
      const floor = by === rows[1];
      for (let bx = lx - 5; bx <= lx + 5; bx++) {
        const baseName = floor ? 'floor' : by === 1 && bx === lx ? 'lamp' : 'wall';
        const base = book.pics.get(baseName)!;
        const dens = new Uint8Array(400);
        for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) dens[y * 20 + x] = beamDensity(kinds[i], bx * 20 + x + 0.5 - cx, by * 20 + y + 0.5);
        if (dens.every((d) => d === 0)) continue;
        const flat = dens[0] !== 0 && dens.every((d) => d === dens[0]) && baseName !== 'lamp';
        if (flat) {
          put.set(`${bx},${by}`, `${floor ? 'floor' : 'wall'}Lit${dens[0]}`);
          continue;
        }
        const pic = new Pixels(20, 20).blit(base, 0, 0).map((x, y, c) => (dens[y * 20 + x] && painted(dens[y * 20 + x] as Density, x, y) ? light : c));
        const key = `${baseName}:${Buffer.from(pic.px).toString('base64')}`;
        if (!made.has(key)) {
          const name = `beam${made.size}`;
          made.set(key, name);
          book.add(name, pic, floor ? { solid: SOLID } : air);
        }
        put.set(`${bx},${by}`, made.get(key)!);
      }
    }
  });
  return put;
}
