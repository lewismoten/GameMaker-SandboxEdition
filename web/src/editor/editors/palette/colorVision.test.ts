// The color vision check: the published simulation matrices, CIELAB round trips, and the
// warnings (touching colors, a monster on its floor, ramp steps) with their palette-only fixes.
import { describe, expect, it } from 'vitest';
import { VIEWS, deltaE, lab, labs, seen, simulate, unlab } from './colorVision';
import { ALIKE, STEP, analyze, fixFor, warnings, whereTouch, type VisionScene } from './visionWarnings';
import { luminance } from '../../check/sceneData';
import { newBlockSet } from '../../../formats/blocks';
import { MLEN, newMap } from '../../../formats/map';
import { newMonsterSet } from '../../../formats/monster';
import { parsePalette, serializePalette } from '../../../formats/palette';

/** A dark red and a dark green that deuteranopia (only) makes look alike. */
const RED = [20, 4, 4];
const GREEN = [4, 16, 4];

function palette(): Uint8Array {
  const p = new Uint8Array(768);
  p.set(RED, 3);
  p.set(GREEN, 6);
  p.set([63, 63, 63], 15 * 3);
  return p;
}

/** A map of red blocks with a column of green ones at x = 50 (and a monster on it). */
function scene(): VisionScene {
  const map = newMap();
  const bbl = newBlockSet('bbl');
  bbl[0].pixels.fill(1);
  bbl[1].pixels.fill(2);
  map.blocks.fill(0);
  for (let y = 0; y < 100; y++) map.blocks[y * MLEN + 50] = 1;
  return { map, bbl, mbl: newBlockSet('mbl'), mon: newMonsterSet() };
}

describe('simulation', () => {
  it('uses Machado et al. 2009 (severity 1) in linear RGB', () => {
    const p = new Uint8Array(768);
    p.set([63, 0, 0], 3);
    const [r, g, b] = seen(p, 1, 'deutan');
    expect(r).toBeCloseTo(0.367322, 5);
    expect(g).toBeCloseTo(0.280085, 5);
    expect(b).toBe(0); // -0.011820 clamps
  });

  it('keeps white white and black black in every view', () => {
    const p = palette();
    for (const v of VIEWS) {
      expect([...simulate(p, v.id).subarray(45, 48)]).toEqual([63, 63, 63]);
      expect([...simulate(p, v.id).subarray(0, 3)]).toEqual([0, 0, 0]);
    }
  });

  it('shows grayscale as the WCAG luminance the Level check uses', () => {
    const p = palette();
    const [y] = seen(p, 1, 'gray');
    expect(y).toBeCloseTo(luminance(p, 1), 10);
    const g = simulate(p, 'gray');
    expect(g[3]).toBe(g[4]);
    expect(g[4]).toBe(g[5]);
  });

  it('round-trips CIELAB', () => {
    const c: [number, number, number] = [0.2, 0.5, 0.05];
    unlab(lab(c)).forEach((v, i) => expect(v).toBeCloseTo(c[i], 4));
  });

  it('parts red and green normally but not with deuteranopia', () => {
    const p = palette();
    expect(deltaE(labs(p, 'normal'), 1, 2)).toBeGreaterThan(40);
    expect(deltaE(labs(p, 'deutan'), 1, 2)).toBeLessThan(ALIKE);
    expect(deltaE(labs(p, 'protan'), 1, 2)).toBeGreaterThan(ALIKE);
  });
});

