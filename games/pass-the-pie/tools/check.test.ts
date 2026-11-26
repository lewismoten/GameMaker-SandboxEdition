// The walkthrough budget counts every bump, even when cider restores health afterward.
import { doBlockTouchChar } from '@lewismoten/gamemaker-sandbox-engine/engine/touch';
import { expect, it, vi } from 'vitest';
import { CIDER_HP } from '../src/levels/common';
import { play } from './play';

vi.mock('./play', () => ({ play: vi.fn() }));

it('rejects 70 damage followed by 15 points of cider in the same tick', async () => {
  const actual = await vi.importActual<typeof import('./play')>('./play');
  const run = await actual.play(undefined, 0);
  const { sim } = run;
  const block = sim.w.bg[0];
  for (const chHitPt of [-35, -35, CIDER_HP]) doBlockTouchChar(sim.w, { ...block, chHitPt, effect: 0 });
  expect(sim.ci.hitpts).toBe(45);
  vi.mocked(play).mockResolvedValue(run);
  await expect(import('./check')).rejects.toThrow('lost 70 hit points');
});
