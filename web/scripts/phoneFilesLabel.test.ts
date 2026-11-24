// Measure the Files button with the phone toolbar and a real open file.
import type { Browser } from 'playwright-core';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { forceTheme, assertTheme } from './forceTheme';
import { launch, target } from './perfLib';

let server: Awaited<ReturnType<typeof target>>;
let browser: Browser;
beforeAll(async () => {
  server = await target(6183);
  browser = await launch();
}, 120_000);
afterAll(async () => {
  await browser?.close();
  server?.stop();
});

const filenames = { latin: 'wwwwwwww.txt', rtl: 'שששששששש.txt' };
const fixtures = [
  { width: 320, narrow: false, script: 'latin', filename: filenames.latin, theme: 'light' },
  ...(['light', 'dark'] as const).flatMap((theme) =>
    Object.entries(filenames).flatMap(([script, filename]) => [false, true].map((narrow) => ({ width: 390, narrow, script, filename, theme }))),
  ),
] as const;

it.each(fixtures)(
  'contains the $script extension at viewport width $width ($theme, forced narrow=$narrow)',
  async ({ width, narrow, script, filename, theme }) => {
    const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
    try {
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
          const name = ${JSON.stringify(filename)};
          project.files.set(name, new TextEncoder().encode(name));
          await project.saveNow();
          document.body.dataset.project = project.id;`,
      });
      const projectId = await page.locator('body[data-project]').getAttribute('data-project');
      await page.goto(`${server.base}/#/p/${projectId}`);
      const button = page.getByRole('button', { name: /^Files \(/ });
      await button.waitFor({ timeout: 60_000 });

      await button.click();
      await page.locator(`.file-row[data-name="${filename}"] button.file`).click();
      const selected = page.locator(`.file-row.active[data-name="${filename}"]`);
      await selected.locator('button.file').waitFor({ state: 'attached' });
      expect(await selected.getAttribute('data-name')).toBe(filename);
      expect(decodeURIComponent(new URL(page.url()).hash.split('?')[0].split('/').pop()!)).toBe(filename);
      const count = await page.locator('.file-row').count();
      await page.getByRole('button', { name: `Files (${count}) · ${filename}`, exact: true }).waitFor();
      await assertTheme(page, theme);
      if (narrow) await page.addStyleTag({ content: '.sidebar .files-toggle { flex: none; width: 80px; }' });
      const layout = await button.evaluate((button) => {
        const stem = button.querySelector('.files-toggle-stem')!;
        const extension = button.querySelector('.files-toggle-extension')!;
        const range = document.createRange();
        range.selectNodeContents(extension);
        const rect = range.getBoundingClientRect();
        const box = button.getBoundingClientRect();
        return {
          overflowing: [button, ...button.querySelectorAll('*')].filter((el) => el.scrollWidth > el.clientWidth).map((el) => el.className),
          truncation: getComputedStyle(stem).textOverflow,
          suffix: extension.textContent,
          visible: rect.width > 0 && rect.left >= box.left && rect.left >= stem.getBoundingClientRect().right - 1 && rect.right <= box.right,
        };
      });
      if (narrow) expect(layout.overflowing).toEqual(['files-toggle-stem']);
      expect(layout).toMatchObject({ truncation: 'ellipsis', suffix: '.txt', visible: true });
      if (process.env.GM_PHONE_FILES_SHOTS) {
        await page.locator('.ach-toast').first().waitFor({ state: 'hidden' });
        await page.screenshot({ path: `${process.env.GM_PHONE_FILES_SHOTS}/files-${script}-${theme}-${width}-${narrow}.png` });
      }
    } finally {
      await context.close();
    }
  },
  120_000,
);
