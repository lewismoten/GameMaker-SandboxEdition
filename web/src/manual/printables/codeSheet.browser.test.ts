// Exercise the live code sheet even when the game catalog has no examples.
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';
import type { CodeSheetItem } from './types';

it('selects a square with Enter and reveals the puzzle square with the answer button', async () => {
  const sheet: CodeSheetItem = {
    kind: 'codesheet',
    title: 'Signal card',
    heading: 'Signals',
    grids: [
      {
        title: 'Flags',
        rows: ['High', 'Low'],
        cols: ['East', 'West'],
        cells: [
          ['A', 'B'],
          ['C', 'D'],
        ],
      },
    ],
    puzzles: [{ ask: 'Which flag?', scenes: [1], grid: 0, row: 'Low', col: 'East' }],
  };
  const script = await build({
    entryPoints: ['src/manual/printables/codeSheet.ts'],
    bundle: true,
    write: false,
    format: 'iife',
    globalName: 'codeSheet',
    define: { 'import.meta.env': '{}' },
    loader: { '.css': 'empty' },
  });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.addScriptTag({ content: script.outputFiles[0].text });
    await page.addScriptTag({ content: `document.body.append(codeSheet.codeSheetLive(${JSON.stringify(sheet)}));` });
    await page.getByRole('cell', { name: 'B', exact: true }).press('Enter');
    expect(await page.locator('td.cs-on').allTextContents()).toEqual(['B']);
    expect(await page.locator('th.cs-line').allTextContents()).toEqual(['West', 'High']);
    await page.getByRole('button', { name: 'Tell me the answer' }).click();
    expect(await page.locator('td.cs-on').allTextContents()).toEqual(['C']);
    expect(await page.locator('th.cs-line').allTextContents()).toEqual(['East', 'Low']);
    expect(await page.locator('[aria-live="polite"]').textContent()).toBe('Flags: Low, East: C');
  } finally {
    await browser.close();
  }
});

it('labels the columns with their group heading on the printed and live cards', async () => {
  const sheet: CodeSheetItem = {
    kind: 'codesheet',
    title: 'Signal card',
    heading: 'Signals',
    grids: [
      {
        title: 'Flags',
        rowHead: 'Station',
        colHead: 'Band',
        rows: ['High', 'Low'],
        cols: ['East', 'West'],
        cells: [
          ['A', 'B'],
          ['C', 'D'],
        ],
      },
    ],
    puzzles: [],
  };
  const script = await build({
    entryPoints: ['src/manual/printables/codeSheet.ts'],
    bundle: true,
    write: false,
    format: 'iife',
    globalName: 'codeSheet',
    define: { 'import.meta.env': '{}' },
    loader: { '.css': 'empty' },
  });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.addScriptTag({ content: script.outputFiles[0].text });
    await page.addScriptTag({ content: `document.body.append(codeSheet.codeSheetLive(${JSON.stringify(sheet)}));` });
    const group = page.locator('th[scope="colgroup"]');
    expect(await group.allTextContents()).toEqual(['Band']);
    expect(await group.getAttribute('colspan')).toBe('2');
  } finally {
    await browser.close();
  }
});
