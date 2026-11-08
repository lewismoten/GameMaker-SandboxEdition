// Browser regression for the headless theme guard, against the real app and its first-paint bootstrap.
// Usage: npm run theme:check -- [--url u|--port p] [--out report.json]
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { arg, launch, target } from './perfLib';
import { assertTheme, forceTheme, type SiteTheme } from './forceTheme';

const srv = await target(5294);
const browser = await launch();
const results: object[] = [];
try {
  // Reproduce the original false positive: the preference and attribute are light, the painted surface is dark.
  const ctx = await browser.newContext({ colorScheme: 'light' });
  await forceTheme(ctx, 'light');
  const page = await ctx.newPage();
  await page.goto(srv.base + '/#/');
  await page.waitForSelector('main.home');
  await page.addStyleTag({ content: 'html, body, main, .card, .panel, .editor, .sidebar { background: #11131a !important; }' });
  await assert.rejects(() => assertTheme(page, 'light'), /Rendered theme pixel mismatch/);
  results.push({ case: 'lying-light-attribute-dark-pixels', detected: true });
  await ctx.close();

  const darkContext = await browser.newContext({ colorScheme: 'dark', deviceScaleFactor: 2 });
  await forceTheme(darkContext, 'dark');
  const darkPage = await darkContext.newPage();
  await darkPage.goto(srv.base + '/#/');
  await darkPage.waitForSelector('main.home');
  await assertTheme(darkPage, 'dark');
  const repaint = await darkPage.addStyleTag({ content: 'html, body, main, .card, .panel, .editor, .sidebar { background: #d5d9e2 !important; }' });
  await assert.rejects(() => assertTheme(darkPage, 'dark'), /[Pp]ixel mismatch/);
  results.push({ case: 'lying-dark-attribute-light-pixels-dpr2', detected: true });
  await repaint.evaluate((el) => el.parentNode?.removeChild(el));
  await darkPage.evaluate(() => delete document.documentElement.dataset.theme);
  await assert.rejects(() => assertTheme(darkPage, 'dark'), /Expected the dark theme/);
  results.push({ case: 'missing-theme-attribute', detected: true });
  await darkContext.close();

  const stored: (SiteTheme | 'missing' | 'invalid')[] = ['missing', 'invalid', 'light', 'dark', 'auto'];
  for (const theme of stored)
    for (const scheme of ['light', 'dark'] as const) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme });
      if (theme === 'missing') await context.addInitScript(() => localStorage.removeItem('gm-theme'));
      else if (theme === 'invalid') await context.addInitScript(() => localStorage.setItem('gm-theme', 'invalid'));
      else await forceTheme(context, theme);
      const p = await context.newPage();
      // Capture the parser's choice before application modules can initialize or overwrite it.
      await context.addInitScript(() => {
        new MutationObserver((_, observer) => {
          const value = document.documentElement?.getAttribute('data-theme');
          if (value) {
            sessionStorage.setItem('theme-check-first', value);
            observer.disconnect();
          }
        }).observe(document, { childList: true, subtree: true, attributes: true });
      });
      await p.goto(srv.base + '/#/');
      await p.waitForSelector('main.home');
      const expectedPreference = theme === 'missing' || theme === 'invalid' ? 'dark' : theme;
      const expectedRendered = expectedPreference === 'auto' ? scheme : expectedPreference;
      const state = await p.evaluate(() => ({
        first: sessionStorage.getItem('theme-check-first'),
        initialized: document.documentElement.dataset.theme,
        stored: localStorage.getItem('gm-theme'),
        mediaDark: matchMedia('(prefers-color-scheme: dark)').matches,
      }));
      assert.equal(state.first, expectedPreference);
      assert.equal(state.initialized, expectedPreference);
      assert.equal(state.mediaDark, scheme === 'dark');
      assert.equal(state.stored, expectedPreference);
      await assertTheme(p, expectedRendered);
      // A subsequent document navigation must still get the correct preference before initialization.
      await p.reload();
      await p.waitForSelector('main.home');
      await assertTheme(p, expectedRendered);
      results.push({ theme, scheme, expectedRendered, ...state });
      await context.close();
    }
  for (const theme of ['light', 'dark'] as const) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: theme });
    await forceTheme(context, 'auto');
    const p = await context.newPage();
    await p.goto(srv.base + '/#/help');
    await p.waitForSelector('.guide article #help-start');
    await assertTheme(p, theme);
    const changed = theme === 'light' ? 'dark' : 'light';
    await p.emulateMedia({ colorScheme: changed });
    await assertTheme(p, changed);
    results.push({ case: 'guide-auto-live-media-change', from: theme, to: changed });
    await context.close();
  }
  console.log(JSON.stringify(results, null, 2));
  if (arg('out')) writeFileSync(arg('out')!, JSON.stringify(results, null, 2) + '\n');
  console.log(`PASS: ${results.length} theme regression cases.`);
} finally {
  await browser.close();
  srv.stop();
}
