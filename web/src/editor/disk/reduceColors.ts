// Color reduction proposals (not part of the automatic steps: they change how a game looks). The
// project's palette reservations (editors/palette/paletteReservations.ts) say which colors each kind
// of block may use: backgrounds their range, monsters theirs, characters theirs, plus the colors
// nobody reserved. A block file that draws with another kind's reserved colors is a proposal: its
// pixels would move to the nearest allowed color, with a difference score and the blocks before and
// after to look at. Applying one makes a checkpoint first, like every change here.
import { BACKBL, CHARBL, MONBL, parseBlocks, serializeBlocks, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { LASTSL, parseMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { reduceBlocks, type ReduceScore } from '@lewismoten/gamemaker-sandbox-tools/color-reduce';
import type { GameFiles } from '../../project/files';
import { reservationAt, type PaletteReservation, type PaletteRole } from '../editors/palette/paletteReservations';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { drawn } from './blockUse';
import { framePictures } from './mergeCharacterBlocks';
import { shownPalettes } from './palettes';
import { commit, readFor, type Writes } from './commit';
import { filesIn, readGame, sceneUses, usersOf, type SceneUse } from './refs';

export interface Reduction {
  file: string;
  role: PaletteRole;
  title: string;
  score: ReduceScore;
  /** The changed blocks, worst first, with the palette to draw them in. */
  shown: { n: number; before: Uint8Array; after: Uint8Array }[];
  changedBlocks: number;
  palette: Uint8Array;
  touches: string[];
  apply(files: GameFiles, gam: string): void;
}

const ROLE = { bbl: 'background', mbl: 'monster', cbl: 'character' } as const;
const SIZE = { bbl: BACKBL, mbl: MONBL, cbl: CHARBL } as const;

/** The block numbers of a file that scenes actually show. */
function shownBlocks(files: GameFiles, uses: SceneUse[], slot: 'bbl' | 'mbl' | 'cbl', file: string, blocks: Block[]): Set<number> {
  const users = usersOf(uses, slot, file);
  if (slot === 'bbl') return drawn(files, uses, file, blocks);
  const out = new Set<number>();
  if (slot === 'cbl') for (const c of filesIn(users, 'chr')) framePictures(files.get(c)!).forEach((n) => out.add(n));
  else
    for (const mon of filesIn(users, 'mon'))
      for (const m of parseMonsters(files.get(mon)!)) for (let s = 0; s <= LASTSL && m.pic[s][0] < MONBL; s++) out.add(m.pic[s][0]);
  return out;
}

export function reductions(files: GameFiles, gam: string, ranges: readonly PaletteReservation[]): Reduction[] {
  if (!ranges.length) return [];
  const uses = sceneUses(files, parseGame(files.get(gam)!));
  const out: Reduction[] = [];
  for (const slot of ['bbl', 'mbl', 'cbl'] as const) {
    const role = ROLE[slot];
    const allowed = new Set<number>();
    for (let i = 1; i < 255; i++) {
      const r = reservationAt(ranges, i);
      if (r === undefined || r === role) allowed.add(i);
    }
    for (const file of filesIn(uses, slot)) {
      const palettes = shownPalettes(files, usersOf(uses, slot, file));
      if (!palettes?.length) continue;
      const blocks = parseBlocks(files.get(file)!.subarray(0, SIZE[slot] * 420), SIZE[slot]);
      const r = reduceBlocks(blocks, shownBlocks(files, uses, slot, file, blocks), palettes, allowed);
      if (!r.changed.size) continue;
      const before: Writes['before'] = new Map();
      const bytes = readFor(files, before, file);
      const next = blocks.map((b, i) => (r.changed.has(i) ? { ...b, pixels: r.changed.get(i)! } : b));
      const writes: Writes = {
        files: new Map([[file, Uint8Array.from([...serializeBlocks(next), ...bytes.subarray(SIZE[slot] * 420)])]]),
        before,
        game: readGame(files, gam),
      };
      const flagged = new Set(r.score.flagged);
      const nums = [...r.changed.keys()].sort((a, b) => Number(flagged.has(b)) - Number(flagged.has(a)) || a - b);
      out.push({
        file,
        role,
        title: `${file}: ${r.changed.size} ${role} block${r.changed.size === 1 ? '' : 's'} use colors reserved for something else`,
        score: r.score,
        shown: nums.slice(0, 6).map((n) => ({ n, before: blocks[n].pixels, after: r.changed.get(n)! })),
        changedBlocks: r.changed.size,
        palette: palettes[0],
        touches: [file, gam],
        apply: (f, g) => commit(f, g, writes),
      });
    }
  }
  return out;
}

/** Sprite files whose reserved colors are not the same in every palette their scenes show: the monster or character changes color between scenes. Reported only (copying the range over would recolor those scenes). */
export function rangeDrift(files: GameFiles, gam: string, ranges: readonly PaletteReservation[]): { file: string; role: PaletteRole; palettes: number }[] {
  const uses = sceneUses(files, parseGame(files.get(gam)!));
  const out: { file: string; role: PaletteRole; palettes: number }[] = [];
  for (const slot of ['mbl', 'cbl'] as const) {
    const role = ROLE[slot];
    for (const file of filesIn(uses, slot)) {
      const pals = shownPalettes(files, usersOf(uses, slot, file));
      if (!pals || pals.length < 2) continue;
      const drift = ranges.some(
        (r) => r.role === role && pals.some((p) => p.subarray(r.first * 3, (r.last + 1) * 3).some((v, i) => v !== pals[0][r.first * 3 + i])),
      );
      if (drift) out.push({ file, role, palettes: pals.length });
    }
  }
  return out;
}
