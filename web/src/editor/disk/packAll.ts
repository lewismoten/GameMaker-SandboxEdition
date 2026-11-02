// "Pack with reserved palettes": the whole route to fewer files in one preview. With the project's
// palette reservations (or, for a game with none, the ranges reservePlan.ts proposes), color
// reductions and range syncs make every palette of a sprite role agree, then the merges run again
// with those ranges (a monster or character block file can join another once their scenes' palettes
// match over the reserved range). Found by applying each unit to a copy and looking again, as
// planDisk does; the units then apply to the real files in the same order. Reductions change how
// scenes look, so the plan reports how far they draw from now (delta E) and is applied only on a click.
import type { GameFiles } from '../../project/files';
import type { PaletteReservation } from '../editors/palette/paletteReservations';
import { planDisk } from './plan';
import { reductions } from './reduceColors';
import { rangeSyncs } from './rangeSync';
import { proposeReservations } from './reservePlan';
import { sceneDelta, type SceneDelta } from './sceneDelta';
import { savesRisk } from './savesSafe';
import type { BlockMove } from './types';

export interface PackUnit {
  kind: 'reduce' | 'sync' | 'merge';
  title: string;
  touches: string[];
  moves?: BlockMove[];
  /** Why the unit would break saved games (savesSafe.ts), when it would. */
  risk?: string;
  apply(files: GameFiles, gam: string): void;
}

export interface PackPlan {
  /** The ranges the plan works with; `proposed` when the game had none (they are saved to the project on apply). */
  roles: PaletteReservation[];
  proposed: boolean;
  units: PackUnit[];
  /** Bytes the game's files shrink by when all of it is applied, and how much of that the plain steps alone would not reach. */
  saves: number;
  extra: number;
  /** How far scenes then draw from now, and the largest delta E any one reduction reported. */
  delta: SceneDelta;
  allowed: number;
  /** Ranges the plan could not make the same everywhere, and why. */
  stuck: string[];
}

const total = (f: GameFiles) => f.entries().reduce((n, [, v]) => n + v.length, 0);

/** undefined when there are no sprites to reserve for, or the ranges would free no more than the plain steps (planDisk) do. */
export function planPack(files: GameFiles, gam: string, existing: readonly PaletteReservation[]): PackPlan | undefined {
  const proposed = !existing.length;
  const roles = proposed ? proposeReservations(files, gam, [])?.roles : [...existing];
  if (!roles?.length) return undefined;
  const plain = planDisk(files, gam, existing);
  const plainSaved = plain.steps.reduce((a, s) => a + s.saves, 0);
  const work = files.copy();
  const units: PackUnit[] = [];
  const stuck: string[] = [];
  let allowed = 0;
  // one at a time: each apply rewrites files the next preview reads
  for (let round = 0; round < 40; round++) {
    const r = reductions(work, gam, roles)[0];
    const { syncs, stuck: why } = rangeSyncs(work, gam, roles);
    const s = r ?? syncs[0];
    if (!s) {
      why.forEach((x) => stuck.push(x.why));
      break;
    }
    s.apply(work, gam);
    allowed = Math.max(allowed, s.score.worst);
    units.push({ kind: r ? 'reduce' : 'sync', title: s.title, touches: s.touches, apply: (f, g) => s.apply(f, g) });
  }
  const plan = planDisk(work, gam, roles);
  for (const s of plan.steps) {
    s.apply(work, gam);
    units.push({ kind: 'merge', title: s.title, touches: s.touches, moves: s.moves, risk: savesRisk(s), apply: (f, g) => s.apply(f, g) });
  }
  const saves = total(files) - total(work);
  // color changes that free no more than the plain steps do are not worth offering
  if (!units.length || saves <= plainSaved) return undefined;
  return { roles, proposed, units, saves, extra: saves - plainSaved, delta: sceneDelta(files, work, gam), allowed, stuck };
}
