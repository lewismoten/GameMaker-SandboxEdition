// Two monster block sets (.mbl, 100 blocks each) that look the same under the palettes their
// scenes show and whose drawn blocks fit in one file: the dropped file's blocks move into the
// kept file's blank slots (a twin already there is reused), every monster that used them points
// at the new slots, and the dropped file's scenes open the kept file (code/GM: MONBL, MON.H pic).
import { MONBL, serializeBlocks, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { LASTMON, LASTSL, parseMonsters, serializeMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import type { GameFiles } from '../../project/files';
import { shownPalettes, shareRange } from './palettes';
import type { PaletteReservation } from '../editors/palette/paletteReservations';
import { placeBlocks, readBlocks } from './blockSlots';
import { commit, readFor, type Writes } from './commit';
import { filesIn, readGame, repoint, usersOf, type SceneUse } from './refs';
import type { Step } from './types';

/** Why two monster block sets can't merge, or the step that merges them. */
export function planMonsterBlocks(
  files: GameFiles,
  gam: string,
  uses: SceneUse[],
  keep: string,
  drop: string,
  ranges: readonly PaletteReservation[] = [],
): Step | string {
  const before: Writes['before'] = new Map();
  const kBytes = readFor(files, before, keep);
  const dBytes = readFor(files, before, drop);
  const K = readBlocks(kBytes, MONBL);
  const D = readBlocks(dBytes, MONBL);
  const kUsers = usersOf(uses, 'mbl', keep);
  const dUsers = usersOf(uses, 'mbl', drop);
  // a blank slot that a kept monster still draws is not free
  const reserved = new Set<number>();
  for (const mon of filesIn(kUsers, 'mon'))
    for (const m of parseMonsters(readFor(files, before, mon))) for (let s = 0; s <= LASTSL && m.pic[s][0] < MONBL; s++) reserved.add(m.pic[s][0]);
  const needed = new Set<number>();
  for (const mon of filesIn(dUsers, 'mon'))
    for (const m of parseMonsters(readFor(files, before, mon))) for (let s = 0; s <= LASTSL && m.pic[s][0] < MONBL; s++) needed.add(m.pic[s][0]);
  const placed = placeBlocks(D, K, reserved, needed);
  if (!placed) return 'their drawn blocks do not fit in one file of 100';
  const kPals = shownPalettes(files, kUsers);
  const dPals = shownPalettes(files, dUsers);
  if (!kPals || !dPals) return 'a scene that uses one of them has no palette file';
  if (
    !shareRange(
      kPals,
      dPals,
      ranges.filter((r) => r.role === 'monster'),
    )
  )
    return 'their scenes have no palette in common';
  // the moved blocks, with their links to other blocks of the same file following them
  const moved = new Map(K.map((b, i) => [i, b] as [number, Block]));
  for (const i of placed.fresh) {
    const b = { ...D[i] };
    if (b.birthTime) return `block ${i} of ${drop} gives birth to monsters`;
    for (const k of ['nextBl', 'touchBl'] as const) {
      if (b[k] === i) b[k] = placed.at.get(i)!;
      else if (placed.at.has(b[k])) b[k] = placed.at.get(b[k])!;
      else return `block ${i} of ${drop} points at a block that is not drawn`;
    }
    moved.set(placed.at.get(i)!, b);
  }
  const blocks = K.map((b, i) => moved.get(i) ?? b);

  // every .mon the dropped file's scenes open must be theirs alone: its monsters' pictures change
  const writes: Writes = { files: new Map(), before, game: readGame(files, gam) };
  const changes = [`${placed.fresh.length} block${placed.fresh.length === 1 ? '' : 's'} move from ${drop} to ${keep}`];
  for (const mon of filesIn(dUsers, 'mon')) {
    if (usersOf(uses, 'mon', mon).some((u) => u.mbl !== drop)) return `${mon} is used with another block set too`;
    const ms = parseMonsters(readFor(files, before, mon));
    for (const m of ms)
      for (let s = 0; s <= LASTSL && m.pic[s][0] < MONBL; s++) {
        const at = placed.at.get(m.pic[s][0]);
        if (at === undefined) return `${mon} draws a monster with a blank block of ${drop}`;
        m.pic[s][0] = at;
      }
    if (ms.length > LASTMON) return `${mon} is not a monster file`;
    writes.files.set(mon, serializeMonsters(ms));
    changes.push(`${mon}: monster pictures use the new block numbers`);
  }
  writes.files.set(keep, serializeBlocks(blocks));
  writes.files.set(drop, null);
  repoint(writes.game, files, 'mbl', drop, keep);
  changes.push(`${dUsers.length} scene${dUsers.length === 1 ? '' : 's'} open ${keep} instead of ${drop}`);
  return {
    kind: 'mbl',
    keep,
    drop,
    saves: dBytes.length,
    title: `Merge monster blocks ${drop} into ${keep}`,
    changes,
    touches: [...writes.files.keys(), gam],
    moves: [{ file: drop, into: keep, at: placed.at }],
    apply: (f, g) => commit(f, g, writes),
  };
}
