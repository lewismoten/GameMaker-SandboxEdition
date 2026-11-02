// The Beltway's monster pictures (in CAST.MBL, drawn in the palette's fixed half so every scene's
// .PAL shows them alike): the two kinds of car that pass THE CHEZ, from behind at four sizes as
// they pull away toward the horizon and from the front as a glint in the rear-view mirror; the
// lane dashes and the shoulder posts at the size of each row they cross; the EXIT sign growing.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { ROAD_SIZES, shrinkSprite } from '@lewismoten/gamemaker-sandbox-tools/kit/road3d';
import { micro } from '../../../snowbound/src/art/font';
import { P } from '../art/palette';
import { DIVIDER_SHIFT, POST_SHIFT } from '../levels/beltwayPlan';

type Add = (name: string, pic: Pixels) => number;
const c = P.c;
const CLEAR = 255;
const INK = c('ink', 0);

/** A car's body colors: the coupe is sky blue, the van mustard yellow. */
const BODY = [
  ['blue', 'blue'],
  ['yellow', 'yellow'],
] as const;

/** Car `k` from behind, full size: its bottom on row 19. */
function rear(k: number): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const [ramp] = BODY[k];
  if (k === 0) {
    // the coupe: low and wide, a sloped back window
    p.rect(2, 11, 16, 6, c(ramp, 2)).rect(2, 11, 16, 1, c(ramp, 3));
    p.rect(5, 6, 10, 5, c(ramp, 2)).rect(6, 7, 8, 3, c('water', 1)).rect(6, 7, 8, 1, c('water', 3));
  } else {
    // the van: a tall box with two rear doors and their windows
    p.rect(3, 3, 14, 14, c(ramp, 2)).rect(3, 3, 14, 1, c(ramp, 3)).rect(10, 4, 1, 12, c(ramp, 0));
    p.rect(5, 5, 4, 3, c('water', 1)).rect(11, 5, 4, 3, c('water', 1));
  }
  // tail lights, the bumper, the tires
  p.rect(2, 12, 3, 2, c('red', 3)).rect(15, 12, 3, 2, c('red', 3));
  p.rect(1, 16, 18, 2, c('metal', 3)).rect(7, 16, 6, 1, c('paint', 1));
  p.rect(3, 18, 3, 2, INK).rect(14, 18, 3, 2, INK);
  return outline(p, INK);
}

/** Car `k` from the front, small, in the mirror; `near` is bigger, with its headlights flaring. */
function front(k: number, near: boolean): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const w = near ? 10 : 6;
  const h = near ? (k ? 7 : 5) : k ? 5 : 3;
  const x = 10 - w / 2;
  const y = 12 - h;
  p.rect(x, y, w, h, c(BODY[k][0], 2)).rect(x + 1, y + (k ? 1 : 0), w - 2, Math.max(1, h >> 1), c('water', 2));
  p.set(x, y + h - 1, c('glow', 3)).set(x + w - 1, y + h - 1, c('glow', 3));
  if (near) {
    // the glint: a flare off each headlight
    for (const hx of [x, x + w - 1])
      p.set(hx, y + h - 2, c('glow', 3))
        .set(hx - 1, y + h - 1, c('glow', 2))
        .set(hx + 1, y + h - 1, c('glow', 2));
    p.set(x + w + 1, y - 1, c('paint', 3))
      .set(x + w + 2, y - 2, c('paint', 3))
      .set(x + w + 1, y - 2, c('glow', 3));
  }
  return p;
}

/** A lane dash at the size of row `row` (2 far, 4 near), shifted `dx` pixels off the cell's middle. */
function dash(row: number, dx: number): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const [w, h, bottom] = row === 2 ? [1, 1, 19] : row === 3 ? [2, 4, 18] : [3, 8, 18];
  p.rect(10 + dx - (w >> 1), bottom - h + 1, w, h, c('paint', 3));
  return p;
}

/** A shoulder post with its reflector at the size of row `row`, shifted `dx` pixels. */
function post(row: number, dx: number): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const [w, h, bottom] = row === 2 ? [1, 2, 19] : row === 3 ? [2, 7, 19] : [3, 15, 19];
  const x = 10 + dx - (w >> 1);
  p.rect(x, bottom - h + 1, w, h, c('paint', 2)).rect(x, bottom - h + 1, w, Math.max(1, h >> 3), c('orange', 3));
  if (row === 4) p.rect(x - 1, bottom, w + 2, 1, c('leaf', 0));
  return p;
}

/** The EXIT sign on its post: size 0 a fleck of green, 2 a full block. */
function exitSign(size: number): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  if (size === 0) return p.rect(9, 17, 2, 2, c('green', 1)).set(9, 19, c('metal', 2));
  if (size === 1) {
    p.rect(6, 9, 8, 5, c('green', 0)).frame(6, 9, 8, 5, c('paint', 2)).rect(9, 14, 1, 6, c('metal', 2));
    return p.rect(8, 11, 4, 1, c('paint', 3));
  }
  p.rect(0, 0, 20, 12, c('green', 0)).frame(0, 0, 20, 12, c('paint', 3));
  micro(p, 2, 2, 'EXIT', c('paint', 3));
  return p.rect(4, 12, 2, 8, c('metal', 2)).rect(14, 12, 2, 8, c('metal', 2));
}

/** Adds the Beltway's pictures to CAST.MBL. */
export function addBeltCast(add: Add): void {
  for (const k of [0, 1]) {
    const full = rear(k);
    ROAD_SIZES.forEach((s, i) => add(`belt.car${k}.${i}`, shrinkSprite(full, s.scale, s.bottom, CLEAR)));
    add(`belt.mirror${k}.0`, front(k, false));
    add(`belt.mirror${k}.1`, front(k, true));
  }
  for (const side of [-1, 1]) {
    [2, 3, 4].forEach((row, i) => {
      add(`belt.dash${side}.${row}`, dash(row, DIVIDER_SHIFT[side][i]));
      add(`belt.post${side}.${row}`, post(row, POST_SHIFT[side][i]));
    });
  }
  [0, 1, 2].forEach((s) => add(`belt.exit${s}`, exitSign(s)));
  // nothing: the EXIT sign's unseen leap from the mirror
  add('belt.none', new Pixels(20, 20, CLEAR));
}
