// Check the printed memory diagram's title color after Chromium parses the SVG.
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';

it('uses the blue spot color for the PLAYGAME bracket title', async () => {
  const script = await build({
    entryPoints: ['src/manual/printables/techRefDiagrams.ts'],
    bundle: true,
    write: false,
    format: 'iife',
    globalName: 'techRef',
    loader: { '.css': 'empty' },
  });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.addScriptTag({ content: script.outputFiles[0].text });
    await page.addScriptTag({ content: 'document.body.append(techRef.TECHREF_DIAGRAMS.memory())' });
    expect(await page.getByText('PLAYGAME', { exact: true }).getAttribute('fill')).toBe('#14304a');
  } finally {
    await browser.close();
  }
});
