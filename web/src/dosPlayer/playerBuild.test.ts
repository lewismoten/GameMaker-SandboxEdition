// Telling Game-Maker's player builds apart and keeping what an author changed in one, on
// synthetic players: the CD's XFERPLAY 3.00 (cd/gm/) edited here, and made-up older builds.
// No third-party .EXE is read or kept.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { applyPlayerPatches } from '@lewismoten/gamemaker-sandbox-archives/player/applyPatches';
import { md5Hex } from '@lewismoten/gamemaker-sandbox-archives/player/md5';
import { crc32 } from '@lewismoten/gamemaker-sandbox-archives/project/zip';
import {
  aboutLines,
  buildData,
  estimateFromFolder,
  identifyPlayer,
  preservePlayer,
  regionText,
  BLOCK,
  BUILD_DATA,
  type BuildData,
} from '@lewismoten/gamemaker-sandbox-archives/project/importPlayer';
import { patchEntry } from '@lewismoten/gamemaker-sandbox-engine/player/patchRules';

const stock = new Uint8Array(readFileSync(new URL('../../../cd/gm/xferplay.exe', import.meta.url)));
const b300 = buildData('3.00')!;
const put = (exe: Uint8Array, o: number, s: string) => [...s].forEach((c, i) => (exe[o + i] = c.charCodeAt(0)));
const offsetOf = (id: string) => (patchEntry(id) as { offset: number }).offset;

describe('identifying a player', () => {
  it('knows the CD’s XFERPLAY and PLAYGAME as stock 3.00', () => {
    const id = identifyPlayer(stock);
    expect(id).toMatchObject({ build: '3.00', stock: true, confidence: 'high', versionLine: 'Version 3.00' });
    const pg = identifyPlayer(new Uint8Array(readFileSync(new URL('../../../cd/gm/playgame.exe', import.meta.url))));
    expect(pg).toMatchObject({ build: '3.00-playgame', stock: true });
  });

  it('keeps every build’s tables inside its player', () => {
    for (const b of BUILD_DATA) {
      expect(b.version, b.id).toBeGreaterThan(0);
      expect(b.about.length, b.id).toBeGreaterThanOrEqual(22);
      expect(atob(b.crc).length, b.id).toBe(Math.ceil(b.size / BLOCK) * 2);
      for (const [o, n] of Object.values(b.text ?? {})) expect(o + n, b.id).toBeLessThan(b.size);
    }
  });

  it('says a hand-edited 3.00 is 3.00 by its size and version line', () => {
    const exe = stock.slice();
    put(exe, offsetOf('str.menu.play'), 'Go! ');
    expect(identifyPlayer(exe)).toMatchObject({ build: '3.00', stock: false, confidence: 'high' });
  });

  it('names who replaced RSD’s About text, with less confidence', () => {
    const exe = stock.slice();
    b300.about.forEach((o) => put(exe, o, ' '.repeat(stringLen(exe, o))));
    put(exe, b300.about[1], 'copyright 1994 by A. Tester');
    const id = identifyPlayer(exe);
    expect(id).toMatchObject({ build: '3.00', confidence: 'medium', aboutAuthor: 'A. Tester' });
    expect(id.reasons.join(' ')).toMatch(/replaced/);
  });

  it('decodes author fragments in reasons without changing raw player evidence', () => {
    const accented = stock.slice();
    b300.about.forEach((o) => put(accented, o, ' '.repeat(stringLen(accented, o))));
    put(accented, b300.about[1], 'copyright 1994 by Caf\x82');
    const identified = identifyPlayer(accented);
    expect(identified.aboutAuthor).toBe('Caf\x82'); // raw evidence remains raw
    expect(identified.reasons.join(' ')).toContain('Café');
  });

  it('reads the version line of a player of no known size', () => {
    const exe = new Uint8Array(5000);
    put(exe, 1000, '          Version 2.02   \0Recreational Software Designs\0');
    expect(identifyPlayer(exe)).toMatchObject({ build: 'unknown', confidence: 'low', versionLine: 'Version 2.02' });
    expect(identifyPlayer(new Uint8Array(4000))).toMatchObject({ build: 'unknown', label: 'an unknown Game-Maker build' });
  });

  it('gives an older build’s size with medium confidence when its bytes differ', () => {
    for (const b of BUILD_DATA.filter((x) => !x.id.startsWith('3')))
      expect(identifyPlayer(new Uint8Array(b.size))).toMatchObject({ build: b.id, confidence: 'medium' });
  });
});

const stringLen = (exe: Uint8Array, o: number) => exe.indexOf(0, o) - o;

