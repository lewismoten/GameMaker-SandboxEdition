// Plays every lesson and checks the shared-map palette trick and safe, visible footing.
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { buildGame } from '../src/game';
import { finishBlocks } from '../src/rain';
import { play } from './play';
const { pal, storm, levels } = buildLevels();
for (const l of levels) assertNoInvisibleWalls({ book: l.book, pal, levels: [l] });
const game = buildGame(levels);
const [mild, dark] = game.scenes.slice(3);
if (mild.files[1] !== dark.files[1] || mild.files[2] !== dark.files[2] || mild.files[0] === dark.files[0])
  throw new Error('the palette comparison must load the same map and blocks with two palettes');
if (pal.pal.every((v, i) => v === storm[i])) throw new Error('storm palette is unchanged');
const blocks = finishBlocks(levels[1]);
for (const t of levels[1].timed) {
  const b = blocks[levels[1].book.n(t.name)];
  if (b.chHitPt || b.scorePts || b.effect) throw new Error(`${t.name}: weather must not hurt or reward`);
  if (t.name.startsWith('pool') && !b.solid) throw new Error(`${t.name}: puddle footing disappeared`);
}
const { sim } = await play();
console.log(`rain: all three scenes completed; ${sim.trail.length} scenes entered, score ${sim.ci.score}`);
