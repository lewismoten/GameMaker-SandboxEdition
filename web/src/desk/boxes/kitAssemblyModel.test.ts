// Regressions for physical inventory, sliding poses, cut holes and the builders' assembly text.
import { describe, expect, it } from 'vitest';
import { assemblyModel, offsetAt } from './kitAssemblyModel';
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
      model.parts.forEach((p, i) => {
        expect(offsetAt(p, i, -1)).toEqual(p.explode);
        expect(offsetAt(p, i, i)).toEqual(p.explode);
        expect(offsetAt(p, i, i + 0.5)).toEqual(p.explode.map((v) => v / 2));
        expect(offsetAt(p, i, i + 1).every((v) => v === 0)).toBe(true);
        expect(offsetAt(p, i, model.parts.length + 1).every((v) => v === 0)).toBe(true);
      });
    });
    it('takes every caption from the existing assembly sheet', () => {
      const words = (s: string) =>
        s
          .replace(/<[^>]+>/g, ' ')
          .replace(/[’']/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      const source = words(instructions(0));
      for (const p of model.parts) expect(source, p.id).toContain(words(p.caption));
    });
    it('routes the manifest to assembly and draws its thumbnail assembled', () => {
      const kit = kitOf({ id: kind, kit: { title: 'Kit', summary: 'Plywood', previews: [{ file: 'sheet.png', alt: 'Cut sheet' }] } }, './laser/test/')!;
      expect(kit.assembly).toBe(kind);
      expect(stillThumb({ kind: 'kit', key: kind, title: 'Kit', kit })).toBeUndefined();
    });
  });

it('seats the cryptex stack on its pocket, with a hollow core and aligned ridge notches', () => {
  const m = assemblyModel('cryptex');
  expect(m.parts.filter((p) => p.name === 'PK').map((p) => p.origin[2])).toEqual([3, 6, 9, 12]);
  expect(m.parts.find((p) => p.name === 'R4B')!.origin[2]).toBe(15);
  expect(m.parts.find((p) => p.name === 'HEAD')!.origin[2]).toBe(39);
  expect(m.parts.find((p) => p.name === 'CORE0')!.cut).toHaveLength(1);
  expect(m.parts.filter((p) => p.name === 'COREC').every((p) => p.cut.length === 2)).toBe(true);
  expect(m.parts.filter((p) => p.name === 'WASH').every((p) => p.right[0] === 1)).toBe(true);
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
