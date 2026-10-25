// The Sandbox Scoop's issues (scoopIssues.ts and each game's printables.json "news"): every
// Sandbox Software game everyone sees has a month in its year, the issues number in that
// order, each one's "In the workshop" names the next game (the last names none), and no
// issue names a secret game.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SCOOP_MONTHS, scoopDateline } from './scoopIssues';
import { scoopIssue } from './scoopIssue';

interface About {
  title: string;
  year?: number;
  secret?: boolean;
  series?: string;
}

const gamesDir = join(__dirname, '../../../../games');
const games = readdirSync(gamesDir)
  .filter((id) => existsSync(join(gamesDir, id, 'about.json')) && existsSync(join(gamesDir, id, 'manual.json')))
  .map((id) => ({ id, ...(JSON.parse(readFileSync(join(gamesDir, id, 'about.json'), 'utf8')) as About) }))
  .filter((g) => g.series !== 'bizarre');
const sandbox = games.filter((g) => !g.secret);
const secret = games.filter((g) => g.secret);
const inOrder = [...sandbox].sort((a, b) => scoopIssue(a.id, sandbox) - scoopIssue(b.id, sandbox));
const news = (id: string) =>
  (JSON.parse(readFileSync(join(gamesDir, id, 'printables.json'), 'utf8')) as { news?: { head: string; html: string }[] }).news ?? [];
const words = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&');
const mainTitle = (t: string) => t.split(/: |(?<=!) /)[0].trim();

describe('the Sandbox Scoop’s issues', () => {
  it('gives every Sandbox game everyone sees a month in its year, and no other game one', () => {
    expect(secret.length).toBeGreaterThan(0);
    expect(Object.keys(SCOOP_MONTHS).sort()).toEqual(sandbox.map((g) => g.id).sort());
    for (const g of sandbox) expect(SCOOP_MONTHS[g.id].slice(0, 4)).toBe(String(g.year));
  });

  it('numbers the issues 1 to N in month order, one issue a month', () => {
    expect(inOrder.map((g) => scoopIssue(g.id, sandbox))).toEqual(sandbox.map((_, i) => i + 1));
    const months = inOrder.map((g) => SCOOP_MONTHS[g.id]);
    expect(months).toEqual([...new Set(months)].sort());
    expect(scoopDateline('year2000')).toBe('December 1992');
  });

  it('teases the next game In the workshop, and the last issue names none', () => {
    inOrder.forEach((g, i) => {
      const shop = news(g.id).filter((n) => n.head.startsWith('In the workshop: '));
      expect(shop, g.id).toHaveLength(1);
      const text = words(shop[0].html);
      const next = inOrder[i + 1];
      if (next) expect(text, g.id).toContain(mainTitle(next.title));
      else for (const o of games) expect(text, g.id).not.toContain(mainTitle(o.title));
    });
  });

  it('looks back at the game before, from the second issue on', () => {
    inOrder.forEach((g, i) => {
      const since = news(g.id).filter((n) => n.head.startsWith('Since last issue: '));
      expect(since.length, g.id).toBe(i ? 1 : 0);
      if (i) expect(words(since[0].html), g.id).toContain(mainTitle(inOrder[i - 1].title));
    });
  });

  it('never names a secret game', () => {
    const issues = [readFileSync(join(__dirname, 'scoopIssues.ts'), 'utf8'), ...sandbox.map((g) => JSON.stringify(news(g.id)))].join('\n').toLowerCase();
    for (const g of secret) {
      expect(issues).not.toMatch(new RegExp(`\\b${g.id}\\b`));
      expect(issues).not.toContain(mainTitle(g.title).toLowerCase());
      expect(issues).not.toContain(g.title.toLowerCase());
    }
  });
});
