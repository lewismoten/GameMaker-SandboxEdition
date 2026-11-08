// The play-testing bot walks the tumble and the gust and ends the game without losing a life; route.ts asserts that the
// first door leads to the gust. It also checks that no solid block is drawn like open ground, that every leaf path fits a
// monster (ten corners at most, whole blocks, speeds 1 to 4) and lands on the row the hero walks on, inside the room,
// and that no more leaves are alive at once than the engine draws.
//   cd web && npx vite-node ../games/leaves/tools/check.ts   (BOT_LOG=1 prints every step)
import { MAXMARCH } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { DROP, LEAF, buildLeafBlocks, buildLeaves } from '../src/leaves';
import { GUST, TUMBLE, buildLevels } from '../src/levels';
import { play } from './play';

const built = buildLevels();
for (const l of [built.tumble, built.gust]) assertNoInvisibleWalls({ book: l.book, pal: built.pal, levels: [l] });

// the paths: corners, speeds, where they land
const mons = buildLeaves(buildLeafBlocks(built.pal));
const landing = (id: number) => {
  const path = mons[id].march[0].filter((c) => c.pic > 0);
  if (path.length > MAXMARCH) throw new Error(`monster ${id} has ${path.length} corners`);
  for (const c of path)
    if (c.pic < 1 || c.pic > 4 || !Number.isInteger(c.x) || !Number.isInteger(c.y)) throw new Error(`monster ${id} has a bad corner ${JSON.stringify(c)}`);
  return path[path.length - 1];
};
for (const t of TUMBLE.trees) {
  const end = landing(t.mon);
  if (end.y !== DROP.tumble) throw new Error(`leaf ${t.mon} lands ${end.y} rows down, not ${DROP.tumble}`);
}
for (const t of GUST.trees) {
  LEAF.calm[t.kind].forEach((id, k) => {
    const end = landing(id);
    const x = t.x + k * 2 + end.x;
    if (end.y !== DROP.calm || x < 1 || x >= GUST.width - 1) throw new Error(`calm ${t.kind} leaf ${id} lands at ${x}, ${end.y} rows down`);
  });
  LEAF.gust[t.kind].forEach((id, col) => {
    const end = landing(id);
    const x = t.x + col + end.x;
    if (end.y !== DROP.gust || x < 1 || x >= GUST.width - 1) throw new Error(`gust ${t.kind} leaf ${id} lands at ${x}, ${end.y} rows down`);
  });
}

const { sim } = await play();
const trail = sim.trail.join(' ');
if (trail !== '2 3') throw new Error(`the bot should enter scenes 2 3 (then the ending), not ${trail}`);
console.log(`leaves: the bot watched the tumble and the gust; ${sim.deaths} lives lost, scenes entered ${trail}`);
