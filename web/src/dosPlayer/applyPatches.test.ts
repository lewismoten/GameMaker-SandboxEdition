// The DOS player customizer's patching against the CD's XFERPLAY.EXE, and reading back the
// hand-edited players of the 1990s (Builder's and Rōdïp's, from the scratchpad archive, when
// it is there).
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { applyPlayerPatches, readPlayerPatches, STOCK_PLAYER_MD5 } from './applyPatches';
import { md5Hex } from './md5';
import { PATCHES } from './patchTable';
import { patchProblem, readPatch, cleanPatches } from './patchRules';
import { renamedExtensions } from './renamedExtensions';
import { PLAYER_PRESETS } from './presets';
import { playerRecord, recordPatches } from './playerRecord';

const exe = new Uint8Array(readFileSync(new URL('../../../cd/gm/xferplay.exe', import.meta.url)));
const ARCHIVE = '/private/tmp/claude-501/-Users-lewismoten-dev-GameMaker/e139be0f-458e-435b-825a-5595bd4c49ab/scratchpad/arch2/';
const archived = (path: string) => (existsSync(ARCHIVE + path) ? new Uint8Array(readFileSync(ARCHIVE + path)) : undefined);

describe('the patch table', () => {
  it('has the CD player’s own value for every entry', () => {
    expect(md5Hex(exe)).toBe(STOCK_PLAYER_MD5);
    for (const e of PATCHES) {
      const v = readPatch(exe, e);
      if (e.kind === 'text' || e.kind === 'format') {
        expect(v, e.id).toBe(e.stock.trimEnd());
        expect(exe[e.offset + e.length], e.id).toBe(0);
        expect(exe[e.offset - 1], e.id).toBe(0);
      } else expect(v, e.id).toEqual(e.kind === 'fkey' ? 'on' : e.stock);
      expect(patchProblem(e, e.kind === 'fkey' ? 'on' : e.stock), e.id).toBeUndefined();
    }
    expect(new Set(PATCHES.map((e) => e.id)).size).toBe(PATCHES.length);
  });

  it('hashes as RFC 1321 says', () => {
    expect(md5Hex(new TextEncoder().encode('abc'))).toBe('900150983cd24fb0d6963f7d28e17f72');
    expect(md5Hex(new Uint8Array())).toBe('d41d8cd98f00b204e9800998ecf8427e');
  });
});

describe('applyPlayerPatches', () => {
  it('writes words padded with spaces, keeping the 0 after them', () => {
    const out = applyPlayerPatches(exe, { 'str.menu.play': 'Go', 'str.invent.hitpoints': 'Energy: %d' });
    expect(Buffer.from(out.subarray(0x2575b, 0x25760)).toString('latin1')).toBe('Go  \0');
    expect(Buffer.from(out.subarray(0x25b59, 0x25b67)).toString('latin1')).toBe('Energy: %d   \0');
    expect(out.length).toBe(exe.length);
    expect(md5Hex(exe)).toBe(STOCK_PLAYER_MD5); // the input is never changed
  });

  it('writes colors, selectors, frames, twins and keys', () => {
    const out = applyPlayerPatches(exe, {
      'color.rgb.blue': [63, 63, 63],
      'color.select.status': 'hsGreen',
      'border.invent.inner': [10, 10, 310, 190],
      'border.marker.width': 7,
      'timing.showGraphic.gif': 65535,
      'table.fkeys.F5': 'off',
    });
    expect([out[0x16354], out[0x16359], out[0x1635e]]).toEqual([63, 63, 63]);
    expect([out[0xe036], out[0xe037]]).toEqual([0x00, 0x16]);
    expect([out[0xe064], out[0xe062], out[0xe05f], out[0xe060], out[0xe05c]]).toEqual([10, 10, 310 & 255, 1, 190]);
    expect([out[0xaa90], out[0xabae]]).toEqual([7, 7]);
    expect([out[0xbe10], out[0xbe11]]).toEqual([255, 255]);
    expect([out[0xcce8], out[0xcce9]]).toEqual([0xf9, 0x28]);
    expect(readPlayerPatches(out)?.patches).toEqual({
      'color.rgb.blue': [63, 63, 63],
      'color.select.status': 'hsGreen',
      'border.invent.inner': [10, 10, 310, 190],
      'border.marker.width': 7,
      'timing.showGraphic.gif': 65535,
      'table.fkeys.F5': 'off',
    });
  });

  it('refuses any other file, and every patch that breaks the rules', () => {
    const other = exe.slice();
    other[100] ^= 1;
    expect(() => applyPlayerPatches(other, {})).toThrow(/not the Game-Maker 3.00/);
    const bad: Record<string, unknown>[] = [
      { 'str.menu.play': 'Start' }, // grows
      { 'str.menu.quit': 'Finé' }, // past 0x7E
      { 'str.invent.score': 'Score %d' }, // a different % code
      { 'str.invent.lives': 'Lives 100%' }, // a stray %
      { 'layout.menu.play.y': 128 }, // past a push imm8
      { 'color.rgb.red': [64, 0, 0] },
      { 'color.select.menu': 'black' },
      { 'border.drop.outer': [10, 10, 330, 190] },
      { 'table.fkeys.F10': 'off' }, // not offered
      { 'str.about.rsd': 'Me' }, // RSD's credit is kept
    ];
    for (const p of bad) expect(() => applyPlayerPatches(exe, p as never), JSON.stringify(p)).toThrow();
    expect(cleanPatches({ 'str.menu.play': 'Play', 'str.menu.quit': 'Exit', nope: 1 })).toEqual({ 'str.menu.quit': 'Exit' });
  });
});

