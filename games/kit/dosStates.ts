// Replays each CD game's demo.rec through the web engine and compares it with the tables a real DOS
// run left (games/kit/dosStates/<game>.txt: one line per 20 ticks of tick, score, scene, character
// position and scroll registers). Reports the first line that differs per game. A local check, not a
// CI test (nebula and peach replay for tens of thousands of ticks). Tables: chiguire, upstream PR #4.
//
//   cd web && npx vite-node ../games/kit/dosStates.ts [game...]
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadCdGame, runHeadless } from './cdDemos/headless';

const OFFSET = +(process.env.DOS_TICK_OFFSET ?? 0); // calibrates which engine tick matches a DOS table line
const dir = join(import.meta.dirname, 'dosStates');

interface Row {
  tick: number;
  score: number;
  scene: number;
  x: number;
  y: number;
}

/** One table line: `  0 tick=20 timer=20 score=0 scene=19 char=(26,19) pan=0/0` (pan is DOS video hardware, not compared). */
function parseRow(line: string): Row {
  const m = /tick=(\d+)\s+timer=\d+\s+score=(-?\d+)\s+scene=(\d+)\s+char=\((-?\d+),(-?\d+)\)/.exec(line);
  if (!m) throw new Error(`bad table line: ${line}`);
  return { tick: +m[1], score: +m[2], scene: +m[3], x: +m[4], y: +m[5] };
}

const show = (r: Row) => `tick ${r.tick} score ${r.score} scene ${r.scene} char (${r.x},${r.y})`;

async function check(game: string): Promise<string> {
  const want = readFileSync(join(dir, `${game}.txt`), 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(parseRow);
  const files = loadCdGame('gameware', game);
  const listing = readdirSync(join(import.meta.dirname, '../../cd/gameware', game));
  const gam = listing.find((f) => /\.gam$/i.test(f)) ?? `${game}.gam`;
  const rec = files.get(listing.find((f) => /\.rec$/i.test(f)) ?? 'demo.rec');
  if (!rec) return `${game}: no demo.rec`;
  let scene = 0;
  let tick = 0;
  let idx = 0;
  let verdict = '';
  await runHeadless(files, gam, {
    playback: rec,
    maxTicks: want.length * 20 + 40,
    onScene: (n) => (scene = n),
    onTick: (w) => {
      tick++;
      if (tick % 20 !== OFFSET) return;
      const got: Row = { tick, score: w.ci.score, scene, x: w.chr.x[0], y: w.chr.y[0] };
      const exp = want[idx++];
      if (!exp) return true;
      if (got.score !== exp.score || got.scene !== exp.scene || got.x !== exp.x || got.y !== exp.y) {
        verdict = `first difference at line ${idx}: DOS ${show(exp)}  web ${show(got)}`;
        return true;
      }
      if (idx >= want.length) return true;
    },
  });
  return `${game}: ${verdict || (idx >= want.length ? `match (${want.length} lines)` : `web ended after ${idx} of ${want.length} lines`)}`;
}

const games = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(dir)
      .filter((f) => f.endsWith('.txt'))
      .map((f) => f.slice(0, -4));
for (const g of games) console.log(await check(g));
process.exit(0); // the headless machine leaves timers behind
