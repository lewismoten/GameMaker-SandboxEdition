// Leave room for platform font metrics; this synthetic stress is not a macOS emulation.
import { expect, it } from 'vitest';
import { launch, target } from './perfLib';
import { forceTheme } from './forceTheme';
import { scenes } from './dialogsFitScenes';
import { measure } from './dialogsFitMeasure';

it('keeps AI setup vertical headroom with taller text in both themes', async () => {
  const server = await target(5306);
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
        for (const tallerText of [false, true]) {
          if (tallerText) await page.addStyleTag({ content: 'dialog.modal, dialog.modal * { line-height: 1.65 !important; }' });
          const label = `${theme}, taller text: ${tallerText}`;
          expect((await measure(page)).problems, label).toEqual([]);
          const spare = await page.locator('dialog[open]').evaluate((d) => parseFloat(getComputedStyle(d).maxHeight) - d.getBoundingClientRect().height);
          expect(spare, `${label}: at least 16px before the dialog height cap`).toBeGreaterThanOrEqual(16);
          await page.getByRole('button', { name: 'Save', exact: true }).focus();
          await page.keyboard.press('Shift+Tab');
          expect(await page.getByRole('button', { name: 'Cancel', exact: true }).evaluate((el) => el === document.activeElement), label).toBe(true);
          expect((await measure(page)).problems, `${label} after keyboard navigation`).toEqual([]);
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
    server.stop();
  }
}, 60000);
