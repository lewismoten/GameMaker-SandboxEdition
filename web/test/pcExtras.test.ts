import { describe, expect, it } from 'vitest';
import { PcExtras, type PcExtrasState } from '../src/retro/hacks/pcExtras';
import { DEFAULT_REG } from '../src/retro/gmReg/registration';

const memory = (start?: PcExtrasState) => {
  let v = start;
  return { load: async () => v, save: async (s: PcExtrasState) => void (v = s), get: () => v };
};

describe('PcExtras', () => {
  it('comes registered, and keeps a deleted PLAYGAME.REG deleted', async () => {
    const store = memory();
    const x = new PcExtras(store);
    await x.ready;
    expect(x.reg).toBe(DEFAULT_REG);
    x.setReg(null);
    await x.saved();
    const again = new PcExtras(store);
    await again.ready;
    expect(again.reg).toBeNull();
  });

  it('merges what was stored with changes made before it loaded', async () => {
    const store = memory({ cracked: [['teddy', 5]], question: 3 });
    const x = new PcExtras(store, () => 9);
    x.setCracked('pac', true);
    await x.saved();
    expect(x.cracked('teddy')).toBe(5);
    expect(x.cracked('pac')).toBe(9);
    expect(store.get()?.question).toBe(3);
    x.setCracked('teddy', false);
    expect(x.cracked('teddy')).toBeUndefined();
  });
});