describe('preserving a 3.00 player', () => {
  it('writes an edited About page and words back byte for byte', () => {
    const exe = stock.slice();
    put(exe, offsetOf('str.menu.play'), 'Go! ');
    put(exe, b300.about[0], ' MY OWN GAMES            ');
    const kept = preservePlayer(exe, b300);
    expect(kept.patches).toEqual({ 'str.menu.play': 'Go!' });
    expect(kept.regions.length).toBe(1);
    expect(regionText(kept.regions[0]).some(([, t]) => t.includes('MY OWN GAMES'))).toBe(true);
    const out = applyPlayerPatches(stock, kept.patches, kept);
    expect(md5Hex(out)).toBe(md5Hex(exe));
  });

  it('keeps a word ended early with a 0 (its old letters after it) byte for byte', () => {
    const exe = stock.slice();
    exe[offsetOf('str.menu.quit')] = 0;
    const kept = preservePlayer(exe, b300);
    expect(kept.patches).toEqual({ 'str.menu.quit': '' });
    expect(md5Hex(applyPlayerPatches(stock, kept.patches, kept))).toBe(md5Hex(exe));
  });

  it('lets a setting changed since the import win over the preserved bytes', () => {
    const exe = stock.slice();
    exe[offsetOf('str.menu.quit')] = 0;
    put(exe, b300.about[0], ' MY OWN GAMES            ');
    const kept = preservePlayer(exe, b300);
    const out = applyPlayerPatches(stock, { 'str.menu.quit': 'Bye' }, kept);
    expect(String.fromCharCode(...out.subarray(offsetOf('str.menu.quit'), offsetOf('str.menu.quit') + 4))).toBe('Bye ');
    expect(aboutLines(out, b300)[0]).toBe(' MY OWN GAMES            ');
  });

  it('keeps nothing raw for a player whose changes are all settings', () => {
    const exe = stock.slice();
    put(exe, offsetOf('str.menu.play'), 'Run!');
    expect(preservePlayer(exe, b300).regions).toEqual([]);
  });
});

/** A made-up older build: 1,024 bytes with words where a table says, and an owner field. */
function fakeBuild(): { b: BuildData; exe: Uint8Array } {
  const exe = new Uint8Array(1024);
  put(exe, 100, 'Play\0Read Instructions\0');
  put(exe, 300, '                Top Ten Scores\0');
  put(exe, 400, '.gam\0');
  put(exe, 500, 'Owner: Somebody\0');
  const b: BuildData = {
    id: '9.99',
    size: exe.length,
    md5: '',
    owner: [500, 20],
    version: 0,
    about: [600],
    text: { 'str.menu.play': [100, 4], 'str.hiscore.title': [300, 30, '                Top Ten Scores'] },
    ext: { gam: [400] },
    crc: '',
  };
  const z = exe.slice();
  z.fill(0, 500, 520);
  const crc = new Uint8Array((exe.length / BLOCK) * 2);
  for (let i = 0; i < exe.length / BLOCK; i++) {
    const c = crc32(z.subarray(i * BLOCK, (i + 1) * BLOCK));
    crc[i * 2] = c & 0xff;
    crc[i * 2 + 1] = (c >> 8) & 0xff;
  }
  b.crc = btoa(String.fromCharCode(...crc));
  return { b, exe };
}

describe('reading an older build', () => {
  it('maps its words and extensions onto 3.00’s patch ids', () => {
    const { b, exe } = fakeBuild();
    put(exe, 100, 'Run!');
    put(exe, 300, '       Best Ones              ');
    put(exe, 400, '.z0g');
    put(exe, 500, 'Owner: Somebody Else');
    const kept = preservePlayer(exe, b);
    expect(kept.patches).toEqual({ 'str.menu.play': 'Run!', 'str.hiscore.title': 'Best Ones', 'file.ext.gam': 'z0g' });
    // the owner field changed, but it is never kept
    expect(kept.regions).toEqual([]);
  });

  it('keeps a word 3.00 can’t hold as raw bytes', () => {
    const { b, exe } = fakeBuild();
    put(exe, 300, 'A VERY LONG HIGH SCORE TITLE  ');
    const kept = preservePlayer(exe, b);
    expect(kept.patches).toEqual({});
    expect(kept.regions.map((r) => r.offset)).toEqual([256]);
  });
});

describe('estimating from a folder', () => {
  it('reads the .gam header, songs and title picture as clues', () => {
    expect(estimateFromFolder(['A.GAM'], [new Uint8Array([0x47, 0x4d, 0x2c, 1, 0])])).toMatchObject({ estimate: '3.00', confidence: 'high' });
    expect(estimateFromFolder(['A.GAM', 'SONG.CMF'], [new Uint8Array(6600)])).toMatchObject({ estimate: '2.00 or later, before 3.00', confidence: 'medium' });
    expect(estimateFromFolder(['GMTITLE.GIF'], [])).toMatchObject({ estimate: 'before 3.00' });
    expect(estimateFromFolder([], [])).toMatchObject({ estimate: 'unknown', confidence: 'low' });
  });
});
