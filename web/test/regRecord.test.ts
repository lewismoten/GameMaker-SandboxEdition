import { describe, expect, it } from 'vitest';
import { registeredTo } from '../src/manual/regRecord';
import { DEFAULT_REG, SERIAL, regFile, registrationNumber } from '../src/retro/gmReg/registration';

describe('the Owner’s Guide registration record', () => {
  it('is blank until PLAYGAME.REG registers the copy', () => {
    expect(registeredTo(DEFAULT_REG)).toBeUndefined();
    expect(registeredTo(null)).toBeUndefined();
    expect(registeredTo(regFile('Gwinn', SERIAL, '12345'))).toBeUndefined();
  });

  it('holds the name and number GM REGISTER wrote', () => {
    const n = String(registrationNumber('Gwinn', SERIAL));
    expect(registeredTo(regFile('Gwinn', SERIAL, n))).toEqual({ name: 'Gwinn', number: n });
  });
});
