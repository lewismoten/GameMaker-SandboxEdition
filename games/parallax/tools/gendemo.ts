// Re-records the title screen's demo into src/demo.ts: the first stretch of the bot's own run
// through the first level (Kit drops onto the path and waits while the three bands go by, then
// starts toward the door), then lets go of Right 10 ticks later so he stops short of the door
// and the demo stays on level 1. Rebuild after.
//   cd web && npx vite-node ../games/parallax/tools/gendemo.ts && npx vite-node ../games/parallax/build.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { recordDemo } from '../../kit/demoRecord';
import { play } from './play';

/** Ticks of the first level the demo shows before Kit starts walking. */
const LENGTH = 300;
const RIGHT = 77;
const { sim } = await play(undefined, 1);
const file = new URL('../src/demo.ts', import.meta.url);
recordDemo(sim.segments[0].keys, LENGTH, file);
const path = fileURLToPath(file);
writeFileSync(path, readFileSync(path, 'utf8').replace(new RegExp(`(const RECORDED: number\\[\\] = \\[[^\\]]*?, ${RIGHT})\\];`), `$1, 10, ${RIGHT + 128}];`));
