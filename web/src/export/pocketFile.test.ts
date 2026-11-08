// The one-file game (.GMP) can carry the game's DOS files for Game-Maker OS beside the Pocket Player's entries.
import { describe, expect, it } from 'vitest';
import { readBundle, writeGmp } from './pocketFile';

const parts = { id: 'dice', title: 'Dice', levels: 1, cfg: ['L 0'], files: new Map([['abc1234.b', new Uint8Array([1, 2])]]), cards: [] };

describe('writeGmp', () => {
  it('stores DOS files as dos/<NAME> entries, upper case, sorted with the rest', () => {
    const gmp = writeGmp({
      ...parts,
      dos: new Map([
        ['dice.gam', new Uint8Array([9])],
        ['DICE.PAL', new Uint8Array([7, 7])],
      ]),
    });
    const names = [...readBundle(gmp).keys()];
    expect(names).toEqual([...names].sort());
    expect(names).toContain('dos/DICE.GAM');
    expect([...readBundle(gmp).get('dos/DICE.PAL')!.bytes]).toEqual([7, 7]);
  });
  it('leaves the Pocket Player entries as they were', () => {
    const without = readBundle(writeGmp(parts));
    const withDos = readBundle(writeGmp({ ...parts, dos: new Map([['DICE.GAM', new Uint8Array([9])]]) }));
    for (const [name, e] of without) expect([...withDos.get(name)!.bytes]).toEqual([...e.bytes]);
  });
});
