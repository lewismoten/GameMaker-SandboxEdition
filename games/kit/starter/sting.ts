// The Starters' sting (STARTER.FLI), about 3 seconds before a Starter's title: grass and dirt blocks
// drop in one at a time and stack into the word STARTER, Kit hops up onto the last letter and cheers,
// and a sign below reads "A STARTER GAME". It uses the Starters' own palette and Kit from hero.ts, and
// it replaces the Sandbox Software sting (games/kit/sandlogo.ts) in the four Starters. No sound: a
// slide list plays an FLI silently, as with the other sting.
import { encodeFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { centered } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { buildHeroBlocks, heroPicture } from './hero';
import { buildStarterPalette, type Pal } from './palette';

/** The sting's file name on a Starter's disk. */
export const STARTER_STING = 'starter.fli';

const W = 320;
const H = 200;
/** FLI speed in 1/70 s: 5 is 14 frames a second. */
const SPEED = 5;
const FRAMES = 40;
const FADE = 2;
const B = 8; // a block is 8x8 pixels
const GROUND = 150;
const WORD_X = 52;
const SIGN_AT = 16;
/** Blocks start dropping in fives per frame and fall for FALL frames. */
const PER_FRAME = 5;
const FALL = 3;
const HOP_AT = 19;
const HOP = 4;

// each letter is 3 blocks wide and 5 tall
const FONT: Record<string, string[]> = {
  S: ['111', '100', '111', '001', '111'],
  T: ['111', '010', '010', '010', '010'],
  A: ['111', '101', '111', '101', '101'],
  R: ['111', '101', '111', '110', '101'],
  E: ['111', '100', '111', '100', '111'],
};

interface Cell {
  x: number;
  y: number;
  grass: boolean;
}

/** The cells of STARTER in the order they drop (column by column, each from the bottom up). */
function cells(): Cell[] {
  const lit = new Set<string>();
  [...'STARTER'].forEach((ch, i) => FONT[ch].forEach((row, y) => [...row].forEach((v, x) => v === '1' && lit.add(`${i * 4 + x},${y}`))));
  const out: Cell[] = [];
  for (let col = 0; col < 27; col++) for (let y = 4; y >= 0; y--) if (lit.has(`${col},${y}`)) out.push({ x: col, y, grass: !lit.has(`${col},${y - 1}`) });
  return out;
}

function block(pal: Pal, grass: boolean, seed: number): Pixels {
  const p = new Pixels(B, B);
  const r = rng(seed);
  for (let y = 0; y < B; y++)
    for (let x = 0; x < B; x++) {
      const cap = grass && y < 3;
      p.set(x, y, cap ? pal.c('grass', 3 + (r() < 0.2 ? 1 : 0)) : pal.c('dirt', 2 + (r() < 0.25 ? 1 : 0)));
    }
  if (grass) for (let x = 0; x < B; x++) p.set(x, 3, pal.c('grass', x % 3 === 0 ? 1 : 2));
  for (let i = 0; i < B; i++) p.set(i, B - 1, pal.c('dirt', 0)).set(B - 1, i, pal.c('dirt', 0));
  return p;
}

/** The sky, two clouds, and the grass and dirt ground. */
function backdrop(pal: Pal): Pixels {
  const p = new Pixels(W, H);
  // flat bands (not dithered) keep the delta frames small
  for (let y = 0; y < GROUND; y++) p.rect(0, y, W, 1, pal.c('sky', 5 - Math.min(3, Math.floor((y / GROUND) * 4))));
  for (const [cx, cy] of [
    [60, 30],
    [230, 20],
  ]) {
    p.disc(cx, cy, 8, pal.c('white', 3))
      .disc(cx + 10, cy - 4, 10, pal.c('white', 3))
      .disc(cx + 22, cy, 8, pal.c('white', 3));
    p.rect(cx - 6, cy + 4, 36, 6, pal.c('white', 3));
  }
  for (let y = GROUND; y < H; y++)
    for (let x = 0; x < W; x++) p.set(x, y, y < GROUND + 5 ? pal.c('grass', y < GROUND + 2 ? 3 : 2) : pal.c('dirt', (y >> 3) % 2 ? 2 : 3));
  return p;
}

function sign(p: Pixels, pal: Pal): void {
  const tag = 'A STARTER GAME';
  const w = tag.length * 8 + 20;
  const x = Math.round((W - w) / 2);
  p.rect(x + 10, 180, 6, 20, pal.c('wood', 0)).rect(x + w - 16, 180, 6, 20, pal.c('wood', 0));
  bevel(p, x, 164, w, 20, pal.r('parch'), 3, 2);
  p.frame(x, 164, w, 20, pal.c('wood', 0));
  centered(p, 170, tag, pal.c('ink', 0));
}

/** Kit's pose (top and bottom block names), left x and feet y at frame f. */
function kitAt(f: number): [[string, string], number, number] {
  const start = 276;
  const land = 236;
  const top = GROUND - 5 * B;
  if (f < HOP_AT) return [f % 12 > 9 ? ['blink.top', 'stand'] : f % 12 > 5 ? ['look.top', 'stand'] : ['stand.top', 'stand'], start, GROUND];
  if (f < HOP_AT + HOP) {
    const t = (f - HOP_AT + 1) / HOP;
    const y = GROUND + (top - GROUND) * t - Math.sin(Math.PI * t) * 36;
    const pose: [string, string] = t < 0.45 ? ['up.top', 'jumpup'] : t < 1 ? ['oh.top', 'fall'] : ['stand.top', 'stand'];
    return [pose, Math.round(start + (land - start) * t), Math.round(y)];
  }
  // the cheer: arms up, then a little hop with arms out, over and over
  const up = (f - HOP_AT - HOP) % 8 < 4;
  return [up ? ['cheer2.top', 'cheer'] : ['cheer.top', 'jump'], land, up ? top : top - 4];
}

let cached: Uint8Array | undefined;

/** STARTER.FLI: the sting as an Autodesk Animator FLI (the Starters' palette, delta frames, a fade at each end). */
export function starterStingFli(): Uint8Array {
  if (cached) return cached;
  const pal = buildStarterPalette();
  const hero = buildHeroBlocks(pal);
  const poses = new Map<string, Pixels>();
  const blocks = [0, 1, 2, 3, 4, 5].map((i) => block(pal, i % 2 === 1, 7 + i));
  const base = backdrop(pal);
  const list = cells();
  const frames: Uint8Array[] = [];
  for (let f = 0; f < FRAMES; f++) {
    const p = new Pixels(W, H);
    p.px.set(base.px);
    list.forEach((c, i) => {
      const t = f - Math.floor(i / PER_FRAME);
      if (t < 0) return;
      const y = GROUND - (5 - c.y) * B;
      const dy = t >= FALL ? 0 : -Math.round((y + B) * (1 - (t + 1) / FALL) ** 2);
      p.blit(blocks[(c.grass ? 1 : 0) + 2 * ((c.x + c.y) % 3)], WORD_X + c.x * B, y + dy);
    });
    const [[top, bottom], kx, ky] = kitAt(f);
    const key = `${top}/${bottom}`;
    if (!poses.has(key)) poses.set(key, heroPicture(hero, top, bottom));
    scaleBlit(p, poses.get(key)!, kx, ky - 80, 2);
    if (f >= SIGN_AT) sign(p, pal);
    frames.push(p.px);
  }
  const palettes = frames.map((_, f) => {
    const k = f < FADE ? (f + 1) / (FADE + 1) : f >= FRAMES - FADE ? (FRAMES - 1 - f + 0.5) / (FADE + 0.5) : 1;
    return pal.pal.map((v) => Math.round(v * k));
  });
  cached = encodeFli(frames, pal.pal, { speed: SPEED, palettes, runs: true, noLoopFrame: true });
  return cached;
}
