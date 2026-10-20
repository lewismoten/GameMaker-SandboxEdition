// Builds every file of Maximus: The Hundred Worlds into games/maximus/disk/.
//   cd web && npx vite-node ../games/maximus/build.ts
import { Disk } from '../kit/disk';
import { buildGame } from './game';
import { present } from './present';
import { README } from './text';
import { about, limitsTxt, manual } from './docs';
import { writeFileSync } from 'node:fs';

const t0 = Date.now();
const built = buildGame();
await present(built);
const disk = new Disk(new URL('./disk', import.meta.url).pathname);
for (const [name, bytes] of built.files) disk.put(name, bytes);
const bytes = [...built.files.values()].reduce((n, f) => n + f.length, 0);
disk.put('readme.txt', README('$15', built.files.size + 2, (bytes / 1e6).toFixed(1)));
disk.put('limits.txt', limitsTxt(built));
const here = (f: string) => new URL(`./${f}`, import.meta.url).pathname;
writeFileSync(here('about.json'), JSON.stringify(about(built), null, 2) + '\n');
writeFileSync(here('manual.json'), JSON.stringify(manual(built), null, 2) + '\n');
disk.write();
for (const p of built.problems) console.log('PROBLEM', p);
console.log(
  `${built.scenes.length} adventure scenes, ${built.scenes.reduce((n, s) => n + s.monsters, 0)} monsters placed, ${((Date.now() - t0) / 1000).toFixed(1)}s`,
);
