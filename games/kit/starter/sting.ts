// The Starters' sting (STARTER.FLI), about 3 seconds before a Starter's title: grass and dirt blocks
// drop in and stack into the word STARTER (letters 6 blocks wide and 9 tall with two-block strokes, a block apart, so no two
// letters run together), Kit hops in from the right onto the last letter and cheers, and a sign below reads "A STARTER
// GAME". The words STARTER GAMES are also lettered in the plain 8x8 font across the top from the first frame. It uses the Starters' own palette and Kit from hero.ts, and
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
const FRAMES = 38;
const FADE = 2;
const B = 6; // a block is 6x6 pixels
const GROUND = 154;
const WORD_X = 16;
const ROWS = 9;
const COLS = 6;
const SIGN_AT = 15;
/** Blocks start dropping in fives per frame and fall for FALL frames. */
const PER_FRAME = 16;
const FALL = 3;
const HOP_AT = 18;
const HOP = 4;

// each letter is 6 blocks wide and 9 tall, strokes two blocks thick so the word reads at 320x200
const FONT: Record<string, string[]> = {
  S: ['011110', '111111', '110000', '111110', '011111', '000011', '000011', '111111', '011110'],
  T: ['111111', '111111', '001100', '001100', '001100', '001100', '001100', '001100', '001100'],
  A: ['011110', '111111', '110011', '110011', '111111', '111111', '110011', '110011', '110011'],
  R: ['111110', '111111', '110011', '110011', '111110', '111100', '110110', '110011', '110011'],
  E: ['111111', '111111', '110000', '111100', '111100', '110000', '110000', '111111', '111111'],
};

interface Cell {
  x: number;
  y: number;
  grass: boolean;
}

/** The cells of STARTER in the order they drop (column by column, each from the bottom up). */
function cells(): Cell[] {
  const lit = new Set<string>();
  [...'STARTER'].forEach((ch, i) => FONT[ch].forEach((row, y) => [...row].forEach((v, x) => v === '1' && lit.add(`${i * (COLS + 1) + x},${y}`))));
  const out: Cell[] = [];
  for (let col = 0; col < 7 * (COLS + 1) - 1; col++)
    for (let y = ROWS - 1; y >= 0; y--) if (lit.has(`${col},${y}`)) out.push({ x: col, y, grass: !lit.has(`${col},${y - 1}`) });
  return out;
}

function block(pal: Pal, grass: boolean, seed: number): Pixels {
  const p = new Pixels(B, B);
  const r = rng(seed);
  for (let y = 0; y < B; y++)
    for (let x = 0; x < B; x++) {
      const cap = grass && y < 2;
      p.set(x, y, cap ? pal.c('grass', 3 + (r() < 0.2 ? 1 : 0)) : pal.c('dirt', 2 + (r() < 0.25 ? 1 : 0)));
    }
  if (grass) for (let x = 0; x < B; x++) p.set(x, 2, pal.c('grass', x % 3 === 0 ? 1 : 2));
  for (let i = 0; i < B; i++) p.set(i, B - 1, pal.c('dirt', 0)).set(B - 1, i, pal.c('dirt', 0));
  return p;
}

/** The sky, two clouds, and the grass and dirt ground. */
function backdrop(pal: Pal): Pixels {
  const p = new Pixels(W, H);
  // flat bands (not dithered) keep the delta frames small
  for (let y = 0; y < GROUND; y++) p.rect(0, y, W, 1, pal.c('sky', 5 - Math.min(3, Math.floor((y / GROUND) * 4))));
  for (const [cx, cy] of [
    [40, 62],
    [250, 50],
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
  const start = 330;
  const land = 225;
  const top = GROUND - ROWS * B;
  if (f < HOP_AT + HOP) {
    const t = Math.max(0, f - HOP_AT + 1) / HOP;
    const y = GROUND + (top - GROUND) * t - Math.sin(Math.PI * t) * 18;
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
    const drop = list.map((c, i) => {
      const t = f - Math.floor(i / PER_FRAME);
      const y = GROUND - (ROWS - c.y) * B;
      return { c, t, y, dy: t >= FALL ? 0 : -Math.round((y + B) * (1 - (t + 1) / FALL) ** 2) };
    });
    // a dark outline round every block already in place keeps the word crisp against the sky
    for (const { c, t, y } of drop) if (t >= FALL) p.rect(WORD_X + c.x * B - 1, y - 1, B + 2, B + 2, pal.c('ink', 0));
    drop.forEach(({ c, t, y, dy }) => {
      if (t < 0) return;
      p.blit(blocks[(c.grass ? 1 : 0) + 2 * ((c.x + c.y) % 3)], WORD_X + c.x * B, y + dy);
    });
    // Kit stays out of sight until the word is built, then hops in from the right
    if (f >= HOP_AT - 1) {
      const [[top, bottom], kx, ky] = kitAt(f);
      const key = `${top}/${bottom}`;
      if (!poses.has(key)) poses.set(key, heroPicture(hero, top, bottom));
      scaleBlit(p, poses.get(key)!, kx, ky - 80, 2);
    }
    if (f >= SIGN_AT) sign(p, pal);
    centered(p, 2, 'STARTER GAMES', pal.c('white', 3), 2, pal.c('ink', 0), W / 2, pal.c('ink', 0));
    frames.push(p.px);
  }
  const palettes = frames.map((_, f) => {
    const k = f < FADE ? (f + 1) / (FADE + 1) : f >= FRAMES - FADE ? (FRAMES - 1 - f + 0.5) / (FADE + 0.5) : 1;
    return pal.pal.map((v) => Math.round(v * k));
  });
  cached = encodeFli(frames, pal.pal, { speed: SPEED, palettes, runs: true, noLoopFrame: true });
  return cached;
}
