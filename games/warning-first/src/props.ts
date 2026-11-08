// WARNING FIRST's pictures: the fog vent in the ground and the fog above it, in three moods (at rest,
// rumbling, puffing), and the plank bridge (solid, flickering, gone) over a pit with a soft mat.
// The warning is a shape as well as a color, and it moves: a rumbling grate shakes from side to side
// with shake marks, and a flickering plank cracks and blinks between its own wood and a gold glow.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { skyOf, type Pal } from '../../kit/starter/palette';

export type Mood = 'rest' | 'rumble' | 'puff';
export const MOODS: Mood[] = ['rest', 'rumble', 'puff'];

/** The vent in the ground: a stone rim around an iron grate. While it rumbles it shakes (`shake` 0 or 1: the bars hop right or left, the shake marks swap sides); while it puffs it glows soft. */
export function grate(pal: Pal, mood: Mood, shake: 0 | 1 = 0): Pixels {
  const { c, r } = pal;
  const s = r('stone');
  const p = new Pixels(20, 20, c('dirt', 2));
  p.rect(0, 0, 20, 4, c('grass', 2)).rect(0, 0, 20, 1, c('grass', 4));
  // the stone rim and the dark hole
  p.rect(1, 3, 18, 3, s[3]).rect(1, 3, 18, 1, s[4]).rect(1, 5, 18, 1, s[1]);
  p.rect(3, 6, 14, 14, mood === 'puff' ? c('ink', 1) : c('ink', 0));
  // the grate bars; they hop a pixel one way, then the other, while it rumbles
  const dx = mood === 'rumble' ? (shake ? -1 : 1) : 0;
  for (let x = 4; x < 16; x += 3) p.rect(x + dx, 6, 2, 8, s[2]).rect(x + dx, 6, 1, 8, s[3]);
  p.rect(3 + dx, 6, 14, 1, s[3]).rect(3 + dx, 13, 14, 1, s[1]);
  if (mood === 'puff') p.rect(5, 15, 10, 3, s[4]).rect(7, 17, 6, 2, s[3]);
  // shake marks: two short slanted dashes on the side the bars hopped from
  if (mood === 'rumble')
    for (const y of [0, 4]) {
      const x = shake ? 17 : 0;
      p.line(x, y + 7, x + 2, y + 8, c('gold', 4)).line(x, y + 8, x + 2, y + 9, c('gold', 3));
    }
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

/** How a plank looks: solid wood, or one of the flicker's two pictures (cracked, or cracked and glowing gold). */
export type PlankLook = 'solid' | 'cracked' | 'lit';

/** The crack in a flickering plank: a jagged split down the middle with a short branch, kept inside the plank (no edge to line up with the next one). */
const CRACK: [number, number][] = [
  [11, 5],
  [11, 6],
  [10, 7],
  [10, 8],
  [9, 9],
  [9, 10],
  [10, 11],
  [10, 12],
  [9, 13],
  [8, 14],
  [8, 15],
  [8, 16],
  [7, 17],
  [7, 18],
  [11, 9],
  [12, 10],
  [13, 11],
  [13, 12],
];

/** A plank of the bridge, the top of a floor in the grass row: solid wood with four nail heads, or (flickering, still solid) cracked, or cracked and lit gold. */
export function plank(pal: Pal, look: PlankLook): Pixels {
  const { r } = pal;
  const w = r(look === 'lit' ? 'gold' : 'wood');
  const p = new Pixels(20, 20, w[2]);
  p.rect(0, 0, 20, 4, w[4]).rect(0, 4, 20, 1, w[3]);
  for (const y of [10, 15]) p.rect(0, y, 20, 1, w[1]).rect(0, y + 1, 20, 1, w[3]);
  p.rect(0, 19, 20, 1, w[0]);
  const dark = r('wood')[0];
  for (const [x, y] of [
    [2, 6],
    [16, 6],
    [2, 16],
    [16, 16],
  ] as const)
    p.rect(x, y, 2, 2, dark);
  if (look !== 'solid') {
    for (const [x, y] of CRACK) p.set(x, y, dark);
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
  p.rect(9, 14, 2, 2, c('gold', 4));
  return p;
}
