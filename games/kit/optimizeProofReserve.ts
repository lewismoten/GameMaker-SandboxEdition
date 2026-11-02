// Part of optimize:proof. For a game with no palette reservations: plan the dialog's "Pack with reserved
// palettes" (web/src/editor/disk/packAll.ts: proposed ranges, the color reductions and range syncs they
// call for, then every merge again), apply it unit by unit to a copy, and check that no scene draws
// further from the original than the largest delta E the units themselves reported.
import type { GameFiles } from '../../web/src/project/files';
import { planPack } from '../../web/src/editor/disk/packAll';
import { backgroundsKept } from '../../web/src/editor/disk/backgroundsKept';
import { sceneDelta } from '../../web/src/editor/disk/sceneDelta';

export interface ReserveProof {
  line: string;
  ok: boolean;
}

export function reserveProof(files: GameFiles, gam: string, plainSaved: number): ReserveProof {
  const pack = planPack(files, gam, []);
  if (!pack) return { line: 'no ranges to propose, or none that would free more than the plain steps', ok: true };
  // the plan was found on a copy; applying it to another one must give the same game
  const work = files.copy();
  for (const u of pack.units) u.apply(work, gam);
  const d = sceneDelta(files, work, gam);
  const bytes = (f: GameFiles) => f.entries().reduce((n, [, v]) => n + v.length, 0);
  const extra = bytes(files) - bytes(work) - plainSaved;
  const ok = d.worst <= pack.allowed + 0.01 && d.worst <= pack.delta.worst + 0.01;
  const kinds = pack.units.reduce((m, u) => ({ ...m, [u.kind]: (m[u.kind] ?? 0) + 1 }), {} as Record<string, number>);
  return {
    line: `with ${pack.roles.map((r) => `${r.role} ${r.first}-${r.last}`).join(', ')}: ${extra >= 0 ? '+' : ''}${extra} bytes more saved ${JSON.stringify(kinds)}; scenes differ by mean ${d.mean.toFixed(1)}, worst ${d.worst.toFixed(1)} (units reported ${pack.allowed.toFixed(1)}) ${ok ? 'OK' : 'FAIL'}${pack.stuck.length ? ` [stuck: ${pack.stuck[0]}]` : ''}`,
    ok,
  };
}

/** "Monsters and characters only": same plan with the background kinds left out; every .bbl byte-identical and every background color number the same RGB. */
export function spritesProof(files: GameFiles, gam: string): ReserveProof {
  const pack = planPack(files, gam, [], 'sprites');
  if (!pack) return { line: 'monsters and characters only: nothing to pack', ok: true };
  const work = files.copy();
  for (const u of pack.units) u.apply(work, gam);
  const bytes = (f: GameFiles) => f.entries().reduce((n, [, v]) => n + v.length, 0);
  const d = sceneDelta(files, work, gam);
  const bad = files.entries().find(([n, v]) => /\.bbl$/i.test(n) && !(work.get(n)?.length === v.length && work.get(n)!.every((b, i) => b === v[i])));
  const why = bad ? `${bad[0]} changed` : backgroundsKept(files, work, gam);
  const ok = !why && d.worst <= pack.delta.worst + 0.01;
  return {
    line: `monsters and characters only: ${bytes(files) - bytes(work)} bytes saved in ${pack.units.length} steps; backgrounds ${why ?? 'byte-identical'}; scenes differ by mean ${d.mean.toFixed(1)}, worst ${d.worst.toFixed(1)} ${ok ? 'OK' : 'FAIL'}`,
    ok,
  };
}
