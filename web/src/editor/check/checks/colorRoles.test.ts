// The level check's color roles check (colorRoles.ts): blocks drawn with another role's colors.
import { describe, expect, it } from 'vitest';
import { emptyBlock } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { GameFiles } from '../../../project/files';
import { runChecks } from '../report';
import { testGame } from '../testGame';
import type { PaletteReservation } from '../../editors/palette/paletteReservations';
import { colorRoles, foreignColors } from './colorRoles';
import { scenesOf } from '../sceneData';

const ranges: PaletteReservation[] = [
  { role: 'character', first: 10, last: 19 },
  { role: 'monster', first: 40, last: 49 },
  { role: 'background', first: 100, last: 120 },
];

describe('foreignColors', () => {
  it('ignores own, global, 0 and 255 colors', () => {
    const b = emptyBlock(0);
    b.pixels.fill(255);
    b.pixels[0] = 0;
    b.pixels[1] = 12;
    b.pixels[2] = 200;
    expect(foreignColors(b, 'character', ranges).size).toBe(0);
  });
  it('lists other roles’ colors by role', () => {
    const b = emptyBlock(0);
    b.pixels[0] = 40;
    b.pixels[1] = 41;
    b.pixels[2] = 110;
    expect(Object.fromEntries(foreignColors(b, 'character', ranges))).toEqual({ monster: [40, 41], background: [110] });
  });
});

describe('colorRoles', () => {
  const t = testGame(['######', '#S..E#', '######']);
  const scenes = () => scenesOf(t.game, t.files);
  it('finds nothing without reservations', () => {
    expect(colorRoles(scenes(), undefined)).toEqual([]);
    expect(colorRoles(scenes(), [])).toEqual([]);
  });
  it('names the file, block, colors and role', () => {
    // test game walls are color 7, coins 14, spikes 12 (all global here); reserve 12 for monsters
    const f = colorRoles(scenes(), [{ role: 'monster', first: 12, last: 14 }]);
    expect(f.length).toBeGreaterThan(0);
    expect(f[0]).toMatchObject({ check: 'color-roles', severity: 'warning' });
    expect(f[0].title).toMatch(/^Background block \d+ in .*\.bbl draws with colors? .*reserves for monsters$/);
  });
  it('runs in the whole-game check and is quiet without reservations', async () => {
    const quiet = await runChecks(new GameFiles(t.files), { play: false });
    expect(quiet.findings.filter((x) => x.check === 'color-roles')).toHaveLength(0);
    const r = await runChecks(new GameFiles(t.files), { play: false, reservations: [{ role: 'monster', first: 12, last: 14 }] });
    expect(r.findings.some((x) => x.check === 'color-roles')).toBe(true);
  });
});
