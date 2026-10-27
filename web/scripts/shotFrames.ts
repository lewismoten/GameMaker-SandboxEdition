// Node only: draws the gameplay frames the games' box shots and manual pages ask for
// (src/gfx/shotFrame.ts) into public/frames/ (scripts/shotFramesDraw.ts). Done ahead of time,
// not when a box opens: reaching a level means playing the whole game up to it (seconds of
// engine time, and every game file). A game's old frames that nothing asks for any more are
// removed. Run from web/ after changing a game or its walkthrough:
//
//   npx vite-node scripts/shotFrames.ts [<id>...]
//
// src/walkthrough/shotFrames.test.ts fails when a frame here no longer matches a replay.
import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { framePath } from '../src/gfx/shotFrame';
import { drawFrames, frameGames, gamesDir } from './shotFramesDraw';

const publicDir = resolve(__dirname, '../public');

async function main(ids: string[]): Promise<void> {
  const out = join(publicDir, 'frames');
  mkdirSync(out, { recursive: true });
  let failed = false;
  const games = frameGames(ids);
  // a game asked for that no longer wants frames: its old ones go
  const named = ids.length ? ids : readdirSync(gamesDir);
  for (const id of named) {
    const keep = new Set(games.find((g) => g.id === id)?.wants.map((f) => framePath(id, f).replace(/^frames\//, '')));
    for (const f of readdirSync(out)) if (f.startsWith(`${id}-`) && !keep.has(f)) (unlinkSync(join(out, f)), console.log(`removed frames/${f}`));
  }
  for (const g of games) {
    const t0 = Date.now();
    for (const [path, png] of await drawFrames(g)) {
      if (!png) {
        console.error(`${g.id}: ${path} never shows in the walkthrough`);
        failed = true;
        continue;
      }
      writeFileSync(join(publicDir, path), png);
      console.log(`${path} (${png.length} bytes)`);
    }
    console.log(`${g.id}: ${Date.now() - t0} ms`);
  }
  if (failed) process.exitCode = 1;
}

await main(process.argv.slice(2));
