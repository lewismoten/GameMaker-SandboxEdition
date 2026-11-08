// Progress pictures, from the bot's own run on the built disk: the title, one screen of every level as the player
// sees it (a 16 x 10 block window round Tess, at a chosen moment), and the frames of the first level, the scene you
// watch, every few ticks (make a GIF of them with ffmpeg).
//   cd web && npx vite-node ../games/mountain-next-door/tools/shots.ts <outDir>
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { StarterBot } from '../../kit/starter/bot';
import { playLevels } from '../../kit/levelRun';
import { buildLevels } from '../src/levels';
import { lookOf } from '../src/palette';
import { LEVELS, SEED } from './play';
import { GameSim } from './sim';

const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(join(out, 'frames'), { recursive: true });
const disk = new URL('../disk/', import.meta.url);
const title = decodeGif(readFileSync(new URL('title.gif', disk)));
const t = new Pixels(title.width, title.height);
t.px.set(title.pixels);
writePng(join(out, 'title.png'), t, title.palette, 2);

/** Ticks into each level when its screen is taken. */
const AT: Record<string, number> = {
  next: 1500,
  gates: 700,
  back: 1500,
  prints: 1500,
  books: 1200,
  stream: 900,
  signs: 1500,
  survey: 1500,
  hollow: 1500,
  tower: 2400,
  roofs: 900,
  ridge: 1600,
  tunnel: 1300,
  zigzag: 1700,
  picnic: 1500,
  ford: 1800,
};
/** The first level's frames: one every this many ticks. */
const EVERY = 8;

/** The screen as the player sees it: 16 x 10 blocks round Tess, the blocks as they show now, the monsters and Tess. */
function screen(sim: GameSim): Pixels {
  const w = sim.w;
  const p = new Pixels(320, 200);
  const hx = w.chr.x[0] * 20 + w.chr.x[1];
  const hy = w.chr.y[0] * 20 + w.chr.y[1];
  const x0 = hx - 150;
  const y0 = hy - 130;
  const put = (pix: Uint8Array, sx: number, sy: number, flip = false) => {
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const c = pix[y * 20 + (flip ? 19 - x : x)];
        if (c !== 255) p.set(sx + x - x0, sy + y - y0, c);
      }
  };
  for (let by = Math.floor(y0 / 20); by <= Math.floor((y0 + 199) / 20); by++)
    for (let bx = Math.floor(x0 / 20); bx <= Math.floor((x0 + 319) / 20); bx++) {
      const cell = w.map[((by + 100) % 100) * 100 + ((bx + 100) % 100)];
      const b = w.bg[w.blkmap[cell]];
      for (let i = 0; i < 400; i++) {
        const x = bx * 20 + (i % 20) - x0;
        const y = by * 20 + Math.floor(i / 20) - y0;
        if (x >= 0 && y >= 0 && x < 320 && y < 200) p.px[y * 320 + x] = b.pixels[i];
      }
    }
  for (let l = 0; l < w.mm.length; l++) {
    const n = w.mm[l].monnum;
    if (n >= 64) continue;
    const pic = w.mon[n]?.pic[w.mi[l].curPic]?.[0];
    if (pic === undefined || pic >= 100) continue;
    put(w.mblk[pic].pixels, w.mi[l].curx[0] * 20 + w.mi[l].curx[1], w.mi[l].cury[0] * 20 + w.mi[l].cury[1], w.mi[l].orient === 4);
  }
  // (Tess is drawn facing right: the character file's mirroring for walking left is not redone here)
  put(w.cblk[w.ci.curtop].pixels, hx, hy - 20);
  put(w.cblk[w.ci.curbottom].pixels, hx, hy);
  return p;
}

const { pal, levels } = buildLevels();
/** A level's palette (its time of day), as the build writes it. */
const look = (level: number) => lookOf(pal, levels[level].look);
const sim = new GameSim(undefined, SEED);
const bot = new StarterBot(sim);
let scene = -1;
let entered = 0;
let frame = 0;
const taken = new Set<number>();
const tick = sim.tick.bind(sim);
sim.tick = async () => {
  const r = await tick();
  const level = sim.segments.length - 1;
  if (level !== scene) {
    scene = level;
    entered = sim.w.clock;
  }
  const since = sim.w.clock - entered;
  if (level === 0 && since % EVERY === 0) writePng(join(out, 'frames', `next-${String(frame++).padStart(4, '0')}.png`), screen(sim), look(0), 1);
  if (level >= 0 && level < levels.length && since >= (AT[levels[level].file] ?? 900) && !taken.has(level)) {
    taken.add(level);
    writePng(join(out, `level-${String(level + 1).padStart(2, '0')}-${levels[level].file}.png`), screen(sim), look(level), 2);
  }
  return r;
};
await playLevels(bot, LEVELS, LEVELS.length);
console.log(`pictures in ${out}: ${taken.size} levels, ${frame} frames of the first`);
