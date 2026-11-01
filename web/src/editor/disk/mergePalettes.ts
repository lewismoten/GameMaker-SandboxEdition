// Two palette files with exactly the same 256 colors: the scenes that open the second open the
// first, and the second goes. Always safe; nothing else names a palette file but the scenes.
import type { GameFiles } from '../../project/files';
import { commit, readFor, type Writes } from './commit';
import { filesIn, readGame, repoint, usersOf, type SceneUse } from './refs';
import type { Step } from './types';

/** The first pair of identical palettes in use, or undefined. */
export function planPalettes(files: GameFiles, gam: string, uses: SceneUse[]): Step | undefined {
  const pals = filesIn(uses, 'pal');
  for (let a = 0; a < pals.length; a++)
    for (let b = a + 1; b < pals.length; b++) {
      const before: Writes['before'] = new Map();
      const x = readFor(files, before, pals[a]);
      const y = readFor(files, before, pals[b]);
      if (x.length !== y.length || !x.every((v, i) => v === y[i])) continue;
      const writes: Writes = { files: new Map([[pals[b], null]]), before, game: readGame(files, gam) };
      repoint(writes.game, files, 'pal', pals[b], pals[a]);
      const n = usersOf(uses, 'pal', pals[b]).length;
      return {
        kind: 'pal',
        keep: pals[a],
        drop: pals[b],
        saves: y.length,
        title: `Merge palette ${pals[b]} into ${pals[a]}`,
        changes: [`${pals[b]} has exactly the colors of ${pals[a]}`, `${n} scene${n === 1 ? '' : 's'} open ${pals[a]} instead of ${pals[b]}`],
        apply: (f, g) => commit(f, g, writes),
      };
    }
  return undefined;
}
