// Touch audit of one editor route at six touch sizes (iPad 1024x768 and 1366x1024, iPhone 390x844, 375x812
// and 844x390, Android 360x740, light; the 1024, 390 and 375 portrait ones also dark): visible controls under 44 px, page
// overflow past the device width (exit 1), axe violations and a screenshot each. Starts its own Vite (never 5173) via perfLib.
// Usage: npm run editor:touch -- <route> [--out dir] [--tag name] [--wait selector] [--click 'sel;sel'] [--port 5291] [--dist dir] [--url u]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { auditFailed, measureTargets } from './editorTouchAudit';
import { resolve } from 'node:path';
import { arg, launch, target } from './perfLib';
import { assertTheme, forceTheme } from './forceTheme';

const route = process.argv[2]?.startsWith('--') ? undefined : process.argv[2];
if (!route) throw new Error('Give a route, e.g. "/#/p/look:blaster/bus2.map".');
const out = resolve(arg('out') ?? '../.for-lewis/research/editor-modern/touch');
const tag = arg('tag') ?? 'audit';
const wait = arg('wait') ?? 'main.editor';
const clicks = (arg('click') ?? '').split(';').filter(Boolean); // click these (Playwright selectors) before measuring, to open tabs and lists
mkdirSync(out, { recursive: true });
const axeSrc = readFileSync(resolve('../node_modules/axe-core/axe.min.js'), 'utf8');
const sizes = [
  ['ipad-1024x768', 1024, 768],
  ['ipad-1366x1024', 1366, 1024],
  ['iphone-390x844', 390, 844],
  ['iphone-375x812', 375, 812],
  ['android-360x740', 360, 740],
  ['iphone-844x390', 844, 390],
] as const;

let failed = 0;
const results: unknown[] = [];
const srv = await target(5291);
const browser = await launch();
try {
  for (const [name, width, height] of sizes)
    for (const scheme of ['light', 'dark'] as const) {
      if (scheme === 'dark' && name !== 'iphone-390x844' && name !== 'iphone-375x812' && name !== 'ipad-1024x768') continue;
      const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: true, isMobile: true, deviceScaleFactor: 1, colorScheme: scheme });
      await forceTheme(ctx, scheme);
      const page = await ctx.newPage();
      await page.goto(srv.base + route);
      const ready = await page.waitForSelector(wait, { timeout: 30000 }).then(
        () => true,
        () => false,
      );
      await page.waitForTimeout(1500);
      for (const sel of clicks) {
        await page.click(sel, { timeout: 5000 }).catch(() => console.log(`(could not click ${sel})`));
        await page.waitForTimeout(500);
      }
      await assertTheme(page, scheme);
      await page.screenshot({ path: `${out}/${tag}-${name}-${scheme}.png` });
      const r = await page.evaluate(measureTargets, width);
      await page.addScriptTag({ content: axeSrc });
      const ax = await page.evaluate(async () => {
        // @ts-expect-error axe is a page global once injected
        const res = await axe.run(document, { resultTypes: ['violations'] });
        return res.violations.map((v: { id: string; nodes: { target: string[]; html: string; failureSummary: string }[] }) => ({
          id: v.id,
          nodes: v.nodes.map(({ target, html, failureSummary }) => ({ target, html, failureSummary })),
        }));
      });
      console.log(
        `\n== ${name} ${scheme}: ready=${ready}, overflowX=${r.overflowX}, ${r.small.length} targets under 44px, ${r.under24.length} under 24px; axe: ${ax.map((v: { id: string; nodes: unknown[] }) => `${v.id} x${v.nodes.length}`).join(', ') || 'none'}`,
      );
      if (scheme === 'light') console.log([...new Set(r.small)].slice(0, 60).join('\n'));
      const result = { route, name, width, height, scheme, ready, ...r, violations: ax };
      results.push(result);
      writeFileSync(`${out}/${tag}.json`, JSON.stringify(results, null, 2));
      if (auditFailed(result)) failed++;
      await ctx.close();
    }
} finally {
  await browser.close();
  srv.stop();
}
if (failed) {
  console.log(`\nFAIL: ${failed} cases have missing editors, overflow, sub-24px targets or axe violations. See ${out}/${tag}.json.`);
  process.exitCode = 1;
}
