// PASS THE PIE's 320x200 pictures, printed like everything else in the game (print.ts): the title (the storybook
// on the left, torn away on the right to show the fight poster under it), the menu, the paper behind text pages,
// the save and load lists, the high scores, the level cards (an animated page turn for Rory's chapters, a slammed
// poster for Mr. Plume's) and the ending cards. PLAYGAME writes its own words over the menu, the text pages and the
// lists, so those keep a plain place for them where the kit's screens do.
import { encodeFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { encodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { centered, text } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import { Reel } from '@lewismoten/gamemaker-sandbox-tools/kit/reel';
import type { Hero } from './levels';
import { gouges, hatch, paperBlock, press } from './print';

export const W = 320;
export const H = 200;

export const gif = (p: Pixels, pal: Uint8Array): Uint8Array => encodeGif({ width: p.w, height: p.h, pixels: p.px, palette: pal });

/** Words printed slightly off register: the accent ink a pixel down-right, then the ink. */
export function printed(p: Pixels, pal: Pal, y: number, words: string, scale: number, ink?: number, under?: number): void {
  const { ink: k, acc } = press(pal);
  centered(p, y + Math.max(1, scale - 1), words, under ?? acc[2], scale);
  centered(p, y, words, ink ?? k[0], scale);
}

/** A rolling hill of carved earth along the bottom, from `top` down. */
function ground(p: Pixels, pal: Pal, top: number, seed: number): void {
  const { ink, leaf } = press(pal);
  for (let x = 0; x < W; x++) {
    const h = Math.round(Math.sin((x + seed * 37) / 41) * 4 + Math.sin((x + seed * 11) / 17) * 2);
    p.rect(x, top + h, 1, H - top - h, ink[0]).rect(x, top + h, 1, 4, leaf[2]);
  }
  gouges(p, 0, top + 10, W, H - top - 10, ink[2], 40, seed, 5);
}

/** The heroes, standing (`pose` is a 20x40 picture), at scale `s`, feet at `feet`. */
export const standing = (p: Pixels, pose: Pixels, x: number, feet: number, s: number) => scaleBlit(p, pose, x, feet - 40 * s, s);

/** The title: the storybook on the left, torn open on the right to the poster under it. */
export function titlePicture(pal: Pal, rory: Pixels, plumeKick: Pixels, pie: Pixels): Pixels {
  const { paper, ink, acc, acc2 } = press(pal);
  const p = paperBlock(pal, W, H, 1);
  // the poster under it: red with black rays
  const poster = new Pixels(W, H, acc[1]);
  for (let a = 0; a < 16; a++) {
    const ang = (a / 16) * Math.PI * 2;
    for (let t = 0; t < 260; t += 1) {
      const x = Math.round(250 + Math.cos(ang) * t);
      const y = Math.round(120 + Math.sin(ang) * t);
      if (a % 2 === 0) poster.rect(x - Math.floor(t / 14), y, 1 + Math.floor(t / 7), 1, acc[0]);
    }
  }
  // the tear: a jagged line from the top to the bottom; right of it is the poster
  const r = rng(4);
  const edge: number[] = [];
  let ex = 196;
  for (let y = 0; y < H; y++) {
    ex += Math.round((r() - 0.5) * 6);
    ex = Math.max(176, Math.min(214, ex));
    edge.push(ex);
  }
  for (let y = 0; y < H; y++) {
    for (let x = edge[y]; x < W; x++) p.set(x, y, poster.get(x, y));
    p.rect(edge[y] - 3, y, 3, 1, paper[3]).set(edge[y], y, ink[0]); // the torn paper's white fiber
  }
  ground(p, pal, 172, 2);
  // the storybook side: a framed vignette with Rory and the pie
  p.frame(10, 50, 160, 118, ink[1]).frame(13, 53, 154, 112, ink[2]);
  centered(p, 58, 'ONCE UPON A', ink[1], 1, undefined, 90);
  centered(p, 68, 'THANKSGIVING...', ink[1], 1, undefined, 90);
  standing(p, rory, 60, 168, 3);
  scaleBlit(p, pie, 112, 112, 2);
  // the poster side: Mr. Plume mid-kick, big
  standing(p, plumeKick, 226, 178, 3);
  text(p, 232, 50, 'PAYBACK', acc2[3], 1);
  // the name, carved: ink slab with paper letters
  p.rect(0, 6, W, 38, ink[0]);
  hatch(p, 0, 6, W, 38, ink[1], 5);
  centered(p, 13, 'PASS THE PIE', acc[2], 3);
  centered(p, 11, 'PASS THE PIE', paper[3], 3);
  return p;
}

/** The menu: the title small, the poster at the edges and a plain bill for PLAYGAME's menu words. */
export function menuPicture(pal: Pal, plume: Pixels, name: string): Pixels {
  const { paper, ink, acc } = press(pal);
  const p = new Pixels(W, H, acc[1]);
  hatch(p, 0, 0, W, H, acc[0], 4);
  ground(p, pal, 176, 5);
  p.rect(0, 4, W, 34, ink[0]);
  centered(p, 12, name, paper[3], 2);
  p.rect(56, 46, 208, 132, ink[0]).rect(59, 49, 202, 126, paper[2]);
  p.rect(62, 52, 196, 120, paper[3]);
  standing(p, plume, 266, 178, 2);
  return p;
}

/** Plain paper for a page of words: PLAYGAME writes in plum over it. */
export function paper(pal: Pal, heading: string): Pixels {
  const { paper: pp, ink, acc } = press(pal);
  const p = new Pixels(W, H, ink[0]);
  hatch(p, 0, 0, W, H, acc[0], 5);
  p.rect(22, 0, 276, 200, ink[1]);
  p.rect(26, 4, 268, 194, pp[3]);
  p.rect(26, 4, 268, 3, acc[2]);
  if (heading.length <= 17) centered(p, 14, heading, ink[0], 2);
  else {
    const spaces = [...heading].flatMap((ch, i) => (ch === ' ' ? [i] : []));
    const at = spaces.reduce((a, b) => (Math.abs(b - heading.length / 2) < Math.abs(a - heading.length / 2) ? b : a));
    [heading.slice(0, at), heading.slice(at + 1)].forEach((l, i) => centered(p, 5 + i * 15, l, ink[0], 2));
  }
  return p;
}

/** The load and save lists: PLAYGAME writes the names in yellow, so each slot is an ink strip. */
export function slotsPicture(pal: Pal, heading: string): Pixels {
  const p = paper(pal, heading);
  const { ink } = press(pal);
  for (let i = 0; i < 10; i++) p.rect(56, 37 + i * 14, 189, 13, ink[0]).rect(56, 49 + i * 14, 189, 1, ink[1]);
  return p;
}

/** The high scores: "Top Ten Scores" in red at y 0, rows from y 27, "Hit any key" at y 192, over a plain panel. */
export function scoresPicture(pal: Pal, heading: string): Pixels {
  const { paper: pp, ink, acc } = press(pal);
  const p = new Pixels(W, H, acc[1]);
  p.rect(4, 0, 312, H, pp[3]).rect(4, 0, 1, H, ink[0]).rect(315, 0, 1, H, ink[0]);
  centered(p, 11, heading, ink[0]);
  p.rect(110, 21, 100, 1, acc[1]);
  return p;
}

/** An ending card: a big line, a smaller one and the heroes. */
export function endPicture(pal: Pal, heroes: Pixels[], head: string, line: string, won: boolean): Pixels {
  const { paper: pp, ink, acc, acc2 } = press(pal);
  const p = paperBlock(pal, W, H, won ? 3 : 8);
  if (!won) hatch(p, 0, 0, W, H, pp[1], 3);
  ground(p, pal, 164, won ? 3 : 9);
  p.rect(0, 10, W, 34, ink[0]);
  centered(p, 15, head, won ? acc2[2] : pp[3], 3);
  p.rect(20, 54, 280, 22, pp[3]).frame(20, 54, 280, 22, ink[0]);
  centered(p, 61, line, ink[0]);
  heroes.forEach((h, i) => standing(p, h, 160 - heroes.length * 30 + i * 60 + 10, 166, 2));
  if (won) {
    const r = rng(9);
    for (let i = 0; i < 30; i++) p.rect(Math.floor(r() * W), 82 + Math.floor(r() * 40), 3, 2, [acc[2], acc2[2], pp[3]][i % 3]);
  }
  return p;
}

/**
 * A level card, as a little FLI in the level's own inks. Rory's: a storybook page slides in over the ink, framed,
 * "CHAPTER n". Mr. Plume's: two slashes of accent ink slam across, the title stamps down with a shake, "PAYBACK
 * PART n", and Mr. Plume mid-kick.
 */
export function cardFli(pal: Pal, bytes: Uint8Array, hero: Hero, part: number, title: string, hint: string, pose: Pixels): Uint8Array {
  const { paper: pp, ink, acc, acc2 } = press(pal);
  const reel = new Reel(bytes);
  const black = new Pixels(W, H, ink[0]);
  const name = title.toUpperCase();
  if (hero === 'rory') {
    const page = (p: Pixels, x: number) => {
      p.rect(x + 16, 14, 288, 172, pp[2]).rect(x + 20, 18, 280, 164, pp[3]);
      p.frame(x + 26, 24, 268, 152, ink[1]).frame(x + 29, 27, 262, 146, ink[2]);
    };
    for (let k = 0; k <= 8; k++) reel.frame(black, (p) => page(p, Math.round(((8 - k) * (8 - k) * W) / 64)), 1);
    const full = (p: Pixels) => {
      page(p, 0);
      centered(p, 40, `CHAPTER ${part}`, ink[1]);
      centered(p, 60, name, ink[0], name.length * 16 <= 240 ? 2 : 1);
      centered(p, 86, hint, ink[1]);
      standing(p, pose, 140, 170, 2);
    };
    reel.frame(black, full, 46);
  } else {
    const slash = (p: Pixels, k: number) => {
      for (let i = 0; i < Math.min(k, 6); i++) {
        const y0 = 30 + i * 4;
        p.line(0, y0 + 120, Math.round((W * Math.min(k, 6)) / 6), y0 - 10, acc[1]);
      }
    };
    for (let k = 1; k <= 6; k++) reel.frame(black, (p) => slash(p, k), 1);
    const poster = (p: Pixels, dx: number, dy: number) => {
      p.rect(0, 0, W, H, acc[1]);
      hatch(p, 0, 0, W, H, acc[0], 4);
      p.rect(0, 112 + dy, W, 88, ink[0]);
      text(p, 16 + dx, 20 + dy, `PAYBACK PART ${part}`, acc2[3], 1);
      const s = name.length * 24 <= 300 ? 3 : 2;
      text(p, 16 + dx + 2, 40 + dy + 2, name, ink[0], s);
      text(p, 16 + dx, 40 + dy, name, pp[3], s);
      text(p, 16, 124, hint, pp[3]);
      standing(p, pose, 216, 196, 4);
    };
    for (const [dx, dy] of [
      [4, -3],
      [-3, 2],
      [2, -1],
      [0, 0],
    ])
      reel.frame(black, (p) => poster(p, dx, dy), 1);
    reel.frame(black, (p) => poster(p, 0, 0), 46);
  }
  reel.fadeOut(3);
  return encodeFli(reel.frames, bytes, { speed: 4, palettes: reel.palettes, runs: true, noLoopFrame: true });
}

