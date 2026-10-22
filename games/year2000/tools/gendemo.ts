// Records DEMO.REC: the bot plays the first minute of Dome Sweet Dome in the simulator,
// and its key presses are written into demo.ts.
//   cd web && npx vite-node ../games/year2000/tools/gendemo.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { newCharInfo } from '../../../web/src/engine/world';
import { Bot } from './bot';
import { buildCharacter } from '../src/characters/character';
import { MON } from '../src/ids';
import { LEVELS, SETS } from '../src/levels/levels';
import { buildMonsters } from '../src/characters/monsters';
import { Sim } from './sim';
import { buildCharBlocks, buildMonsterBlocks } from '../src/sprites/sprites';

const l = LEVELS[0];
const set = SETS[l.set]();
const lm = l.build(set);
const mb = buildMonsterBlocks();
const cb = buildCharBlocks();
const sim = new Sim(
  { map: lm.done(), bbl: set.build(), mbl: mb.build(), mon: buildMonsters(mb), chr: buildCharacter(cb, false), cbl: cb.build(), links: [] },
  lm.at('start'),
  newCharInfo(),
);
const robots = new Set<number>([MON.mowerH, MON.mowerV, MON.mowerBox, MON.dog, MON.paperbot]);
const bot = new Bot(sim, { zapAt: (n) => robots.has(n), maxTicks: 900, avoid: new Set([set.id('booth_door')]) });
// Fetch the remote, open the garage, grab the Zapper and some pages.
const names = set.names;
await bot.collect(names, (n) => /^(remote|zapper|page|quarter)_/.test(n), 'items');
sim.releaseAll();
const out: number[] = [];
let last = 0;
for (const [t, k] of sim.log) {
  out.push(t + 1 - last, k);
  last = t + 1;
}
const here = dirname(fileURLToPath(import.meta.url));
const file = join(here, '..', 'src', 'demo.ts');
const src = readFileSync(file, 'utf8').replace(/export const DEMO: number\[\] = \[[^\]]*\];/, `export const DEMO: number[] = [${out.join(', ')}];`);
writeFileSync(file, src);
console.log(`${out.length / 2} key events over ${sim.ticks} ticks`);
