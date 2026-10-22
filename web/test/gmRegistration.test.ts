import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DEFAULT_NAME, DEFAULT_REG, SERIAL, checkRegistration, regFile, registrationNumber, validSerial } from '../src/retro/gmReg/registration';
import { QUESTIONS, rightAnswer } from '../src/retro/gmReg/copyCheck';

describe('Game-Maker registration (CHK.C)', () => {
  it('computes TELLREG#.C numbers', () => {
    // "Andy Stone": first 7 bytes 627, next 11 bytes 322, the rest 0
    expect(registrationNumber('Andy Stone', 1734764645)).toBe((1734764645 * 627 + 322 * 1143 + 0x16ac) % 2 ** 32);
    expect(validSerial(SERIAL)).toBe(true);
    expect(validSerial(SERIAL + 1)).toBe(false);
  });

  it('starts registered with the desk’s PLAYGAME.REG', () => {
    expect(checkRegistration(DEFAULT_REG)).toEqual({ kind: 'registered', userName: DEFAULT_NAME });
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

/** The <p> paragraphs of each page of the Owner's Guide, as words. */
function guidePages(): string[][][] {
  const src = readFileSync(new URL('../src/manual/dosManual.ts', import.meta.url), 'utf8');
  const body = src.slice(src.indexOf('  return [\n    {'), src.indexOf('export async function openDosManual'));
  const starts = [...body.matchAll(/^ {4}(page\(|\{)/gm)].map((m) => m.index!);
  return starts.map((s, i) =>
    [...body.slice(s, starts[i + 1] ?? body.length).matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) =>
      m[1]
        .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
        .replace(/<[^>]+>/g, '')
        .trim()
        .split(/\s+/),
    ),
  );
}

describe('the copy protection questions', () => {
  it('are answered by the Owner’s Guide (page, paragraph, word)', () => {
    const pages = guidePages();
    expect(pages.length).toBeGreaterThan(15);
    for (const q of QUESTIONS) {
      const word = pages[q.page]?.[q.paragraph - 1]?.[q.word - 1] ?? '';
      const bare = word.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');
      expect(rightAnswer(q, bare), `page ${q.page} paragraph ${q.paragraph} word ${q.word}: ${word}`).toBe(true);
      expect(q.answer.length).toBeLessThanOrEqual(13);
    }
  });
});
