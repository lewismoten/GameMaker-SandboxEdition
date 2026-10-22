// Tests: the Sandbox BBS's W)arez area (retro/bbs/warezArea.ts): its releases' FILE_ID.DIZ and
// .NFO fit the period limits, warez costs a file point a ZIP, the access code, and GM30's
// INSTALL.EXE reading the registration as CHK.EXE does.
import { describe, expect, it } from 'vitest';
import { DIZ_LINES, DIZ_WIDTH } from '../src/retro/bbs/fileId';
import { ACCESS_CODE, WAREZ, accessOk, fileSize, pointsFor, zipsOf } from '../src/retro/bbs/warezArea';
import { GM30_NFO, GM30_REG_NAME, GM30_REG_NUMBER, GM30_SERIAL } from '../src/retro/hacks/gm30Text';
import { GMCRACK_NFO } from '../src/retro/hacks/gmcrackText';
import { isGmDir, registrationLines } from '../src/retro/hacks/gm30Install';
import { checkRegistration, DEFAULT_NAME, DEFAULT_REG, regFile, validSerial } from '../src/retro/gmReg/registration';

describe('the Warez area', () => {
  it('holds GMCRACK, SAVEHACK and Game-Maker 3.00', () => {
    expect(WAREZ.map((w) => w.id)).toEqual(['gmcrack', 'savehack', 'gm30']);
  });

  it('keeps every DIZ within 10 lines of 45 ASCII columns, signed by the courier', () => {
    for (const w of WAREZ) {
      expect(w.diz.length).toBeLessThanOrEqual(DIZ_LINES);
      for (const l of w.diz) {
        expect(l.length, l).toBeLessThanOrEqual(DIZ_WIDTH);
        expect(/^[\x20-\x7e]*$/.test(l), l).toBe(true);
      }
      expect(w.diz.at(-1)).toContain('vesuvian');
    }
  });

  it('keeps the .NFOs within 79 columns with square boxes', () => {
    for (const nfo of [GM30_NFO, GMCRACK_NFO]) {
      for (const l of nfo) expect(l.length, l).toBeLessThanOrEqual(79);
      const box = nfo.filter((l) => /[║╔╚]/.test(l));
      expect(new Set(box.map((l) => l.length)).size).toBe(1);
    }
  });

  it('costs a file point a ZIP: GM30 comes in four', () => {
    const gm = WAREZ.find((w) => w.id === 'gm30')!;
    expect(zipsOf(gm)).toEqual(['GM30-1.ZIP', 'GM30-2.ZIP', 'GM30-3.ZIP', 'GM30-4.ZIP']);
    expect(pointsFor(gm)).toBe(4);
    expect(pointsFor(WAREZ[0])).toBe(1);
    expect(gm.files.find((f) => f.name === 'INSTALL.EXE')?.run).toEqual({ kind: 'install', from: 'warez' });
    for (const f of gm.files) expect(fileSize(f)).toBeGreaterThan(0);
  });

  it('lets in the elite (any case)', () => {
    expect(accessOk(ACCESS_CODE)).toBe(true);
    expect(accessOk(' dune ')).toBe(true);
    expect(accessOk('LAMER')).toBe(false);
  });
});

describe("GM30's INSTALL", () => {
  it('knows C:\\GM however it is typed', () => {
    for (const d of ['C:\\GM', 'c:\\gm\\', '\\GM', 'GM']) expect(isGmDir(d), d).toBe(true);
    expect(isGmDir('C:\\GM2')).toBe(false);
  });

  it('reports the registration CHK.EXE would see', () => {
    expect(registrationLines(DEFAULT_REG)[0]).toBe(`Registered To: ${DEFAULT_NAME}`);
    expect(registrationLines(null)[0]).toContain('missing');
  });

  it("ships a registration that only fits its own copy's serial", () => {
    expect(validSerial(GM30_SERIAL)).toBe(true);
    expect(checkRegistration(regFile(GM30_REG_NAME, GM30_SERIAL, String(GM30_REG_NUMBER)), GM30_SERIAL).kind).toBe('registered');
    expect(checkRegistration(regFile(GM30_REG_NAME, GM30_SERIAL, String(GM30_REG_NUMBER))).kind).toBe('bad');
  });
});
