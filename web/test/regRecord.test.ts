// The Owner's Guide's registration record: blank until PLAYGAME.REG registers the copy.
import { describe, expect, it } from 'vitest';
import { registeredTo } from '../src/manual/regRecord';
import { defaultReg, FACTORY_SERIAL as SERIAL, regFile, registrationNumber } from '../src/retro/gmReg/registration';

const DEFAULT_REG = defaultReg(SERIAL);

describe('the Owner’s Guide registration record', () => {
  it('is blank until PLAYGAME.REG registers the copy', () => {
    expect(registeredTo(DEFAULT_REG, SERIAL)).toBeUndefined();
    expect(registeredTo(null, SERIAL)).toBeUndefined();
    expect(registeredTo(regFile('Gwinn', SERIAL, '12345'), SERIAL)).toBeUndefined();
  });

  it('holds the name and number GM REGISTER wrote', () => {
    const n = String(registrationNumber('Gwinn', SERIAL));
    expect(registeredTo(regFile('Gwinn', SERIAL, n), SERIAL)).toEqual({ name: 'Gwinn', number: n });
  });
});
