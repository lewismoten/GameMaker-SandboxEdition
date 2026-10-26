// Renamed file extensions: every copy of each in XFERPLAY 3.00, the rules a new one keeps, and
// Acord Games' set matching their NEVER.EXE (from the scratchpad archive, when it is there).
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { applyPlayerPatches, readPlayerPatches } from './applyPatches';
import { ACORD_EXTENSIONS, EXT_KINDS, extId, extValueProblem, extensionClashes, renamedExtensions, withoutExtensions } from './fileExtensions';
import { cleanPatches } from './patchRules';
import { playerChanges, renamedFiles } from './describePatches';
import { md5Hex } from './md5';

const exe = new Uint8Array(readFileSync(new URL('../../../cd/gm/xferplay.exe', import.meta.url)));
const NEVER =
  '/private/tmp/claude-501/-Users-lewismoten-dev-GameMaker/e139be0f-458e-435b-825a-5595bd4c49ab/scratchpad/arch2/game-maker_zapper-4-escape-from-neverwhere/NEVER.EXE';
const text = (b: Uint8Array, at: number, n: number) => Buffer.from(b.subarray(at, at + n)).toString('latin1');
const acord = Object.fromEntries(Object.entries(ACORD_EXTENSIONS).map(([e, v]) => [extId(e), v]));

describe('the player’s extensions', () => {
  it('finds each one, 0-ended, at every offset in the CD’s player', () => {
    for (const k of EXT_KINDS) for (const o of k.offsets) expect(text(exe, o, 5), `${k.ext} @ ${o.toString(16)}`).toBe(`.${k.ext}\0`);
    expect(EXT_KINDS.filter((k) => k.offsets.length).map((k) => k.ext)).toEqual(['gam', 'gif', 'bkd', 'fli', 'txt', 'lst', 'rec', 'voc', 'his', 'sav', 'dat']);
  });

  it('patches every copy of each kind, and only those bytes', () => {
    for (const k of EXT_KINDS) {
      const out = applyPlayerPatches(exe, { [extId(k.ext)]: 'q1_' });
      const changed = [...out.keys()].filter((i) => out[i] !== exe[i]);
      expect(changed, k.ext).toEqual(k.offsets.flatMap((o) => [o + 1, o + 2, o + 3]).sort((a, b) => a - b));
      for (const o of k.offsets) expect(text(out, o, 5)).toBe('.q1_\0');
      if (k.offsets.length) expect(readPlayerPatches(out)).toEqual({ patches: { [extId(k.ext)]: 'q1_' }, explained: true, unreadable: [] });
    }
  });

  it('keeps the CD’s player byte for byte when every kind keeps its own', () => {
    const own = Object.fromEntries(EXT_KINDS.map((k) => [extId(k.ext), k.ext.toUpperCase()]));
    expect(md5Hex(applyPlayerPatches(exe, own))).toBe(md5Hex(exe));
    expect(cleanPatches(own)).toEqual({});
    expect(playerChanges(own)).toEqual([]);
  });
});

describe('a new extension', () => {
  it('is 3 DOS characters, not another kind’s or a DOS file’s', () => {
    expect(extValueProblem('gif', 'z0n')).toBeUndefined();
    expect(extValueProblem('gif', 'Z0N')).toBeUndefined();
    expect(extValueProblem('gif', 'gif')).toBeUndefined();
    expect(extValueProblem('gif', 'z0')).toMatch(/3 characters/);
    expect(extValueProblem('gif', 'z0nn')).toMatch(/3 characters/);
    expect(extValueProblem('gif', 'z%d')).toMatch(/letters/);
    expect(extValueProblem('gif', 'a b')).toMatch(/letters/);
    expect(extValueProblem('gif', 'é01')).toMatch(/letters/);
    expect(extValueProblem('gif', 'bkd')).toMatch(/Game-Maker’s own/);
    expect(extValueProblem('map', 'exe')).toMatch(/DOS/);
    expect(extValueProblem('rec', 'cfg')).toMatch(/DOS/); // the player writes GM.CFG
  });

  it('clashes with no other kind’s', () => {
    const two = { [extId('gif')]: 'z0n', [extId('map')]: 'z0n' };
    expect([...extensionClashes(two).keys()]).toEqual(['gif', 'map']);
    expect(extensionClashes(acord).size).toBe(0);
    expect(() => applyPlayerPatches(exe, two)).toThrow(/Pictures.*Maps use .z0n too/);
    expect(() => applyPlayerPatches(exe, { [extId('gif')]: 'g f' })).toThrow();
  });

  it('is kept by the companion record in lower case, and left out of the web pages’ patches', () => {
    expect(cleanPatches({ [extId('gif')]: 'Z0N', [extId('nope')]: 'abc', [extId('map')]: 'zz' })).toEqual({ [extId('gif')]: 'z0n' });
    expect(withoutExtensions({ ...acord, 'str.menu.play': 'Go' })).toEqual({ 'str.menu.play': 'Go' });
  });

  it('is described for the README', () => {
    expect(playerChanges(acord)).toContain('Files, Pictures: .gif -> .z0n');
    expect(playerChanges(acord).some((l) => l.includes('.map'))).toBe(false); // no .EXE change
    expect(renamedFiles(acord)).toContain('.map -> .z0b');
  });
});

describe('Acord style', () => {
  it('patches the extensions NEVER.EXE asks for', () => {
    const out = applyPlayerPatches(exe, acord);
    expect(renamedExtensions(out)).toEqual({
      '.gam': '.z0g',
      '.gif': '.z0n',
      '.bkd': '.z0j',
      '.fli': '.z0p',
      '.txt': '.z0l',
      '.rec': '.z0r',
      '.his': '.z0h',
      '.sav': '.z0m',
    });
    // Acord's own bytes for every copy (their player also renamed SavNames, GM.CFG and some messages)
    expect(text(out, 0x25673, 5)).toBe('.z0r\0');
    expect(text(out, 0x256f0, 16)).toBe('data*.z0r\0\0.z0r\0');
    expect(text(out, 0x257a5, 13)).toBe('%sdata%d.z0r\0');
    expect(text(out, 0x257f3, 13)).toBe('%sgame%d.z0m\0');
    expect(text(out, 0x26907, 5)).toBe('.z0h\0');
  });

  it.skipIf(!existsSync(NEVER))('matches NEVER.EXE at every extension', () => {
    const never = new Uint8Array(readFileSync(NEVER));
    const out = applyPlayerPatches(exe, acord);
    for (const k of EXT_KINDS) for (const o of k.offsets) expect(text(out, o, 5), `${k.ext} @ ${o.toString(16)}`).toBe(text(never, o, 5));
    expect(readPlayerPatches(never)!.patches).toEqual(
      Object.fromEntries(Object.entries(acord).filter(([id]) => EXT_KINDS.find((k) => extId(k.ext) === id)!.offsets.length)),
    );
  });
});
