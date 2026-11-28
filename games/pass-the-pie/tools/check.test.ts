// The walkthrough budget counts every bump, even when cider restores health afterward.
import { doBlockTouchChar } from '@lewismoten/gamemaker-sandbox-engine/engine/touch';
import { expect, it, vi } from 'vitest';
import { CIDER_HP } from '../src/levels/common';
import { play } from './play';
import { GameSim } from './sim';

vi.mock('./play', () => ({ play: vi.fn() }));

it('rejects 70 damage followed by 15 points of cider in the same tick', async () => {
  // The sim as play() makes it before its first level (play() itself needs at least one level).
  const { SEED } = await vi.importActual<typeof import('./play')>('./play');
  const sim = new GameSim(undefined, SEED);
  sim.ci.damageTaken = 0;
  const block = sim.w.bg[0];
  for (const chHitPt of [-35, -35, CIDER_HP]) doBlockTouchChar(sim.w, { ...block, chHitPt, effect: 0 });
  expect(sim.ci.hitpts).toBe(45);
  vi.mocked(play).mockResolvedValue({ sim, bot: undefined as never });
  await expect(import('./check')).rejects.toThrow('lost 70 hit points');
});
