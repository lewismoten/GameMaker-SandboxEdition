// The Ultimate Owner's Guide: its page sums, its chapters' order, structure and figures, and (when
// the sources are on this machine) that none of its wording comes from RSD's manual or the reviews.
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CHAPTERS, chapterStarts, planBook } from './plan';

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

  it('uses generic words for toys', () => {
    for (const c of CHAPTERS) expect(c.html).not.toMatch(/\blego\b/i);
  });

  it('ends with designing with a goal, then the upload checklist on a page of its own, then the numbers', () => {
    expect(CHAPTERS.slice(-3).map((c) => c.id)).toEqual(['craft', 'upload', 'numbers']);
    expect(CHAPTERS.filter((c) => c.newPage).map((c) => c.id)).toEqual(['upload']);
  });

  // the original manual's OCR, and the player reviews the design chapter learned from: no wording of theirs
  const sources = ['manual-ocr/manual.txt', 'other-games.md'].map((f) => new URL(`../../../../.for-lewis/${f}`, import.meta.url));
  it.skipIf(!sources.every(existsSync))('shares no run of six words with the original manual or the reviews', () => {
    const theirs = words(sources.map((f) => readFileSync(f, 'utf8')).join(' '));
    const runs = new Set<string>();
    for (let i = 0; i + 6 <= theirs.length; i++) runs.add(theirs.slice(i, i + 6).join(' '));
    const ours = words(CHAPTERS.map((c) => c.html).join(' '));
    const shared = [];
    for (let i = 0; i + 6 <= ours.length; i++) if (runs.has(ours.slice(i, i + 6).join(' '))) shared.push(ours.slice(i, i + 6).join(' '));
    expect(shared).toEqual([]);
  });
});
