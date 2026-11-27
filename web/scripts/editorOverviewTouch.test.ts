// Browser regression for standalone editor links, measuring the actual rendered hit target.
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
