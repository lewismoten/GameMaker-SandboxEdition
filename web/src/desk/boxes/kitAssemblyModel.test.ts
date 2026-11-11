// Regressions for physical inventory, sliding poses, cut holes and the builders' assembly text.
import { describe, expect, it } from 'vitest';
import { assemblyModel, poseAt } from './kitAssemblyModel';
import { makeParts as cryptexParts } from '../../../../games/year2000/laser/cryptexParts';
import { makeParts as plowedParts } from '../../../../games/snowbound/laser/plowedParts';
import { assemblySvg as cryptexInstructions } from '../../../../games/year2000/laser/cryptexSteps';
import { assemblySvg as plowedInstructions } from '../../../../games/snowbound/laser/plowedSteps';
import { kitOf } from './laserKits';
import { stillThumb } from './feelies';

for (const [kind, builder, instructions] of [
  ['plowed-street', plowedParts, plowedInstructions],
  ['cryptex', cryptexParts, cryptexInstructions],
] as const)
  describe(kind, () => {
    const model = assemblyModel(kind);
    const stock = builder(0);
    it('has one step per physical cut piece, with the exact nominal outline and holes', () => {
      expect(model.thickness).toBe(3);
      expect(new Set(model.parts.map((p) => p.id)).size).toBe(model.parts.length);
      for (const [name, made] of Object.entries(stock)) {
        const parts = model.parts.filter((p) => p.name === name);
        expect(parts, name).toHaveLength(made.qty);
        const cuts = made.part.sheet.items.filter((p) => p.op === 'cut');
        for (const p of parts) {
          expect(p.cut).toHaveLength(cuts.length);
          cuts.forEach((cut, i) => {
            if (cut.k === 'poly') expect(p.cut[i]).toEqual(cut.pts.map(([x, y]) => [x - 2, y - 2]));
            if (cut.k === 'circle') expect(p.cut[i][0]).toEqual([cut.cx - 2 + cut.r, cut.cy - 2]);
          });
        }
      }
    });
    it('only slides the current part; supports backward travel and clamps endpoints', () => {
      const own = (i: number) => model.steps.findIndex((s) => s.part === i);
      model.parts.forEach((_, i) => {
        const pose = (step: number) => poseAt(model, i, step).off;
        const hover = pose(-1);
        const seated = pose(own(i) + 1);
        expect(pose(own(i))).toEqual(hover);
        pose(own(i) + 0.5).forEach((v, j) => expect(v).toBeCloseTo((hover[j] + seated[j]) / 2));
        if (!model.groups.length) pose(own(i) + 3).forEach((v) => expect(v).toBeCloseTo(0));
      });
    });
    it('has a step for every part and a unique ID for each', () => {
      expect(model.parts.every((_, i) => model.steps.filter((s) => s.part === i).length === 1)).toBe(true);
    });
    it('takes every caption from the existing assembly sheet', () => {
      const words = (s: string) =>
        s
          .replace(/<[^>]+>/g, ' ')
          .replace(/[’']/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      const source = words(instructions(0));
      for (const s of model.steps) expect(source, s.label).toContain(words(s.caption));
    });
    it('routes the manifest to assembly and draws its thumbnail assembled', () => {
      const kit = kitOf({ id: kind, kit: { title: 'Kit', summary: 'Plywood', previews: [{ file: 'sheet.png', alt: 'Cut sheet' }] } }, './laser/test/')!;
      expect(kit.assembly).toBe(kind);
      expect(stillThumb({ kind: 'kit', key: kind, title: 'Kit', kit })).toBeUndefined();
    });
  });

describe('cryptex sub-assemblies', () => {
  const m = assemblyModel('cryptex');
  const at = (name: string) => m.parts.find((p) => p.name === name)!;
  it('seats the base layers, rings and head at the heights of the lock', () => {
    expect(m.parts.filter((p) => /^A\dR$/.test(p.name)).map((p) => p.origin[2])).toEqual([3, 6, 9, 12]);
    expect(at('B1').origin[2]).toBe(15);
    expect(at('E2').origin[2]).toBe(36);
    expect(at('HEAD').origin[2]).toBe(39);
    expect(at('CORE0').cut).toHaveLength(1);
    expect(m.parts.filter((p) => p.name === 'COREC').every((p) => p.cut.length === 2)).toBe(true);
  });
  it('keeps every ring slice hollow and gives the base plates a hollow ring', () => {
    for (const k of ['B1', 'C1', 'D1', 'E1', 'A2R']) expect(at(k).cut, k).toHaveLength(2);
  });
  it('builds each group, shows it finished, puts the groups together, then sets a code', () => {
    expect(m.groups.map((g) => g.id)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G4', 'G3', 'G2', 'G1', 'H', 'I']);
    expect(m.steps.filter((s) => s.kind === 'done')).toHaveLength(m.groups.length);
    expect(m.sections.map((s) => s.title)).toContain('Set your own code');
    const last = m.steps.length + 1;
    // lifted and turned washer: G1 is up and turned in the "G1 turns" step, back and seated at the end
    const turns = m.steps.findIndex((s) => s.label === 'G1 turns');
    const g1 = m.parts.findIndex((p) => p.group === 'G1');
    expect(poseAt(m, g1, turns + 1).spin).toBe(108);
    expect(poseAt(m, g1, turns + 1).off[2]).toBeGreaterThan(30);
    expect(poseAt(m, g1, last).off).toEqual([0, 0, 0]);
  });
  it('turns ring 1 so digit 2 is at the marker and leaves the other rings and washers unturned', () => {
    expect(
      poseAt(
        m,
        m.parts.findIndex((p) => p.name === 'E1'),
        99,
      ).spin,
    ).toBe(-72);
    expect(
      poseAt(
        m,
        m.parts.findIndex((p) => p.name === 'D1'),
        99,
      ).spin,
    ).toBe(0);
  });
  it('shows every engraved ID in the 3D parts', () => {
    expect(at('A2R').art.length).toBeGreaterThan(0);
    expect(at('G2').art.length).toBeGreaterThan(0);
  });
});

it('preserves the Plowed Street drawer lug, street slots and mirrored right wall', () => {
  const m = assemblyModel('plowed-street');
  const get = (name: string) => m.parts.find((p) => p.name === name)!;
  expect(get('T').cut).toHaveLength(3);
  expect(get('L').cut).toHaveLength(3);
  expect(get('P').cut).toHaveLength(2);
  expect(get('R').right).toEqual([0, -1, 0]);
  expect(get('DK').origin[2]).toBe(31.7);
  expect(get('F').origin[2]).toBe(26);
  expect(get('PL').origin[2]).toBe(29);
  expect(get('DK').cut[0].length).toBeGreaterThan(4);
});