describe('warnings', () => {
  it('lists touching colors that look alike, and shows where', () => {
    const s = scene();
    const an = analyze(s);
    const w = warnings(palette(), an);
    const pair = w.find((x) => x.kind === 'pair');
    expect(pair).toMatchObject({ a: 1, b: 2, views: ['deutan'] });
    // each of 100 rows: the green column's left and right edges, 20 pixels each
    expect(pair?.kind === 'pair' && pair.count).toBe(100 * 2 * 20);
    expect([49, 50].includes(whereTouch(an, 1, 2) % MLEN)).toBe(true);
  });

  it('says nothing about colors that already look alike (texture) or far apart in every view', () => {
    const p = palette();
    p.set([20, 5, 4], 6); // a red one step from color 1
    expect(warnings(p, analyze(scene())).filter((w) => w.kind === 'pair')).toEqual([]);
    p.set([60, 60, 20], 6); // pale yellow on dark red: apart for everyone
    expect(warnings(p, analyze(scene())).filter((w) => w.kind === 'pair')).toEqual([]);
  });

  it('finds a monster the color of the scenery it stands in', () => {
    const s = scene();
    s.bbl[1].pixels.fill(1); // all red
    s.mbl[0].pixels.fill(255);
    s.mbl[0].pixels.fill(2, 100, 300); // a green monster
    s.mon[3].pic[0] = [0, 1];
    s.map.monsters[0] = { monnum: 3, status: 0, xtra: 0, curx: 10, cury: 20, extra: 0 };
    const w = warnings(palette(), analyze(s)).find((x) => x.kind === 'monster');
    expect(w).toMatchObject({ n: 3, color: 2, behind: 1, cell: 20 * MLEN + 10, views: ['deutan'] });
  });

  it('finds ramp steps too close to see, and evens them out', () => {
    const p = new Uint8Array(768);
    p.set([0, 0, 63], 9 * 3); // a blue that is no shade of the greens
    const greens = [10, 20, 21, 40, 60];
    greens.forEach((g, k) => p.set([2 + k * 2, g, 2 + k * 2], (10 + k) * 3));
    const s = scene();
    s.bbl[0].pixels.fill(12);
    s.bbl[1].pixels.fill(12);
    const an = analyze(s);
    const w = warnings(p, an).find((x) => x.kind === 'ramp');
    expect(w).toMatchObject({ ramp: [10, 11, 12, 13, 14], step: [11, 12] });
    const fix = fixFor(p, w!, an);
    expect(fix?.label).toBe('Even out colors 10–14');
    const after = labs(fix!.pal, 'normal');
    for (let c = 10; c < 14; c++) expect(deltaE(after, c, c + 1)).toBeGreaterThan(STEP);
    expect(warnings(fix!.pal, an).some((x) => x.kind === 'ramp')).toBe(false);
  });
});

describe('fixes', () => {
  it('relights one color so the pair parts in every view, as ordinary palette data', () => {
    const p = palette();
    const s = scene();
    // red is used far more, so the green column is the one changed
    const an = analyze(s);
    const w = warnings(p, an).find((x) => x.kind === 'pair')!;
    const fix = fixFor(p, w, an)!;
    expect(fix.label).toMatch(/^Make color 2 (lighter|darker)$/);
    const changed = [...Array(256).keys()].filter((i) => [0, 1, 2].some((c) => fix.pal[i * 3 + c] !== p[i * 3 + c]));
    expect(changed).toEqual([2]);
    expect(warnings(fix.pal, an).some((x) => x.id === w.id)).toBe(false);
    for (const v of VIEWS) expect(deltaE(labs(fix.pal, v.id), 1, 2)).toBeGreaterThan(ALIKE);
    // a DOS palette still: 768 bytes of 0..63, unchanged by a save and load
    expect(fix.pal.length).toBe(768);
    expect(fix.pal.every((v) => v >= 0 && v <= 63)).toBe(true);
    expect([...parsePalette(serializePalette(fix.pal))]).toEqual([...fix.pal]);
    // the palette it was offered for is untouched
    expect([...p.subarray(3, 9)]).toEqual([...RED, ...GREEN]);
  });

  it('offers no fix that would make another level worse', () => {
    const p = palette();
    p.set([20, 26, 4], 9); // color 3: an olive between them in another level
    const an = analyze(scene());
    const other = scene();
    other.bbl[0].pixels.fill(3);
    const w = warnings(p, an).find((x) => x.kind === 'pair')!;
    const anOther = analyze(other);
    const fix = fixFor(p, w, an, [an, anOther]);
    if (fix) {
      const before = new Set(warnings(p, anOther).map((x) => x.id));
      expect(warnings(fix.pal, anOther).every((x) => before.has(x.id))).toBe(true);
    }
  });
});
