// Two character block sets (.cbl, 50 blocks each) that look the same under the palettes their scenes
// show and whose pictures fit in one file: the dropped file's blocks move into the kept file's blank
// slots (a twin already there is reused), every character frame that used them points at the new
// slots (top and bottom picture; a frame that gives birth to a monster has no picture), and the
// dropped file's scenes open the kept file (code/GM: CHARBL, CHAR.H pic1/pic2).
import { CHARBL, MONBL, serializeBlocks, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { frameCount, parseCharacter, serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import type { GameFiles } from '../../project/files';
import { shownPalettes, sharePalette } from './palettes';
import { placeBlocks, readBlocks } from './blockSlots';
import { commit, readFor, type Writes } from './commit';
import { filesIn, readGame, repoint, usersOf, type SceneUse } from './refs';
import type { Step } from './types';

/** The block numbers (below CHARBL) a character's active frames draw. */
export function framePictures(bytes: Uint8Array): number[] {
  const out: number[] = [];
  for (const s of parseCharacter(bytes).sequences)
    for (const f of s.frames.slice(0, frameCount(s))) {
      if (f.pic2 === MONBL) continue;
      for (const n of [f.pic1, f.pic2]) if (n < CHARBL) out.push(n);
    }
  return out;
}

/** Why two character block sets can't merge, or the step that merges them. */
export function planCharacterBlocks(files: GameFiles, gam: string, uses: SceneUse[], keep: string, drop: string): Step | string {
  const before: Writes['before'] = new Map();
  const dBytes = readFor(files, before, drop);
  const K = readBlocks(readFor(files, before, keep), CHARBL);
  const D = readBlocks(dBytes, CHARBL);
  const kUsers = usersOf(uses, 'cbl', keep);
  const dUsers = usersOf(uses, 'cbl', drop);
  // a blank slot that a kept character still draws is not free
  const reserved = new Set<number>();
  for (const chr of filesIn(kUsers, 'chr')) for (const n of framePictures(readFor(files, before, chr))) reserved.add(n);
  const needed = new Set<number>();
  for (const chr of filesIn(dUsers, 'chr')) framePictures(readFor(files, before, chr)).forEach((n) => needed.add(n));
  const placed = placeBlocks(D, K, reserved, needed);
  if (!placed) return `their blocks do not fit in one file of ${CHARBL}`;
  const kPals = shownPalettes(files, kUsers);
  const dPals = shownPalettes(files, dUsers);
  if (!kPals || !dPals) return 'a scene that uses one of them has no palette file';
  if (!sharePalette(kPals, dPals)) return 'their scenes have no palette in common';
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

  const writes: Writes = { files: new Map(), before, game: readGame(files, gam) };
  const changes = [`${placed.fresh.length} block${placed.fresh.length === 1 ? '' : 's'} move from ${drop} to ${keep}`];
  for (const chr of filesIn(dUsers, 'chr')) {
    if (usersOf(uses, 'chr', chr).some((u) => u.cbl !== drop)) return `${chr} is used with another character block set too`;
    const c = parseCharacter(readFor(files, before, chr));
    for (const s of c.sequences)
      for (const f of s.frames.slice(0, frameCount(s))) {
        if (f.pic2 === MONBL) continue;
        for (const k of ['pic1', 'pic2'] as const) {
          if (f[k] >= CHARBL) continue;
          const at = placed.at.get(f[k]);
          if (at === undefined) return `${chr} draws a blank block of ${drop}`;
          f[k] = at;
        }
      }
    writes.files.set(chr, serializeCharacter(c));
    changes.push(`${chr}: frame pictures use the new block numbers`);
  }
  writes.files.set(keep, serializeBlocks(blocks));
  writes.files.set(drop, null);
  repoint(writes.game, files, 'cbl', drop, keep);
  changes.push(`${dUsers.length} scene${dUsers.length === 1 ? '' : 's'} open ${keep} instead of ${drop}`);
  return {
    kind: 'cbl',
    keep,
    drop,
    saves: dBytes.length,
    title: `Merge character blocks ${drop} into ${keep}`,
    changes,
    touches: [...writes.files.keys(), gam],
    apply: (f, g) => commit(f, g, writes),
  };
}
