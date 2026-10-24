// What the block editor's previews and group guesses read from the rest of the game: the
// animations a block is in (its own chain, the monsters that show it, the hero's sequences)
// and the group suggestions from the maps, the placed monsters and the hero's frames. The
// partner files are those of the scenes that use this block set, as "Used in" finds them.
import type { Project } from '../../core/project';
import { partners } from '../../core/uses';
import { parseMap } from '../../../formats/map';
import { parseMonsters, type Monster } from '../../../formats/monster';
import { parseCharacter, SEQUENCE_NAMES, type Character } from '../../../formats/character';
import type { Block, BlockKind } from '../../../formats/blocks';
import { scanName } from '../../../input/scancodes';
import { ADVTYPE } from '../../../formats/game';
import { normalize } from '../../../project/files';
import { bblClip, bblGroupClip, characterClips, monsterClips, monsterGroupClip, type Clip } from './animClip';
import type { BlockGroup } from './blockGroups';
import { guessCharacterGroups, guessMapGroups, guessMonsterGroups, type Suggestion } from './groupGuess';

/** The scene slot of each block set kind, and of the file whose animations use it (see uses.ts). */
const SLOTS: Record<BlockKind, { set: number; anim: number; map: number }> = {
  bbl: { set: 2, anim: 1, map: 1 },
  mbl: { set: 4, anim: 3, map: 1 },
  cbl: { set: 6, anim: 5, map: 1 },
};

function tryParse<T>(fn: () => T): T | undefined {
  try {
    return fn();
  } catch {
    return undefined;
  }
}

/** A value as a list of one, or none. */
const some = <T>(v: T | undefined): T[] => (v === undefined ? [] : [v]);

const filesFor = (project: Project, file: string, kind: BlockKind, slot: 'anim' | 'map') =>
  partners(project, file, SLOTS[kind].set, SLOTS[kind][slot]).map((p) => p.file);

const monstersFor = (project: Project, file: string): Monster[][] =>
  filesFor(project, file, 'mbl', 'anim').flatMap((f) => some(tryParse(() => parseMonsters(project.files.get(f)!))));

const charactersFor = (project: Project, file: string): Character[] =>
  filesFor(project, file, 'cbl', 'anim').flatMap((f) => some(tryParse(() => parseCharacter(project.files.get(f)!))));

function seqName(chr: Character, i: number): string {
  const key = chr.sequences[i].key;
  return SEQUENCE_NAMES[i] ?? (key ? `Sequence ${i} (${scanName(key >> 8)})` : `Sequence ${i}`);
}

/** The animations block `block` is in, as the game plays them. */
export function clipsFor(project: Project, file: string, kind: BlockKind, blocks: Block[], block: number): Clip[] {
  if (kind === 'bbl') return [bblClip(blocks, block)];
  const files = filesFor(project, file, kind, 'anim');
  const named = (f: string, clips: Clip[]) => (files.length > 1 ? clips.map((c) => ({ ...c, label: `${f}: ${c.label.toLowerCase()}` })) : clips);
  const all =
    kind === 'mbl'
      ? files.flatMap((f) => named(f, monsterClips(some(tryParse(() => parseMonsters(project.files.get(f)!)))[0] ?? [], block)))
      : files.flatMap((f) =>
          some(tryParse(() => parseCharacter(project.files.get(f)!))).flatMap((c) =>
            named(
              f,
              characterClips(c, block, (i) => seqName(c, i)),
            ),
          ),
        );
  // the same monster copied into each scene's file plays the same: show it once
  const seen = new Set<string>();
  return all.filter((c) => {
    const key = JSON.stringify(c.tracks);
    return !seen.has(key) && !!seen.add(key);
  });
}

/** The group's animation: each block running its own as `block` runs (background chains, monsters in step). */
export function groupClipFor(project: Project, file: string, kind: BlockKind, blocks: Block[], g: BlockGroup, block: number): Clip | undefined {
  if (kind === 'bbl') return bblGroupClip(blocks, g);
  if (kind === 'mbl') {
    const mons = monstersFor(project, file).find((m) => monsterClips(m, block).length);
    return mons && monsterGroupClip(mons, g, block);
  }
  return undefined;
}

/** Groups the files suggest for this set. */
export function suggestionsFor(project: Project, file: string, kind: BlockKind, count: number): Suggestion[] {
  if (kind === 'cbl') return charactersFor(project, file).flatMap((c) => guessCharacterGroups(c, (i) => seqName(c, i)));
  if (kind === 'bbl') {
    const maps = filesFor(project, file, kind, 'map').flatMap((f) => some(tryParse(() => parseMap(project.files.get(f)!).blocks)));
    return guessMapGroups(maps, count);
  }
  // monsters: each scene's map with that scene's monster file
  const byMon = new Map<string, Uint8Array[]>();
  const n = normalize(file);
  for (const sc of project.game().scenes) {
    if (sc.gametype !== ADVTYPE || normalize(sc.files[SLOTS.mbl.set] ?? '') !== n) continue;
    const mon = normalize(sc.files[SLOTS.mbl.anim] ?? '');
    const map = normalize(sc.files[SLOTS.mbl.map] ?? '');
    if (!project.files.has(mon) || !project.files.has(map)) continue;
    byMon.set(mon, [...(byMon.get(mon) ?? []), project.files.get(map)!]);
  }
  const out: Suggestion[] = [];
  for (const [mon, mapBytes] of byMon) {
    const mons = tryParse(() => parseMonsters(project.files.get(mon)!));
    const placed = mapBytes.flatMap((b) => some(tryParse(() => parseMap(b).monsters)));
    for (const sug of mons ? guessMonsterGroups(mons, placed, count) : []) if (!out.some((o) => o.group.cells.join() === sug.group.cells.join())) out.push(sug);
  }
  return out;
}
