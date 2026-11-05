// WARNING FIRST's pictures: the fog vent in the ground and the fog above it, in three moods (at rest,
// rumbling, puffing), and the plank bridge (solid, flickering, gone) over a pit with a soft mat.
// The warning is a shape as well as a color: a rumble has shake marks, a flicker has stripes.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { skyOf, type Pal } from '../../kit/starter/palette';

export type Mood = 'rest' | 'rumble' | 'puff';
export const MOODS: Mood[] = ['rest', 'rumble', 'puff'];

/** The vent in the ground: a stone rim around an iron grate. It shakes with shake marks while it rumbles and glows soft while it puffs. */
export function grate(pal: Pal, mood: Mood): Pixels {
  const { c, r } = pal;
  const s = r('stone');
  const p = new Pixels(20, 20, c('dirt', 2));
  p.rect(0, 0, 20, 4, c('grass', 2)).rect(0, 0, 20, 1, c('grass', 4));
  // the stone rim and the dark hole
  p.rect(1, 3, 18, 3, s[3]).rect(1, 3, 18, 1, s[4]).rect(1, 5, 18, 1, s[1]);
  p.rect(3, 6, 14, 14, mood === 'puff' ? c('ink', 1) : c('ink', 0));
  // the grate bars; they hop a pixel while it rumbles
  const dx = mood === 'rumble' ? 1 : 0;
  for (let x = 4; x < 16; x += 3) p.rect(x + dx, 6, 2, 8, s[2]).rect(x + dx, 6, 1, 8, s[3]);
  p.rect(3 + dx, 6, 14, 1, s[3]).rect(3 + dx, 13, 14, 1, s[1]);
  if (mood === 'puff') p.rect(5, 15, 10, 3, s[4]).rect(7, 17, 6, 2, s[3]);
  // shake marks: two short slanted dashes on each side
  if (mood === 'rumble')
    for (const [x, y] of [
      [0, 0],
      [17, 0],
      [0, 4],
      [17, 4],
    ] as const)
      p.line(x, y + 7, x + 2, y + 8, c('gold', 4)).line(x, y + 8, x + 2, y + 9, c('gold', 3));
  return p;
}

/** A soft round puff of fog (light stone with a darker rim, so it is not a scenery cloud). */
function blob(p: Pixels, pal: Pal, cx: number, cy: number, rad: number): void {
  const s = pal.r('stone');
  p.disc(cx, cy, rad, s[2])
    .disc(cx - 1, cy - 1, rad - 1, s[3])
    .disc(cx - 2, cy - 2, Math.max(1, rad - 3), s[4]);
}

/** The two blocks of fog over the vent as one 20x40 picture: [upper, lower]. */
export function fog(pal: Pal, mood: Mood): [Pixels, Pixels] {
  const { c } = pal;
  const p = new Pixels(20, 40, skyOf(pal));
  if (mood === 'rumble') {
    // a few tiny wisps near the grate only
    for (const [x, y, rad] of [
      [6, 36, 2],
      [14, 33, 2],
      [10, 29, 1],
    ] as const)
      p.disc(x, y, rad, c('white', 3)).ring(x, y, rad, c('stone', 2));
  } else if (mood === 'puff') {
    for (const [x, y, rad] of [
      [10, 34, 8],
      [3, 32, 5],
      [17, 32, 5],
      [10, 25, 8],
      [4, 21, 5],
      [16, 20, 5],
      [10, 13, 7],
      [5, 9, 4],
      [15, 8, 4],
    ] as const)
      blob(p, pal, x, y, rad);
  }
  return [p.crop(0, 0, 20, 20), p.crop(0, 20, 20, 20)];
}

/** A plank of the bridge: solid, or flickering (gold and ink stripes, still solid), the top of a floor in the grass row. */
export function plank(pal: Pal, flicker: boolean): Pixels {
  const { c, r } = pal;
  const w = r('wood');
  const p = new Pixels(20, 20, w[2]);
  p.rect(0, 0, 20, 4, w[4]).rect(0, 4, 20, 1, w[3]);
  for (const y of [10, 15]) p.rect(0, y, 20, 1, w[1]).rect(0, y + 1, 20, 1, w[3]);
  p.rect(0, 19, 20, 1, w[0]);
  if (flicker) {
    for (let x = 0; x < 20; x++) for (let y = 5; y < 19; y++) if ((x + y) % 8 < 3) p.set(x, y, c('gold', 3));
    for (let x = 0; x < 20; x++) for (let y = 5; y < 19; y++) if ((x + y) % 8 === 3) p.set(x, y, c('ink', 0));
  } else {
    p.disc(3, 7, 1, w[0]).disc(16, 7, 1, w[0]).disc(3, 16, 1, w[0]).disc(16, 16, 1, w[0]);
  }
  return p;
}

/** The pit under the bridge: a deep blue wall with faint upright planks (lighter than night, so it reads as a soft drop, not a hole). */
export function pit(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, c('blue', 0));
  for (const x of [0, 10]) p.rect(x, 0, 1, 20, c('blue', 1));
  return p;
}

/** The mat at the bottom of the pit: a fat gold cushion with a blue stripe. */
export function mat(pal: Pal): Pixels {
  const { c } = pal;
  const p = pit(pal);
  p.rect(0, 8, 20, 12, c('gold', 2)).rect(0, 8, 20, 2, c('gold', 4)).rect(0, 18, 20, 2, c('gold', 1));
  p.rect(0, 12, 20, 2, c('blue', 3));
  p.disc(10, 15, 1, c('gold', 4));
  return p;
}
