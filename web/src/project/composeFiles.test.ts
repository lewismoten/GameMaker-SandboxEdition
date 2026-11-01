import { describe, expect, it } from 'vitest';
import { GameFiles } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';
import { decodeGif, encodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { composeFiles, stampsVersion } from './composeFiles';
import { emptyCompanion, menuVersionOf, setMenuVersion } from './companion';

function project(): GameFiles {
  const game = newGame('Test');
  game.scenes[0].files[2] = 'title.gif';
  const palette = new Uint8Array(768);
  palette.set([63, 63, 63], 3); // index 1 is light, index 0 dark
  const pixels = new Uint8Array(320 * 200);
  pixels[0] = 1; // the picture uses a light and a dark color
  const files = new GameFiles();
  files.set('test.gam', serializeGame(game));
  files.set('title.gif', encodeGif({ width: 320, height: 200, pixels, palette }));
  return files;
}

describe('composeFiles', () => {
  it('hands back the same files when the toggle is off, with or without a version', () => {
    const files = project();
    expect(composeFiles(files, undefined)).toBe(files);
    const c = emptyCompanion();
    setMenuVersion(c, '1.0', false);
    expect(composeFiles(files, c)).toBe(files);
    setMenuVersion(c, '', true);
    expect(stampsVersion(c)).toBe(false);
    expect(composeFiles(files, c)).toBe(files);
  });

  it('letters the version on a copy and leaves the saved files alone', () => {
    const files = project();
    const before = files.entries().map(([n, b]) => [n, b.slice()]);
    const c = emptyCompanion();
    setMenuVersion(c, '1.0', true);
    const out = composeFiles(files, c);
    expect(out).not.toBe(files);
    expect(files.entries().map(([n, b]) => [n, b.slice()])).toEqual(before);
    expect(out.get('test.gam')).toEqual(files.get('test.gam'));
    expect(out.get('title.gif')).not.toEqual(files.get('title.gif'));
    expect(decodeGif(out.get('title.gif')!).pixels).not.toEqual(decodeGif(files.get('title.gif')!).pixels);
  });

  it('is deterministic', () => {
    const c = emptyCompanion();
    setMenuVersion(c, '2.1', true);
    expect(composeFiles(project(), c).get('title.gif')).toEqual(composeFiles(project(), c).get('title.gif'));
  });

  it('plays a game with no menu picture as it is', () => {
    const files = new GameFiles();
    files.set('test.gam', serializeGame(newGame('Test')));
    const c = emptyCompanion();
    setMenuVersion(c, '1.0', true);
    expect(composeFiles(files, c).get('test.gam')).toEqual(files.get('test.gam'));
  });

  it('reads and clears the companion fields, ignoring unreadable versions', () => {
    const c = emptyCompanion();
    setMenuVersion(c, ' 1.2 ', true);
    expect(menuVersionOf(c)).toEqual({ version: '1.2', show: true });
    setMenuVersion(c, '', false);
    expect(Object.keys(c).sort()).toEqual(['files', 'format', 'version']);
    c.gameVersion = 'way too long a version';
    expect(menuVersionOf(c).version).toBe('');
  });
});
