// File names a game asks for, opened as DOS opened them: each part cut to 8.3 (MS-DOS drops the
// extra letters when it opens a file).
import { describe, expect, it } from 'vitest';
import { parseGame } from '../formats/game';
import { GameFiles, normalize } from './files';

/** A pre-3.0 .gam (OLDintegratorstruct, 330 bytes a scene) whose level names these files, without extensions. */
function oldGam(names: string[]): Uint8Array {
  const out = new Uint8Array(3 * 330);
  const dv = new DataView(out.buffer);
  dv.setUint16(0, 1, true); // start
  dv.setUint16(330, 2, true); // end
  const s = 2 * 330;
  dv.setUint16(s, 10, true); // a level
  out.set(new TextEncoder().encode('Level'), s + 6);
  names.forEach((n, i) => out.set(new TextEncoder().encode(n), s + 21 + i * 10));
  return out;
}

describe('DOS file names', () => {
  it('cuts each part of a name to 8.3', () => {
    expect(normalize('gmhoedown.cmf')).toBe('gmhoedow.cmf');
    expect(normalize('MECHWORLD.MAP')).toBe('mechworl.map');
    expect(normalize('nejillian.gif')).toBe('nejillia.gif');
    expect(normalize('a.long')).toBe('a.lon');
  });

  it('opens the files a pre-3.0 game names past 8.3 (Blinky 2, Mech)', () => {
    const game = parseGame(oldGam(['mechpal', 'mechworld', '', '', '', '', '', '', 'gmhoedown']));
    const level = game.scenes[2].files;
    expect(level[1]).toBe('mechworld.map');
    expect(level[8]).toBe('gmhoedown.cmf');
    const files = new GameFiles([
      ['MECHWORL.MAP', new Uint8Array([1])],
      ['GMHOEDOW.CMF', new Uint8Array([2])],
    ]);
    expect(files.resolve(level[1])).toBe('mechworl.map');
    expect(files.get(level[8])).toEqual(new Uint8Array([2]));
  });
});
