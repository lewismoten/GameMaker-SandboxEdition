// The Ultimate Owner's Guide's "(Chapter N)" cross-references: each names a chapter that exists,
// never the chapter it is in unless it is that chapter's own opening, and the one named with a
// section heading (“An ending, not an ad”) has that heading.
import { describe, expect, it } from 'vitest';
import { CHAPTERS } from './plan';

const text = (html: string) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');

describe('The Ultimate Owner’s Guide chapter references', () => {
  it('point at chapters that exist, and at another chapter than their own', () => {
    for (const [i, c] of CHAPTERS.entries()) {
      for (const m of text(c.html).matchAll(/\([Cc]hapters? (\d+)/g)) {
        const n = Number(m[1]);
        expect(n, `${c.id} cites chapter ${n}`).toBeGreaterThanOrEqual(1);
        expect(n, `${c.id} cites chapter ${n}`).toBeLessThanOrEqual(CHAPTERS.length);
        expect(n, `${c.id} cites itself`).not.toBe(i + 1);
      }
    }
  });

  it('quotes a section heading that the chapter it names has', () => {
    for (const c of CHAPTERS) {
      for (const m of text(c.html).matchAll(/\(Chapter (\d+), “([^”]+)”\)/g)) {
        expect(CHAPTERS[Number(m[1]) - 1].html, `${c.id} cites “${m[2]}”`).toContain(m[2]);
      }
    }
  });
});
