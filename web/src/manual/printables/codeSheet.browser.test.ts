// Exercise the printed and interactive cards with a sheet independent of the game catalog.
import { build } from 'esbuild';
import { chromium, type Page } from 'playwright-core';
import { expect, it } from 'vitest';
import type { CodeSheetItem } from './types';

const item: CodeSheetItem = {
  kind: 'codesheet',
  title: 'Signal card',
  heading: 'Signal card',
  puzzles: [{ scenes: [1], ask: 'Which signal opens the gate?', grid: 0, row: 'West', col: 'Low', answer: 'Open the gate.' }],
  grids: [
    {
      title: 'Signals',
      rowHead: 'Station',
      colHead: 'Band',
      rows: ['East', 'West'],
      cols: ['Low', 'High'],
      cells: [
        ['A', 'B'],
        ['C', 'D'],
      ],
    },
  ],
};

async function showCards(check: (page: Page) => Promise<void>) {
  const script = await build({
    stdin: {
      contents: `import { codeSheetLive, codeSheetSheets } from './codeSheet';
      const item = ${JSON.stringify(item)};
      codeSheetSheets(item).then(([sheet]) => document.body.append(sheet.el, codeSheetLive(item)));`,
      resolveDir: 'src/manual/printables',
    },
    bundle: true,
    write: false,
    define: { 'import.meta.env': '{}' },
    loader: { '.css': 'empty' },
  });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.addScriptTag({ content: script.outputFiles[0].text });
    await check(page);
  } finally {
    await browser.close();
  }
}

it('labels both axes on the printed and live cards', () =>
  showCards(async (page) => {
    for (const selector of ['.pp-paper', '.cs-live']) {
      const table = page.locator(selector).getByRole('table', { name: 'Signals' });
      expect(await table.getByRole('columnheader', { name: 'Station' }).count()).toBe(1);
      const group = table.locator('th[scope="colgroup"]');
      expect(await group.allTextContents()).toEqual(['Band']);
      expect(await group.getAttribute('colspan')).toBe('2');
    }
  }));

it('selects squares by keyboard and looks up the puzzle answer', () =>
  showCards(async (page) => {
    const live = page.locator('.cs-live');
    await page.keyboard.press('Tab');
    expect(await live.locator('td:focus').textContent()).toBe('A');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    expect(await live.locator('.cs-on').allTextContents()).toEqual(['B']);
    expect(await live.locator('th.cs-line').allTextContents()).toEqual(['High', 'East']);
    const tell = live.getByRole('button', { name: 'Tell me the answer' });
    expect(await tell.count()).toBe(1);
    await tell.press('Enter');
    expect(await live.locator('.cs-on').allTextContents()).toEqual(['C']);
    expect(await live.locator('th.cs-line').allTextContents()).toEqual(['Low', 'West']);
    expect(await live.locator('[aria-live="polite"]').textContent()).toBe('Signals: West, Low: C Open the gate.');
  }));
