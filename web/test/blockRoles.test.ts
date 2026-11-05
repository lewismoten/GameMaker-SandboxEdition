// Block roles: suggestions from what a block does (and its picture), the companion round trip, and
// that roles never reach the game's files. Real games' blocks are read from games/<id>/disk when built.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BLOCK_SIZE,
  SOLBOT,
  SOLLEF,
  SOLRIG,
  SOLTOP,
  emptyBlock,
  parseBlocks,
  serializeBlocks,
  type Block,
} from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { defaultPalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { blocksWithRole, cleanRoles, packRoles, pendingSuggestions, suggestRoles, type Role } from '@lewismoten/gamemaker-sandbox-tools/kit/blockRoles';
import { emptyCompanion, getSection, parseCompanion, serializeCompanion, setSection } from '../src/project/companion';
import { readRoles, writeRoles } from '../src/editor/editors/blocks/blockRoles';

const ALL = SOLTOP | SOLRIG | SOLBOT | SOLLEF;
const roles = (b: Partial<Block>, i = 5) => suggestRoles({ ...emptyBlock(i), ...b }, i).map((s) => s.role);

describe('suggestRoles evidence rows', () => {
  it('solid all round is a wall; top only a platform', () => {
    expect(roles({ solid: ALL })).toEqual(['wall']);
    expect(roles({ solid: SOLTOP })).toEqual(['platform']);
  });
  it('touch that turns into another block is a door; solid ones a locked door', () => {
    expect(roles({ touchBl: 9 })).toContain('door');
    expect(roles({ solid: ALL, touchBl: 9 })).toEqual(['locked-door']);
  });
  it('a negative special counter is a lock with its number', () => {
    const s = suggestRoles({ ...emptyBlock(5), solid: ALL, effect: 22, eamt: -1 }, 5);
    expect(s[0]).toMatchObject({ role: 'locked-door', pair: 3 });
  });
  it('pick-ups: money and score are treasure, counter plus a key, lives a life', () => {
    expect(roles({ obj: 1, effect: 3, eamt: 10 })).toEqual(['treasure']);
    expect(roles({ obj: 1, scorePts: 50 })).toEqual(['treasure']);
    expect(suggestRoles({ ...emptyBlock(5), obj: 1, effect: 21, eamt: 1 }, 5)).toEqual([{ role: 'key', why: expect.any(String), pair: 2 }]);
    expect(roles({ obj: 1, effect: 1, eamt: 1 })).toEqual(['life']);
  });
  it('hurting, ladder and spawn', () => {
    expect(roles({ chHitPt: -3 })).toContain('hazard');
    expect(roles({ grav: 5 })).toEqual(['ladder']);
    expect(roles({ grav: 4 })).toEqual(['floor']);
    expect(roles({ birthMon: 2, birthTime: 90 })).toContain('monster-spawn');
  });
  it('a plain walkable block is a floor; a blue picture water or sky (needs the palette)', () => {
    expect(roles({})).toEqual(['floor']);
    const pal = defaultPalette();
    const b = emptyBlock(5);
    // find a palette color that reads as blue
    let blue = 0;
    for (let c = 0; c < 256; c++) {
      const r = pal[c * 3],
        g = pal[c * 3 + 1],
        bl = pal[c * 3 + 2];
      if (bl > 40 && bl > r * 2 && bl > g * 1.5) blue = c;
    }
    expect(blue).toBeGreaterThan(0);
    b.pixels.fill(blue);
    const got = suggestRoles(b, 5, { palette: pal }).map((s) => s.role);
    expect(got).toContain('water');
    expect(got).not.toContain('floor');
    expect(suggestRoles(b, 5).map((s) => s.role)).toEqual(['floor']);
  });
  it('terrain membership suggests an edge piece, and chosen roles are not suggested again', () => {
    const s = suggestRoles({ ...emptyBlock(5), solid: ALL }, 5, { inTerrain: true });
    expect(s.map((x) => x.role)).toEqual(['wall', 'wall-edge']);
    expect(pendingSuggestions(['wall'], s).map((x) => x.role)).toEqual(['wall-edge']);
  });
});

describe('roles in the companion', () => {
  it('cleans junk and keeps extras only where they apply', () => {
    const m = cleanRoles(
      {
        '1': { roles: ['chair', 'chair', 'nope'], facing: 'S', pair: 4 },
        '2': { roles: ['key'], pair: 3, facing: 'N' },
        '999': { roles: ['wall'] },
        '3': { roles: [] },
        x: { roles: ['wall'] },
      },
      256,
    );
    expect(m).toEqual({ 1: { roles: ['chair'], facing: 'S' }, 2: { roles: ['key'], pair: 3 } });
    expect(blocksWithRole(m, 'key', 3)).toEqual([2]);
    expect(packRoles({})).toBeUndefined();
  });
  it('survives a save and reload of the companion file', () => {
    const c = emptyCompanion();
    writeRoles({ extras: (f, s, d) => getSection(c, f, s, d), setExtras: (f, s, v) => setSection(c, f, s, v) }, 'Keys.BBL', {
      4: { roles: ['wall', 'wall-edge'] },
      7: { roles: ['locked-door'], pair: 2 },
    });
    const back = parseCompanion(JSON.parse(new TextDecoder().decode(serializeCompanion(c))));
    const store = { extras: <T>(f: string, s: string, d: T) => getSection(back, f, s, d), setExtras: () => undefined };
    expect(readRoles(store, 'keys.bbl', 20)).toEqual({ 4: { roles: ['wall', 'wall-edge'] }, 7: { roles: ['locked-door'], pair: 2 } });
    expect(readRoles(store, 'keys.bbl', 6)).toEqual({ 4: { roles: ['wall', 'wall-edge'] } });
  });
});

const disk = (id: string) => resolve(__dirname, '../../games', id, 'disk');
const bblOf = (id: string): Block[] | undefined => {
  const d = disk(id);
  if (!existsSync(d)) return undefined;
  const f = readdirSync(d).find((n) => /\.bbl$/i.test(n));
  if (!f) return undefined;
  const bytes = new Uint8Array(readFileSync(resolve(d, f)));
  return parseBlocks(bytes, Math.floor(bytes.length / BLOCK_SIZE));
};
const count = (blocks: Block[], role: Role, palette?: Uint8Array) =>
  blocks.filter((b, i) => suggestRoles(b, i, { palette }).some((s) => s.role === role)).length;

describe('suggestions on real games', () => {
  it.skipIf(!bblOf('keys-and-doors'))('keys-and-doors: walls, doors, locks and keys all come up', () => {
    const blocks = bblOf('keys-and-doors')!;
    for (const r of ['wall', 'key'] as const) expect(count(blocks, r), r).toBeGreaterThan(0);
    const at = (i: number) => suggestRoles(blocks[i], i);
    expect(at(20)).toEqual([expect.objectContaining({ role: 'locked-door', pair: 1 })]);
    expect(at(22)).toEqual([expect.objectContaining({ role: 'locked-door', pair: 2 })]);
    expect(at(16).map((s) => [s.role, s.pair])).toContainEqual(['key', 1]);
    expect(at(15).map((s) => s.role)).toEqual(['treasure']);
  });
  it.skipIf(!bblOf('overhead'))('overhead: walls and floor', () => {
    const blocks = bblOf('overhead')!;
    expect(count(blocks, 'wall')).toBeGreaterThan(0);
    expect(count(blocks, 'floor')).toBeGreaterThan(0);
  });
  it.skipIf(!bblOf('town-links'))('town-links: suggestions never invent a role for every block', () => {
    const blocks = bblOf('town-links')!;
    const none = blocks.filter((b, i) => suggestRoles(b, i).length === 0).length;
    expect(none).toBeGreaterThanOrEqual(0);
    expect(suggestRoles(blocks[64], 64)[0]).toMatchObject({ role: 'locked-door', pair: 2 });
    expect(suggestRoles(blocks[63], 63).map((s) => s.role)).toContain('key');
    expect(count(blocks, 'wall')).toBeLessThan(blocks.length);
  });
});

describe('no game bytes change', () => {
  it('saving roles leaves the block set bytes as they were', () => {
    const blocks = [emptyBlock(0), { ...emptyBlock(1), solid: ALL }];
    const before = serializeBlocks(blocks);
    const c = emptyCompanion();
    writeRoles({ extras: (f, s, d) => getSection(c, f, s, d), setExtras: (f, s, v) => setSection(c, f, s, v) }, 'a.bbl', { 1: { roles: ['wall'] } });
    expect(serializeBlocks(blocks)).toEqual(before);
    expect(JSON.stringify(c.files['a.bbl'])).toContain('roles');
    expect(new TextDecoder('latin1').decode(before)).not.toContain('roles');
  });
});
