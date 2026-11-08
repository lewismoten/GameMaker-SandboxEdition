import { describe, expect, it } from 'vitest';
import { GameFiles } from './files';
import { aboutOf, setAbout } from './aboutGame';
import { emptyCompanion } from './companion';
import { takeFileIdDiz } from './importDiz';

const diz = new TextEncoder().encode('Moon Jump v2.0\r\nby Pat Q, 1993\r\nHop between moons.\r\n');

describe('an imported FILE_ID.DIZ', () => {
  it('fills the About fields and the version, and leaves the game files', () => {
    const files = new GameFiles([
      ['moon.gam', Uint8Array.of(1)],
      ['FILE_ID.DIZ', diz],
    ]);
    const c = takeFileIdDiz(files)!;
    expect(files.names()).toEqual(['moon.gam']);
    expect(aboutOf(c)).toMatchObject({ title: 'Moon Jump', author: 'Pat Q', year: '1993', description: 'Hop between moons.' });
    expect(c.gameVersion).toBe('2.0');
  });

  it('keeps what the author already wrote', () => {
    const files = new GameFiles([['file_id.diz', diz]]);
    const c = emptyCompanion();
    setAbout(c, { title: 'Mine' });
    c.gameVersion = '1.0';
    const got = takeFileIdDiz(files, c)!;
    expect(aboutOf(got).title).toBe('Mine');
    expect(aboutOf(got).author).toBe('Pat Q');
    expect(got.gameVersion).toBe('1.0');
  });

  it('does nothing without one', () => {
    const files = new GameFiles([['moon.gam', Uint8Array.of(1)]]);
    expect(takeFileIdDiz(files)).toBeUndefined();
  });
});
