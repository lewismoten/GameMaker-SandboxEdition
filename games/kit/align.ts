// Repository disk lookup and CLI diagnostics; reusable alignment checks live in the tools package.
import { mkdirSync } from 'node:fs';
import { auditDisk, type PartRule } from '@lewismoten/gamemaker-sandbox-tools/kit/align';
export function alignGame(
  id: string,
  names: (map: string) => string[] | undefined,
  rules: PartRule[] | ((map: string) => PartRule[]),
  opts: { seamOk?: string[]; factor?: number; floor?: number; draw?: string } = {},
): number {
  const r = auditDisk(new URL(`../${id}/disk`, import.meta.url).pathname, names, rules, opts);
  const okSeams = new Set(opts.seamOk ?? []);
  const broken = r.broken.filter((x) => !okSeams.has(`${x.a}${x.dir === 'h' ? '|' : '/'}${x.b}`));
  let n = 0;
  for (const [map, bad] of r.maps) {
    if (!bad.length) continue;
    n += bad.length;
    console.log(`${id} ${map}: ${bad.length} misplaced part(s)`);
    for (const b of bad.slice(0, 12)) console.log(`  ${b}`);
    if (bad.length > 12) console.log(`  ... and ${bad.length - 12} more`);
  }
  // ALIGN_DRAW=<folder> draws each flagged join there, for a look
  const draw = opts.draw ?? process.env.ALIGN_DRAW;
  if (draw && broken.length) mkdirSync(draw, { recursive: true });
  if (draw) for (const x of broken) x.draw?.(`${draw}/${id}-${x.a}${x.dir === 'h' ? '-' : '_'}${x.b}.png`);
  for (const x of broken)
    console.log(`${id} seam ${x.a}${x.dir === 'h' ? '|' : '/'}${x.b}: colors jump ${x.across.toFixed(1)} across the edge, ${x.within.toFixed(1)} beside it`);
  n += broken.length;
  if (!n) console.log(`${id}: multi-block objects whole on ${r.maps.length} maps (${r.seams.length} joins)`);
  return n;
}
