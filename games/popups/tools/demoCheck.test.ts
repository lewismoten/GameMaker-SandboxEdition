// Replay a coin pickup that pays double and otherwise looks correct.
import { expect, it, vi } from 'vitest';
import { COIN, POP100 } from '../src/monsters';

vi.mock('node:fs', async (load) => ({
  ...(await load<typeof import('node:fs')>()),
  readFileSync: () => new Uint8Array(),
}));
vi.mock('@lewismoten/gamemaker-sandbox-engine/formats/recording', () => ({
  parseRecording: () => [{ delta: 1, key: 77 }, {}, {}],
}));
vi.mock('./sim', () => ({
  GameSim: class {
    ci = { score: 20 };
    w = { mm: [COIN, COIN, COIN].map((monnum) => ({ monnum })) };
    press() {}
    tick() {
      this.w.mm = [{ monnum: COIN }, { monnum: COIN }];
      if (this.ci.score === 20) {
        this.ci.score += 200;
        this.w.mm.push({ monnum: POP100 });
      }
    }
  },
}));

it('rejects a demo coin that pays 200', async () => {
  const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('demo rejected');
  });
  try {
    await expect(import('./demoCheck')).rejects.toThrow('demo rejected');
  } finally {
    exit.mockRestore();
  }
});
