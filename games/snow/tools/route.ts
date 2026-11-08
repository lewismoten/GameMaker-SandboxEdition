// Human-paced routes: pause under the snow, make a gap with a hop, then fill it by walking back.
import type { StarterBot, Result } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { LASTMON } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { buildLevels } from '../src/levels';
import { FACINGS, PRINT_LIFE } from '../src/prints';

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
  await must(bot.walk(15), 'fresh powder');
  await must(bot.jump('right', 19), 'hop over powder');
  if (bot.sim.w.map[at(17, 9)] !== book.n('powder')) throw new Error('jumping should leave fresh powder at column 17');
  await must(bot.walk(22), 'past the gap');
  await must(bot.wait(28), 'look behind');
  await must(bot.walk(15), 'fill the gap');
  if (bot.sim.w.map[at(17, 9)] !== book.n('footprints')) throw new Error('walking back did not stamp the gap');
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
  if (r !== 'link') throw new Error(`second door: ${r}`);
  bot.say('drift grew and stopped; footprints stayed; second door linked to the open field');
}

/** Which prints are in the snow now: monster numbers (facing * 2 + foot), one entry per print. */
export const printsNow = (bot: StarterBot): number[] => (bot.sim.w.mm as { monnum: number }[]).filter((m) => m.monnum !== LASTMON).map((m) => m.monnum);

/** Level 3: walk to the snowman, circle him so the prints make a loop, then on to the gate. */
export async function openSnow(bot: StarterBot): Promise<void> {
  const seen = new Set<string>();
  const note = () => {
    for (const n of printsNow(bot)) seen.add(FACINGS[n >> 1]);
  };
  const leg = async (go: Promise<Result>, what: string) => {
    await must(go, what);
    note();
    await must(bot.wait(3), 'a beat');
  };
  await must(bot.wait(40), 'read the first sign');
  await leg(bot.walk(12, 'right along the trail'), 'right');
  await must(bot.wait(10), 'see the snowman and read his sign');
  // once round the snowman: up, right, down, then left back to where the loop began
  await leg(bot.climb('up', 5, 'up beside him'), 'up');
  await leg(bot.walk(14, 'across the top'), 'right');
  await leg(bot.climb('down', 8, 'down the far side'), 'down');
  await leg(bot.walk(12, 'back along the bottom'), 'left');
  const loop = printsNow(bot).length;
  if (loop < 8) throw new Error(`the loop of prints should still show around the snowman, got ${loop}`);
  await must(bot.wait(12), 'admire the loop');
  await leg(bot.climb('down', 12, 'down to the lower trail'), 'down');
  await leg(bot.walk(24, 'right along the bottom'), 'right again');
  await leg(bot.climb('up', 8, 'up to the gate row'), 'up');
  if (seen.size !== 4) throw new Error(`prints should face all four ways; saw ${[...seen].join(', ')}`);
  await must(bot.wait(PRINT_LIFE + 10), 'watch the last prints fade');
  if (printsNow(bot).length) throw new Error('the prints should all have faded to smooth snow');
  const r = await bot.walk(25, 'the gate');
  if (r !== 'end') throw new Error(`gate: ${r}`);
  bot.say(`prints made a loop round the snowman, faced ${[...seen].join(', ')} and faded away; the gate won`);
}
