// Draws the figures of art course 5 ("Block animation") into src/artCourses/figures/. A block that animates is a ring of
// background blocks (each block's "next block" and "time", PLAYGAME changeblks). The water and torch frames are drawn here with
// indexed pixels; the Heat Waves ring, the Keys and Doors door and the Switches lever are the real blocks of those Starters,
// read from their built disks (games/<id>/disk/; GM_GAMES picks another games folder). The disks must be built
// (`npm run build:games` from the root).
// Run from web/: npx vite-node scripts/artCourseFigures5.ts
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { C, OUT, pal as kitPal, strip } from './artCourseKit';

const GAMES = process.env.GM_GAMES ?? fileURLToPath(new URL('../../games/', import.meta.url));
const disk = (game: string, file: string): Uint8Array => {
  const dir = `${GAMES}/${game}/disk`;
  const real = readdirSync(dir).find((f) => f.toLowerCase() === file.toLowerCase()) ?? file;
  return new Uint8Array(readFileSync(`${dir}/${real}`));
};
const block = (px: Uint8Array): Pixels => {
  const p = new Pixels(20, 20);
  p.px.set(px);
  return p;
};

// ---- drawn: water, a wave crest that moves 5 pixels a frame, so 4 frames close the loop ----
const water = (shift: number): Pixels => {
  const p = new Pixels(20, 20, C.b0);
  for (let x = 0; x < 20; x++) {
    const crest = 7 + Math.round(2 * Math.sin((2 * Math.PI * (x + shift)) / 20));
    for (let y = 0; y < 20; y++) p.set(x, y, y < crest ? C.sky : y === crest ? C.b2 : y < crest + 5 ? C.b1 : C.b0);
    if ((x + shift) % 20 === 5) p.set(x, crest, C.wht);
  }
  return p;
};
function figWater(): void {
  const frames = [0, 5, 10, 15].map(water);
  const loop = new Pixels(20 * 6, 20, C.sky);
  [0, 1, 2, 3, 0, 1].forEach((f, i) => loop.blit(frames[f], i * 20, 0));
  const same = new Pixels(20 * 5, 20, C.sky);
  for (let i = 0; i < 5; i++) same.blit(frames[0], i * 20, 0);
  const out = new Pixels(Math.max(frames.length * 24 - 4, loop.w), 20 + 20 + 12, C.bg);
  out.blit(strip(frames, 4), 0, 0);
  out.blit(loop, 0, 32);
  writePng(`${OUT}anim-water.png`, out, kitPal, 4);
  console.log(
    'water: frames distinct',
    new Set(frames.map((f) => f.px.join())).size,
    'frame 20 shift equals frame 0:',
    water(20).px.join() === frames[0].px.join(),
  );
}

// ---- drawn: a torch, four flame shapes on one bracket ----
function torch(frame: number): Pixels {
  const p = new Pixels(20, 20, C.k1);
  p.rect(0, 0, 20, 1, C.k2).rect(0, 10, 20, 1, C.k0).rect(10, 0, 1, 10, C.k0).rect(0, 15, 20, 1, C.k0).rect(5, 10, 1, 5, C.k0).rect(15, 10, 1, 5, C.k0);
  p.rect(8, 14, 4, 6, C.w1).rect(8, 14, 1, 6, C.w2).rect(7, 12, 6, 2, C.w2).rect(7, 12, 6, 1, C.w3);
  const tall = [8, 10, 9, 11][frame];
  const sway = [0, 2, 0, -2][frame];
  for (let i = 0; i < tall; i++) {
    const y = 11 - i;
    const half = Math.max(1, Math.round(3.6 * (1 - Math.pow(i / tall, 1.5))));
    const cx = 10 + Math.round((sway * i * i) / (tall * tall));
    p.rect(cx - half, y, half * 2, 1, C.r2);
    if (half >= 2) p.rect(cx - half + 1, y, half * 2 - 2, 1, C.yel);
    if (half >= 2 && i < tall - 4) p.rect(cx - half + 2, y, Math.max(1, half * 2 - 4), 1, C.wht);
  }
  return p;
}
function figTorch(): void {
  const frames = [0, 1, 2, 3].map(torch);
  const wall = new Pixels(20 * 4, 20, C.bg);
  [0, 1, 2, 3].forEach((f, i) => wall.blit(frames[f], i * 20, 0));
  writePng(`${OUT}anim-torch.png`, strip(frames, 4), kitPal, 4);
  void wall;
}

