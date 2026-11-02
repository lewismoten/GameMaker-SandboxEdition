// The About tab's DOS / web switch: what the preview draws in each view.
import { describe, expect, it } from 'vitest';
import { aboutLookOf } from './aboutFields';

const origin = { build: '2.02', label: 'Game-Maker 2.02', regions: [], importPatches: {}, about: undefined } as never;

describe('aboutLookOf', () => {
  it('shows XFERPLAY’s own words as in DOS, its order line without the phone number', () => {
    const pages = aboutLookOf('dos', undefined)!.pages!;
    expect(pages.map((p) => p.length)).toEqual([14, 7]);
    expect(pages[0][1]).toEqual([48, '          Version 3.00   ']);
    expect(pages.flat().some(([, t]) => /\d{3}-\d{4}/.test(t))).toBe(false);
  });

  it('shows this edition’s words on the web, with the build the game was first made with', () => {
    expect(aboutLookOf('web', undefined)).toBeUndefined();
    expect(aboutLookOf('web', origin)).toEqual({ origin: ['Originally made with', 'Game-Maker 2.02.'] });
  });
});
