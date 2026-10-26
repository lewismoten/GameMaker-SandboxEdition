// The web edition feature names only what is there: each checklist line's module is in the
// repository, each "1995 box: no" is a feature the original source lacks, and the desk's
// snapshot is shipped, small enough for a page.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CHECKLIST, WEB_EDITION } from './webEdition';
import { WEB_SHOTS } from '../types';

const repo = join(__dirname, '../../../../..');
const gm = join(repo, 'code/GM');
/** The original designers' and PLAYGAME's C and C++ source, as one lower-case string. */
const original = readdirSync(gm)
  .filter((f) => /\.(c|cpp)$/i.test(f))
  .map((f) => readFileSync(join(gm, f), 'latin1'))
  .join('\n')
  .toLowerCase();

describe('the web edition feature', async () => {
  const pages = await WEB_EDITION.pages({ games: [], game: () => undefined });
  const text = JSON.stringify(pages);

  it('runs three to six pages', () => {
    expect(pages.length).toBeGreaterThanOrEqual(3);
    expect(pages.length).toBeLessThanOrEqual(6);
  });

  it('names only features whose modules exist', () => {
    for (const f of CHECKLIST) expect(existsSync(join(repo, f.module)), `${f.name}: ${f.module}`).toBe(true);
    expect(new Set(CHECKLIST.map((f) => f.name)).size).toBe(CHECKLIST.length);
  });

  it('prints every checklist line', () => {
    for (const f of CHECKLIST) expect(text, f.name).toContain(JSON.stringify(f.name).slice(1, -1));
  });

  it('says the original had no undo, music writer or FLI maker, as its source shows', () => {
    expect(original).toContain('playscene'); // the source is really there
    expect(original).not.toMatch(/\bundo\b/);
    expect(original).not.toMatch(/writecmf|savecmf|writefli|savefli/);
  });

  it('shows the desk’s snapshot, under 300 KB', () => {
    expect(text).toContain('"art":"desk"');
    const shot = join(repo, 'web/public/magazine/desk-1994.webp');
    expect(statSync(shot).size).toBeLessThan(300_000);
  });

  it('shows every screenshot of today’s web, each under 150 KB and all of them under 1 MB', () => {
    let total = 0;
    for (const shot of WEB_SHOTS) {
      expect(text, shot).toContain(`"art":"web-${shot}"`);
      const file = join(repo, `web/public/magazine/web-${shot}.webp`);
      expect(existsSync(file), file).toBe(true);
      const { size } = statSync(file);
      expect(size, file).toBeLessThan(150_000);
      total += size;
    }
    expect(total).toBeLessThan(1_000_000);
  });

  it('puts ™ on Game-Maker only', () => {
    expect(text).toContain('Game-Maker™');
    expect(text).not.toMatch(/Sandbox Edition™/);
  });
});
