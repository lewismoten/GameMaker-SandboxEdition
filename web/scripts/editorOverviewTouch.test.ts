// Browser regression for standalone editor links, measuring the actual rendered hit target.
import { forceTheme } from './forceTheme';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, expect, inject, it, vi } from 'vitest';
import type { Browser } from 'playwright-core';
import { launch } from './perfLib';
import { measureTargets } from './editorTouchAudit';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 }); // the second test loads the app in Chromium
let browser: Browser;
beforeAll(async () => {
  browser = await launch();
});
afterAll(async () => {
  await browser?.close();
});

it('counts a pseudo-element hit area only when it really receives pointer hits', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.setContent(
    `<style>.handle { position:absolute;left:100px;top:100px;width:10px;height:200px }.handle::before { content:'';position:absolute;inset:0 -7px }</style><div class="handle" tabindex="0" role="separator" aria-label="Resize"></div>`,
  );
  expect((await page.evaluate(measureTargets, 390)).under24).toHaveLength(0);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.addStyleTag({ content: '.handle { top:227px;height:672px }' });
  expect((await page.evaluate(measureTargets, 844)).under24).toHaveLength(0);
  await page.addStyleTag({ content: '.handle::before { pointer-events:none }' });
  expect((await page.evaluate(measureTargets, 390)).under24).toHaveLength(1);
});

it('gives standalone Overview links a 24px target without phone overflow', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(inject('appBase'));
  await page.addScriptTag({
    type: 'module',
    content: `import { overviewLink } from '/src/editor/shell/overviewLink.ts'; document.body.replaceChildren(overviewLink({ id: 'test' }, 'controls', 'Name the counters in Overview › Controls')); document.body.dataset.linkReady = '1';`,
  });
  await page.waitForSelector('body[data-link-ready="1"]');
  const result = await page.evaluate(() => {
    const link = document.querySelector('a')!;
    const rect = link.getBoundingClientRect();
    return { width: rect.width, height: rect.height, overflow: document.documentElement.scrollWidth - 390, href: link.getAttribute('href') };
  });
  expect(result.href).toBe('#/p/test?tab=controls');
  expect(result.width).toBeGreaterThanOrEqual(24);
  expect(result.height).toBeGreaterThanOrEqual(24);
  expect(result.overflow).toBeLessThanOrEqual(0);
});

it.each([390, 1440].flatMap((width) => (['light', 'dark'] as const).map((theme) => ({ width, theme }))))(
  'keeps the read-only action reachable across Overview tabs at $width px in $theme',
  async ({ width, theme }) => {
    const page = await browser.newPage({ viewport: { width, height: 844 }, hasTouch: width === 390 });
    try {
      await forceTheme(page.context(), theme);
      await page.addInitScript(() => localStorage.setItem('gm-ui', 'modern'));
      await page.goto(inject('appBase') + '/#/p/look:bcuda?tab=controls');
      const selected = page.getByRole('tablist', { name: 'Overview' }).getByRole('tab', { selected: true });
      await selected.waitFor();
      const action = page.getByRole('region', { name: 'Read-only' }).getByRole('button');
      for (const label of ['Controls', 'DOS player', 'Tools', 'Files']) {
        expect(await selected.textContent()).toBe(label);
        expect(await action.isVisible()).toBe(true);
        await selected.focus();
        await page.keyboard.press('Tab');
        expect(await action.evaluate((button) => button === document.activeElement)).toBe(true);
        if (label !== 'Files') {
          await selected.focus();
          await page.keyboard.press('ArrowRight');
        }
      }
      const notice = await action.boundingBox();
      const files = await selected.boundingBox();
      expect(notice!.y).toBeLessThan(width === 390 ? files!.y + files!.height + 24 : files!.y + files!.height);
      await page.addScriptTag({ content: readFileSync('../node_modules/axe-core/axe.min.js', 'utf8') });
      const violations = await page.evaluate(async () => {
        // @ts-expect-error axe is injected above
        const result = await axe.run(document.querySelector('.panel-tabs-heading'));
        return result.violations.map((v: { id: string }) => v.id);
      });
      expect(violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    } finally {
      await page.close();
    }
  },
);

it('exposes the Overview file count and total size at 375px', async () => {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  try {
    await page.goto(inject('appBase') + '/#/p/look:orb');
    const heading = page.locator('.asset-heading');
    await heading.waitFor();
    expect(await heading.ariaSnapshot()).toMatch(/status: [\d,]+ files · [\d.,]+ (?:bytes|KB|MB)/);
  } finally {
    await page.close();
  }
});

it('keeps the shareware text clear of Notice on narrow phones', async () => {
  const page = await browser.newPage({ viewport: { width: 320, height: 740 } });
  try {
    await page.goto(inject('appBase') + '/#/p/look:orb');
    const bar = page.getByRole('region', { name: 'Read-only' });
    const notice = bar.getByRole('button', { name: 'Notice' });
    await notice.waitFor();
    for (const viewport of [
      { width: 320, height: 740 },
      { width: 375, height: 812 },
    ]) {
      await page.setViewportSize(viewport);
      const textRight = await bar.locator('.released-text').evaluate((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return range.getBoundingClientRect().right;
      });
      expect.soft(textRight, `at ${viewport.width}px`).toBeLessThanOrEqual((await notice.boundingBox())!.x);
    }
  } finally {
    await page.close();
  }
});
