// The cryptex's 3D assembly: each sub-assembly is built apart (one step per cut piece), shown finished as one solid, then the
// finished groups are put together, then one washer is lifted, turned and dropped back to set your own code.
// Groups, IDs and captions come from games/year2000/laser/cryptexGroups.ts, the same list the assembly card sheet prints.
import { makeParts } from '../../../../games/year2000/laser/cryptexParts';
import { BASE, STEP } from '../../../../games/year2000/laser/cryptexDims';
import { CODE_STEPS, CODE_TURN, FIT_ORDER, GROUPS } from '../../../../games/year2000/laser/cryptexGroups';
import { loopsOf } from './kitAssemblyLoops';
import type { AssemblyGroup, AssemblyModel, AssemblyPart, AssemblyStep, V3 } from './kitAssemblyModel';

const ZERO: V3 = [0, 0, 0];

export function cryptexModel(): AssemblyModel {
  const stock = makeParts(0);
  const c = BASE / 2;
  const parts: AssemblyPart[] = [];
  const groups: AssemblyGroup[] = [];
  const steps: AssemblyStep[] = [];
  const sections: AssemblyModel['sections'] = [{ title: 'All parts exploded', step: 0 }];
  for (const g of GROUPS) {
    const z0 = Math.min(...g.pieces.map((p) => p.z));
    const first = parts.length;
    g.pieces.forEach((piece, j) => {
      const p = stock[piece.key].part;
      const n = parts.filter((q) => q.name === piece.key).length + 1;
      parts.push({
        id: stock[piece.key].qty === 1 ? piece.key : `${piece.key}-${n}`,
        name: piece.key,
        caption: g.build,
        cut: loopsOf(p, 'cut'),
        art: loopsOf(p, 'engrave'),
        origin: [c - p.w / 2, c - p.h / 2, piece.z],
        right: [1, 0, 0],
        down: [0, 1, 0],
        normal: [0, 0, 1],
        explode: [0, 0, 14 + Math.min(9, 90 / g.pieces.length) * j],
        group: g.id,
      });
    });
    groups.push({
      id: g.id,
      title: g.title,
      shift: [g.at[0] - c, g.at[1] - c, -z0],
      spin: g.spin,
      parts: g.pieces.map((_, j) => first + j),
    });
    if (g.pieces.length > 1) sections.push({ title: `${g.title}: built apart`, step: steps.length + 1 });
    g.pieces.forEach((piece, j) =>
      steps.push({
        kind: 'part',
        label: stock[piece.key].qty === 1 ? piece.key : `${piece.key} (${g.id})`,
        caption: g.build,
        part: first + j,
        group: g.id,
      }),
    );
    steps.push({ kind: 'done', label: `${g.id} finished`, caption: g.done, group: g.id });
  }
  sections.push({ title: 'Put the sub-assemblies together', step: steps.length + 1 });
  for (const id of FIT_ORDER) {
    const g = groups.find((x) => x.id === id)!;
    steps.push({
      kind: 'move',
      label: `Put in ${id}`,
      caption: GROUPS.find((x) => x.id === id)!.fit,
      group: id,
      moves: [{ group: id, from: g.shift, to: ZERO }],
    });
  }
  sections.push({ title: 'Set your own code', step: steps.length + 1 });
  const lift = (id: string, to: V3, spin?: [number, number], from: V3 = ZERO): AssemblyStep['moves'] => [
    { group: id, from, to, ...(spin ? { spinFrom: spin[0], spinTo: spin[1] } : {}) },
  ];
  const OUT: V3 = [-85, 0, 75]; // the core, pulled up and set to the left
  const aside: V3 = [70, 0, 40];
  const up: V3 = [0, 0, 40];
  const turn = CODE_TURN * STEP;
  const code: [string, string, AssemblyStep['moves']][] = [
    ['F, H and I lift out', 'F', [...lift('F', OUT)!, ...lift('H', OUT)!, ...lift('I', OUT)!]],
    ['E lifts off', 'E', lift('E', aside)],
    ['G1 lifts out', 'G1', lift('G1', up)],
    ['G1 turns', 'G1', lift('G1', up, [0, turn], up)],
    ['G1 drops back', 'G1', lift('G1', ZERO, [turn, turn], up)],
    ['E goes back on', 'E', lift('E', ZERO, undefined, aside)],
    ['F, H and I go back in', 'F', [...lift('F', ZERO, undefined, OUT)!, ...lift('H', ZERO, undefined, OUT)!, ...lift('I', ZERO, undefined, OUT)!]],
  ];
  code.forEach(([label, group, moves], i) => steps.push({ kind: 'move', label, caption: CODE_STEPS[i], group, moves }));
  return { parts, thickness: 3, steps, groups, center: [c, c], sections };
}
