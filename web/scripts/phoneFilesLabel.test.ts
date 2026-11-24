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

function extensionVisible(button: Element): boolean {
  const extension = button.querySelector('.files-toggle-extension')!;
  const style = getComputedStyle(extension);
  // Computed rgba() uses a fourth comma-separated channel. Modern color functions use a slash.
  const alpha = style.color.match(/(?:^rgba\([^)]*,|\/)\s*([\d.e+-]+)%?\s*\)$/i)?.[1];
  if (Number(alpha) === 0) return false;
  if (style.visibility !== 'visible' || extension.getBoundingClientRect().height === 0) return false;
  for (let element: Element | null = extension; element; element = element.parentElement) {
    if (Number(getComputedStyle(element).opacity) === 0) return false;
  }
  const stem = button.querySelector('.files-toggle-stem')!;
  const range = document.createRange();
  range.selectNodeContents(extension);
  const rect = range.getBoundingClientRect();
  for (let element: Element | null = extension; element; element = element.parentElement) {
    const style = getComputedStyle(element);
    if (style.overflowY === 'visible' || style.display === 'inline' || style.display === 'contents') continue;
    const top = element.getBoundingClientRect().top + element.clientTop;
    if (rect.top < top || rect.bottom > top + element.clientHeight) return false;
  }
  const box = button.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.top >= box.top &&
    rect.bottom <= box.bottom &&
    rect.left >= box.left &&
    rect.left >= stem.getBoundingClientRect().right - 1 &&
    rect.right <= box.right
  );
}

it.each([
  ['hidden extension', '.files-toggle-extension { visibility: hidden }'],
  ['zero-height extension', '.files-toggle-extension { display:inline-block; height:0; overflow:hidden; vertical-align:top }'],
  ['clipped ancestor', '.filename { display:inline-block; height:8px; overflow:hidden; vertical-align:top }'],
  ['transparent extension', '.files-toggle-extension { opacity: 0 }'],
  ['transparent text color', '.files-toggle-extension { color: transparent }'],
  ['transparent ancestor', 'body { opacity: 0 }'],
  ['clipped second line', 'button { height: 20px }'],
])('rejects a %s', async (_name, css) => {
  const page = await browser.newPage();
  try {
    await page.setContent(`
      <style>button { display: block; width: 100px; height: 42px; padding: 0; border: 0; overflow: hidden; line-height: 20px; align-content: start }</style>
      <button>Files (2)<br><span class="files-toggle-stem">file</span><span class="filename"><span class="files-toggle-extension">.txt</span></span></button>
    `);
    const button = page.locator('button');
    expect(await button.evaluate(extensionVisible)).toBe(true);
    await page.addStyleTag({ content: css });
    expect(await button.evaluate(extensionVisible)).toBe(false);
  } finally {
    await page.close();
  }
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
        const prefix = button.querySelector('.files-toggle-prefix')!;
        const filenameRow = button.querySelector('.files-toggle-current')!.getBoundingClientRect();
        const stem = button.querySelector('.files-toggle-stem')!;
        const extension = button.querySelector('.files-toggle-extension')!;
        const range = document.createRange();
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
        };
      });
      expect(await button.evaluate(extensionVisible)).toBe(true);
      if (narrow) expect(layout.overflowing).toEqual(['files-toggle-stem']);
      expect(layout).toMatchObject({ prefix: `Files (${count})`, truncation: 'ellipsis', suffix: '.txt' });
      if (!narrow) expect(layout.countVisible).toBe(true);
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
