// Writes a title-screen demo into a game's src/demo.ts from the bot's own run (each game's
// tools/gendemo.ts): the first `length` ticks of a scene's keys, as the RECORDED list of
// delta, key pairs that the game's demo.ts turns into a recording. Rebuild the game after.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Puts the keys of the first `length` ticks into `demoFile`'s `const RECORDED: number[] = […];`. */
export function recordDemo(keys: readonly { delta: number; key: number }[], length: number, demoFile: URL | string): void {
  const out: number[] = [];
  let t = 0;
  for (const k of keys) {
    if (t + k.delta > length) break;
    t += k.delta;
    out.push(k.delta, k.key);
  }
  const file = typeof demoFile === 'string' ? demoFile : fileURLToPath(demoFile);
  const src = readFileSync(file, 'utf8').replace(/const RECORDED: number\[\] = \[[^\]]*\];/, `const RECORDED: number[] = [${out.join(', ')}];`);
  writeFileSync(file, src);
  console.log(`demo: ${out.length / 2} keys over ${t} ticks`);
}
