// Throws an error on purpose on the site, play.html and dos.html at 1440, 390 and 375 px, light and
// dark, and checks the error notice: axe, page overflow, button height (24 px) and that its copy
// button puts the details on the clipboard. Exits 1 on any failure.
// Usage: npm run check:error-notice -- --base <url of your own server> [--out dir]
import { mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { arg, launch } from './perfLib';
import { assertTheme, forceTheme } from './forceTheme';

const base = arg('base')?.replace(/\/$/, '');
if (!base) throw new Error('Pass --base <url> of your own server (this starts none).');
const out = arg('out');
if (out) mkdirSync(out, { recursive: true });
const axeSrc = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const browser = await launch();
let fail = 0;
try {
  for (const url of ['/#/privacy', '/play.html?game=none', '/dos.html'])
    for (const [w, h] of [
      [1440, 900],
      [390, 800],
      [375, 700],
    ])
      for (const theme of ['light', 'dark'] as const) {
        const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme });
        try {
          await forceTheme(ctx, theme);
          const page = await ctx.newPage();
          await page.goto(base + url, { waitUntil: 'load' });
          if (url.startsWith('/#')) {
            await page.waitForSelector('body');
            await assertTheme(page, theme);
          }
          await page.evaluate(() =>
            setTimeout(() => {
              throw new Error('test error on purpose');
            }, 0),
          );
          await page.waitForSelector('.gm-error-notice', { timeout: 8000 });
          await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
          await page.click('.gm-error-notice button');
          await page
            .waitForFunction(
              () =>
                navigator.clipboard.readText().then(
                  (t) => t.length > 0,
                  () => true,
                ),
              null,
              { timeout: 3000 },
            )
            .catch(() => {});
          const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => 'READFAIL'));
          await page.addScriptTag({ content: axeSrc });
          const res = await page.evaluate(async () => {
            const r = await (window as unknown as { axe: { run: (n: Element | null, o: object) => Promise<{ violations: { id: string }[] }> } }).axe.run(
              document.querySelector('.gm-error-notice'),
              { resultTypes: ['violations'] },
            );
            return r.violations.map((v) => v.id);
          });
          const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
          const small = await page.evaluate(
            () => [...document.querySelectorAll('.gm-error-notice button')].filter((b) => b.getBoundingClientRect().height < 24).length,
          );
          const bad = res.length > 0 || over > 0 || small > 0 || !clip.includes('Error: test error on purpose');
          if (bad) fail++;
          console.log(
            bad ? 'FAIL' : 'ok  ',
            url,
            w,
            theme,
            'axe:',
            res.join(',') || 'none',
            'overflow',
            over,
            'small buttons',
            small,
            'clipboard',
            clip === 'READFAIL' ? 'unreadable' : `${clip.length} chars`,
          );
          if (out) await page.screenshot({ path: join(out, `notice-${url.replace(/\W+/g, '_')}-${w}-${theme}.png`) });
        } catch (e) {
          fail++;
          console.log('FAIL', url, w, theme, e instanceof Error ? e.message.split('\n')[0] : e);
        } finally {
          await ctx.close();
        }
      }
} finally {
  await browser.close();
}
console.log(fail ? `${fail} failure(s)` : 'All pass');
process.exit(fail ? 1 : 0);
