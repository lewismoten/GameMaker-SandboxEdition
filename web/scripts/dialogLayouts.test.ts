// Real-page regressions for dialogs that used to need portrait scrolling.
import { expect, inject, it } from 'vitest';
import { launch } from './perfLib';
import { assertTheme, forceTheme } from './forceTheme';
import { extraScenes } from './dialogsExtraScenes';
import { scenes } from './dialogsFitScenes';
import { measure } from './dialogsFitMeasure';

it('fits the Community proposal form on both small portrait phones', async () => {
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
      await page.goto(inject('appBase'), { waitUntil: 'commit' });
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
  }
}, 30000);

it('blocks the questions scene when its questions fail to load', async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
    await page.addInitScript(() => localStorage.setItem('gm-ui', 'modern'));
    await page.route('**/src/project/howDoI.ts', (route) =>
      route.fulfill({
        contentType: 'text/javascript',
        body: `export * from './howDoI.ts?original';
          export async function loadQuestions() { throw new Error('offline'); }`,
      }),
    );
    await page.goto(inject('appBase'));
    const opened = scenes.find((scene) => scene.id === 'how-do-i')!.open(page);
    await expect(opened).rejects.toThrow();
    expect(await page.getByText('The questions could not be loaded.').isVisible()).toBe(true);
  } finally {
    await browser.close();
  }
}, 30000);
