// The bot must see a full turn of the die before it walks into it.
import { expect, it } from 'vitest';
import type { StarterBot } from '../../kit/starter/bot';
import { buildLevels, rolling } from '../src/levels';
import { FACE } from '../src/timing';
import { rollTheDice } from './route';

it.each([0, 1, 5, 6])('checks the pre-touch roll after %i transitions', async (transitions) => {
  const { book } = buildLevels().levels[0];
  const first = book.n(rolling(3));
  const sim = {
    ci: { score: 0 },
    w: { blkmap: { [book.n(rolling(1))]: first } },
    ticks: 0,
    async tick() {
      this.ticks++;
      const step = Math.min(transitions, Math.floor(this.ticks / FACE));
      this.w.blkmap[book.n(rolling(1))] = book.n(rolling(((2 + step) % 6) + 1));
    },
  };
  const bot = {
    sim,
    async wait(ticks: number) {
      for (let i = 0; i < ticks; i++) await sim.tick();
    },
    async walk(_col: number, label: string) {
      if (label === 'into the die') throw new Error('reached touch');
    },
  };
  await expect(rollTheDice(bot as unknown as StarterBot)).rejects.toThrow(transitions < 6 ? 'complete cycle' : 'reached touch');
});
