// Part of optimize:proof. For a game with no palette reservations: propose them (reservePlan.ts), apply
// the color reductions and range syncs they call for, then plan and apply every step again with the
// ranges, on a copy. Reports the extra bytes saved over the plain plan, and checks that no scene draws
// further from the original than the largest delta E the steps themselves reported.
import { ADVTYPE, parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { labOf } from '@lewismoten/gamemaker-sandbox-tools/color-reduce';
import type { GameFiles } from '../../web/src/project/files';
import { planDisk } from '../../web/src/editor/disk/plan';
import { reductions } from '../../web/src/editor/disk/reduceColors';
import { rangeSyncs } from '../../web/src/editor/disk/rangeSync';
import { proposeReservations } from '../../web/src/editor/disk/reservePlan';
import { scenePixels } from '../../web/src/gfx/levelPicture';

const bytes = (f: GameFiles) => f.entries().reduce((n, [, v]) => n + v.length, 0);

export interface ReserveProof {
  line: string;
  ok: boolean;
}

export function reserveProof(files: GameFiles, gam: string, plainSaved: number): ReserveProof {
  const p = proposeReservations(files, gam, []);
  if (!p) return { line: 'no sprite ranges to propose', ok: true };
  const work = files.copy();
  let allowed = 0;
  const notes: string[] = [];
  // one at a time: each apply rewrites files the next preview read
  for (let round = 0; round < 40; round++) {
    const r = reductions(work, gam, p.roles)[0];
    const { syncs, stuck } = rangeSyncs(work, gam, p.roles);
    const s = r ?? syncs[0];
    if (!s) {
      stuck.forEach((x) => notes.push(x.why));
      break;
    }
    s.apply(work, gam);
    allowed = Math.max(allowed, s.score.worst);
  }
  const plan = planDisk(work, gam, p.roles);
  for (const s of plan.steps) s.apply(work, gam);
  let worst = 0;
  let sum = 0;
  let n = 0;
  const [a, b] = [files, work].map((f) => parseGame(f.get(gam)!).scenes.map((s) => (s.gametype === ADVTYPE ? scenePixels(f, s, 0, 0, 100, 100) : undefined)));
  a.forEach((x, i) => {
    const y = b[i];
    if (!x || !y) return;
    for (let k = 0; k < x.pixels.length; k++) {
      const [u, v] = [x.pixels[k], y.pixels[k]];
      if ([0, 1, 2].every((c) => x.palette[u * 3 + c] === y.palette[v * 3 + c])) continue;
      const [l1, l2] = [labOf(x.palette, u), labOf(y.palette, v)];
      const d = Math.hypot(l1[0] - l2[0], l1[1] - l2[1], l1[2] - l2[2]);
      worst = Math.max(worst, d);
      sum += d;
      n++;
    }
  });
  const extra = bytes(files) - bytes(work) - plainSaved;
  const ok = worst <= allowed + 0.01;
  const kinds = plan.steps.reduce((m, s) => ({ ...m, [s.kind]: (m[s.kind] ?? 0) + 1 }), {} as Record<string, number>);
  return {
    line: `with ${p.roles.map((r) => `${r.role} ${r.first}-${r.last}`).join(', ')}: ${extra >= 0 ? '+' : ''}${extra} bytes more saved ${JSON.stringify(kinds)}; scenes differ by mean ${n ? (sum / n).toFixed(1) : 0}, worst ${worst.toFixed(1)} (steps reported ${allowed.toFixed(1)}) ${ok ? 'OK' : 'FAIL'}${notes.length ? ` [stuck: ${notes[0]}]` : ''}`,
    ok,
  };
}
