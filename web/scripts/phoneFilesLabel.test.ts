// Measure the Files button with the phone toolbar and a real open file.
import type { Browser } from 'playwright-core';
import { expect, it } from 'vitest';
import { forceTheme, assertTheme } from './forceTheme';
import { launch, target } from './perfLib';

it('keeps a visible filename ending inside the only overflowing label at 390px', async () => {
  const server = await target(6183);
  let browser: Browser | undefined;
  try {
    browser = await launch();
    const filename = 'notes-for-the-last-level.txt';
    for (const theme of ['light', 'dark'] as const) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      await forceTheme(context, theme);
      await context.addInitScript(() => localStorage.setItem('gm-ui', 'modern'));
      const page = await context.newPage();
      await page.goto(server.base);
      await page.addScriptTag({
        type: 'module',
        content: `import { Project } from '/src/editor/core/project.ts';
          import { beginFirstSteps } from '/src/editor/shell/firstSteps.ts';
          const project = Project.create('My Game');
          beginFirstSteps(project);
          project.files.set('${filename}', new TextEncoder().encode('Level notes'));
          await project.saveNow();
          location.hash = '#/p/' + project.id + '/${filename}';`,
      });
      const button = page.getByRole('button', { name: new RegExp('^Files .*' + filename + '$') });
      await button.waitFor();
      await assertTheme(page, theme);
      const layout = await button.evaluate((button) => {
        const name = button.querySelector('.files-toggle-current')!;
        const style = getComputedStyle(name);
        const suffix = document.createRange();
        const text = name.querySelector('bdi')!.firstChild!;
        suffix.setStart(text, text.textContent!.length - 5);
        suffix.setEnd(text, text.textContent!.length);
        const ellipsis = document.createElement('canvas').getContext('2d')!;
        ellipsis.font = style.font;
        const rect = suffix.getBoundingClientRect();
        const box = name.getBoundingClientRect();
        return {
          overflowing: [button, ...button.querySelectorAll('*')]
            .filter((el) => el.scrollWidth > el.clientWidth && getComputedStyle(el).display !== 'inline')
            .map((el) => el.className),
          truncation: [style.textOverflow, style.overflowX, style.direction],
          suffixVisible: rect.left >= box.left + ellipsis.measureText('…').width && rect.right <= box.right + 1,
        };
      });
      expect(layout).toEqual({ overflowing: ['files-toggle-current'], truncation: ['ellipsis', 'hidden', 'rtl'], suffixVisible: true });
      if (process.env.GM_PHONE_FILES_SHOTS) {
        await page.locator('.ach-toast').first().waitFor({ state: 'hidden' });
        await page.screenshot({ path: `${process.env.GM_PHONE_FILES_SHOTS}/files-${theme}.png` });
      }
      await context.close();
    }
  } finally {
    await browser?.close();
    server.stop();
  }
}, 120_000);
