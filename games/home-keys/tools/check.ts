// The play-testing bot plays the whole game on the built disk. It must win without losing a life, and the
// keys it pressed must be what the levels promise:
//   - the whole game can be won with the arrows, Space and Enter alone (the run without the extras presses nothing else);
//   - the run with the extras presses Q and E only in level 3, and only for its shelves.
// route.ts asserts what each sign teaches (a jelly blocks until a star pops it, a hop then Right crosses a gap, E and Q reach the shelves).
//   cd web && npx vite-node ../games/home-keys/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { BASIC_KEYS } from '../../../web/src/editor/check/keyLimit';
import { scanName } from '@lewismoten/gamemaker-sandbox-engine/input/scancodes';
import { buildLevels } from '../src/levels';
import { SCAN_E, SCAN_Q } from '../src/hero';
import { play } from './play';

assertNoInvisibleWalls(buildLevels());

/** The keys pressed (not let go) in each scene's segment, other than the basic keys. */
function extras(sim: Awaited<ReturnType<typeof play>>['sim']): Map<number, Set<number>> {
  const out = new Map<number, Set<number>>();
  for (const seg of sim.segments)
    for (const { key } of seg.keys) {
      if (key & 0x80 || BASIC_KEYS.has(key)) continue;
      if (!out.has(seg.scene)) out.set(seg.scene, new Set());
      out.get(seg.scene)!.add(key);
    }
  return out;
}

const plain = await play(undefined, undefined, false);
const other = extras(plain.sim);
if (other.size)
  throw new Error(
    `the way through must need only the arrows, Space and Enter; the bot also pressed ${[...other].map(([s, k]) => `${[...k].map(scanName)} in scene ${s}`)}`,
  );
const full = await play();
const more = extras(full.sim);
for (const [scene, keys] of more) {
  const bad = [...keys].filter((k) => !(scene === 4 && (k === SCAN_Q || k === SCAN_E)));
  if (bad.length) throw new Error(`only Q and E in level 3 are extras; the bot pressed ${bad.map(scanName)} in scene ${scene}`);
}
if (!more.get(4)?.has(SCAN_E) || !more.get(4)?.has(SCAN_Q)) throw new Error('the shelves should have been reached with E and with Q');
console.log(
  `home keys: won with the arrows, Space and Enter alone (score ${plain.sim.ci.score}); with the extras Q and E in level 3 score ${full.sim.ci.score}; ${full.sim.deaths} lives lost, ${full.sim.trail.length} scenes entered`,
);
