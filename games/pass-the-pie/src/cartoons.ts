// PASS THE PIE's three cartoons, Autodesk Animator FLI files drawn in code (Reel), in the game's block-print look:
//   INTRO.FLI    the storybook, played straight: Grandma's oven goes KA-CLUNK, Rory volunteers, little Mr. Plume
//                tags along because he loves a parade
//   PAYBACK.FLI  the hard cut: "MEANWHILE." Uncle Dale's parade flyer; twelve years; the hat goes on; PAYBACK
//   ENDING.FLI   Big Gobble goes down, the cord runs back to Grandma's kitchen, the oven goes DING, and the long
//                table settles the morning's arguments
// 320x200, each in its own inks. An FLI is silent; PLAYGAME plays all of it before the next key is read.
import { encodeFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { centered, text, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import { Reel } from '@lewismoten/gamemaker-sandbox-tools/kit/reel';
import { heroPicture } from '../../kit/starter/hero';
import * as art from './art';
import { moodBytes } from './palette';
import { buildPlumeBlocks } from './plume';
import { hatch, oval, paperBlock, press, stamp, T } from './print';
import { buildRoryBlocks } from './rory';

const W = 320;
const H = 200;
const SPEED = 6;

type Who = 'grandma' | 'dale' | 'marjorie' | 'lopez' | 'pettigrew';

/** A neighbor from the waist up, head centered at (x, y), stamped in ink. */
function person(p: Pixels, pal: Pal, who: Who, x: number, y: number, talking = false): void {
  const { ink, paper, acc, acc2, leaf } = press(pal);
  const skinOf: Record<Who, number> = {
    grandma: pal.c('rSkin', 2),
    dale: pal.c('rSkin', 1),
    marjorie: pal.c('tBrown', 2),
    lopez: pal.c('rSkin', 0),
    pettigrew: pal.c('rSkin', 2),
  };
  const coat: Record<Who, number> = { grandma: acc2[1], dale: leaf[1], marjorie: pal.c('cran', 1), lopez: pal.c('bean', 1), pettigrew: acc[1] };
  const s = new Pixels(48, 60, T);
  const cx = 24;
  const cy = 18;
  oval(s, cx, 50, 19, 16, coat[who]);
  if (who === 'dale') for (let i = 8; i < 42; i += 6) s.rect(i, 36, 2, 24, leaf[0]).rect(5, 40 + (i % 12), 38, 1, leaf[0]); // plaid
  if (who === 'marjorie') for (let a = -3; a <= 3; a++) s.set(cx + a * 3, 37 + Math.abs(a), paper[3]); // pearls
  oval(s, cx, cy, 10, 12, skinOf[who]);
  // hair
  if (who === 'grandma') oval(s, cx, 6, 9, 5, paper[3]).rect(cx - 10, 6, 20, 5, paper[3]);
  if (who === 'pettigrew') s.rect(cx - 11, 4, 22, 7, pal.c('steel', 1));
  if (who === 'dale') s.rect(cx - 11, 12, 3, 8, pal.c('rHair', 1)).rect(cx + 8, 12, 3, 8, pal.c('rHair', 1));
  if (who === 'marjorie') for (let a = 0; a < 7; a++) oval(s, cx - 10 + a * 3.5, 7 + (a % 2), 3, 3, ink[0]);
  if (who === 'lopez')
    s.rect(cx - 12, 5, 24, 6, ink[0])
      .rect(cx - 12, 5, 4, 26, ink[0])
      .rect(cx + 8, 5, 4, 26, ink[0]);
  // face
  const eye = ink[0];
  s.rect(cx - 5, cy - 2, 2, 2, eye).rect(cx + 3, cy - 2, 2, 2, eye);
  if (who === 'grandma' || who === 'pettigrew') s.ring(cx - 4, cy - 1, 3, ink[1]).ring(cx + 4, cy - 1, 3, ink[1]);
  if (who === 'dale') s.rect(cx - 5, cy + 4, 10, 2, pal.c('rHair', 0));
  if (talking) s.rect(cx - 3, cy + 6, 6, 3, ink[0]);
  else s.rect(cx - 3, cy + 7, 6, 1, ink[0]);
  p.blit(stamp(pal, s), x - cx, y - cy, T);
}

/** A speech bubble with its tail at (tx, top + h). */
function bubble(p: Pixels, pal: Pal, lines: string[], tx: number, top: number, shout = false): void {
  const { ink, paper, acc } = press(pal);
  const w = Math.max(...lines.map((l) => textWidth(l))) + 14;
  const h = lines.length * 10 + 8;
  const x = Math.round(Math.max(4, Math.min(W - w - 4, tx - w / 2)));
  p.rect(x, top, w, h, ink[0]).rect(x + 2, top + 2, w - 4, h - 4, shout ? acc[2] : paper[3]);
  for (let i = 0; i < 6; i++) p.rect(tx - 4 + Math.floor(i / 2), top + h + i - 1, 8 - i, 1, ink[0]);
  lines.forEach((l, i) => text(p, x + 7, top + 5 + i * 10, l, ink[0]));
}

/** A narration caption across the bottom, like a picture book's. */
function caption(p: Pixels, pal: Pal, words: string): void {
  const { ink, paper } = press(pal);
  p.rect(0, 176, W, 24, paper[3]).rect(0, 176, W, 2, ink[1]);
  centered(p, 184, words, ink[0]);
}

/** Grandma's kitchen in the storybook's inks. */
function kitchen(pal: Pal): Pixels {
  const { ink, acc2 } = press(pal);
  const p = paperBlock(pal, W, H, 2);
  p.rect(0, 130, W, 70, acc2[0]);
  for (let x = 0; x < W; x += 16) p.rect(x, 130, 1, 70, ink[2]);
  p.rect(0, 128, W, 3, ink[0]);
  for (const x of [30, 120])
    p.rect(x, 26, 50, 44, ink[0])
      .rect(x + 3, 29, 44, 38, acc2[3])
      .rect(x + 24, 29, 2, 38, ink[0])
      .rect(x + 3, 47, 44, 2, ink[0]);
  p.frame(4, 4, W - 8, H - 8, ink[1]);
  return p;
}

function oven(p: Pixels, pal: Pal, x: number, y: number, shake: number, lit: boolean): void {
  const st = pal.r('steel');
  const { ink, acc } = press(pal);
  const s = new Pixels(72, 72, T);
  s.rect(0, 0, 72, 72, st[1]).rect(0, 0, 72, 4, st[2]);
  s.rect(8, 22, 56, 40, ink[0]).rect(11, 25, 50, 34, lit ? acc[2] : st[0]);
  for (let i = 0; i < 3; i++) s.rect(12 + i * 20, 8, 8, 8, ink[0]);
  p.blit(stamp(pal, s), x + shake, y, T);
}

/** INTRO.FLI: the storybook. */
export function introFli(pal: Pal): Uint8Array {
  const bytes = moodBytes(pal, 'yard');
  const reel = new Reel(bytes);
  const bg = kitchen(pal);
  const rory = buildRoryBlocks(pal);
  const stand = heroPicture(rory, 'stand.top', 'stand');
  const cheer = heroPicture(rory, 'cheer2.top', 'cheer');
  const little = [art.littlePlume(pal, false), art.littlePlume(pal, true)];
  const scene = (f: number, o: { clunk?: boolean; say?: [string[], number]; cap?: string; up?: boolean }) =>
    reel.frame(bg, (p) => {
      oven(p, pal, 226, 58, o.clunk ? (f % 2 ? 3 : -3) : 0, false);
      person(p, pal, 'grandma', 76, 96, !!o.say && o.say[1] === 76);
      scaleBlit(p, o.up && f % 8 < 4 ? cheer : stand, 132, 52, 2);
      scaleBlit(p, little[f % 6 < 3 ? 0 : 1], 176, 92, 2);
      if (o.clunk) centered(p, 10, 'KA-CLUNK!', press(pal).acc[1], 3);
      if (o.say) bubble(p, pal, o.say[0], o.say[1], 14);
      if (o.cap) caption(p, pal, o.cap);
    });
  reel.fadeIn(bg, 3);
  for (let f = 0; f < 18; f++) scene(f, { cap: 'IT WAS THANKSGIVING MORNING.' });
  for (let f = 0; f < 14; f++) scene(f, { clunk: true });
  for (let f = 0; f < 20; f++) scene(f, { say: [['OH DEAR. THE OVEN.', 'AND THE WHOLE TOWN', 'IS COMING AT FOUR.'], 76] });
  for (let f = 0; f < 22; f++) scene(f, { say: [['EVERY HOUSE COOKS ONE', 'DISH. I WILL CARRY', 'THEM ALL!'], 152], up: true });
  for (let f = 0; f < 22; f++) scene(f, { say: [['GOBBLE!'], 196], cap: 'MR. PLUME CAME TOO. HE LOVED A PARADE.' });
  reel.fadeOut(4);
  return encodeFli(reel.frames, bytes, { speed: SPEED, palettes: reel.palettes, runs: true, noLoopFrame: true });
}

/** Uncle Dale's parade flyer, close up. */
function flyer(pal: Pal, crumple: number): Pixels {
  const { ink, paper, acc, acc2 } = press(pal);
  const p = new Pixels(W, H, acc2[0]);
  hatch(p, 0, 0, W, H, ink[1], 6);
  const s = new Pixels(170, 150, T);
  s.rect(0, 0, 170, 150, paper[3]);
  s.rect(0, 0, 170, 22, acc[1]);
  centered(s, 7, 'PARADE NEWS', paper[3]);
  centered(s, 32, "THIS YEAR'S MASCOT:", ink[0]);
  centered(s, 46, 'BIG GOBBLE', acc[1], 2);
  centered(s, 70, '30 FT. INFLATABLE.', ink[0]);
  centered(s, 82, 'PLUGS IN.', ink[0]);
  const g = art.bigGobble(pal);
  for (let i = 0; i < 9; i++) s.blit(g[i], 55 + (i % 3) * 20, 92 + Math.floor(i / 3) * 18, T);
  centered(s, 140, '- DALE', ink[1]);
  const out = stamp(pal, s);
  if (crumple) for (let y = 0; y < out.h; y += 7) out.rect(0, y, out.w, Math.min(crumple, 6), T);
  return p.blit(out, 75, 25 + crumple * 3, T);
}

/** PAYBACK.FLI: the turn. */
export function paybackFli(pal: Pal): Uint8Array {
  const bytes = moodBytes(pal, 'lawn');
  const reel = new Reel(bytes);
  const { ink, paper, acc, acc2 } = press(pal);
  const black = new Pixels(W, H, ink[0]);
  const plume = buildPlumeBlocks(pal);
  const glare = heroPicture(plume, 'stand.top', 'stand');
  const kick = heroPicture(plume, 'kick1.top', 'throw1');
  reel.frame(black, (p) => centered(p, 94, 'MEANWHILE.', paper[3], 2), 16);
  reel.frame(flyer(pal, 0), () => undefined, 30);
  // little Mr. Plume reads it; his eye twitches
  const lawnBg = paperBlock(pal, W, H, 6).rect(0, 160, W, 40, ink[0]);
  const little = art.littlePlume(pal, false);
  for (let f = 0; f < 20; f++)
    reel.frame(lawnBg, (p) => {
      scaleBlit(p, little, 120, 40, 6);
      if (f > 8 && f % 3 === 0) p.rect(198, 72, 10, 2, ink[0]);
      if (f > 10) bubble(p, pal, ['TWELVE YEARS.'], 220, 14);
    });
  for (let c = 1; c <= 4; c++) reel.add(flyer(pal, c), 2);
  // the hat comes down
  const HAT = 10; // the hat's rows of the head block
  const bare = glare.crop(0, 0, 20, 40).map((_x, y, c) => (y < HAT ? T : c));
  const hat = glare.crop(0, 0, 20, HAT);
  for (let k = 0; k <= 6; k++)
    reel.frame(black, (p) => {
      p.rect(0, 150, W, 50, acc[0]);
      scaleBlit(p, bare, 100, -40, 6);
      scaleBlit(p, hat, 100, -100 + k * 10, 6);
    });
  reel.frame(
    black,
    (p) => {
      p.rect(0, 150, W, 50, acc[0]);
      scaleBlit(p, glare, 100, -40, 6);
      bubble(p, pal, ['TWELVE. YEARS.'], 56, 30);
    },
    22,
  );
  // PAYBACK, stamped
  for (const [dx, dy, hold] of [
    [6, -4, 1],
    [-4, 3, 1],
    [2, -1, 1],
    [0, 0, 34],
  ] as const)
    reel.frame(
      black,
      (p) => {
        p.rect(0, 0, W, H, acc[1]);
        hatch(p, 0, 0, W, H, acc[0], 4);
        scaleBlit(p, kick, 244, 30, 4);
        text(p, 18 + dx + 3, 70 + dy + 3, 'PAYBACK', ink[0], 4);
        text(p, 18 + dx, 70 + dy, 'PAYBACK', acc2[3], 4);
      },
      hold,
    );
  reel.fadeOut(3);
  return encodeFli(reel.frames, bytes, { speed: SPEED, palettes: reel.palettes, runs: true, noLoopFrame: true });
}

/** The town hall's wall, the long table and its cloth. */
function hall(pal: Pal): Pixels {
  const { ink, acc, acc2, paper } = press(pal);
  const p = paperBlock(pal, W, H, 4);
  p.rect(0, 0, W, 104, acc[0]);
  for (let x = 0; x < W; x += 24) p.rect(x, 0, 1, 104, ink[1]);
  p.rect(60, 10, 200, 16, acc2[1]).frame(60, 10, 200, 16, ink[0]);
  centered(p, 14, 'TOWN HALL DINNER', ink[0]);
  p.rect(0, 150, W, 50, ink[0]);
  p.rect(6, 124, 308, 40, paper[3]).frame(6, 124, 308, 40, ink[0]);
  for (let x = 24; x < 300; x += 38) p.ring(x, 140, 7, ink[2]);
  return p;
}

/** ENDING.FLI: what happened to the oven, and the table. */
export function endingFli(pal: Pal): Uint8Array {
  const bytes = moodBytes(pal, 'base');
  const reel = new Reel(bytes);
  const { ink, paper, acc, acc2 } = press(pal);
  const plume = buildPlumeBlocks(pal);
  const rory = buildRoryBlocks(pal);
  const pStand = heroPicture(plume, 'stand.top', 'stand');
  const pCheer = heroPicture(plume, 'cheer2.top', 'cheer');
  const rStand = heroPicture(rory, 'stand.top', 'stand');
  const rCheer = heroPicture(rory, 'cheer2.top', 'cheer');
  const gobble = art.bigGobble(pal);
  // 1. Big Gobble goes down outside the hall
  const street = paperBlock(pal, W, H, 7).rect(0, 160, W, 40, ink[0]);
  for (let k = 0; k <= 10; k++)
    reel.frame(street, (p) => {
      const big = new Pixels(60, 60, T);
      gobble.forEach((g, i) => big.blit(g, (i % 3) * 20, Math.floor(i / 3) * 20, -1));
      const sq = Math.max(1, Math.round(60 - k * 5));
      for (let y = 0; y < sq; y++)
        for (let x = 0; x < 60; x++) {
          const c = big.get(x, Math.floor((y * 60) / sq));
          const sx = 100 + x * 2;
          const sy = 160 - sq * 2 + y * 2;
          p.rect(sx, sy, 2, 2, c);
        }
      scaleBlit(p, pStand, 40, 80, 2);
      centered(p, 20, 'PFFFFFFFFT', paper[3], 2, ink[0]);
    });
  // 2. the cord
  const cord = (p: Pixels) => {
    p.rect(100, 156, 120, 4, acc[1]);
    p.line(220, 158, 318, 120, ink[0]).line(220, 159, 318, 121, ink[0]);
    person(p, pal, 'grandma', 260, 90, true);
    person(p, pal, 'dale', 190, 90);
    scaleBlit(p, rStand, 40, 80, 2);
    scaleBlit(p, pStand, 80, 80, 2);
  };
  reel.frame(street, (p) => (cord(p), bubble(p, pal, ['THAT CORD RUNS', 'TO MY KITCHEN.'], 260, 20)), 24);
  reel.frame(street, (p) => (cord(p), centered(p, 30, 'DING!', acc2[2], 4, ink[0])), 16);
  reel.frame(street, (p) => (cord(p), bubble(p, pal, ['MY OVEN WORKS.'], 260, 20)), 18);
  reel.frame(street, (p) => (cord(p), bubble(p, pal, ['DALE.'], 260, 20, true)), 22);
  reel.frame(street, (p) => (cord(p), bubble(p, pal, ['IT WAS THE ONLY OUTLET', 'THAT COULD TAKE IT.'], 190, 20)), 30);
  // 3. the long table
  const bg = hall(pal);
  const table = (p: Pixels, talk: Who | 'rory' | 'plume' | '') => {
    person(p, pal, 'pettigrew', 36, 92, talk === 'pettigrew');
    person(p, pal, 'marjorie', 90, 92, talk === 'marjorie');
    person(p, pal, 'lopez', 144, 92, talk === 'lopez');
    person(p, pal, 'dale', 198, 92, talk === 'dale');
    person(p, pal, 'grandma', 252, 92, talk === 'grandma');
    p.rect(6, 124, 308, 40, paper[3]).frame(6, 124, 308, 40, ink[0]);
    p.blit(art.gravy(pal), 80, 126, -1).blit(art.casserole(pal), 130, 126, -1).blit(art.casserole(pal), 160, 126, -1).blit(art.pie(pal), 230, 126, -1);
  };
  reel.fadeIn(bg, 2);
  reel.frame(bg, (p) => (table(p, 'marjorie'), bubble(p, pal, ['...'], 90, 30)), 16);
  reel.frame(bg, (p) => (table(p, 'marjorie'), bubble(p, pal, ['THE GRAVY IS FINE.'], 90, 30)), 24);
  reel.frame(bg, (p) => (table(p, ''), scaleBlit(p, rCheer, 290, 104, 1), bubble(p, pal, ['SHE SAID FINE!', 'SCREENSHOT!'], 280, 30, true)), 24);
  reel.frame(bg, (p) => (table(p, 'lopez'), bubble(p, pal, ['SAME CASSEROLE?'], 144, 30)), 20);
  reel.frame(bg, (p) => (table(p, 'marjorie'), bubble(p, pal, ['SAME CAN.', 'NOBODY SAY IT.'], 90, 30)), 24);
  reel.frame(bg, (p) => (table(p, 'pettigrew'), bubble(p, pal, ["NEXT YEAR'S MASCOT:", 'MR. PLUME.'], 36, 30)), 30);
  // 4. the kids' table
  const kids = paperBlock(pal, W, H, 11).rect(0, 150, W, 50, ink[0]);
  for (let f = 0; f < 34; f++)
    reel.frame(kids, (p) => {
      p.rect(60, 120, 200, 30, acc2[1]).frame(60, 120, 200, 30, ink[0]);
      centered(p, 128, "KIDS' TABLE", ink[0]);
      scaleBlit(p, f % 10 < 5 ? pStand : pCheer, 140, 30, 2);
      p.blit(art.rolls(pal), 210, 100, -1);
      bubble(p, pal, ["I'LL SIT HERE.", 'THEY HAVE THE', 'GOOD ROLLS.'], 160, 4);
    });
  reel.fadeOut(4);
  return encodeFli(reel.frames, bytes, { speed: SPEED, palettes: reel.palettes, runs: true, noLoopFrame: true });
}
