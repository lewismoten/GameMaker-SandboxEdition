import { describe, expect, it } from 'vitest';
import { emptyCompanion, isEmptyCompanion, parseCompanion, serializeCompanion } from './companion';
import { aboutOf, isAboutEmpty, setAbout } from './aboutGame';
import { DIZ_LINES, DIZ_WIDTH, asciiOnly, fileIdDiz, fileIdDizLines, readFileIdDiz } from './fileIdDiz';

describe('About this game in the companion', () => {
  it('keeps the fields through a save and load, and drops empty ones', () => {
    const c = emptyCompanion();
    setAbout(c, { title: ' Moon Jump ', author: 'Doc Leo', year: '', credits: [{ role: 'Music', name: 'Pat' }, { role: 'x', name: ' ' }] });
    const back = parseCompanion(serializeCompanion(c));
    expect(aboutOf(back)).toEqual({ title: 'Moon Jump', author: 'Doc Leo', credits: [{ role: 'Music', name: 'Pat' }] });
    expect(isEmptyCompanion(back)).toBe(false);
  });

  it('an old companion without it opens with no About fields, and clearing the fields clears the key', () => {
    const old = parseCompanion('{"format":"gamemaker-companion","version":1,"gameVersion":"1.2","files":{}}');
    expect(isAboutEmpty(aboutOf(old))).toBe(true);
    expect(old.gameVersion).toBe('1.2');
    setAbout(old, { title: 'A' });
    setAbout(old, {});
    expect('about' in old).toBe(false);
  });

  it('ignores junk in the about key', () => {
    expect(aboutOf(parseCompanion('{"about":[1,2],"files":{}}'))).toEqual({});
    expect(aboutOf(parseCompanion('{"about":{"title":5,"credits":"no"},"files":{}}'))).toEqual({});
  });
});

describe('FILE_ID.DIZ', () => {
  const about = {
    title: 'Café Caper',
    author: 'Doc Leo',
    company: 'Sandbox Software',
    year: '1994',
    description: 'Run, jump and stack building blocks across forty rooms of a very strange coffee house. Dodge the cold brew.',
    genre: 'Platform',
    website: 'https://example.com/caper',
    license: 'Shareware',
  };

  it('is at most 10 lines of 45 ASCII characters', () => {
    const lines = fileIdDizLines(about, 'x', '1.2');
    expect(lines.length).toBeLessThanOrEqual(DIZ_LINES);
    for (const l of lines) {
      expect(l.length).toBeLessThanOrEqual(DIZ_WIDTH);
      expect(l).toMatch(/^[\x20-\x7e]*$/);
    }
    expect(lines[0]).toBe('Cafe Caper v1.2');
    expect(lines[1]).toBe('by Doc Leo / Sandbox Software, 1994');
    expect(lines.at(-1)).toBe('Shareware');
  });

  it('cuts a long description to fit with an ellipsis', () => {
    const lines = fileIdDizLines({ title: 'T', description: 'word '.repeat(300) }, 't');
    expect(lines).toHaveLength(DIZ_LINES);
    expect(lines.at(-1)).toMatch(/\.\.\.$/);
  });

  it('uses CRLF and gives nothing when there is no title', () => {
    expect(new TextDecoder().decode(fileIdDiz({ title: 'A' }, 'a')!)).toBe('A\r\n');
    expect(fileIdDiz({}, '')).toBeUndefined();
  });

  it('reads back what it wrote', () => {
    const { about: got, version } = readFileIdDiz(fileIdDiz(about, 'x', '1.2')!);
    expect(version).toBe('1.2');
    expect(got.title).toBe('Cafe Caper');
    expect(got.author).toBe('Doc Leo');
    expect(got.company).toBe('Sandbox Software');
    expect(got.year).toBe('1994');
    expect(got.website).toBe('https://example.com/caper');
    expect(got.description).toContain('Run, jump');
  });

  it('straightens quotes and drops what ASCII cannot hold', () => {
    expect(asciiOnly('“Hi” – it’s  ☺ ok')).toBe('"Hi" - it\'s ok');
  });
});
