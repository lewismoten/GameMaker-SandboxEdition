// KIT DUCKS' two friendly fliers, drawn here (nothing is borrowed from the Starter monsters):
//   a bluebird that flaps along at head height (Kit's top block), and
//   a beach ball that bounces along the ground (Kit's bottom block).
// Each is one block, two frames, facing right (a monster walking left is the same picture mirrored by its path).
// Their blocks hurt a little when they touch Kit's pixels, and they are not solid, so a miss costs nothing.
import { newMonsterSet, type Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { mon, pace } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';

const T = 255;
/** Hit points a touch takes (each tick the pictures overlap). */
export const BITE = -1;
/** Monster numbers in dk.mon. */
export const MONS = { bird: 0, birdQuick: 1, ball: 2, ballQuick: 3 } as const;
/** Blocks each patrols, and its speed (a bigger number is slower). */
export const PATROL = { bird: [9, 3], birdQuick: [9, 4], ball: [9, 3], ballQuick: [9, 4] } as const;

/** A bluebird, flapping: wings up or down, a yellow beak to the right. */
function bird(pal: Pal, up: boolean): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  const blue = r('blue');
  const wy = up ? 2 : 11;
  // the far wing behind the body, then the body, then the near wing in front
  blob(p, 8, wy + 3, 3.2, 3.4, blue, 0, 3);
  blob(p, 10, 10, 7.4, 5.4, blue, 1, 4);
  blob(p, 11, 12, 4.6, 2.8, r('white'), 1, 3);
  blob(p, 5, wy + 4, 3.6, 4, blue, 0, 4);
  // head, beak and eye
  blob(p, 15, 8, 3.4, 3.4, blue, 1, 4);
  p.rect(18, 8, 2, 2, c('gold', 3)).set(19, 8, c('gold', 4));
  p.rect(15, 7, 2, 2, c('white', 3)).set(16, 8, c('ink', 0));
  // the tail
  p.line(3, 10, 0, 8, blue[2]).line(3, 11, 0, 11, blue[1]);
  return outline(p, c('ink', 0), { transparent: T });
}

/** A beach ball: curved stripes of red, white and blue, turned a quarter between frames. */
function ball(pal: Pal, turn: number): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  const bands = [r('red'), r('white'), r('blue')];
  const cx = 10;
  const cy = 11;
  for (let y = 2; y < 20; y++)
    for (let x = 1; x < 19; x++) {
      const nx = (x + 0.5 - cx) / 9;
      const ny = (y + 0.5 - cy) / 9;
      const d = nx * nx + ny * ny;
      if (d > 1) continue;
      const band = Math.floor(((Math.atan2(ny, nx) + Math.PI) / (Math.PI * 2)) * 6 + turn) % 3;
      const z = Math.sqrt(1 - d);
      const l = 0.62 * z - 0.42 * nx - 0.52 * ny;
      p.set(x, y, bands[band][Math.max(1, Math.min(3, Math.round(l * 3 + 1)))]);
    }
  p.disc(10, 11, 1.2, c('gold', 3));
  p.set(6, 6, c('white', 3)).set(7, 5, c('white', 3));
  return outline(p, c('ink', 0), { transparent: T });
}

/** The monsters' pictures (.MBL). */
export function buildMonsterBlocks(pal: Pal): Book {
  const book = new Book('mbl');
  // not solid: touching a flier costs a point, it never shoves Kit
  book.add('bird0', bird(pal, true), { hp: BITE });
  book.add('bird1', bird(pal, false), { hp: BITE });
  book.add('ball0', ball(pal, 0), { hp: BITE });
  book.add('ball1', ball(pal, 1), { hp: BITE });
  return book;
}

/** What each does (.MON): all four patrol back and forth through anything, a quick one and a slow one of each. */
export function buildMonsters(mb: Book): Monster[] {
  const set = newMonsterSet();
  const anim = (name: string, t: number): [number, number][] => [
    [mb.n(`${name}0`), t],
    [mb.n(`${name}1`), t],
  ];
  for (const k of Object.keys(MONS) as (keyof typeof MONS)[]) {
    const [run, speed] = PATROL[k];
    set[MONS[k]] = mon(anim(k.startsWith('bird') ? 'bird' : 'ball', k.startsWith('bird') ? 3 : 5), { power: 150, thru: 1 }, pace(run, speed));
  }
  return set;
}

/** Where a flier patrols, in level pixels: from `col` blocks across, `PATROL` blocks to the right (a flier turns at both ends). */
export function patrol(kind: keyof typeof MONS, col: number): { x0: number; x1: number } {
  return { x0: col * 20, x1: (col + PATROL[kind][0]) * 20 };
}
