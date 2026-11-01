// Two monster files (.mon, 64 monsters each) used with one monster block set whose monsters fit
// in one file: the dropped file's monsters move into the kept file's empty slots, and everything
// that names a monster by number follows: the maps' placements, a background block that gives
// birth to monsters, a character frame that fires one, and a monster that turns into another
// when it dies. The dropped file's scenes open the kept file (code/GM MON.H, MONBL births).
import { BACKBL, MONBL, parseBlocks, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseCharacter, serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { parseMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { LASTMON, emptyMonster, parseMonsters, serializeMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import type { GameFiles } from '../../project/files';
import { commit, readFor, type Writes } from './commit';
import { filesIn, readGame, repoint, usersOf, type SceneUse } from './refs';
import type { Step } from './types';

const bytesOf = (m: ReturnType<typeof parseMonsters>[number]) => serializeMonsters([m]).slice(0, 300).join(',');
const EMPTY = bytesOf(emptyMonster());

/** Why two monster files can't merge, or the step that merges them. */
export function planMonsters(files: GameFiles, gam: string, uses: SceneUse[], keep: string, drop: string): Step | string {
  const before: Writes['before'] = new Map();
  const kUsers = usersOf(uses, 'mon', keep);
  const dUsers = usersOf(uses, 'mon', drop);
  const blockSets = new Set([...kUsers, ...dUsers].map((u) => u.mbl ?? ''));
  if (blockSets.size !== 1 || blockSets.has('')) return 'their scenes use different monster block sets (merge those first)';
  const K = parseMonsters(readFor(files, before, keep));
  const D = parseMonsters(readFor(files, before, drop));
  const isEmpty = (m: (typeof K)[number]) => bytesOf(m) === EMPTY;
  const writes: Writes = { files: new Map(), before, game: readGame(files, gam) };

  // slots the kept scenes' maps, births and deaths still name are not free, even when empty
  const reserved = new Set<number>();
  for (const map of filesIn(kUsers, 'map')) for (const p of parseMap(readFor(files, before, map)).monsters) reserved.add(p.monnum);
  K.forEach((m) => reserved.add(m.newmon));
  const free = K.map((m, i) => (isEmpty(m) && !reserved.has(i) ? i : -1)).filter((i) => i >= 0);
  const at = new Map<number, number>();
  for (let i = 0; i < LASTMON; i++) {
    if (isEmpty(D[i])) continue;
    const slot = free.shift();
    if (slot === undefined) return 'their monsters do not fit in one file of 64';
    at.set(i, slot);
  }
  const to = (n: number): number | undefined => (n >= LASTMON ? n : at.get(n));

  const merged = [...K];
  for (const [i, slot] of at) {
    const m = { ...D[i] };
    const dies = to(m.newmon);
    if (dies === undefined) return `a monster in ${drop} turns into a monster slot that is empty`;
    m.newmon = dies;
    merged[slot] = m;
  }
  const changes = [`${at.size} monster${at.size === 1 ? '' : 's'} move from ${drop} to ${keep}`];

  // each file that names the dropped file's monsters by number must be only for the dropped file's scenes
  const owned = (slot: 'map' | 'bbl' | 'chr', name: string): string | undefined =>
    usersOf(uses, slot, name).some((u) => !dUsers.includes(u)) ? `${name} is also used with other monsters` : undefined;
  for (const map of filesIn(dUsers, 'map')) {
    const m = parseMap(readFor(files, before, map));
    let moved = 0;
    for (const p of m.monsters)
      if (p.monnum < LASTMON) {
        const n = to(p.monnum);
        if (n === undefined) return `${map} places a monster that ${drop} leaves empty`;
        if (n !== p.monnum) moved++;
        p.monnum = n;
      }
    if (!moved) continue;
    const why = owned('map', map);
    if (why) return why;
    writes.files.set(map, serializeMap(m));
    changes.push(`${map}: ${moved} placed monster${moved === 1 ? '' : 's'} renumbered`);
  }
  for (const bbl of filesIn(dUsers, 'bbl')) {
    const blocks = parseBlocks(readFor(files, before, bbl), BACKBL);
    let moved = 0;
    for (const b of blocks)
      if (b.birthTime > 0 && b.birthMon < LASTMON) {
        const n = to(b.birthMon);
        if (n === undefined) return `${bbl} has a block giving birth to a monster that ${drop} leaves empty`;
        if (n !== b.birthMon) moved++;
        b.birthMon = n;
      }
    if (!moved) continue;
    const why = owned('bbl', bbl);
    if (why) return why;
    writes.files.set(bbl, serializeBlocks(blocks));
    changes.push(`${bbl}: ${moved} block${moved === 1 ? '' : 's'} give birth to the renumbered monsters`);
  }
  for (const chr of filesIn(dUsers, 'chr')) {
    const c = parseCharacter(readFor(files, before, chr));
    let moved = 0;
    for (const s of c.sequences)
      for (const f of s.frames)
        if (f.pic2 === MONBL) {
          const n = to(f.pic1);
          if (n === undefined) return `${chr} fires a monster that ${drop} leaves empty`;
          if (n !== f.pic1) moved++;
          f.pic1 = n;
        }
    if (!moved) continue;
    const why = owned('chr', chr);
    if (why) return why;
    writes.files.set(chr, serializeCharacter(c));
    changes.push(`${chr}: ${moved} frame${moved === 1 ? '' : 's'} fire the renumbered monsters`);
  }
  writes.files.set(keep, serializeMonsters(merged));
  writes.files.set(drop, null);
  repoint(writes.game, files, 'mon', drop, keep);
  changes.push(`${dUsers.length} scene${dUsers.length === 1 ? '' : 's'} open ${keep} instead of ${drop}`);
  return {
    kind: 'mon',
    keep,
    drop,
    saves: readFor(files, before, drop).length,
    title: `Merge monsters ${drop} into ${keep}`,
    changes,
    touches: [...writes.files.keys(), gam],
    apply: (f, g) => commit(f, g, writes),
  };
}
