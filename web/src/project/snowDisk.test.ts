// Built-disk acceptance, on the same headless PLAYGAME loop used by Starter walkthroughs.
import { existsSync } from 'node:fs';
import { expect, it } from 'vitest';
import { GameSim } from '../../../games/snow/tools/sim';
import { StarterBot } from '../../../games/kit/starter/bot';

it('builds a three-level snow game that the normal player can open', () => {
  expect(existsSync(new URL('../../../games/snow/disk/snow.gam', import.meta.url))).toBe(true);
  const sim = new GameSim();
  expect(sim.scene).toBe(2);
  expect(sim.game.scenes).toHaveLength(5);
  expect(new StarterBot(sim).px.y).toBe(180);
});
