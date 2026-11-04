// Touch audit of one editor route at four touch sizes (iPad 1024x768 and 1366x1024, iPhone 390x844
// and 844x390, light; the 1024 and 390 portrait ones also dark): visible controls under 44 px, page
// overflow past the device width (exit 1), axe violations and a screenshot each. Starts its own Vite (never 5173) via perfLib.
// Usage: npm run editor:touch -- <route> [--out dir] [--tag name] [--wait selector] [--click 'sel;sel'] [--port 5291] [--dist dir] [--url u]
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { arg, launch, target } from './perfLib';

const route = process.argv[2]?.startsWith('--') ? undefined : process.argv[2];
if (!route) throw new Error('Give a route, e.g. "/#/p/look:blaster/bus2.map".');
const out = resolve(arg('out') ?? '../.for-lewis/research/editor-modern/touch');
const tag = arg('tag') ?? 'audit';
const wait = arg('wait');
const clicks = (arg('click') ?? '').split(';').filter(Boolean); // click these (Playwright selectors) before measuring, to open tabs and lists
mkdirSync(out, { recursive: true });
const axeSrc = readFileSync(resolve('../node_modules/axe-core/axe.min.js'), 'utf8');
const sizes = [
  ['ipad-1024x768', 1024, 768],
  ['ipad-1366x1024', 1366, 1024],
  ['iphone-390x844', 390, 844],
  ['iphone-844x390', 844, 390],
] as const;

let failed = 0;
const srv = await target(5291);
const browser = await launch();
try {
  for (const [name, width, height] of sizes)
    for (const scheme of ['light', 'dark'] as const) {
      if (scheme === 'dark' && name !== 'iphone-390x844' && name !== 'ipad-1024x768') continue;
      const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: true, isMobile: true, deviceScaleFactor: 1, colorScheme: scheme });
      const page = await ctx.newPage();
      await page.goto(srv.base + route);
      if (wait) await page.waitForSelector(wait, { timeout: 90000 }).catch(() => undefined);
      else await page.waitForLoadState('networkidle').catch(() => undefined);
      await page.waitForTimeout(1500);
      for (const sel of clicks) {
        await page.click(sel, { timeout: 5000 }).catch(() => console.log(`(could not click ${sel})`));
        await page.waitForTimeout(500);
      }
      await page.screenshot({ path: `${out}/${tag}-${name}-${scheme}.png` });
      const r = await page.evaluate((deviceWidth) => {
        const sel = 'button, a[href], input, select, textarea, summary, [role=button], [role=tab], [tabindex]:not([tabindex="-1"])';
        const small: string[] = [];
        for (const el of document.querySelectorAll<HTMLElement>(sel)) {
          const b = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          if (!b.width || !b.height || cs.visibility === 'hidden' || cs.display === 'none') continue;
          if (b.width < 44 || b.height < 44) {
            const label = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || '').trim().slice(0, 24);
            small.push(
              `${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).split(' ')[0] : ''} "${label}" ${Math.round(b.width)}x${Math.round(b.height)}`,
            );
          }
        }
        // Compare with the configured device width, not innerWidth: Chromium's mobile emulation widens the layout viewport to fit
        // overflowing content (innerWidth then equals scrollWidth), while a real iPhone keeps the width and scrolls sideways.
        return { small, overflowX: document.documentElement.scrollWidth - deviceWidth };
      }, width);
      await page.addScriptTag({ content: axeSrc });
      const ax = await page.evaluate(async () => {
        // @ts-expect-error axe is a page global once injected
        const res = await axe.run(document, { resultTypes: ['violations'] });
        return res.violations.map((v: { id: string; nodes: unknown[] }) => `${v.id} x${v.nodes.length}`);
      });
      console.log(`\n== ${name} ${scheme}: overflowX=${r.overflowX}, ${r.small.length} targets under 44px; axe: ${ax.join(', ') || 'none'}`);
      if (scheme === 'light') console.log([...new Set(r.small)].slice(0, 60).join('\n'));
      if (r.overflowX > 0) failed++;
      await ctx.close();
    }
} finally {
  await browser.close();
  srv.stop();
}
if (failed) {
  console.log(`\nFAIL: ${failed} size(s) are wider than the device (sideways scroll on a real phone).`);
  process.exitCode = 1;
}