describe('readPlayerPatches', () => {
  it('finds nothing in the CD’s player', () => {
    expect(readPlayerPatches(exe)).toEqual({ patches: {}, explained: true, unreadable: [] });
    expect(readPlayerPatches(exe.subarray(1))).toBeUndefined();
  });

  const builder = archived('game-maker_builder/BUILDER.EXE');
  it.skipIf(!builder)('reads Builder’s blanked menu and high-score words', () => {
    const r = readPlayerPatches(builder!)!;
    expect(r.explained).toBe(true);
    expect(r.patches).toEqual({
      'str.menu.play': '',
      'str.menu.instructions': '',
      'str.menu.storyline': '',
      'str.menu.credits': '',
      'str.menu.highScores': '',
      'str.menu.quit': '',
      'str.hiscore.title': '',
      'str.hiscore.anyKey': '',
    });
    expect(md5Hex(applyPlayerPatches(exe, r.patches))).toBe(md5Hex(builder!));
  });

  const rover = archived('game-maker_rodip-river-of-the-deep/rover.exe');
  it.skipIf(!rover)('reads Rōdïp’s renamed status words', () => {
    const r = readPlayerPatches(rover!)!;
    expect(r.patches['str.invent.hitpoints']).toBe('Energy:    %d');
    expect(r.patches['str.invent.lives']).toBe('Failsafes: %d');
    expect(r.patches['str.hiscore.title']).toBe('');
    expect(r.explained).toBe(true);
    expect(md5Hex(applyPlayerPatches(exe, r.patches))).toBe(md5Hex(rover!));
  });

  const acord = archived('game-maker_anyworld/ANYWORLD.EXE');
  it.skipIf(!acord)('sees Acord Games’ renamed extensions', () => {
    expect(readPlayerPatches(acord!)?.explained).toBe(false);
    expect(renamedExtensions(acord!)).toEqual({
      '.gam': '.z0g',
      '.rec': '.z0r',
      '.gif': '.z0n',
      '.bkd': '.z0j',
      '.fli': '.z0p',
      '.txt': '.z0l',
      '.sav': '.z0m',
      '.his': '.z0h',
    });
    expect(renamedExtensions(exe)).toEqual({});
  });
});

describe('presets and the companion record', () => {
  it('keeps every preset within the rules', () => {
    for (const p of PLAYER_PRESETS) if (p.patches) expect(() => applyPlayerPatches(exe, p.patches!), p.id).not.toThrow();
  });

  it('keeps only valid patches, under its base', () => {
    expect(playerRecord({ 'str.menu.play': 'Play' })).toBeUndefined();
    expect(playerRecord({ 'str.menu.quit': 'Exit', 'str.menu.play': 'Startup' })).toEqual({ base: 'xferplay-3.00', patches: { 'str.menu.quit': 'Exit' } });
    expect(recordPatches({ base: 'playgame-3.00', patches: { 'str.menu.quit': 'Exit' } })).toEqual({});
  });
});
