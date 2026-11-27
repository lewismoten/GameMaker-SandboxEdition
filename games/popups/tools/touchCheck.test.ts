// Sample a popup that can disappear before the final walk finishes.
import { expect, it, vi } from 'vitest';
import { POP100, STUCKPOP } from '../src/monsters';

const state = vi.hoisted(() => ({ visible: false, showPopup: false }));
vi.mock('./play', () => ({
  play: () => ({
    sim: { ci: { score: 0, hitpts: 1, meter: [0, 1] } },
    bot: {
      px: { x: 580 },
      tick: vi.fn(),
      wait: vi.fn(),
      async walk(x: number) {
        if (x === 34) {
          state.visible = state.showPopup;
          await this.tick();
          state.visible = false;
          await this.tick();
        }
      },
    },
  }),
}));
vi.mock('./route', () => ({ alive: (_bot: unknown, n: number) => Number(n === STUCKPOP || (n === POP100 && state.visible)) }));

it.each([false, true])('checks whether a final number appeared during the walk (appeared: %s)', async (showPopup) => {
  vi.resetModules();
  state.showPopup = showPopup;
  const check = import('./touchCheck');
  if (showPopup) await expect(check).resolves.toBeDefined();
  else await expect(check).rejects.toThrow('the last number did not appear');
});
