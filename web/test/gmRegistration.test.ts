import { describe, expect, it } from 'vitest';
import { DEFAULT_REG, SERIAL, checkRegistration, regFile, registrationNumber, validSerial } from '../src/retro/gmReg/registration';
import { QUESTIONS, rightAnswer } from '../src/retro/gmReg/copyCheck';

describe('Game-Maker registration (CHK.C)', () => {
  it('computes TELLREG#.C numbers', () => {
    // "Andy Stone": first 7 bytes 627, next 11 bytes 322, the rest 0
    expect(registrationNumber('Andy Stone', 1734764645)).toBe((1734764645 * 627 + 322 * 1143 + 0x16ac) % 2 ** 32);
    expect(validSerial(SERIAL)).toBe(true);
    expect(validSerial(SERIAL + 1)).toBe(false);
  });

  it('starts unregistered with the desk’s PLAYGAME.REG: no name, this serial, no number', () => {
    expect(checkRegistration(DEFAULT_REG)).toEqual({ kind: 'check', userName: String(SERIAL) });
  });

  it('asks the manual when the number is wrong, showing the serial number', () => {
    expect(checkRegistration(regFile('Somebody', SERIAL, '12345'))).toEqual({ kind: 'check', userName: String(SERIAL) });
    expect(checkRegistration(regFile('Somebody', SERIAL, ''))).toEqual({ kind: 'check', userName: String(SERIAL) });
  });

  it('refuses a missing file or another copy’s serial', () => {
    expect(checkRegistration(null)).toEqual({ kind: 'missing' });
    expect(checkRegistration(undefined)).toEqual({ kind: 'missing' });
    expect(checkRegistration(regFile('A', 1029 + 4, String(registrationNumber('A', 1033))))).toEqual({ kind: 'bad' });
    expect(checkRegistration('garbage')).toEqual({ kind: 'bad' });
  });

  it('keeps CHK.C’s fgets quirk: a 29-character name loses its last letter', () => {
    const name = 'A'.repeat(29);
    expect(checkRegistration(regFile(name, SERIAL, String(registrationNumber(name, SERIAL)))).kind).toBe('check');
    const short = 'A'.repeat(28);
    expect(checkRegistration(regFile(short, SERIAL, String(registrationNumber(short, SERIAL)))).kind).toBe('registered');
  });
});

describe('the copy protection questions', () => {
  // the answers come from the printed Game-Maker 3.0 Owner's Manual (read off a scan, which
  // stays out of the repository); this checks that the list is one CHK.C could have asked
  it('are words of the printed Owner\u2019s Manual (page, paragraph, word)', () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(18);
    const seen = new Set<string>();
    for (const q of QUESTIONS) {
      const at = `${q.page}/${q.paragraph}/${q.word}`;
      expect(seen.has(at), at).toBe(false);
      seen.add(at);
      expect(q.page).toBeGreaterThanOrEqual(1);
      expect(q.page).toBeLessThanOrEqual(107);
      expect(q.paragraph).toBeGreaterThanOrEqual(1);
      expect(q.word).toBeGreaterThanOrEqual(1);
      // answer[14] in CHK.C: thirteen letters at most, and only letters
      expect(q.answer).toMatch(/^[A-Z]{1,13}$/);
    }
  });

  it('accepts the word in any case', () => {
    const q = QUESTIONS.find((x) => x.page === 13 && x.paragraph === 1 && x.word === 6)!;
    expect(rightAnswer(q, 'which')).toBe(true);
    expect(rightAnswer(q, ' Which ')).toBe(true);
    expect(rightAnswer(q, 'WHICH,')).toBe(true);
    expect(rightAnswer(q, 'red')).toBe(false);
    expect(rightAnswer(q, '')).toBe(false);
  });
});

describe('GMCRACK’s answer table', () => {
  it('lists every question, fitting 80 columns and the screen', async () => {
    const { answerPages } = await import('../src/retro/hacks/gmcrack');
    const pages = answerPages();
    const text = pages.flat().join('\n');
    for (const q of QUESTIONS) expect(text).toContain(q.answer);
    for (const page of pages) {
      expect(page.length).toBeLessThanOrEqual(10);
      for (const row of page) expect(row.replace(/\|\d\d/g, '').length + 4).toBeLessThanOrEqual(80);
    }
  });
});
