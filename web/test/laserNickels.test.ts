// Tests: the laser SVG builder and pixel text (tools kit/laserSvg, laserPixels), and every wooden nickel the build has made
// (web/public/laser/<game>/): only the three operation colors, real millimeter sizes, closed cut paths, and room to cut.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { arcText, lineText, mergeRuns } from '@lewismoten/gamemaker-sandbox-tools/kit/laserPixels';
import { CUT, ENGRAVE, LaserSheet, SCORE } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';

describe('laser SVG builder', () => {
  it('writes millimeter sizes with a matching viewBox and one color per operation', () => {
    const s = new LaserSheet(38.1, 38.1);
    s.add({ op: 'cut', k: 'circle', cx: 19.05, cy: 19.05, r: 19.05 });
    s.add({ op: 'score', k: 'circle', cx: 19.05, cy: 19.05, r: 15 });
    s.add({ op: 'engrave', k: 'ring', cx: 19.05, cy: 19.05, r0: 16, r1: 17 });
    const svg = s.svg('t');
    expect(svg).toContain('width="38.1mm" height="38.1mm" viewBox="0 0 38.1 38.1"');
    expect(svg).toContain(`stroke="${CUT}"`);
    expect(svg).toContain(`stroke="${SCORE}"`);
    expect(svg).toContain(`fill="${ENGRAVE}"`);
  });
  it('merges runs of pixels into few rectangles', () => {
    const r = mergeRuns({ w: 4, h: 3, on: () => true });
    expect(r).toEqual([[0, 0, 4, 3]]);
  });
  it('sets text from pixels, 2.5 mm tall letters, and round an arc', () => {
    const s = new LaserSheet(40, 40);
    expect(lineText(s, 'GOOD', 'pc', 20, 20, 0.36).h).toBeCloseTo(2.52, 2);
    expect(s.count('engrave')).toBeGreaterThan(4);
    const a = new LaserSheet(40, 40);
    expect(arcText(a, 'SANDBOX', 'micro', 20, 20, 15, 0.5, false)).toBeGreaterThan(30);
  });
});

const dir = join(__dirname, '../public/laser');
const games = existsSync(dir) ? readdirSync(dir).filter((g) => existsSync(join(dir, g, 'manifest.json'))) : [];

describe.skipIf(!games.length)('wooden nickels the build made', () => {
  for (const game of games)
    it(`${game}: three colors, real millimeters, closed cut paths`, () => {
      for (const file of ['front', 'back', 'sheet', 'sheet-back']) {
        const svg = readFileSync(join(dir, game, `${file}.svg`), 'utf8');
        const colors = new Set([...svg.matchAll(/(?:stroke|fill)="(#[0-9a-fA-F]{3,6})"/g)].map((m) => m[1].toLowerCase()));
        expect([...colors].every((c) => [CUT, SCORE, ENGRAVE].includes(c))).toBe(true);
        expect(svg).not.toMatch(/<text|font-family|transform=/);
        const m = svg.match(/width="([\d.]+)mm" height="([\d.]+)mm" viewBox="0 0 ([\d.]+) ([\d.]+)"/)!;
        expect(m).toBeTruthy();
        expect([m[1], m[2]]).toEqual([m[3], m[4]]);
        const [w, h] = [Number(m[1]), Number(m[2])];
        if (file.startsWith('sheet')) expect([w <= 270, h <= 480]).toEqual([true, true]);
        else expect([w, h]).toEqual([38.1, 38.1]);
        // every cut is a circle or a path that closes with Z
        const cut = svg.match(/<g id="cut"[^>]*>(.*?)<\/g>/s)![1];
        for (const p of cut.matchAll(/<path d="([^"]*)"/g)) expect(p[1].trim().endsWith('Z')).toBe(true);
        expect(cut.replace(/<circle [^>]*\/>|<path [^>]*\/>/g, '').trim()).toBe('');
        const cuts = (cut.match(/<circle/g) ?? []).length + (cut.match(/<path/g) ?? []).length;
        expect(cuts).toBe({ front: 1, back: 0, sheet: 13, 'sheet-back': 0 }[file]);
      }
      const man = JSON.parse(readFileSync(join(dir, game, 'manifest.json'), 'utf8'));
      expect(man.mm.coin).toBeCloseTo(38.1, 5);
      for (const t of [...man.texts.front, ...man.texts.back]) expect(t.capMm).toBeGreaterThanOrEqual(2.45);
    });
});
