// Designer labels must not rename fixed engine meters or accept malformed companion data.
import { describe, expect, it } from 'vitest';
import { namedCounterOptions, readCounterNames } from '../src/editor/editors/character/counterNames';

describe('counter names', () => {
  it('ignores malformed or reserved metadata and bounds imported label lengths', () => {
    expect(readCounterNames({ 0: 'Health', 4: 'Fixed', 5: '  Uses  ', 6: 12, 25: 'Unused', '05': 'Alias', 20: 'x'.repeat(90) })).toEqual({
      5: 'Uses',
      20: 'x'.repeat(80),
    });
    expect(readCounterNames(['Not a record'])).toEqual({});
    expect(readCounterNames(null)).toEqual({});
  });
  it('adds the game-wide name to block effect labels without changing any native option numbers', () => {
    const options: [number, string][] = [
      [1, 'Lives'],
      [5, 'Repetition count 1'],
      [20, 'Special counter 1'],
    ];
    expect(namedCounterOptions(options, { 5: 'Charges', 20: 'Keys' })).toEqual([
      [1, 'Lives'],
      [5, 'Repetition count 1: Charges'],
      [20, 'Special counter 1: Keys'],
    ]);
    expect(namedCounterOptions(options, {})).toEqual(options);
  });
});
