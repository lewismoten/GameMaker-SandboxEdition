// Human-paced routes: pause under the snow, make a gap with a hop, then fill it by walking back.
import type { StarterBot, Result } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { buildLevels } from '../src/levels';

const { levels } = buildLevels();
async function must(r: Promise<Result>, what: string): Promise<void> {
  const result = await r;
  if (result) throw new Error(`${what}: ${result}`);
}
const at = (x: number, y: number) => (y + ORIGIN) * 100 + x + ORIGIN;

export async function snowyWalk(bot: StarterBot): Promise<void> {
  const { book } = levels[0];
  const flake = book.n('flake0.0');
  const shown = new Set<number>();
  await must(bot.walk(6), 'first sign');
  for (let i = 0; i < 36; i++) {
    shown.add(bot.sim.w.blkmap[flake]);
    await must(bot.tick(), 'snow falling');
  }
  if (shown.size < 6) throw new Error('the falling snow did not animate');
  await must(bot.walk(12), 'fresh powder');
  await must(bot.jump('right', 16), 'hop over powder');
  if (bot.sim.w.map[at(14, 9)] !== book.n('powder')) throw new Error('jumping should leave fresh powder at column 14');
  await must(bot.walk(20), 'the boot marks sign');
  await must(bot.wait(28), 'look behind');
  await must(bot.walk(12), 'fill the gap');
  if (bot.sim.w.map[at(14, 9)] !== book.n('footprints')) throw new Error('walking back did not stamp the gap');
  await must(bot.wait(28), 'compare the trail');
  const r = await bot.walk(25, 'the door');
  if (r !== 'link') throw new Error(`first door: ${r}`);
  bot.say('snow animated; hopping left a gap, walking back stamped it; first door linked');
}

export async function pilesUp(bot: StarterBot): Promise<void> {
  const { book } = levels[1];
  const drift = book.n('drift1.0');
  if (bot.sim.w.blkmap[drift] !== drift) throw new Error('drift did not start shallow');
  await must(bot.walk(7), 'the growing drift sign');
  await must(bot.wait(54), 'watch the drift deepen');
  if (bot.sim.w.blkmap[drift] !== book.n('drift1.2')) throw new Error('drift did not reach its deepest picture');
  await must(bot.walk(19), 'make boot marks');
  await must(bot.walk(14), 'look back at the trail');
  await must(bot.wait(30), 'read the sign');
  const r = await bot.walk(25, 'the last door');
  if (r !== 'end') throw new Error(`last door: ${r}`);
  bot.say('drift grew and stopped; footprints stayed; second door won');
}
