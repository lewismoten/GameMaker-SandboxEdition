// Exercise the sticky navigation with wrapped and single-row tabs in Chromium.
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';

it.each([320, 1440].flatMap((width) => ['heading link', 'pinned switch'].map((action) => ({ width, action }))))(
  '$action at $width pixels',
  async ({ width, action }) => {
    const script = await build({
      entryPoints: ['src/credits/tabs.ts'],
      bundle: true,
      write: false,
      format: 'iife',
      globalName: 'credits',
    });
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage({ viewport: { width, height: 568 }, reducedMotion: 'reduce' });
      const titles = ['The original', 'Game authors', 'The people', 'More games', 'The Bard', 'BBS pictures', 'AI tools', 'Third-party pieces', 'Software'];
      await page.setContent(
        `<main class="credits-page"><div style="height:200px"></div><div class="credits-tabs-wrap"></div>${titles.map((title, i) => `<section style="height:4000px"><h2 id="s${i}">${title}</h2></section>`).join('')}</main>`,
      );
      await page.addStyleTag({ content: readFileSync('src/credits/creditsLayout.css', 'utf8') });
      await page.addScriptTag({ content: script.outputFiles[0].text });
      await page.addScriptTag({
        content: `const main = document.querySelector('main');
      const panels = [...main.querySelectorAll('section')];
      main.querySelector('.credits-tabs-wrap').append(credits.creditsTabs(panels.map((p,i) => ({id:'s'+i,key:'s'+i,title:p.textContent,what:p.textContent})),panels,main));
`,
      });
      const visible = async (i: number) => {
        const heading = await page.locator(`#s${i}`).boundingBox();
        const bar = await page.locator('.credits-tabs-wrap').boundingBox();
        expect(heading!.y).toBeGreaterThanOrEqual(bar!.y + bar!.height - 1);
        expect(heading!.y + heading!.height).toBeLessThan(568);
      };
      if (action === 'heading link') {
        await page.addScriptTag({ content: "credits.gotoCredit('s4')" });
        await visible(4);
        expect(await page.locator(':focus').getAttribute('id')).toBe('s4');
        return;
      }
      const tab = page.getByRole('tab', { name: 'The people' });
      await page.evaluate(() => window.scrollBy(0, 1200));
      await tab.click();
      await visible(2);
      await page.evaluate(() => window.scrollBy(0, 1200));
      await tab.press('ArrowRight');
      await visible(3);
      expect(await page.locator(':focus').textContent()).toBe('More games');
    } finally {
      await browser.close();
    }
  },
);
