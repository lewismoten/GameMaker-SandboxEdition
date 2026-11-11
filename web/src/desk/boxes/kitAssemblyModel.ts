// Assembly poses in millimeters, using the kit builders' actual nominal cut shapes (zero kerf).
// Part.sheet adds a 2 mm layout pad; it is removed here, never used as material.
import { makeParts as plowedParts } from '../../../../games/snowbound/laser/plowedParts';
import { addArt } from '../../../../games/snowbound/laser/plowedArt';
import * as P from '../../../../games/snowbound/laser/plowedDims';
import { cryptexModel } from './kitAssemblyCryptex';
import { loopsOf } from './kitAssemblyLoops';
import type { Part } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';

export type V3 = [number, number, number];
export interface AssemblyPart {
  id: string;
  name: string;
  caption: string;
  cut: number[][][];
  art: number[][][];
  origin: V3;
  right: V3;
  down: V3;
  normal: V3;
  explode: V3;
  /** the sub-assembly it belongs to (kits with sub-assemblies) */
  group?: string;
}
/** A glued sub-assembly: it waits at `shift` (from its place in the finished kit) and `spin` degrees about the kit's middle. */
export interface AssemblyGroup {
  id: string;
  title: string;
  shift: V3;
  spin: number;
  parts: number[];
}
/** A whole group slides from one pose to another (and may turn about the kit's middle) during one step. */
export interface Move {
  group: string;
  from: V3;
  to: V3;
  spinFrom?: number;
  spinTo?: number;
}
export interface AssemblyStep {
  kind: 'part' | 'done' | 'move';
  /** what the counter shows: a part's ID, or the sub-assembly's */
  label: string;
  caption: string;
  /** the one part that slides into its place (kind part) */
  part?: number;
  group?: string;
  moves?: Move[];
}
export interface AssemblyModel {
  parts: AssemblyPart[];
  thickness: number;
  steps: AssemblyStep[];
  groups: AssemblyGroup[];
  /** the kit's middle, for turning a group */
  center: [number, number];
  /** places the step slider can jump to (target step numbers: 0 is everything exploded) */
  sections: { title: string; step: number }[];
}

/** Each physical slice, disc and panel gets exactly one step. */
export function assemblyModel(kind: 'plowed-street' | 'cryptex'): AssemblyModel {
  if (kind === 'cryptex') return cryptexModel();
  const parts: AssemblyPart[] = [];
  const stock = plowedParts(0);
  addArt(stock);
  const add = (name: string, origin: V3, caption: string, plane: 'flat' | 'front' | 'side' = 'flat', explode: V3 = [0, 0, 65]) => {
    const p: Part = stock[name].part;
    parts.push({
      id: `${name}-${parts.filter((p) => p.name === name).length + 1}`,
      name,
      caption,
      cut: loopsOf(p, 'cut'),
      art: loopsOf(p, 'engrave'),
      origin,
      right: plane === 'side' ? [0, 1, 0] : [1, 0, 0],
      down: plane === 'flat' ? [0, 1, 0] : [0, 0, -1],
      normal: plane === 'flat' ? [0, 0, 1] : plane === 'front' ? [0, 1, 0] : [1, 0, 0],
      explode,
    });
  };
  {
    const box = 'Glue P, K, L, R to B (finger joints). Leave the lid off. P is the front, with the drawer opening; T goes on last.';
    add('B', [0, 0, -3], box);
    add('K', [0, 0, P.Ho - 3], box, 'front', [0, -60, 0]);
    add('L', [0, 0, P.Ho - 3], box, 'side', [-65, 0, 0]);
    // R is drawn from outside: its sheet's x runs front to back.
    add('R', [P.Wo, P.Do, P.Ho - 3], box, 'side', [65, 0, 0]);
    Object.assign(parts.at(-1)!, { right: [0, -1, 0], normal: [-1, 0, 0] });
    add('P', [0, P.Do - 3, P.Ho - 3], box, 'front', [0, 65, 0]);
    add('F', [0, 3, P.zShelf[0]], 'Drop F into the wall slots (no glue yet).');
    const px = 3 + P.cellX(0) - P.plate.q1[0];
    const py = 3 + P.cellY(0) - P.plate.q1[1];
    add('PL', [px, py, P.zShelf[1]], 'PL rests loose on F: never glue it. The channel in PL faces the front.');
    for (const q of [P.plate.q1, P.plate.q2])
      for (let j = 0; j < 2; j++)
        add('STEM', [px + q[0] - 2.5, py + q[1] - 2.5, 32 + j * 3], 'Glue two STEM discs on each dot on PL, one on top of the other.');
    for (const x of [11, 119]) add('RAIL', [x, 40, 0], 'Glue the two RAILs on the base under the sides.');
    const d = P.drawer;
    const x = 3 + d.x0,
      y = P.Do - d.len,
      z = d.z0;
    const cap = 'Glue the five panels. DK, the one with the tab on top, goes at the back, tab up.';
    add('DB', [x, y, z], cap, 'flat', [0, 110, 10]);
    add('DK', [x, y, P.lug.top], cap, 'front', [0, 100, 20]);
    add('DL', [x, y, z + d.h], cap, 'side', [-40, 100, 0]);
    add('DR', [x + d.w - 3, y, z + d.h], cap, 'side', [40, 100, 0]);
    add(
      'DF',
      [x, P.Do - 3, z + d.h],
      'Slide the drawer in. The tab must pass through F’s slot and stand inside PL’s bay. Pull it out and in; it should move freely.',
      'front',
      [0, 140, 0],
    );
    add('T', [0, 0, P.Hi], 'Set T on, with both stems in their streets.');
    for (const q of [P.plate.q1, P.plate.q2])
      add('CAP', [px + q[0] - 7, py + q[1] - 7, 38], 'Glue CAPs on the stems above T. Then glue T. Slide the plow to HOME, then to LaVale Mall.');
  }
  const steps = parts.map((p, i): AssemblyStep => ({ kind: 'part', label: p.id, caption: p.caption, part: i }));
  return { parts, thickness: 3, steps, groups: [], center: [0, 0], sections: [] };
}

const lerp = (a: V3, b: V3, t: number): V3 => a.map((v, i) => v + (b[i] - v) * t) as V3;
const progress = (step: number, index: number) => Math.max(0, Math.min(1, step - index));

/**
 * Where a part is at a (fractional) step: its own slide into place from `explode`, plus the pose of its sub-assembly (set by
 * the moves so far, from where it waits to the finished kit and on through setting a code). Completed parts stay seated.
 */
export function poseAt(model: AssemblyModel, partIndex: number, step: number): { off: V3; spin: number } {
  const part = model.parts[partIndex];
  const own = model.steps.findIndex((s) => s.part === partIndex);
  const k = own < 0 ? 1 : progress(step, own);
  const off = part.explode.map((v) => v * (1 - k)) as V3;
  const group = model.groups.find((g) => g.id === part.group);
  if (!group) return { off, spin: 0 };
  let v = group.shift;
  let spin = group.spin;
  model.steps.forEach((s, i) => {
    const t = progress(step, i);
    if (t <= 0) return;
    for (const m of s.moves ?? [])
      if (m.group === group.id) {
        v = lerp(m.from, m.to, t);
        if (m.spinTo !== undefined) spin = (m.spinFrom ?? spin) + (m.spinTo - (m.spinFrom ?? spin)) * t;
      }
  });
  return { off: off.map((x, i) => x + v[i]) as V3, spin };
}
