// Records a demo for a CD game with the bot, and replays a .REC to see how it plays out:
// where the character went, what it scored, whether it died, plus screenshots.
import { parseRecording, serializeRecording } from '../../../web/src/formats/recording';
import type { World } from '../../../web/src/engine/world';
import type { GameFiles } from '../../../web/src/project/files';
import { Pixels } from '../pixels';
import { writePng } from '../png';
import { Bot, type BotOptions } from './bot';
import { runHeadless } from './headless';

/** Esc, a moment after the last key: playback leaves the level for the score table and menu. */
const ESC = 0x01;

export async function recordDemo(files: GameFiles, gam: string, ticks: number, o: BotOptions & { seed?: number } = {}): Promise<{ rec: Uint8Array; bot: Bot }> {
  const bot = new Bot(o);
  const every = o.every ?? 4;
  let n = 0;
  const r = await runHeadless(files, gam, {
    record: true,
    seed: o.seed ?? 1,
    onTick: (w, s, m) => {
      n++;
      if (n >= ticks) {
        bot.release(m);
        return true;
      }
      if (n % every === 1) return bot.decide(w, s, m);
    },
  });
  const keys = parseRecording(r.rec!);
  // the keys let go at the very end are applied after recording stopped: add them, then Esc
  const used = keys.reduce((t, k) => t + k.delta, 0);
  const held = new Set<number>();
  for (const k of keys) k.key < 0x80 ? held.add(k.key) : held.delete(k.key & 0x7f);
  let gap = Math.max(1, ticks - used);
  for (const k of held) keys.push({ delta: gap, key: k | 0x80 }), (gap = 0);
  keys.push({ delta: gap + 9, key: ESC }, { delta: 2, key: ESC | 0x80 });
  return { rec: serializeRecording(keys), bot };
}

export interface Replay {
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
}

/** Plays a .REC through the engine with monster dice `seed`; `shots` saves a sheet of screenshots, one every `every` ticks. */
export async function replay(files: GameFiles, gam: string, rec: Uint8Array, seed: number, shots?: { file: string; every: number }): Promise<Replay> {
  const frames: { px: Uint8Array; pal: Uint8Array }[] = [];
  let shotAt = -1;
  const out: Replay = { ticks: 0, deaths: 0, loads: 0, cells: 0, score: 0, stuck: 0, ended: 0 };
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
    onFrame: (_w, s, m) => {
      if (!shots || s.rec.tick % shots.every !== 0 || !s.rec.tick || s.rec.tick === shotAt) return;
      shotAt = s.rec.tick;
      frames.push({ px: m.screen.pixels.slice(), pal: m.screen.palette.slice() });
    },
  });
  if (shots && frames.length) {
    // one picture: the screenshots in rows of four, each in its own colors (shown in the first one's palette)
    const cols = 4;
    const sheet = new Pixels(cols * 322, Math.ceil(frames.length / cols) * 202, 0);
    frames.forEach((f, i) => {
      for (let y = 0; y < 200; y++) for (let x = 0; x < 320; x++) sheet.set((i % cols) * 322 + x, Math.floor(i / cols) * 202 + y, f.px[y * 320 + x]);
    });
    writePng(shots.file, sheet, frames[0].pal, 1);
  }
  out.cells = cells.size;
  return out;
}
