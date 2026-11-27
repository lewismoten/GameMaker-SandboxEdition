// A score-producing puddle must still show its splash pictures on the built disk.
import { expect, it } from 'vitest';
import { StarterBot } from '../../kit/starter/bot';
import { buildLevels } from '../src/levels';
import { falling, puddles } from './route';
import { GameSim } from './sim';

it('rejects plain rain painted over the splash frames', async () => {
  const sim = new GameSim();
  const bot = new StarterBot(sim);
  await falling(bot);
  const { book } = buildLevels().levels[1];
  for (let i = 0; i < 6; i++) sim.w.bg[book.n(`step.${i}`)].pixels.set(sim.w.bg[book.n('rain.0')].pixels);
  await expect(puddles(bot)).rejects.toThrow(/first puddle.*splash frames/);
});

it('rejects a cell that still shows the last splash picture after the walker leaves', async () => {
  const sim = new GameSim();
  const bot = new StarterBot(sim);
  await falling(bot);
  const last = buildLevels().levels[1].book.n('step.5');
  sim.w.bg[last].touchBl = last;
  await expect(puddles(bot)).rejects.toThrow(/first puddle column 9: rain did not return after departure/);
});
