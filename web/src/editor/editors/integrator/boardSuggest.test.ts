import { describe, expect, it } from 'vitest';
import { stemOf } from './boardSuggest';

describe('stemOf', () => {
  it('drops trailing numbers and question tags', () => {
    expect(stemOf('lila 1')).toBe('lila');
    expect(stemOf('Lila 2 q3')).toBe('lila');
  });
  it('uses the part before a colon', () => {
    expect(stemOf('Board: stub')).toBe('board');
    expect(stemOf('Wrong: lila')).toBe('wrong');
  });
  it('keeps a name that is only a number', () => {
    expect(stemOf('7')).toBe('7');
  });
});
