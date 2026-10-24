// Monster names in the companion: an array by monster number, blanks trimmed away.
import { describe, expect, it } from 'vitest';
import { MONSTER_NAMES, monsterName, withName } from './monsterNames';

describe('monster names', () => {
  it('sets a name by monster number, padding with blanks and dropping trailing ones', () => {
    expect(withName(undefined, 2, ' Scorpion ')).toEqual(['', '', 'Scorpion']);
    expect(withName(['Camel', '', 'Scorpion'], 2, '')).toEqual(['Camel']);
    expect(withName(['Camel'], 0, '')).toBeUndefined();
    expect(withName('junk', 1, 'Bat')).toEqual(['', 'Bat']);
  });

  it('reads a name, or an empty string', () => {
    const src = {
      extras: <T>(file: string, section: string, fallback: T): T => (file === 'a.mon' && section === MONSTER_NAMES ? (['', ' Bat '] as T) : fallback),
    };
    expect(monsterName(src, 'a.mon', 1)).toBe('Bat');
    expect(monsterName(src, 'a.mon', 0)).toBe('');
    expect(monsterName(src, 'b.mon', 1)).toBe('');
    expect(monsterName({}, 'a.mon', 1)).toBe('');
  });
});
