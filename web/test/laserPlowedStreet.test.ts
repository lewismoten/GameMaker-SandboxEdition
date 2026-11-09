// Tests: Snowbound's Plowed Street box (games/snowbound/laser): red stroke-only cuts and blue fill-only engraving (never magenta
// score), every sheet inside the Glowforge bed, cuts outside all engraving, no two elements too close, the kerf a parameter, and
// a lock that opens the drawer only when the plow stands at LaVale Mall (every reachable place is walked).
import { describe, expect, it } from 'vitest';
import { BED } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';
import { CUT, ENGRAVE } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';
import { buildPlowedStreet } from '../../games/snowbound/laser/plowedBuild';
import { MALL, PITCH, STEM, STREET, STREETS, checkLock, plate } from '../../games/snowbound/laser/plowedDims';
import { assemblySvg } from '../../games/snowbound/laser/plowedSteps';

const box = buildPlowedStreet();

describe('Plowed Street box sheets', () => {
  it('uses only red cut strokes and blue engrave fills, one pass, inside the bed', () => {
    expect(box.sheets).toHaveLength(4);
    for (const s of box.sheets) {
      const svg = s.sheet.svg(s.title);
      const colors = new Set([...svg.matchAll(/(?:stroke|fill)="(#[0-9a-f]{6})"/gi)].map((m) => m[1].toLowerCase()));
      expect([...colors].every((c) => [CUT, ENGRAVE].includes(c))).toBe(true);
      expect(svg).not.toMatch(/<text|font-family|transform=|#ff00ff|id="score"/);
      expect(s.sheet.w).toBeLessThanOrEqual(BED.w);
      expect(s.sheet.h).toBeLessThanOrEqual(BED.h);
      const cut = svg.match(/<g id="cut"[^>]*>(.*?)<\/g>/s)![1];
      for (const p of cut.matchAll(/<path d="([^"]*)"/g)) expect(p[1].trim().endsWith('Z')).toBe(true);
    }
  });
  it('puts every cut outside all engraving, and no two elements too close', () => {
    expect(box.problems).toEqual([]);
    for (const c of Object.values(box.clearance)) expect(c).toEqual([]);
  });
  it('places every part once per its quantity', () => {
    const placed = box.sheets.flatMap((s) => s.placed.map((p) => p.name));
    for (const m of Object.values(box.parts)) expect(placed.filter((n) => n === m.part.name)).toHaveLength(m.qty);
  });
  it('takes the kerf as a parameter: parts grow by half a kerf each side, holes shrink', () => {
    const a = buildPlowedStreet(0, false);
    const b = buildPlowedStreet(0.4, false);
    const width = (n: string, k: typeof a, i: number) => {
      const it = k.parts[n].part.sheet.items[i] as unknown as { pts: number[][] };
      const xs = it.pts.map((p) => p[0]);
      return Math.max(...xs) - Math.min(...xs);
    };
    expect(width('P', b, 0) - width('P', a, 0)).toBeCloseTo(0.4, 6);
    expect(width('T', a, 1) - width('T', b, 1)).toBeCloseTo(0.4, 6);
  });
  it('writes an assembly sheet with every card', () => {
    const svg = assemblySvg();
    for (const t of ['1. Box', '2. Shelf and plate', '3. Knobs', '4. Drawer', '5. Check', '6. Lid']) expect(svg).toContain(t);
  });
});

describe('Plowed Street street map', () => {
  it('is a tree (no loops), so no piece of the lid is cut loose', () => {
    const cells = new Set(STREETS.flatMap(([a, b, c, d]) => [`${a},${b}`, `${c},${d}`]));
    expect(STREETS.length).toBe(cells.size - 1);
  });
  it('keeps the walls between streets at least as thick as the plywood', () => {
    expect(PITCH - STREET).toBeGreaterThanOrEqual(3);
  });
  it('gives a stem a sliding fit in a street', () => {
    expect(STREET - 0.2 - STEM).toBeGreaterThan(0.4);
    expect(plate.channelHalf * 2).toBeGreaterThan(5 + 1);
  });
});

describe('Plowed Street lock', () => {
  const lock = checkLock(0.2);
  it('opens the drawer from LaVale Mall and from nowhere else on the map', () => {
    expect(lock.startReachesMall).toBe(true);
    expect(lock.openCells).toEqual([`${MALL[0]},${MALL[1]}`]);
  });
  it('keeps the lug in the bay and the plate in the box wherever the knobs can reach', () => {
    expect(lock.alwaysContained).toBe(true);
  });
  it('needs a real route (12 streets), and the locked drawer opens under 2.5 cm', () => {
    expect(lock.shortest).toBe(12);
    expect(lock.maxRattle).toBeLessThan(25);
  });
  it('still works at the kerfs a laser might have (0.1 to 0.3 mm)', () => {
    for (const k of [0.1, 0.3]) {
      const l = checkLock(k);
      expect(l.startReachesMall).toBe(true);
      expect(l.openCells).toEqual(['6,2']);
    }
  });
});
