// The Ultimate Owner's Guide: its page sums, its chapters' order, structure and figures, and (when
// the sources are on this machine) that none of its wording comes from RSD's manual or the reviews.
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CHAPTERS, chapterStarts, planBook } from './plan';
import { CHECKS } from '../../editor/check/findings';

const FIGURES = ['moods', 'compare', 'goat', 'loaf', 'chain', 'walkoff'];
const words = (t: string) =>
  t
    .replace(/<[^>]+>/g, ' ')
    .toLowerCase()
    .replace(/’/g, "'")
    .split(/[^a-z0-9']+/)
    .filter(Boolean);

describe('The Ultimate Owner’s Guide', () => {
  it('fills out whole folded sheets, covers and contents included', () => {
    for (let text = 1; text < 60; text++) {
      const { total, notes } = planBook(text);
      expect(total % 4).toBe(0);
      expect(notes).toBeGreaterThanOrEqual(0);
      expect(notes).toBeLessThan(4);
      expect(2 + text + notes + 1).toBe(total);
    }
  });

  it('lists each chapter at the page its opening is on', () => {
    expect(chapterStarts([[0], [], [1, 2], [], [3]], 4)).toEqual([2, 4, 4, 6]);
  });

  it('opens every chapter with one heading, and names only figures it can draw', () => {
    expect(new Set(CHAPTERS.map((c) => c.id)).size).toBe(CHAPTERS.length);
    for (const c of CHAPTERS) {
      expect(c.html.match(/<h1\b/g)?.length, c.id).toBe(1);
      expect(c.html.startsWith('<header class="ug-open">'), c.id).toBe(true);
      for (const [, name] of c.html.matchAll(/data-fig="([^"]+)"/g)) expect(FIGURES, c.id).toContain(name);
      expect(c.html).not.toMatch(/<img(?![^>]*\balt=)/);
    }
  });

  it('has the chapter and section every level check finding links to', () => {
    for (const [id, { guide }] of Object.entries(CHECKS)) {
      const c = CHAPTERS.find((x) => x.id === guide.chapter);
      expect(c, id).toBeDefined();
      const heads = [c!.title, ...[...c!.html.matchAll(/<h2>([^<]+)<\/h2>/g)].map((m) => m[1])];
      expect(heads, id).toContain(guide.section);
    }
  });

  it('uses generic words for toys', () => {
    for (const c of CHAPTERS) expect(c.html).not.toMatch(/\blego\b/i);
  });

  it('ends with designing with a goal, level design, the tricks, the level check, every player, the limits, the shareware tricks, the numbers, then the upload checklist on a page of its own', () => {
    expect(CHAPTERS.slice(-9).map((c) => c.id)).toEqual(['craft', 'levels', 'tricks', 'check', 'players', 'limits', 'shareware', 'numbers', 'upload']);
    expect(CHAPTERS.filter((c) => c.newPage).map((c) => c.id)).toEqual(['upload']);
  });

  // the original manual's OCR, the player reviews and the video transcript the design chapters learned from: no wording of theirs
  const sources = [
    'manual-ocr/manual.txt',
    'other-games.md',
    'bad-games/friction.md',
    'bad-games/sherwood forest software.md',
    'binge/adg-250-game-maker.md',
  ].map((f) => new URL(`../../../../.for-lewis/${f}`, import.meta.url));
  it.skipIf(!sources.every(existsSync))('shares no run of six words with the original manual, the reviews or the video', () => {
    const theirs = words(sources.map((f) => readFileSync(f, 'utf8')).join(' '));
    const runs = new Set<string>();
    for (let i = 0; i + 6 <= theirs.length; i++) runs.add(theirs.slice(i, i + 6).join(' '));
    const ours = words(CHAPTERS.map((c) => c.html).join(' '));
    const shared = [];
    for (let i = 0; i + 6 <= ours.length; i++) if (runs.has(ours.slice(i, i + 6).join(' '))) shared.push(ours.slice(i, i + 6).join(' '));
    expect(shared).toEqual([]);
  });
});
