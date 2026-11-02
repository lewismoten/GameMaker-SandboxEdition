// `npm run walk:auto -- <game folder | .zip> [--budget ms] [--game NAME.GAM] [--out walkthrough.json]`
// Runs the bot that the editor's "Make a walkthrough…" runs (autoWalk) on a game folder or zip and
// prints a table: each scene's style, tries, time and outcome, and why it stopped (which door stayed
// shut). --out writes the walkthrough in the editor's format. Exits 1 when the bot didn't win.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { readZip } from '@lewismoten/gamemaker-sandbox-archives/project/zip';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { GameFiles } from '../src/project/files';
import { autoWalk, STRATEGIES } from '../src/editor/check/walk/autoWalk';
import { verifyWalk } from '../src/editor/check/walk/verify';
import { parseArgs, pickGam, sceneLine } from './walkAutoArgs';

const args = parseArgs(process.argv.slice(2));
if (typeof args === 'string') {
  console.error(args);
  process.exit(2);
}
const files = new GameFiles();
if (statSync(args.source).isDirectory()) {
  for (const f of readdirSync(args.source)) if (statSync(join(args.source, f)).isFile()) files.set(f, new Uint8Array(readFileSync(join(args.source, f))));
} else {
  for (const { name, data } of await readZip(new Uint8Array(readFileSync(args.source)))) if (!name.endsWith('/')) files.set(basename(name), data);
}
const picked = pickGam([...files.names()], args.game);
if ('error' in picked) {
  console.error(picked.error);
  process.exit(2);
}
const game = parseGame(files.get(picked.gam)!);
const styleName = (id: string) => (id === 'mine' ? 'Your play' : (STRATEGIES.find((s) => s.id === id)?.name ?? id));
const t0 = Date.now();
const result = await autoWalk(game, files, picked.gam.replace(/\.gam$/i, ''), { budgetMs: args.budgetMs });
console.log(`${picked.gam}: ${result.won ? 'won' : 'did not win'} in ${((Date.now() - t0) / 1000).toFixed(1)}s (budget ${args.budgetMs / 1000}s a scene)`);
console.log('scene  name                      style                                tries    play  outcome');
for (const s of result.scenes) console.log(sceneLine(s, styleName));
if (result.stopped) console.log(`Stopped: ${result.stopped}`);
if (args.out && result.walk) {
  const verified = await verifyWalk(files, picked.gam, result.walk, { maxMinutes: 60 });
  result.walk.timeline = { fps: result.walk.timeline.fps, frames: verified.frames, chapters: verified.chapters };
  writeFileSync(args.out, JSON.stringify(result.walk, null, 1) + '\n');
  console.log(`Wrote ${args.out}`);
}
process.exit(result.won ? 0 : 1);
