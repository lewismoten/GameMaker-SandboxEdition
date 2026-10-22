// Re-records the title screen's demo into src/demo.ts: the first stretch of the bot's own run
// through the classroom (the first practice rats pinned and tickled), then rebuild.
//   cd web && npx vite-node ../games/tickle/tools/gendemo.ts && npx vite-node ../games/tickle/build.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { play } from './play';

/** Ticks of the classroom the demo shows. */
const LENGTH = 420;
const { sim } = await play(undefined, 1);
const keys = sim.segments[0].keys;
const out: number[] = [];
let t = 0;
for (const k of keys) {
  if (t + k.delta > LENGTH) break;
  t += k.delta;
  out.push(k.delta, k.key);
}
const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'demo.ts');
const src = readFileSync(file, 'utf8').replace(/const RECORDED: number\[\] = \[[^\]]*\];/, `const RECORDED: number[] = [${out.join(', ')}];`);
writeFileSync(file, src);
console.log(`demo: ${out.length / 2} keys over ${t} ticks`);
