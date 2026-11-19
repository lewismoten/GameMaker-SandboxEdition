// Sweep the library's nested scroll containers with a mouse viewport.
import { chromium } from 'playwright-core';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ hasTouch: false });
  await page.addInitScript(() => localStorage.setItem('gm-ui', 'modern'));
  await page.goto(process.argv[2] || 'http://127.0.0.1:6119');
  await page.waitForSelector('.shot-tools .shot-icon[data-tip]');
  await page.evaluate(() => document.fonts.ready);
  let failures = 0;
  for (let width = 320; width <= 1920; width += 4) {
    const height = width < 1000 ? 812 : width === 1280 ? 800 : 700;
    await page.setViewportSize({ width, height });
    await page.evaluate(() => new Promise(requestAnimationFrame));
    const overflow = await page.evaluate(() =>
      ['html', 'section.library', '.lib-tiles'].flatMap((selector) => {
        const element = document.querySelector(selector);
        if (!element) throw new Error('Missing ' + selector);
        if (selector !== 'html' && !/^(auto|scroll)$/.test(getComputedStyle(element).overflowX)) return [];
        const extra = element.scrollWidth - element.clientWidth;
        return extra > 1 ? [selector + ' +' + extra] : [];
      }),
    );
    if (overflow.length) {
      failures++;
      console.log(width + 'x' + height, overflow.join(', '));
    }
  }
  console.log('401 mouse widths;', failures, 'failures');
  if (failures) process.exitCode = 1;
} finally {
  await browser.close();
}