/** Pictures side by side with a gap and an arrow between, on a copy of `palBytes` with two unused entries set to gray and white. */
function pairPng(name: string, palBytes: Uint8Array, pics: Pixels[], scale: number, arrows: boolean): void {
  const used = new Set(pics.flatMap((p) => [...p.px]));
  const free = [...Array(256).keys()].filter((c) => !used.has(c));
  const [gap, ink] = free;
  const pal = palBytes.slice();
  pal.set([46, 46, 50], gap * 3);
  pal.set([4, 4, 8], ink * 3);
  const w = pics.length * 20 + (pics.length - 1) * 18;
  const out = new Pixels(w, 20, gap);
  pics.forEach((p, i) => {
    out.blit(p, i * 38, 0);
    if (arrows && i < pics.length - 1)
      out
        .rect(i * 38 + 23, 9, 8, 2, ink)
        .line(i * 38 + 28, 6, i * 38 + 31, 9, ink)
        .line(i * 38 + 28, 13, i * 38 + 31, 10, ink);
  });
  writePng(`${OUT}${name}.png`, out, pal, scale);
}

// ---- real: Heat Waves, hw1.bbl blocks 45 to 50 (six frames of 4 ticks each) ----
function figHeat(): void {
  const blocks = parseBlocks(disk('heat-waves', 'hw1.bbl'), 150);
  const scene = parseGame(disk('heat-waves', 'hw.gam')).scenes.find((s) => s.files[2].toLowerCase() === 'hw1.bbl')!;
  const ring = [45, 46, 47, 48, 49, 50];
  console.log('heat ring', ring.map((i) => `${i}->${blocks[i].nextBl}@${blocks[i].ntime}`).join(' '));
  pairPng(
    'anim-heat',
    disk('heat-waves', scene.files[0]),
    ring.map((i) => block(blocks[i].pixels)),
    3,
    true,
  );
}

// ---- real: a door that opens and a lever that flips (touch swaps), Keys and Doors and Switches ----
function figSwaps(): void {
  const kb = parseBlocks(disk('keys-and-doors', 'keys.bbl'), 150);
  const sb = parseBlocks(disk('switches', 'sw.bbl'), 150);
  console.log('door 20 touch ->', kb[20].touchBl, 'solid', kb[20].solid, 'effect', kb[20].effect, kb[20].eamt);
  console.log('lever 105 ->', sb[105].touchBl, 'effect', sb[105].effect, sb[105].eamt, '; 106 ->', sb[106].touchBl);
  pairPng('anim-door', disk('keys-and-doors', 'keys.pal'), [block(kb[20].pixels), block(kb[kb[20].touchBl].pixels)], 4, true);
  pairPng('anim-lever', disk('switches', 'sw.pal'), [block(sb[105].pixels), block(sb[sb[105].touchBl].pixels)], 4, true);
}

/** A row of torches at one moment: all showing the same ring member, or different members of the same ring. Counts the blocks. */
function figStagger(): void {
  const frames = [0, 1, 2, 3].map(torch);
  const row = (members: number[]): Pixels => {
    const r = new Pixels(members.length * 20, 20);
    members.forEach((m, i) => r.blit(frames[m], i * 20, 0));
    return r;
  };
  const together = [0, 0, 0, 0, 0, 0];
  const apart = [0, 2, 1, 3, 2, 1];
  const a = row(together);
  const b = row(apart);
  const out = new Pixels(a.w, 20 * 2 + 8, C.bg);
  out.blit(a, 0, 0).blit(b, 0, 28);
  writePng(`${OUT}anim-stagger.png`, out, kitPal, 3);
  console.log('stagger: blocks in the ring', frames.length, 'distinct shown together', new Set(together).size, 'apart', new Set(apart).size);
}

figWater();
figTorch();
figStagger();
figHeat();
figSwaps();
