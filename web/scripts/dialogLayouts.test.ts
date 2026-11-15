// Real-page regressions for dialogs that used to need portrait scrolling.
import { expect, it } from 'vitest';
import { launch, target } from './perfLib';
import { assertTheme, forceTheme } from './forceTheme';
import { extraScenes } from './dialogsExtraScenes';
import { measure } from './dialogsFitMeasure';

it('fits the Community proposal form on both small portrait phones', async () => {
  const server = await target(5196);
  const browser = await launch();
  try {
    for (const viewport of [
      { width: 375, height: 812 },
      { width: 360, height: 740 },
    ]) {
      const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true });
      await forceTheme(context, 'light');
      await context.addInitScript(() => localStorage.setItem('gm-ui', 'modern'));
      const page = await context.newPage();
      await page.goto(server.base);
      await extraScenes.find((scene) => scene.id === 'community-submit')!.open(page);
      await page.waitForSelector('dialog[open]');
      await assertTheme(page, 'light');
      const result = await measure(page);
      expect(
        result.problems.filter((problem) => problem.includes('scrolls') && !problem.includes('[allowed list]')),
        JSON.stringify(viewport),
      ).toEqual([]);
      await context.close();
    }
  } finally {
    await browser.close();
    server.stop();
  }
}, 30000);
