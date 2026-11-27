// A stationary camera can hide the hero moving through the left hedge.
import { expect, it, vi } from 'vitest';
import { StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { oneScreen } from './route';

it('rejects movement through the hedge while leaning on it', async () => {
  const sim = {
    ci: { score: 0 },
    pos: { x: ORIGIN + 1, y: ORIGIN, sx: 0, sy: 0 },
    w: { mx: ORIGIN, my: ORIGIN, scroll: { nx: 0, ny: 0 } },
    press: vi.fn(),
    release: vi.fn(),
  };
  const bot = new StarterBot(sim as unknown as StarterBot['sim']);
  vi.spyOn(bot, 'walk').mockResolvedValue(undefined);
  vi.spyOn(bot, 'wait').mockImplementation(async () => {
    sim.pos.x = ORIGIN;
    return undefined;
  });
  await expect(oneScreen(bot)).rejects.toThrow(/walked through the hedge/);
});
