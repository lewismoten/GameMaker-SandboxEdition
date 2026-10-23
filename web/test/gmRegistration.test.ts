import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CARD_NAME_MAX, DEFAULT_REG, SERIAL, cardCheck, checkRegistration, regFile, registrationNumber, validSerial } from '../src/retro/gmReg/registration';
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

  it('checks the desk’s registration card in plain words', () => {
    const key = String(registrationNumber('Gwinn', SERIAL));
    expect(cardCheck('Gwinn', key)).toBeUndefined();
    expect(cardCheck('  Gwinn ', ` ${key} `)).toBeUndefined();
    expect(cardCheck('', key)).toMatch(/name/);
    expect(cardCheck('Gwinn', '')).toMatch(/Mail the card/);
    expect(cardCheck('Gwinn', '12ab')).toMatch(/digits/);
    expect(cardCheck('Gwin', key)).toMatch(/doesn’t fit/);
    expect(cardCheck('A'.repeat(CARD_NAME_MAX + 1), '1')).toMatch(/at most/);
    // whatever the card accepts, GM accepts
    const long = 'B'.repeat(CARD_NAME_MAX);
    const longKey = String(registrationNumber(long, SERIAL));
    expect(cardCheck(long, longKey)).toBeUndefined();
    expect(checkRegistration(regFile(long, SERIAL, longKey))).toEqual({ kind: 'registered', userName: long });
  });

  it('keeps CHK.C’s fgets quirk: a 29-character name loses its last letter', () => {
    const name = 'A'.repeat(29);
    expect(checkRegistration(regFile(name, SERIAL, String(registrationNumber(name, SERIAL)))).kind).toBe('check');
    const short = 'A'.repeat(28);
    expect(checkRegistration(regFile(short, SERIAL, String(registrationNumber(short, SERIAL)))).kind).toBe('registered');
  });
});

/** The <p> paragraphs of each page of the Owner's Guide (manual/dosManual.ts), as words; index = printed page number. */
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
  it('are answered by the Owner\u2019s Guide (page, paragraph, word)', () => {
    const pages = guidePages();
    expect(pages.length).toBeGreaterThan(25);
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(25);
    const seen = new Set<string>();
    for (const q of QUESTIONS) {
      const at = `${q.page}/${q.paragraph}/${q.word}`;
      expect(seen.has(at), at).toBe(false);
      seen.add(at);
      const word = pages[q.page]?.[q.paragraph - 1]?.[q.word - 1] ?? '';
      expect(rightAnswer(q, word), `page ${q.page} paragraph ${q.paragraph} word ${q.word}: ${word}`).toBe(true);
      // answer[14] in CHK.C: thirteen letters at most, and only letters
      expect(q.answer).toMatch(/^[A-Z]{1,13}$/);
    }
  });

  it('accepts the word in any case', () => {
    const q = QUESTIONS.find((x) => x.page === 18 && x.paragraph === 1 && x.word === 6)!;
    expect(rightAnswer(q, 'red')).toBe(true);
    expect(rightAnswer(q, ' Red ')).toBe(true);
    expect(rightAnswer(q, 'RED,')).toBe(true);
    expect(rightAnswer(q, 'box')).toBe(false);
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
