// The 1994 Technical Reference booklet: its chapters read from the Markdown, with nothing of the modern book in it.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { techRefChapters } from './techRef';
import { blockText } from './markdownBlocks';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { MEMORY, TECHREF_DIAGRAMS } from './techRefDiagrams';

const text = readFileSync(join(import.meta.dirname, '../../programmersGuide/booklet1994.md'), 'utf8');

describe('Technical Reference and Limits', () => {
  it('has thirty numbered chapters after the opening one, none empty, and ends on its glossary', () => {
    const heads = techRefChapters(text).map((c) => c.head);
    expect(heads[0]).toBe('Before you begin');
    expect(heads).toContain('Limits at a glance');
    expect(heads.at(-1)).toBe('Words used in this booklet');
    expect(heads).toHaveLength(31);
  });

  it('says pixels, not dots, and leaves no stray note or literal underscores', () => {
    expect(text).not.toMatch(/\bdots\b|source listing/);
    const words = techRefChapters(text).flatMap((c) => c.blocks.map(blockText));
    expect(words.filter((w) => /(?<!\w)_|_(?!\w)/.test(w))).toEqual([]);
  });

  it('draws a labeled figure for each diagram in the chapters', async () => {
    const names = techRefChapters(text).flatMap((chapter) => chapter.blocks.flatMap((block) => (block.tag === 'diagram' ? [block.name] : [])));
    expect(names.sort()).toEqual(Object.keys(TECHREF_DIAGRAMS).sort());
    const bundle = await build({
      entryPoints: ['src/manual/printables/techRefDiagrams.ts'],
      bundle: true,
      write: false,
      format: 'iife',
      globalName: 'diagrams',
      loader: { '.css': 'empty' },
    });
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.addScriptTag({ content: 'document.body.append(...Object.values(diagrams.TECHREF_DIAGRAMS).map(build => build()));' });
      const figures = await page.locator('figure').evaluateAll((elements) =>
        elements.map((figure) => ({
          label: figure.querySelector('svg[role="img"]')?.getAttribute('aria-label'),
          drawn: !!figure.querySelector('svg > *'),
          caption: figure.querySelector('figcaption')?.textContent,
        })),
      );
      expect(figures).toHaveLength(names.length);
      for (const figure of figures) {
        expect(figure.label).toMatch(/\S/);
        expect(figure.drawn).toBe(true);
        expect(figure.caption).toMatch(/\S/);
      }
    } finally {
      await browser.close();
    }
  });

  it('rounds the program rows in the memory diagram to the booklet estimate', () => {
    const total = MEMORY.filter((row) => row.kind === 'prog').reduce((sum, row) => sum + row.k, 0);
    expect(text).toContain(`PLAYGAME holds about ${Math.round(total / 10) * 10}K`);
  });

  it('is signed by technical staff and keeps the draft note, source lines and bugs out', () => {
    expect(text).toContain('Notes by technical staff');
    expect(text).not.toMatch(/Draft text|taste call|PG:\d|\.C:\d|\[verify\]|RSD|Lewis|source listing line/);
  });
});
