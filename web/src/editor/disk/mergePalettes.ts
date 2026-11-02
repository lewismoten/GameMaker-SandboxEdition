// Two palette files that draw the same: the scenes that open the second open the first, and the
// second goes. Either they have exactly the same 256 colors, or they agree on every color number any
// block their scenes show draws with (they differ only where nothing is drawn, such as a reserved
// range the sprites moved out of). Nothing else names a palette file but the scenes; a palette a slide
// or animation scene opens is never touched.
import type { GameFiles } from '../../project/files';
import { commit, readFor, type Writes } from './commit';
import { filesIn, readGame, repoint, usersOf, type SceneUse } from './refs';
import { colorsOf, type Colors } from './spriteColors';
import type { Step } from './types';

/** Color numbers a palette must keep: 0-15 (the engine's own interface colors; an inference from PLAYGAME's Box calls), 255, and whatever the blocks its scenes show draw with. */
function needed(c: Colors, pal: string): Set<number> {
  const out = new Set<number>([255, ...Array.from({ length: 16 }, (_, i) => i)]);
  const at = c.drawnWith.get(pal);
  if (at) for (const k of ['bbl', 'mbl', 'cbl'] as const) at[k].forEach((v) => out.add(v));
  return out;
}

function pairOf(files: GameFiles, pals: string[], c: Colors | undefined): [string, string, boolean] | undefined {
  for (let a = 0; a < pals.length; a++)
    for (let b = a + 1; b < pals.length; b++) {
      const [px, py] = [files.get(pals[a])!, files.get(pals[b])!];
      if (px.length !== py.length) continue;
      if (px.every((v, i) => v === py[i])) return [pals[a], pals[b], true];
      if (!c || c.locked.has(pals[a]) || c.locked.has(pals[b])) continue;
      const use = [...new Set([...needed(c, pals[a]), ...needed(c, pals[b])])];
      if (use.every((i) => px[i * 3] === py[i * 3] && px[i * 3 + 1] === py[i * 3 + 1] && px[i * 3 + 2] === py[i * 3 + 2])) return [pals[a], pals[b], false];
    }
  return undefined;
}

/** The first pair of palettes in use that draw the same, or undefined. */
export function planPalettes(files: GameFiles, gam: string, uses: SceneUse[]): Step | undefined {
  const pals = filesIn(uses, 'pal');
  // identical pairs first (cheap); the "differ only where nothing is drawn" search reads every block
  const hit = pairOf(files, pals, undefined) ?? pairOf(files, pals, colorsOf(files, gam));
  if (!hit) return undefined;
  const [keep, drop, exact] = hit;
  const before: Writes['before'] = new Map();
  readFor(files, before, keep);
  const y = readFor(files, before, drop);
  const writes: Writes = { files: new Map([[drop, null]]), before, game: readGame(files, gam) };
  repoint(writes.game, files, 'pal', drop, keep);
  const n = usersOf(uses, 'pal', drop).length;
  return {
    kind: 'pal',
    keep,
    drop,
    saves: y.length,
    title: `Merge palette ${drop} into ${keep}`,
    changes: [
      exact ? `${drop} has exactly the colors of ${keep}` : `${drop} and ${keep} differ only in colors no block draws with`,
      `${n} scene${n === 1 ? '' : 's'} open ${keep} instead of ${drop}`,
    ],
    touches: [...writes.files.keys(), gam],
    apply: (f, g) => commit(f, g, writes),
  };
}
