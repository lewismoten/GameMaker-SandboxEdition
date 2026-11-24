// Measure the Files button with the phone toolbar and a real open file.
import type { Browser } from 'playwright-core';
import { expect, it } from 'vitest';
import { forceTheme, assertTheme } from './forceTheme';
import { launch, target } from './perfLib';

it('keeps the extension visible when a file selected from the phone picker overflows at 390px', async () => {
  const server = await target(6183);
  let browser: Browser | undefined;
  try {
    browser = await launch();
    const filenames = { latin: 'wwwwwwww.txt', rtl: 'שששששששש.txt' };
    for (const theme of ['light', 'dark'] as const) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      await forceTheme(context, theme);
      await context.addInitScript(() => localStorage.setItem('gm-ui', 'modern'));
      const page = await context.newPage();
      // Seed storage before starting the app so its initial route cannot race project creation.
      await page.route('**/seed-project', (route) => route.fulfill({ contentType: 'text/html', body: '<body></body>' }));
      await page.goto(server.base + '/seed-project');
      await page.addScriptTag({
        type: 'module',
        content: `import { Project } from '/src/editor/core/project.ts';
          import { beginFirstSteps } from '/src/editor/shell/firstSteps.ts';
          const project = Project.create('My Game');
          beginFirstSteps(project);
          for (const name of ${JSON.stringify(Object.values(filenames))}) project.files.set(name, new TextEncoder().encode(name));
          await project.saveNow();
          document.body.dataset.project = project.id;`,
      });
      const projectId = await page.locator('body[data-project]').getAttribute('data-project');
      await page.goto(`${server.base}/#/p/${projectId}`);
      const button = page.getByRole('button', { name: /^Files \(/ });
      await button.waitFor({ timeout: 60_000 });
      for (const [script, filename] of Object.entries(filenames)) {
        await button.click();
        await page.locator(`.file-row[data-name="${filename}"] button.file`).click();
        const selected = page.locator(`.file-row.active[data-name="${filename}"]`);
        await selected.locator('button.file').waitFor({ state: 'attached' });
        expect(await selected.getAttribute('data-name')).toBe(filename);
        expect(decodeURIComponent(new URL(page.url()).hash.split('?')[0].split('/').pop()!)).toBe(filename);
        const count = await page.locator('.file-row').count();
        await page.getByRole('button', { name: `Files (${count}) · ${filename}`, exact: true }).waitFor();
        await assertTheme(page, theme);
        const layout = await button.evaluate((button) => {
          const prefix = button.querySelector('.files-toggle-prefix')!;
          const filenameRow = button.querySelector('.files-toggle-current')!.getBoundingClientRect();
          const stem = button.querySelector('.files-toggle-stem')!;
          const extension = button.querySelector('.files-toggle-extension')!;
          const range = document.createRange();
          range.selectNodeContents(extension);
          const rect = range.getBoundingClientRect();
          range.selectNodeContents(prefix);
          const countRect = range.getBoundingClientRect();
          const box = button.getBoundingClientRect();
          return {
            prefix: prefix.textContent,
            countVisible:
              countRect.width > 0 &&
              countRect.height > 0 &&
              countRect.left >= box.left &&
              countRect.right <= box.right &&
              countRect.top >= box.top &&
              countRect.bottom <= box.bottom &&
              countRect.bottom <= filenameRow.top,
            overflowing: [button, ...button.querySelectorAll('*')].filter((el) => el.scrollWidth > el.clientWidth).map((el) => el.className),
            truncation: getComputedStyle(stem).textOverflow,
            suffix: extension.textContent,
            visible: rect.width > 0 && rect.left >= stem.getBoundingClientRect().right - 1 && rect.right <= box.right,
          };
        });
        expect(layout).toEqual({
          prefix: `Files (${count})`,
          countVisible: true,
          overflowing: ['files-toggle-stem'],
          truncation: 'ellipsis',
          suffix: '.txt',
          visible: true,
        });
        if (process.env.GM_PHONE_FILES_SHOTS) {
          await page.locator('.ach-toast').first().waitFor({ state: 'hidden' });
          await page.screenshot({ path: `${process.env.GM_PHONE_FILES_SHOTS}/files-${script}-${theme}.png` });
        }
      }
      await context.close();
    }
  } finally {
    await browser?.close();
    server.stop();
  }
}, 120_000);
