// BLOOM.FLI, the cartoon that plays between levels 2 and 3: a seed on a mound, the sun comes up,
// a stalk grows, two leaves and a daisy open, and Yana cheers. 320x200, 40 frames at 6/70 s
// (about 3.4 seconds), the Starters' palette, a fade at each end. An FLI is silent, it carries no
// sound, and PLAYGAME plays all of it before the next key is read (see text.ts).
import { encodeFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { outlined, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { buildHeroBlocks, heroPicture } from '../../kit/starter/hero';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';

export const CARTOON = 'bloom.fli';
const W = 320;
const H = 200;
const SPEED = 6;
export const FRAMES = 40;
const FADE = 2;
const GROUND = 150;
const FX = 200;
const GROW_AT = 6;
const STALK = 66;
const BLOOM_AT = 30;
const CHEER_AT = 33;

function backdrop(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(W, H);
  // flat bands, not dithered, keep the delta frames small
  for (let y = 0; y < GROUND; y++) p.rect(0, y, W, 1, c('sky', 5 - Math.min(3, Math.floor((y / GROUND) * 4))));
  for (let x = 0; x < W; x++) {
    const hill = GROUND - 14 - Math.round(Math.sin(x / 38 + 1) * 10);
    p.rect(x, hill, 1, GROUND - hill, c('green', 1));
  }
  for (let y = GROUND; y < H; y++)
    for (let x = 0; x < W; x++) p.set(x, y, y < GROUND + 5 ? c('grass', y < GROUND + 2 ? 3 : 2) : c('dirt', (y >> 3) % 2 ? 2 : 3));
  return p;
}

/** The sun, with rays that swap between two sets. */
function sun(p: Pixels, pal: Pal, f: number, rise: number): void {
  const cx = 268;
  const cy = 70 - rise;
  const { c } = pal;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + ((f >> 1) % 2 ? Math.PI / 8 : 0);
    p.line(
      Math.round(cx + Math.cos(a) * 18),
      Math.round(cy + Math.sin(a) * 18),
      Math.round(cx + Math.cos(a) * 27),
      Math.round(cy + Math.sin(a) * 27),
      c('gold', 3),
    );
  }
  p.disc(cx, cy, 14, c('gold', 1))
    .disc(cx, cy, 12, c('gold', 3))
    .disc(cx - 2, cy - 2, 7, c('gold', 4));
}

function daisy(p: Pixels, pal: Pal, x: number, y: number, open: number): void {
  const { c } = pal;
  if (open <= 0) {
    p.disc(x, y, 4, c('green', 2));
    return;
  }
  const reach = Math.round(12 * open);
  const size = Math.max(2, Math.round(6 * open));
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const px = Math.round(x + Math.cos(a) * reach);
    const py = Math.round(y + Math.sin(a) * reach);
    p.disc(px, py, size, c('white', 3)).ring(px, py, size, c('white', 0));
  }
  p.disc(x, y, Math.max(3, Math.round(7 * open)), c('gold', 1)).disc(x, y, Math.max(2, Math.round(6 * open)), c('gold', 4));
}

function plant(p: Pixels, pal: Pal, f: number): void {
  const { c } = pal;
  const grown = Math.min(1, Math.max(0, (f - GROW_AT) / (BLOOM_AT - GROW_AT)));
  const h = Math.round(STALK * grown);
  if (f < GROW_AT) {
    p.disc(FX, GROUND - 1, 9, c('dirt', 3));
    p.rect(FX - 3, GROUND - 11, 6, 3, c('hair', 0));
    return;
  }
  p.disc(FX, GROUND - 1, 9, c('dirt', 3));
  p.rect(FX - 1, GROUND - h, 3, h, c('green', 2)).rect(FX + 1, GROUND - h, 1, h, c('green', 1));
  // two leaves, each a pair of discs, once the stalk is tall enough
  if (h > 24)
    p.disc(FX - 9, GROUND - 24, 5, c('green', 3))
      .disc(FX - 5, GROUND - 22, 4, c('green', 3))
      .line(FX, GROUND - 20, FX - 8, GROUND - 24, c('green', 1));
  if (h > 44)
    p.disc(FX + 9, GROUND - 44, 5, c('green', 3))
      .disc(FX + 5, GROUND - 42, 4, c('green', 3))
      .line(FX, GROUND - 40, FX + 8, GROUND - 44, c('green', 1));
  const open = f < BLOOM_AT ? 0 : Math.min(1, (f - BLOOM_AT + 1) / 5);
  daisy(p, pal, FX, GROUND - h - (open > 0 ? 8 : 2), open);
}

/** Yana's pose (top and bottom block names), and where her feet stand, at frame f. */
function kit(f: number): [[string, string], number, number] {
  const x = 112;
  if (f < CHEER_AT) return [f % 14 > 11 ? ['blink.top', 'stand'] : f % 14 > 6 ? ['look.top', 'stand'] : ['stand.top', 'stand'], x, GROUND];
  const up = (f - CHEER_AT) % 4 < 2;
  return [up ? ['cheer2.top', 'cheer'] : ['cheer.top', 'jump'], x, up ? GROUND : GROUND - 4];
}

let cached: Uint8Array | undefined;

/** BLOOM.FLI, built once. */
export function bloomFli(): Uint8Array {
  if (cached) return cached;
  const pal = buildStarterPalette(undefined, 'pictures-and-cartoons');
  const hero = buildHeroBlocks(pal);
  const poses = new Map<string, Pixels>();
  const base = backdrop(pal);
  const frames: Uint8Array[] = [];
  for (let f = 0; f < FRAMES; f++) {
    const p = new Pixels(W, H);
    p.px.set(base.px);
    sun(p, pal, f, Math.min(f, 14) * 2);
    plant(p, pal, f);
    const [[top, bottom], kx, ky] = kit(f);
    const key = `${top}/${bottom}`;
    if (!poses.has(key)) poses.set(key, heroPicture(hero, top, bottom));
    scaleBlit(p, poses.get(key)!, kx, ky - 80, 2);
    if (f >= CHEER_AT) outlined(p, Math.round((W - textWidth('BLOOM!', 3)) / 2), 14, 'BLOOM!', pal.c('gold', 4), pal.c('ink', 0), 3, pal.c('ink', 1));
    frames.push(p.px);
  }
  const palettes = frames.map((_, f) => {
    const k = f < FADE ? (f + 1) / (FADE + 1) : f >= FRAMES - FADE ? (FRAMES - 1 - f + 0.5) / (FADE + 0.5) : 1;
    return pal.pal.map((v) => Math.round(v * k));
  });
  cached = encodeFli(frames, pal.pal, { speed: SPEED, palettes, runs: true, noLoopFrame: true });
  return cached;
}
