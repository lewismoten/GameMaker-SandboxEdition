// GMCRACK's serials: made-up ones are always good to CHK.EXE (a counter x 1029 + 4), and RESERIAL
// stamps one into this PC's PLAYGAME.EXE, so the old PLAYGAME.REG fails and a key for the new one passes.
import { describe, expect, it, vi } from 'vitest';
import { BAD_SERIAL, parseSerial, patchLine, randomSerial, reserialCli } from '../src/retro/hacks/gmcrackSerial';
import { FACTORY_SERIAL, SERIAL_OFFSET, checkRegistration, regFile, registrationNumber, serialBytes, validSerial } from '../src/retro/gmReg/registration';
import { PcExtras, type PcExtrasState } from '../src/retro/hacks/pcExtras';

// registering here is a test, not the desk's achievement
vi.mock('../src/achievements', () => ({ unlockAchievement: () => undefined }));

const memory = () => {
  let v: PcExtrasState | undefined;
  return { load: async () => v, save: async (s: PcExtrasState) => void (v = s) };
};

const keyed = (name: string, serial: number) => regFile(name, serial, String(registrationNumber(name, serial)));

describe('randomSerial', () => {
  it('makes valid serials that are not the one given', () => {
    for (let i = 0; i < 200; i++) {
      const s = randomSerial(FACTORY_SERIAL);
      expect(validSerial(s)).toBe(true);
      expect(s).not.toBe(FACTORY_SERIAL);
    }
  });

  it('skips the serial it is told to', () => {
    const own = (FACTORY_SERIAL - 4) / 1029;
    const picks = [(own - 0.5) / 9999, 0];
    expect(randomSerial(FACTORY_SERIAL, () => picks.shift()!)).toBe(1 * 1029 + 4);
  });
});

describe('the serial in PLAYGAME.EXE', () => {
  it('lies at PLAYBYTE+30 in the byte order GetMoreData reads (1, 3, 4, 2)', () => {
    expect(SERIAL_OFFSET).toBe(0x181e);
    // 2052859 = 0x001F52FB: bytes FB 52 1F 00 of the long, stored FB 1F 00 52
    expect(serialBytes(FACTORY_SERIAL)).toEqual([0xfb, 0x1f, 0x00, 0x52]);
    expect(patchLine(FACTORY_SERIAL, FACTORY_SERIAL)).toBe('181Eh (PLAYBYTE+30): FB 1F 00 52 -> FB 1F 00 52');
  });

  it('takes only a serial CHK.EXE could read as good', () => {
    expect(parseSerial(' 2,052,859 ')).toBe(FACTORY_SERIAL);
    for (const t of ['', '0', String(FACTORY_SERIAL + 1), 'abc', '99999999999']) expect(parseSerial(t)).toBeUndefined();
  });
});

describe('RESERIAL', () => {
  it('stamps a new serial: the old registration fails, a key for the new one passes', async () => {
    const x = new PcExtras(memory());
    await x.ready;
    x.setReg(keyed('Gwinn', FACTORY_SERIAL));
    expect(checkRegistration(x.reg, x.serial).kind).toBe('registered');
    const out = reserialCli(undefined, x);
    const now = x.serial;
    expect(now).not.toBe(FACTORY_SERIAL);
    expect(validSerial(now)).toBe(true);
    expect(out[0]).toMatch(/^Patching C:\\GM\\PLAYGAME\.EXE at 181Eh \(PLAYBYTE\+30\): FB 1F 00 52 -> /);
    expect(out.join('\n')).toMatch(/Bad Registration File/);
    expect(checkRegistration(x.reg, now).kind).toBe('bad');
    x.setReg(keyed('Gwinn', now));
    expect(checkRegistration(x.reg, x.serial)).toEqual({ kind: 'registered', userName: 'Gwinn' });
  });

  it('takes a typed serial, refuses a bad one, and goes back to the factory serial', async () => {
    const x = new PcExtras(memory());
    await x.ready;
    expect(reserialCli(String(FACTORY_SERIAL + 1), x)).toEqual([BAD_SERIAL]);
    expect(x.serial).toBe(FACTORY_SERIAL);
    reserialCli(String(42 * 1029 + 4), x);
    expect(x.serial).toBe(42 * 1029 + 4);
    expect(reserialCli(String(42 * 1029 + 4), x)[0]).toMatch(/already/);
    const back = reserialCli('f', x);
    expect(x.serial).toBe(FACTORY_SERIAL);
    expect(back[1]).toMatch(/factory serial/);
    // the PC's own PLAYGAME.REG came for the factory serial, so it fits again
    expect(checkRegistration(x.reg, x.serial).kind).toBe('check');
  });
});
