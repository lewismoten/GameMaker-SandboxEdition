// Measures how long the show's acts take on the built disk (what monsters.ts TICKS_PER_BLOCK, PEEK_TICKS and the
// cues rely on): when each actor changes act, in ticks from the level start. Run it after changing a path or a lifetime.
//   cd web && npx vite-node ../games/scripted/tools/timing.ts
import { MON } from '../src/monsters';
import { GameSim } from './sim';

const sim = new GameSim(undefined, 1);
const names = Object.fromEntries(Object.entries(MON).map(([k, v]) => [v, k]));
let prev = '';
for (let t = 0; t < 700; t++) {
  await sim.tick();
  const now = sim.w.mm
    .map((m) => m.monnum)
    .filter((n) => n in names)
    .sort((a, b) => a - b)
    .map((n) => names[n])
    .join(' ');
  if (now !== prev) console.log(`${String(t).padStart(4)}  ${now}`);
  prev = now;
}
