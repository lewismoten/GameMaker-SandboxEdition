import { describe, expect, it } from 'vitest';
import { actionLabel, keyNames, nameFits } from './actionLabels';

describe('keyNames', () => {
  it('reads short names by scan code and skips what is unusable', () => {
    const m = keyNames({ keys: { '34': { short: ' Pick   up ', long: 'x' }, '57': { short: '' }, '28': 5, abc: { short: 'No' } } });
    expect([...m]).toEqual([[34, 'Pick up']]);
  });
  it('is empty for nothing', () => {
    expect(keyNames(undefined).size).toBe(0);
    expect(keyNames({ keys: 3 }).size).toBe(0);
  });
});

describe('nameFits', () => {
  it('allows short names and refuses long ones or long words', () => {
    expect(nameFits('Throw a star')).toBe(true);
    expect(nameFits('Pick up')).toBe(true);
    expect(nameFits('Throw a star far')).toBe(false);
    expect(nameFits('Extinguish')).toBe(false);
  });
});

describe('actionLabel', () => {
  it('shows the name with the key small, and the aria-label is exactly that text', () => {
    expect(actionLabel('Enter', 'Enter', 'Throw a star')).toEqual({
      main: 'Throw a star',
      key: 'Enter',
      aria: 'Throw a star (Enter)',
      plainAria: 'Enter, Throw a star',
    });
  });
  it('falls back to the key without an entry', () => {
    expect(actionLabel('G', 'G', undefined)).toEqual({ main: 'G', aria: 'G', plainAria: 'G' });
  });
  it('falls back to the key when the name is too long: key first, then the name', () => {
    expect(actionLabel('G', 'G', 'Throw a star at the boss')).toEqual({
      main: 'G',
      aria: 'G, Throw a star at the boss',
      plainAria: 'G, Throw a star at the boss',
    });
  });
  it('does not repeat a name that is the key', () => {
    expect(actionLabel('Space', 'Space', 'space')).toEqual({ main: 'space', aria: 'space', plainAria: 'Space, space' });
  });
});
