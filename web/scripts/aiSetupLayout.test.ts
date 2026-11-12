// Real-page regression: AI setup must fit a short landscape phone without hiding controls.
import { expect, it } from 'vitest';
import { launch, target } from './perfLib';
import { forceTheme } from './forceTheme';
import { scenes } from './dialogsFitScenes';
import { measure } from './dialogsFitMeasure';

it('fits AI setup at 844x390 in both themes with keyboard-reachable actions', async () => {
  const server = await target(5278);
  const browser = await launch();
  try {
    for (const theme of ['light', 'dark'] as const) {
      const context = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
      try {
        await forceTheme(context, theme);
        await context.addInitScript(() => localStorage.setItem('gm-ui', 'modern'));
        const page = await context.newPage();
        await page.goto(server.base);
        await scenes.find((scene) => scene.id === 'ai-setup')!.open(page);
        await page.waitForSelector('dialog[open] .ai-setup');
        const result = await measure(page);
        expect(result.problems, theme).toEqual([]);
        const save = page.getByRole('button', { name: 'Save', exact: true });
        await save.focus();
        await page.keyboard.press('Shift+Tab');
        expect(await page.getByRole('button', { name: 'Cancel', exact: true }).evaluate((el) => el === document.activeElement)).toBe(true);
        expect((await measure(page)).problems, `${theme} after keyboard navigation`).toEqual([]);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
    server.stop();
  }
}, 60000);
