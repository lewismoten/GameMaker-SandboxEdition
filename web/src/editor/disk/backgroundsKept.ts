// The check behind "Monsters and characters only": nothing a background draws has changed. Every
// scene still opens a background block file with the same bytes, and every color number those
// blocks draw is the same RGB in the scene's palette as it was. Returns the first problem, or undefined.
import { BACKBL, parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { GameFiles } from '../../project/files';
import { drawn } from './blockUse';
import { readGame, sceneUses } from './refs';

export function backgroundsKept(before: GameFiles, after: GameFiles, gam: string): string | undefined {
  const [a, b] = [sceneUses(before, readGame(before, gam)), sceneUses(after, readGame(after, gam))];
  for (const u of a) {
    const w = b.find((x) => x.index === u.index);
    if (!w || !u.bbl || !u.pal) continue;
    if (!w.bbl || !w.pal) return `scene ${u.index} lost its background`;
    const [x, y] = [before.get(u.bbl)!, after.get(w.bbl)!];
    if (x.length !== y.length || x.some((v, i) => v !== y[i])) return `scene ${u.index}: ${u.bbl} changed`;
    const blocks = parseBlocks(x, BACKBL);
    const colors = new Set<number>();
    for (const n of drawn(before, a, u.bbl, blocks)) for (const v of blocks[n]?.pixels ?? []) colors.add(v);
    const [p, q] = [before.get(u.pal)!, after.get(w.pal)!];
    for (const c of colors)
      if (c !== 255 && [0, 1, 2].some((k) => p[c * 3 + k] !== q[c * 3 + k])) return `scene ${u.index}: color ${c} of the background changed`;
  }
  return undefined;
}
