// Designer labels must not rename fixed engine meters or accept malformed companion data.
import { describe, expect, it } from 'vitest';
import { counterName, namedCounterOptions, readCounterNames, withCounterName } from '../src/editor/editors/character/counterNames';

describe('character counter names', () => {
  it('keeps repetition and tally names by their original native meter number', () => {
    const original = { 5: 'Charges', 20: 'Keys' };
    const next = withCounterName(original, 24, '  Puzzle pieces  ');
    expect(next).toEqual({ 5: 'Charges', 20: 'Keys', 24: 'Puzzle pieces' });
    expect(original).toEqual({ 5: 'Charges', 20: 'Keys' });
    expect(withCounterName(next, 20, ' ')).toEqual({ 5: 'Charges', 24: 'Puzzle pieces' });
    expect(counterName({ extras: <T>() => next as T }, 'hero.chr', 5)).toBe('Charges');
    expect(counterName({ extras: <T>() => next as T }, 'hero.chr', 6)).toBe('');
  });
  it('ignores malformed or reserved metadata and bounds imported label lengths', () => {
    expect(readCounterNames({ 0: 'Health', 4: 'Fixed', 5: '  Uses  ', 6: 12, 25: 'Unused', '05': 'Alias', 20: 'x'.repeat(90) })).toEqual({
      5: 'Uses',
      20: 'x'.repeat(80),
    });
    expect(readCounterNames(['Not a record'])).toEqual({});
    expect(readCounterNames(null)).toEqual({});
    for (const meter of [0, 4, 25, 5.5, NaN]) expect(() => withCounterName({}, meter, 'Bad')).toThrow(RangeError);
  });
  it('qualifies shared-block labels without changing any native option numbers', () => {
    const options: [number, string][] = [
      [1, 'Lives'],
      [5, 'Repetition count 1'],
      [20, 'Special counter 1'],
    ];
    expect(namedCounterOptions(options, [{ file: 'hero.chr', names: { 5: 'Charges', 20: 'Keys' } }])).toEqual([
      [1, 'Lives'],
      [5, 'Repetition count 1: Charges'],
      [20, 'Special counter 1: Keys'],
    ]);
    expect(
      namedCounterOptions(options, [
        { file: 'hero.chr', names: { 20: 'Keys' } },
        { file: 'other.chr', names: { 20: 'Levers' } },
      ])[2],
    ).toEqual([20, 'Special counter 1: Keys (HERO.CHR), Levers (OTHER.CHR)']);
    expect(namedCounterOptions(options, [])).toEqual(options);
  });
});
