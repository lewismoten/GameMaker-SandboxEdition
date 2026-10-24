import { describe, expect, it } from 'vitest';
import { fictionNote } from './fiction';
import { credits } from './winApp';
import { infoPlist } from './macApp';
import { readme } from './linuxApp';
import { exportAbout } from './pageSeo';

describe('the note on our own games', () => {
  it('says when one was made and the year it pretends to be from', () => {
    expect(fictionNote({ original: {}, year: 1996 })).toBe('Made in 2026 for Game-Maker: Sandbox Edition; presented as a fictional 1996 release.');
    expect(fictionNote({ original: {} })).toBe('Made in 2026 for Game-Maker: Sandbox Edition; presented as a fictional 1990s release.');
  });

  it('leaves the 1990s games by other authors and RSD’s samples alone', () => {
    expect(fictionNote({ year: 1993 })).toBeUndefined();
  });

  it('goes into the downloads’ About text, README and page', () => {
    const fiction = fictionNote({ original: {}, year: 1995 })!;
    expect(credits({ author: 'Sandbox Software', year: 1995, fiction })).toContain(fiction);
    expect(infoPlist({ title: 'T', id: 't', fiction })).toContain(fiction);
    expect(readme({ title: 'T', id: 't', fiction })).toContain(fiction);
    expect(exportAbout({ title: 'T', fiction })).toContain(fiction);
    expect(credits({ author: 'RSD', year: 1994 })).not.toContain('fictional');
  });
});
