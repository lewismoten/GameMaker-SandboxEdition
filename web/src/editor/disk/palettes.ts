// Palette questions the merges ask. A block is drawn with its own scene's palette whatever file it
// sits in, so a merge never changes how a scene looks; what it can change is how the editor
// previews the joined file (in one scene's palette). So two sets merge when their scenes have a
// palette in common, ignoring the all-one-color palettes of the fade-through scenes.
import { isSolidPalette } from '../core/readablePalette';
import type { GameFiles } from '../../project/files';
import type { SceneUse } from './refs';

/** The distinct, not-solid palettes (raw .pal bytes) the given scenes show; undefined when a scene has none. */
export function shownPalettes(files: GameFiles, scenes: SceneUse[]): Uint8Array[] | undefined {
  const out: Uint8Array[] = [];
  for (const s of scenes) {
    const bytes = s.pal ? files.get(s.pal) : undefined;
    if (!bytes) return undefined;
    if (!isSolidPalette(bytes) && !out.some((o) => same(o, bytes))) out.push(bytes);
  }
  return out;
}

const same = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((v, i) => v === b[i]);

/** True when some palette is shown in both groups of scenes (same colors, whatever the file is called). */
export function sharePalette(a: Uint8Array[], b: Uint8Array[]): boolean {
  return a.some((x) => b.some((y) => same(x, y)));
}

/** Like sharePalette, but when the role has reserved colors, two palettes also count as shared when those colors are the same (a sprite file only needs its own range to look right in the editor). */
export function shareRange(a: Uint8Array[], b: Uint8Array[], reserved: readonly { first: number; last: number }[]): boolean {
  if (sharePalette(a, b)) return true;
  if (!reserved.length) return false;
  const eq = (x: Uint8Array, y: Uint8Array) => reserved.every((r) => x.subarray(r.first * 3, (r.last + 1) * 3).every((v, i) => v === y[r.first * 3 + i]));
  return a.some((x) => b.some((y) => eq(x, y)));
}
