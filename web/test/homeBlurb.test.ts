// Tests: the home page's game descriptions (editor/shell/homeBlurb.ts).
import { describe, expect, it } from 'vitest';
import { readableBlurb } from '../src/editor/shell/homeBlurb';

describe('readableBlurb', () => {
  it('drops an ALL-CAPS heading and ends on a whole sentence', () => {
    expect(
      readableBlurb(
        'nebula',
        'PLANETARY COALITION For many years your solar system has lived in harmony, with each planet minding its own orbit, and not disturbing the others. You thought that your life as a solar flare would be peaceful, and…',
      ),
    ).toBe('For many years your solar system has lived in harmony, with each planet minding its own orbit, and not disturbing the others.');
    expect(readableBlurb('volume', 'CHAPTER I After getting through the daily hell called high school, Marty headed home. He sat…')).toBe(
      'After getting through the daily hell called high school, Marty headed home.',
    );
    expect(readableBlurb('parsec3d', 'PARSEC MAN 3D Somewhere in the system of XON there is a crystal.')).toBe('Somewhere in the system of XON there is a crystal.');
  });

  it('leaves ordinary text alone', () => {
    const t = 'GLITCH, a virus off a bad BBS download, is eating the family 486. Shrink down.';
    expect(readableBlurb('blaster', t)).toBe(t);
    expect(readableBlurb('x', 'A thunderstorm has scrambled the house.')).toBe('A thunderstorm has scrambled the house.');
  });

  it('uses a written description where the screen is a key chart or an address', () => {
    expect(readableBlurb('zark', 'NUMERICAL KEYPAD Up | |~~~|~~~|')).toMatch(/Alpha Centauri/);
    expect(readableBlurb('other', 'NUMERICAL KEYPAD Up | |~~~|~~~|~~~| Left')).toBeUndefined();
    expect(readableBlurb('other', undefined)).toBeUndefined();
  });
});

describe('readableBlurb length', () => {
  it('keeps the sentences that fit, or the first one', () => {
    const one = 'A thunderstorm has scrambled the Bitmores’ Smart Home, and Watt, a pocket-sized repair robot, must roll through twenty haywire circuit boards to get home.';
    expect(readableBlurb('logic', `${one} Flip switches, blow fuses, throw relays and route live current to shut down the force fields, without touching a live wire.`)).toBe(one);
    expect(readableBlurb('x', 'Short one. Short two.')).toBe('Short one. Short two.');
  });
});
