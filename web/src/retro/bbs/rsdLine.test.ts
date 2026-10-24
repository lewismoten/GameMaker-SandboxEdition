// The Sandbox BBS's RSD registration line answers with the number GM REGISTER accepts.
import { describe, expect, it } from 'vitest';
import { rsdAnswer } from './rsdLine';
import { CARD_NAME_MAX, SERIAL, checkRegistration, regFile, registrationNumber } from '../gmReg/registration';

describe('rsdAnswer', () => {
  it('gives the registration number for this copy, and GM takes it', () => {
    const a = rsdAnswer('  Lewis Moten ', String(SERIAL));
    expect(a).toEqual({ kind: 'number', name: 'Lewis Moten', serial: SERIAL, number: String(registrationNumber('Lewis Moten', SERIAL)), ours: true });
    if (a.kind !== 'number') throw new Error('no number');
    expect(checkRegistration(regFile(a.name, SERIAL, a.number))).toEqual({ kind: 'registered', userName: 'Lewis Moten' });
  });

  it('works for a 28-letter name and skips spaces and commas in the serial', () => {
    const name = 'A'.repeat(CARD_NAME_MAX);
    const a = rsdAnswer(name, ` ${SERIAL.toLocaleString('en-US')} `);
    expect(a.kind === 'number' && a.number).toBe(String(registrationNumber(name, SERIAL)));
    if (a.kind === 'number') expect(checkRegistration(regFile(name, SERIAL, a.number)).kind).toBe('registered');
  });

  it("answers another copy's valid serial, but not as this PC's", () => {
    const a = rsdAnswer('Pat', String(7 * 1029 + 4));
    expect(a.kind === 'number' && a.ours).toBe(false);
    expect(a.kind === 'number' && a.number).toBe(String(registrationNumber('Pat', 7 * 1029 + 4)));
  });

  it('refuses a bad serial number', () => {
    for (const s of [String(SERIAL + 1), '0', '3', 'GM30', '', '99999999999', '-2052859']) expect(rsdAnswer('Pat', s)).toEqual({ kind: 'badSerial' });
  });

  it('needs a name that fits', () => {
    expect(rsdAnswer('   ', String(SERIAL))).toEqual({ kind: 'noName' });
    expect(rsdAnswer('A'.repeat(CARD_NAME_MAX + 1), String(SERIAL))).toEqual({ kind: 'longName' });
  });
});
