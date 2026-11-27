// Measure the Files button with the phone toolbar and a real open file.
import type { Browser } from 'playwright-core';
import { afterAll, beforeAll, expect, inject, it } from 'vitest';
import { forceTheme, assertTheme } from './forceTheme';
import { launch } from './perfLib';

let browser: Browser;
beforeAll(async () => {
  browser = await launch();
}, 120_000);
afterAll(async () => {
  await browser?.close();
});

function extensionVisible(button: Element): boolean {
  const extension = button.querySelector('.files-toggle-extension')!;
  const style = getComputedStyle(extension);
  // Computed rgba() uses a fourth comma-separated channel. Modern color functions use a slash.
  const alpha = style.color.match(/(?:^rgba\([^)]*,|\/)\s*([\d.e+-]+)%?\s*\)$/i)?.[1];
  if (Number(alpha) === 0) return false;
  if (style.visibility !== 'visible' || (style.display !== 'contents' && extension.getBoundingClientRect().height === 0)) return false;
  for (let element: Element | null = extension; element; element = element.parentElement) {
    if (Number(getComputedStyle(element).opacity) === 0) return false;
  }
  const stem = button.querySelector('.files-toggle-stem')!;
  const range = document.createRange();
  range.selectNodeContents(extension);
  const rect = range.getBoundingClientRect();
  for (let element: Element | null = extension; element; element = element.parentElement) {
    const style = getComputedStyle(element);
    if (style.display === 'inline' || style.display === 'contents') continue;
    const bounds = element.getBoundingClientRect();
    const left = bounds.left + element.clientLeft;
    const top = bounds.top + element.clientTop;
    if (style.overflowX !== 'visible' && (rect.left < left || rect.right > left + element.clientWidth)) return false;
    if (style.overflowY !== 'visible' && (rect.top < top || rect.bottom > top + element.clientHeight)) return false;
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
  ['hidden extension', '.files-toggle-extension { visibility: hidden }', false],
  ['zero-height extension', '.files-toggle-extension { display:inline-block; height:0; overflow:hidden; vertical-align:top }', false],
  ['clipped ancestor', '.filename { display:inline-block; height:8px; overflow:hidden; vertical-align:top }', false],
  ['horizontally clipped ancestor', '.filename { display:inline-block; vertical-align:top; width:0; overflow:hidden }', false],
  ['transparent extension', '.files-toggle-extension { opacity: 0 }', false],
  ['transparent text color', '.files-toggle-extension { color: transparent }', false],
  ['transparent ancestor', 'body { opacity: 0 }', false],
  ['clipped second line', 'button { height: 20px }', false],
  ['display:contents extension', '.files-toggle-extension { display:contents }', true],
] as const)('measures visibility for a %s', async (_name, css, visible) => {
  const page = await browser.newPage();
  try {
    await page.setContent(`
      <style>button { display: block; width: 100px; height: 42px; padding: 0; border: 0; overflow: hidden; line-height: 20px; align-content: start }</style>
      <button>Files (2)<br><span class="files-toggle-stem">file</span><span class="filename"><span class="files-toggle-extension">.txt</span></span></button>
    `);
    const button = page.locator('button');
    expect(await button.evaluate(extensionVisible)).toBe(true);
    await page.addStyleTag({ content: css });
    expect(await button.evaluate(extensionVisible)).toBe(visible);
  } finally {
    await page.close();
  }
});

const filenames = { latin: 'wwwwwwww.txt', rtl: 'שששששששש.txt' };
const fixtures = [
  { width: 320, checkNarrow: false, script: 'latin', filename: filenames.latin, theme: 'light' },
  { width: 390, checkNarrow: false, script: 'short-latin', filename: 'mygame.txt', theme: 'light' },
  ...(['light', 'dark'] as const).flatMap((theme) =>
    Object.entries(filenames).map(([script, filename]) => ({ width: 390, checkNarrow: true, script, filename, theme })),
  ),
] as const;

it.each(fixtures)(
  'contains the $script extension at viewport width $width ($theme)',
  async ({ width, checkNarrow, script, filename, theme }) => {
    const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
    try {
      await forceTheme(context, theme);
      await context.addInitScript(() => localStorage.setItem('gm-ui', 'modern'));
      const page = await context.newPage();
      // Seed storage before starting the app so its initial route cannot race project creation.
      await page.route('**/seed-project', (route) => route.fulfill({ contentType: 'text/html', body: '<body></body>' }));
      await page.goto(inject('appBase') + '/seed-project');
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
      await page.goto(`${inject('appBase')}/#/p/${projectId}`);
      const button = page.getByRole('button', { name: /^Files \(/ });
      await button.waitFor({ timeout: 60_000 });

      if (filename === 'mygame.txt') {
        // First steps redraws the sidebar once its panel has loaded. Open the settled drawer.
        await page.locator('.sidebar .fs-toggle').waitFor({ state: 'attached' });
        await page.locator('.save-note').filter({ hasText: '✓ Saved' }).waitFor({ state: 'attached' });
        await button.press('Enter');
        const file = page.locator('.file-row .file:visible').first();
        await file.waitFor();
        await expect.poll(() => file.getAttribute('tabindex')).toBe('0');
        const tabStops = await page.locator('.sidebar button, .sidebar input, .sidebar a').count();
        for (let i = 0; i < tabStops && !(await file.evaluate((el) => el === document.activeElement)); i++) {
          await page.keyboard.press('Tab');
        }
        expect(await file.evaluate((el) => el === document.activeElement)).toBe(true);
        await page.keyboard.press('Escape');
        await page.setViewportSize({ width: 1440, height: 844 });
        await file.waitFor();
        await expect.poll(() => file.getAttribute('tabindex')).toBe('0');
        await page.setViewportSize({ width, height: 844 });
        await button.press('Enter');
      } else {
        await button.click();
      }
      await page.locator(`.file-row[data-name="${filename}"] button.file`).click();
      const selected = page.locator(`.file-row.active[data-name="${filename}"]`);
      await selected.locator('button.file').waitFor({ state: 'attached' });
      expect(await selected.getAttribute('data-name')).toBe(filename);
      expect(decodeURIComponent(new URL(page.url()).hash.split('?')[0].split('/').pop()!)).toBe(filename);
      const count = await page.locator('.file-row').count();
      await page.getByRole('button', { name: `Files (${count}) · ${filename}`, exact: true }).waitFor();
      await assertTheme(page, theme);
      // The forced width changes only the mounted toolbar's CSS. Measure both layouts on the same open file.
      for (const narrow of checkNarrow ? [false, true] : [false]) {
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
        if (filename === 'mygame.txt') expect(layout.overflowing).toEqual([]);
        if (narrow) expect(layout.overflowing).toEqual(['files-toggle-stem']);
        expect(layout).toMatchObject({ prefix: `Files (${count})`, truncation: 'ellipsis', suffix: '.txt' });
        if (!narrow) expect(layout.countVisible).toBe(true);
        if (process.env.GM_PHONE_FILES_SHOTS) {
          await page.locator('.ach-toast').first().waitFor({ state: 'hidden' });
          await page.screenshot({ path: `${process.env.GM_PHONE_FILES_SHOTS}/files-${script}-${theme}-${width}-${narrow}.png` });
        }
      }
    } finally {
      await context.close();
    }
  },
  120_000,
);
