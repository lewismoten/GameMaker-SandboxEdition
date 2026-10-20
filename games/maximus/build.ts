// Builds every file of Maximus: The Hundred Worlds into games/maximus/disk/.
//   cd web && npx vite-node ../games/maximus/build.ts
import { Disk } from '../kit/disk';
import { buildGame } from './game';
import { present } from './present';
import { README } from './text';

const t0 = Date.now();
const built = buildGame();
present(built);
const disk = new Disk(new URL('./disk', import.meta.url).pathname);
for (const [name, bytes] of built.files) disk.put(name, bytes);
disk.put('readme.txt', README('$15'));
disk.write();
for (const p of built.problems) console.log('PROBLEM', p);
console.log(
  `${built.scenes.length} adventure scenes, ${built.scenes.reduce((n, s) => n + s.monsters, 0)} monsters placed, ${((Date.now() - t0) / 1000).toFixed(1)}s`,
);
