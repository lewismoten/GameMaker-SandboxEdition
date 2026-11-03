// Build-time palette consolidation: palette files with exactly the same 768 bytes collapse to one
// file. Only a .gam names a palette (an adventure scene's first file slot, code/GM/GRATOR.H;
// slide lists, backdrops, text and FLI files carry their own colors), so every scene that opened a
// duplicate opens the kept file instead and the duplicates are dropped. Scenes keep their numbers,
// and a DOS saved game records scene numbers, never file names (code/GM/PLAYGAME.C SaveGame).
// The kept file is the first one in scene order (alphabetical when no scene opens it).
import { ADVTYPE, parseGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { normalize } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';

export interface PalMerge {
  /** Dropped file name -> the file kept in its place. */
  merged: Map<string, string>;
  /** Bytes the dropped files held. */
  saved: number;
}

const keyOf = (b: Uint8Array) => Buffer.from(b).toString('latin1');

/** Groups of byte-identical palettes, each group in keep-first order; groups of one are left out. */
export function identicalPalettes(files: ReadonlyMap<string, Uint8Array>): string[][] {
  const order: string[] = [];
  const seen = new Set<string>();
  for (const [n, b] of files)
    if (n.endsWith('.gam'))
      for (const s of parseGame(b).scenes) {
        const p = s.gametype === ADVTYPE ? normalize(s.files[0] ?? '') : '';
        if (p.endsWith('.pal') && files.has(p) && !seen.has(p)) (seen.add(p), order.push(p));
      }
  const rest = [...files.keys()].filter((n) => n.endsWith('.pal') && !seen.has(n)).sort();
  const groups = new Map<string, string[]>();
  for (const n of [...order, ...rest]) {
    const k = keyOf(files.get(n)!);
    groups.set(k, [...(groups.get(k) ?? []), n]);
  }
  return [...groups.values()].filter((g) => g.length > 1);
}

/** Merges the identical palettes in a disk's files in place (the map is changed; .gam files are rewritten only when a scene is repointed). */
export function mergeIdenticalPalettes(files: Map<string, Uint8Array>): PalMerge {
  const merged = new Map<string, string>();
  let saved = 0;
  for (const [keep, ...drops] of identicalPalettes(files))
    for (const d of drops) {
      merged.set(d, keep);
      saved += files.get(d)!.length;
    }
  if (!merged.size) return { merged, saved };
  for (const [n, b] of [...files])
    if (n.endsWith('.gam')) {
      const game = parseGame(b);
      let changed = false;
      for (const s of game.scenes) {
        const to = s.gametype === ADVTYPE ? merged.get(normalize(s.files[0] ?? '')) : undefined;
        if (to) ((s.files[0] = to), (changed = true));
      }
      if (changed) files.set(n, serializeGame(game));
    }
  for (const d of merged.keys()) files.delete(d);
  return { merged, saved };
}
