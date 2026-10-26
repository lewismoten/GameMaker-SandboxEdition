// Records a demo for a CD game with the bot, and replays a .REC to see how it plays out:
// where the character went, what it scored, whether it died, plus screenshots.
import { parseRecording, serializeRecording } from '../../../web/src/formats/recording';
import type { World } from '../../../web/src/engine/world';
import type { GameFiles } from '../../../web/src/project/files';
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { Bot, type BotOptions } from './bot';
import { runHeadless } from './headless';

/** Esc, a moment after the last key: playback leaves the level for the score table and menu. */
const ESC = 0x01;

export async function recordDemo(files: GameFiles, gam: string, ticks: number, o: BotOptions & { seed?: number } = {}): Promise<{ rec: Uint8Array; bot: Bot }> {
  const bot = new Bot(o);
  const every = o.every ?? 4;
  let n = 0;
  // the keys so far: a game that ends (no lives left) stops the recorder, which forgets them
  let sofar: Uint8Array = new Uint8Array(0);
  const r = await runHeadless(files, gam, {
    record: true,
    seed: o.seed ?? 1,
    onTick: (w, s, m) => {
      n++;
      if (s.rec.mode) sofar = s.rec.save();
      if (n >= ticks) {
        bot.release(m);
        return true;
      }
      if (n % every === 1) return bot.decide(w, s, m);
    },
  });
  const keys = parseRecording(r.rec?.length ? r.rec : sofar);
  // the keys let go at the very end are applied after recording stopped: add them, then Esc
  const used = keys.reduce((t, k) => t + k.delta, 0);
  const held = new Set<number>();
  for (const k of keys) k.key < 0x80 ? held.add(k.key) : held.delete(k.key & 0x7f);
  let gap = Math.max(1, ticks - used);
  for (const k of held) (keys.push({ delta: gap, key: k | 0x80 }), (gap = 0));
  keys.push({ delta: gap + 9, key: ESC }, { delta: 2, key: ESC | 0x80 });
  return { rec: serializeRecording(keys), bot };
}

interface Replay {
  ticks: number;
  deaths: number;
  /** Levels loaded (the first one, and again after each death or link). */
  loads: number;
  /** Distinct 20x20 cells the character stood in. */
  cells: number;
  score: number;
  /** Ticks the character stood still (same cell) the longest. */
  stuck: number;
  /** Ticks at which play left the level (Esc, death, link). */
  ended: number;
  /** Game ticks played (without the polls a DOS recording counts while a screen waits). */
  played: number;
}

/** Plays a .REC through the engine with monster dice `seed`; `shots` saves a sheet of screenshots, one every `every` ticks. */
export async function replay(files: GameFiles, gam: string, rec: Uint8Array, seed: number, shots?: { file: string; every: number }): Promise<Replay> {
  const frames: { px: Uint8Array; pal: Uint8Array }[] = [];
  let shotAt = -1;
  let played = 0;
  const out: Replay = { ticks: 0, deaths: 0, loads: 0, cells: 0, score: 0, stuck: 0, ended: 0, played: 0 };
  const cells = new Set<string>();
  let lastWorld: World | undefined;
  let lastCell = '';
  let still = 0;
  let lives = -1;
  await runHeadless(files, gam, {
    playback: rec,
    seed,
    maxTicks: 6000,
    onTick: (w, s) => {
      played++;
      out.ticks = s.rec.tick;
      if (!s.rec.playing) return true;
      if (w !== lastWorld) {
        lastWorld = w;
        out.loads++;
      }
      if (lives >= 0 && w.ci.lives < lives) out.deaths++;
      lives = w.ci.lives;
      const cell = `${out.loads}:${w.chr.x[0]},${w.chr.y[0]}`;
      cells.add(cell);
      still = cell === lastCell ? still + 1 : 0;
      lastCell = cell;
      out.stuck = Math.max(out.stuck, still);
      out.score = w.ci.score;
      out.ended = s.rec.tick;
    },
    onFrame: (_w, _s, m) => {
      // by game ticks played (a DOS recording's tick also counts the polls of screens waiting for a key)
      if (!shots || played % shots.every !== 0 || !played || played === shotAt) return;
      shotAt = played;
      frames.push({ px: m.screen.pixels.slice(), pal: m.screen.palette.slice() });
    },
  });
  if (shots && frames.length) writeSheet(shots.file, frames);
  out.cells = cells.size;
  out.played = played;
  return out;
}

/** One RGB picture of the screenshots in rows of four, each in its own colors. */
function writeSheet(file: string, frames: { px: Uint8Array; pal: Uint8Array }[]): void {
  const cols = 4;
  const w = cols * 322;
  const h = Math.ceil(frames.length / cols) * 202;
  const raw = new Uint8Array((w * 3 + 1) * h);
  frames.forEach((f, i) => {
    const ox = (i % cols) * 322;
    const oy = Math.floor(i / cols) * 202;
    for (let y = 0; y < 200; y++)
      for (let x = 0; x < 320; x++) {
        const c = f.px[y * 320 + x];
        const o = (oy + y) * (w * 3 + 1) + 1 + (ox + x) * 3;
        for (let k = 0; k < 3; k++) raw[o + k] = (f.pal[c * 3 + k] << 2) | (f.pal[c * 3 + k] >> 4);
      }
  });
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const chunk = (type: string, data: Uint8Array) => {
    const out = new Uint8Array(12 + data.length);
    const dv = new DataView(out.buffer);
    dv.setUint32(0, data.length);
    for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
    out.set(data, 8);
    let c = 0xffffffff;
    for (const b of out.subarray(4, 8 + data.length)) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    dv.setUint32(8 + data.length, (c ^ 0xffffffff) >>> 0);
    return out;
  };
  const ihdr = new Uint8Array(13);
  new DataView(ihdr.buffer).setUint32(0, w);
  new DataView(ihdr.buffer).setUint32(4, h);
  ihdr.set([8, 2, 0, 0, 0], 8);
  const parts = [Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', new Uint8Array(0))];
  writeFileSync(file, Buffer.concat(parts));
}
