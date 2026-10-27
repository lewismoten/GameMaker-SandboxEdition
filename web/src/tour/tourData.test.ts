// The tour's data: every step well formed, short enough for a phone's bubble, pointing at
// controls the page's code really makes, and only Sandbox games' sprites, sounds and music
// (never a secret game's, never the Bard of Bizarre's recordings).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CHAPTERS } from './chapters/index';
import { tourLines } from './lines';
import { HOSTS, MAX_CAPTION, MAX_SAY, MUSIC, PROPS, SOUNDS, captionOf, cssList } from './steps';
import { CHAPTER_PAGES } from './tourPages';

const GAMES = join(__dirname, '../../../games');
const about = (id: string) => JSON.parse(readFileSync(join(GAMES, id, 'about.json'), 'utf8')) as { title: string; secret?: boolean; series?: string };
const gameIds = readdirSync(GAMES).filter((d) => existsSync(join(GAMES, d, 'about.json')));
const secret = gameIds.filter((id) => about(id).secret);

/** Where each page's controls are made: a selector's classes and ids must appear in these. */
const SOURCES: Record<string, string[]> = {
  home: ['main.ts', 'settingsMenu.ts', 'theme.ts', 'viewSwitch.ts', 'tour/tourButton.ts', 'walkthrough/button.ts', 'editor/shell'],
};
const sourceText = (paths: string[]) =>
  paths
    .flatMap((p) => {
      const full = join(__dirname, '..', p);
      return p.endsWith('.ts')
        ? [full]
        : readdirSync(full)
            .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
            .map((f) => join(full, f));
    })
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');

const steps = CHAPTERS.flatMap((c) => c.steps.map((s) => ({ c, s })));

describe('the tour’s data', () => {
  it('has a page list in step with its chapters', () => {
    expect([...new Set(CHAPTERS.map((c) => c.page))].sort()).toEqual([...CHAPTER_PAGES].sort());
  });

  it('gives every step a stable, unique, lowercase id', () => {
    const ids = steps.map(({ s }) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const { c, s } of steps) {
      expect(s.id).toMatch(/^[a-z0-9-]+$/);
      expect(s.id.startsWith(`${c.id}-`)).toBe(true);
    }
    for (const c of CHAPTERS) expect(c.id).toMatch(/^[a-z0-9-]+$/);
  });

  it('keeps bubbles and captions short', () => {
    for (const { c, s } of steps) {
      expect(s.say.length, s.id).toBeLessThanOrEqual(MAX_SAY);
      expect(captionOf(c, s).length, s.id).toBeLessThanOrEqual(MAX_CAPTION);
      expect(s.say.trim(), s.id).toBe(s.say);
    }
  });

  it('points only at steps that need a target, and moves only to ones it has', () => {
    for (const { s } of steps) {
      if (s.action === 'point' || s.action === 'press') expect(s.target, s.id).toBeDefined();
      if (s.click) expect(s.action, s.id).toBe('press');
    }
  });

  it('points at controls the page’s code makes', () => {
    for (const c of CHAPTERS) {
      const text = sourceText(SOURCES[c.page] ?? []);
      const css = c.steps.flatMap((s) => (s.target ? [...cssList(s.target.css), ...cssList(s.target.reveal)] : [])).concat(c.ready);
      for (const sel of css) {
        for (const [, name] of sel.matchAll(/[.#]([a-z][\w-]*)/gi)) expect(text.includes(name), `${c.id}: ${sel} (${name})`).toBe(true);
        for (const [, href] of sel.matchAll(/href="([^"]+)"/g)) expect(text.includes(`'${href}'`), `${c.id}: ${sel}`).toBe(true);
      }
      for (const s of c.steps) if (s.target?.text) expect(text.includes(s.target.text), `${s.id}: ${s.target.text}`).toBe(true);
    }
  });

  it('uses only Sandbox games’ sprites, sounds and music', () => {
    const games = [
      ...Object.values(HOSTS).map((x) => x.game),
      ...Object.values(PROPS).map((x) => x.game),
      ...Object.values(SOUNDS).map((x) => x.split('/')[0]),
      ...Object.values(MUSIC).map((x) => x.split('/')[0]),
    ];
    for (const g of new Set(games)) {
      expect(gameIds, g).toContain(g);
      expect(about(g).secret, g).toBeFalsy();
      expect(about(g).series, g).not.toBe('bizarre');
    }
    // and each file is really on that game's disk
    for (const f of [...Object.values(SOUNDS).map((x) => `${x}.voc`), ...Object.values(MUSIC)]) {
      const [g, name] = f.split('/');
      expect(existsSync(join(GAMES, g, 'disk', name)), f).toBe(true);
    }
  });

  it('never names a secret game', () => {
    const all = JSON.stringify(CHAPTERS).toLowerCase();
    for (const id of secret) {
      expect(all).not.toContain(about(id).title.toLowerCase());
      expect(all).not.toMatch(new RegExp(`\\b${id}\\b`));
    }
  });

  it('lists every line for the voice clips', () => {
    const lines = tourLines();
    expect(lines.length).toBe(steps.length);
    for (const l of lines) {
      expect(l.where).toMatch(/^\w[\w ]*: /);
      expect(l.text.length).toBeGreaterThan(0);
    }
  });
});
