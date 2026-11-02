// Picture files with a bigger color table than they need: the table shrinks to the smallest power of
// two that holds the colors the picture draws with (gifShrink.ts says when that is lossless in
// PLAYGAME). One step for all of them; it never changes the .gam, a block number or a saved game.
import { shrinkGif } from '@lewismoten/gamemaker-sandbox-tools/gif-shrink';
import type { GameFiles } from '../../project/files';
import type { Step } from './types';

export function planGifs(files: GameFiles): Step | undefined {
  const found: { name: string; bytes: Uint8Array; from: number; to: number }[] = [];
  for (const [name, old] of files.entries()) {
    const r = old[0] === 0x47 ? shrinkGif(old) : undefined;
    if (r) found.push({ name, bytes: r.bytes, from: r.from, to: r.to });
  }
  if (!found.length) return undefined;
  const before = new Map(found.map((f) => [f.name, files.get(f.name)!]));
  const saves = found.reduce((a, f) => a + before.get(f.name)!.length - f.bytes.length, 0);
  return {
    kind: 'gif',
    keep: '',
    drop: '',
    saves,
    title: `Shrink the color tables of ${found.length} picture${found.length === 1 ? '' : 's'}`,
    changes: found.map(
      (f) =>
        `${f.name}: ${f.from} colors in its table, ${f.to} used; every pixel and every screen color stays the same (${before.get(f.name)!.length - f.bytes.length} bytes)`,
    ),
    touches: found.map((f) => f.name),
    apply: (f) => {
      for (const g of found) {
        if (f.get(g.name) !== before.get(g.name)) throw new Error(`${g.name} changed since the preview; open the disk tool again`);
        f.set(g.name, g.bytes);
      }
    },
  };
}
