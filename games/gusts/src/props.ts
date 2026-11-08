// GUSTS' pictures: the updraft cells of level 1 (calm, fluttering leaves, a gust), the wind tunnel of
// level 2 (calm, fluttering, a gust blowing left), the windsock on its pole in three moods, and the
// little shelter. The warning is a shape as well as a motion: leaves tilt and dash marks shake
// before a gust, and a gust is long streaks with a head, so it reads without color.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { skyOf, type Pal } from '../../kit/starter/palette';

export type Mood = 'calm' | 'flutter' | 'gust';
export const MOODS: Mood[] = ['calm', 'flutter', 'gust'];

/** A small leaf: a tilted pair of strokes, light green over dark. */
function leaf(p: Pixels, pal: Pal, x: number, y: number, tilt: 1 | -1): void {
  const g = pal.r('grass');
  p.line(x, y, x + 3 * tilt, y - 2, g[4])
    .line(x, y + 1, x + 3 * tilt, y - 1, g[2])
    .set(x - tilt, y + 1, g[1]);
}

/** One long streak of a gust. `dir` 0 is up (the head on top), 1 is left (the head on the left). */
function streak(p: Pixels, pal: Pal, x: number, y: number, len: number, dir: 0 | 1, phase: number): void {
  const w = pal.r('white');
  for (let i = 0; i < len; i++) {
    const wob = Math.round(Math.sin((i + phase) / 2.6) * 1.4);
    if (dir === 0) p.set(x + wob, y - i, i < 2 ? w[2] : w[3]).set(x + wob + 1, y - i, w[1]);
    else p.set(x - i, y + wob, i < 2 ? w[2] : w[3]).set(x - i, y + wob + 1, w[1]);
  }
  // the head
  if (dir === 0) p.line(x, y - len, x - 2, y - len + 3, w[3]).line(x + 1, y - len, x + 3, y - len + 3, w[3]);
  else p.line(x - len, y, x - len + 3, y - 2, w[3]).line(x - len, y + 1, x - len + 3, y + 3, w[3]);
}

/** A cell of the updraft shaft: bare sky when calm (two faint dots), tilted leaves and shake marks when fluttering, long upward streaks in a gust. */
export function updraft(pal: Pal, mood: Mood): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, skyOf(pal));
  if (mood === 'calm') {
    p.set(5, 6, c('sky', 4)).set(14, 14, c('sky', 4)).set(6, 6, c('sky', 4)).set(15, 14, c('sky', 4));
  } else if (mood === 'flutter') {
    leaf(p, pal, 4, 8, 1);
    leaf(p, pal, 14, 15, -1);
    leaf(p, pal, 9, 3, 1);
    for (const [x, y] of [
      [1, 12],
      [17, 6],
    ] as const)
      p.line(x, y, x + 2, y + 1, c('gold', 4)).line(x, y + 2, x + 2, y + 3, c('gold', 3));
  } else {
    streak(p, pal, 4, 18, 14, 0, 0);
    streak(p, pal, 10, 19, 17, 0, 2);
    streak(p, pal, 16, 17, 13, 0, 4);
  }
  return p;
}

/** The ground the shaft stands on: grass over a stone slot, so a player sees where the wind comes from (solid, never changes). */
export function slot(pal: Pal): Pixels {
  const { c, r } = pal;
  const s = r('stone');
  const p = new Pixels(20, 20, c('dirt', 2));
  p.rect(0, 0, 20, 4, c('grass', 2)).rect(0, 0, 20, 1, c('grass', 4));
  p.rect(2, 3, 16, 4, s[3]).rect(2, 3, 16, 1, s[4]).rect(2, 6, 16, 1, s[1]);
  for (let x = 4; x < 17; x += 4) p.rect(x, 4, 2, 2, s[0]);
  return p;
}

/** The inside of the wind tunnel: dark blue-gray stone with joints, so the tunnel is plainly a room of stone and not sky. */
export function back(pal: Pal): Pixels {
  const s = pal.r('stone');
  const p = new Pixels(20, 20, s[1]);
  for (const y of [0, 10]) p.rect(0, y, 20, 1, s[0]);
  for (const [x, y] of [
    [6, 1],
    [15, 11],
  ] as const)
    p.rect(x, y, 1, 9, s[0]);
  p.set(3, 4, s[2]).set(12, 15, s[2]);
  return p;
}

/** A cell of the wind tunnel: calm, fluttering (leaves and dashes) or a gust blowing left. */
export function tunnel(pal: Pal, mood: Mood): Pixels {
  const { c } = pal;
  const p = back(pal);
  if (mood === 'flutter') {
    leaf(p, pal, 5, 13, -1);
    leaf(p, pal, 14, 6, 1);
    for (const [x, y] of [
      [3, 4],
      [13, 16],
    ] as const)
      p.line(x, y, x + 1, y + 2, c('gold', 4)).line(x + 2, y, x + 3, y + 2, c('gold', 3));
  } else if (mood === 'gust') {
    streak(p, pal, 19, 4, 15, 1, 0);
    streak(p, pal, 17, 10, 14, 1, 3);
    streak(p, pal, 19, 15, 16, 1, 5);
  }
  return p;
}

