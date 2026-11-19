// Sweep the web home for horizontal overflow, including invisible tooltips.
// Usage: npx vite-node scripts/homeOverflow.ts [http://127.0.0.1:6119]
import { chromium } from 'playwright-core';
import { assertTheme, forceTheme } from './forceTheme';

const browser = await chromium.launch();
try {
  for (const touch of [false, true]) {
    for (const theme of ['light', 'dark'] as const) {
      const context = await browser.newContext({ viewport: { width: 320, height: 844 }, hasTouch: touch, isMobile: touch, colorScheme: theme });
      try {
        await forceTheme(context, theme);
        await context.addInitScript(() => localStorage.setItem('gm-ui', 'modern'));
        const page = await context.newPage();
        await page.goto(process.argv[2] || 'http://127.0.0.1:6119');
        await page.waitForSelector('.shot-tools');
        await page.evaluate(() => document.fonts.ready);
        await assertTheme(page, theme);
        const failures = [];
        for (let width = 320; width <= 1300; width += 5) {
          await page.setViewportSize({ width, height: 844 });
          await page.evaluate(() => new Promise(requestAnimationFrame));
          const size = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
          if (size.client !== width) throw new Error(`Unexpected viewport: ${JSON.stringify(size)} at ${width}`);
          if (size.scroll > size.client + 1) failures.push({ width, extra: size.scroll - size.client });
        }
        console.log(`${touch ? 'touch' : 'mouse'} ${theme}: 197 widths; ${JSON.stringify(failures)}`);
        if (failures.length) process.exitCode = 1;
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}
