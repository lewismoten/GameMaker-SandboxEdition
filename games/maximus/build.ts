// Builds every file of Maximus: The Hundred Worlds into games/maximus/disk/.
//   cd web && npx vite-node ../games/maximus/build.ts
import { Disk } from '../kit/disk';
import { buildGame } from './src/game';
import { present } from './src/present';
import { README } from './src/screens/text';
import { about, limitsTxt, manual } from './src/docs';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { licenseText } from '../kit/license';

const t0 = Date.now();
const built = buildGame();
await present(built);
const disk = new Disk(new URL('./disk', import.meta.url).pathname);
for (const [name, bytes] of built.files) disk.put(name, bytes);
const bytes = [...built.files.values()].reduce((n, f) => n + f.length, 0);
disk.put('readme.txt', README('$15', built.files.size + 3, (bytes / 1e6).toFixed(1)));
disk.put('limits.txt', limitsTxt(built));
const here = (f: string) => new URL(`./${f}`, import.meta.url).pathname;
// box.hours belongs to games/kit/playtime.ts (from the walkthrough): keep whatever it last wrote
const aboutJson = about(built) as { box: { hours?: number } };
const old = existsSync(here('about.json')) ? (JSON.parse(readFileSync(here('about.json'), 'utf8')) as { box?: { hours?: number } }) : {};
if (old.box?.hours) aboutJson.box.hours = old.box.hours;
else delete aboutJson.box.hours;
writeFileSync(here('about.json'), JSON.stringify(aboutJson, null, 2) + '\n');
writeFileSync(here('manual.json'), JSON.stringify(manual(built), null, 2) + '\n');
disk.put('license.txt', licenseText("Maximus: The Hundred Worlds"));
disk.write();
for (const p of built.problems) console.log('PROBLEM', p);
console.log(
  `${built.scenes.length} adventure scenes, ${built.scenes.reduce((n, s) => n + s.monsters, 0)} monsters placed, ${((Date.now() - t0) / 1000).toFixed(1)}s`,
);