/** The solid roof of the tunnel (stone) and its floor (flagstones). */
export function roof(pal: Pal): Pixels {
  const s = pal.r('stone');
  const p = new Pixels(20, 20, s[2]);
  p.rect(0, 0, 20, 1, s[3]).rect(0, 19, 20, 1, s[0]).rect(0, 17, 20, 2, s[1]);
  for (const x of [5, 13]) p.rect(x, 1, 1, 16, s[1]);
  p.rect(0, 8, 20, 1, s[1]);
  return p;
}
export function flags(pal: Pal): Pixels {
  const s = pal.r('stone');
  const p = new Pixels(20, 20, s[3]);
  p.rect(0, 0, 20, 2, s[4]).rect(0, 2, 20, 1, s[2]);
  for (const x of [7, 16]) p.rect(x, 3, 1, 17, s[1]);
  p.rect(0, 11, 20, 1, s[1]);
  return p;
}

/** The pole of a windsock: a thin wooden pole on the right of the cell, over sky. */
export function pole(pal: Pal): Pixels {
  const w = pal.r('wood');
  const p = new Pixels(20, 20, skyOf(pal));
  p.rect(15, 0, 2, 20, w[3]).rect(15, 0, 1, 20, w[4]).rect(16, 0, 1, 20, w[1]);
  return p;
}

/** The top of the pole with its sock: hanging down limp (calm), half lifted and twitching (flutter), or streaming out to the left (gust). Orange and white bands, so it shows by shape too. */
export function sock(pal: Pal, mood: Mood): Pixels {
  const { c, r } = pal;
  const w = r('wood');
  const p = pole(pal);
  const band = (i: number) => (Math.floor(i / 3) % 2 === 0 ? c('orange', 3) : c('white', 3));
  p.disc(15, 3, 2, w[2]).rect(14, 2, 4, 2, w[4]);
  if (mood === 'calm') {
    // hangs straight down from the ring, narrowing
    for (let i = 0; i < 14; i++) p.rect(12 - Math.floor(i / 6), 4 + i, 4 - Math.floor(i / 7), 1, band(i));
    p.rect(11, 4, 1, 14, c('orange', 1));
  } else if (mood === 'flutter') {
    // lifted halfway and bent, with a twitch
    for (let i = 0; i < 12; i++) {
      const x = 13 - Math.round(i * 0.9);
      const y = 3 + Math.round(i * 0.8) + Math.round(Math.sin(i / 1.5));
      p.rect(x, y, 3, 3, band(i));
    }
    p.line(1, 12, 3, 13, c('gold', 4)).line(1, 15, 3, 16, c('gold', 3));
  } else {
    // streaming out straight to the left, tapering
    for (let i = 0; i < 14; i++) p.rect(13 - i, 1 + Math.floor(i / 6), 1, 7 - Math.floor(i / 3), band(i));
    p.rect(0, 1, 14, 1, c('orange', 1));
  }
  return p;
}

/** The shelter's three cells, over the tunnel wall: an awning (top), a hanging lantern (middle), and a rug with a pot plant (bottom). `coin` adds a coin on the rug. */
export function awning(pal: Pal): Pixels {
  const { c } = pal;
  const p = back(pal);
  for (let x = 0; x < 20; x++) {
    p.rect(x, 0, 1, 9, Math.floor(x / 4) % 2 === 0 ? c('teal', 3) : c('white', 3));
    p.set(x, 9 + (Math.floor(x / 2) % 2), Math.floor(x / 4) % 2 === 0 ? c('teal', 3) : c('white', 3));
  }
  p.rect(0, 0, 20, 1, c('teal', 4)).rect(0, 8, 20, 1, c('teal', 1));
  return p;
}
export function lantern(pal: Pal): Pixels {
  const { c } = pal;
  const p = back(pal);
  p.rect(10, 0, 1, 6, c('ink', 2));
  p.rect(7, 6, 7, 8, c('gold', 3)).rect(8, 7, 5, 6, c('gold', 5)).rect(7, 6, 7, 1, c('ink', 1)).rect(7, 13, 7, 1, c('ink', 1));
  return p;
}
export function rug(pal: Pal, coin: boolean): Pixels {
  const { c, r } = pal;
  const p = back(pal);
  p.rect(0, 15, 20, 5, c('teal', 2)).rect(0, 15, 20, 1, c('teal', 4)).rect(0, 19, 20, 1, c('teal', 1));
  for (let x = 2; x < 20; x += 4) p.rect(x, 17, 2, 1, c('white', 3));
  // a pot plant on the left
  p.rect(2, 10, 5, 5, c('brick', 2)).rect(2, 10, 5, 1, c('brick', 4));
  p.disc(4, 8, 3, c('grass', 3)).disc(3, 7, 2, c('grass', 4));
  if (coin) p.disc(14, 11, 4, c('gold', 3)).disc(14, 11, 2, c('gold', 5)).ring(14, 11, 4, r('gold')[1]);
  return p;
}
