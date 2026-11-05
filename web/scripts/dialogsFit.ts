// Do the site's pop-up dialogs fit a phone? Lewis's rule: a dialog that pops up must not need scrolling on a phone.
// Opens each dialog in `dialogsFitScenes.ts` at 375x812, 390x844 and 360x740 (portrait; failures) and 844x390
// (landscape; advisory, "fit as far as it reasonably can"), light and dark, then measures: the dialog's box inside the
// visual viewport; no scrollbar inside it (a dialog may scroll one list area, named in `listArea`, with title and
// actions fixed); no page scroll; the close button and the primary button visible and not covered. Axe runs on each
// open dialog at the first size. Starts its own Vite (never 5173) through perfLib, or --url / --dist.
// Usage: npm run check:dialogs [-- --only id,id] [--webkit] [--quick] [--block substring] [--port 5193] [--out dir] [--landscape-fails] [--axe]
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { webkit, type Browser, type Page } from 'playwright-core';
import { arg, launch, target } from './perfLib';
import { assertTheme, forceTheme } from './forceTheme';
import { scenes } from './dialogsFitScenes';
import { measure, type Measure } from './dialogsFitMeasure';

const only = (arg('only') ?? '').split(',').filter(Boolean);
const useWebkit = process.argv.includes('--webkit');
const landscapeFails = process.argv.includes('--landscape-fails');
const quick = process.argv.includes('--quick');
const block = arg('block'); // abort requests whose URL contains this, e.g. dialogsPhone.css, to see a dialog without one stylesheet (a before shot)
const runAxe = !process.argv.includes('--no-axe');
const out = arg('out') ? resolve(arg('out') as string) : undefined;
if (out) mkdirSync(out, { recursive: true });
const axeSrc = readFileSync(resolve('../node_modules/axe-core/axe.min.js'), 'utf8');

const sizes = [
  ['375x812', 375, 812, true],
  ['390x844', 390, 844, true],
  ['360x740', 360, 740, true],
  ['844x390', 844, 390, false],
] as const;

async function axeOn(page: Page): Promise<string[]> {
  await page.addScriptTag({ content: axeSrc });
  return page.evaluate(async () => {
    // @ts-expect-error axe is a page global once injected
    const res = await axe.run(document.querySelector('dialog[open]') ?? document, { resultTypes: ['violations'] });
    return res.violations.filter((v: { impact?: string }) => v.impact !== 'minor').map((v: { id: string; nodes: unknown[] }) => `${v.id} x${v.nodes.length}`);
  });
}

const srv = await target(5193);
const browser: Browser = useWebkit ? await webkit.launch() : await launch();
const todo = scenes.filter((x) => !only.length || only.includes(x.id));
const results = new Map<string, { cells: string[]; notes: string[] }>(todo.map((x) => [x.id, { cells: [], notes: [] }]));
let failures = 0;
let advisories = 0;
try {
  // One browser context per theme and size, reused by every dialog (a page load is the slow part).
  for (const theme of quick ? (['light'] as const) : (['light', 'dark'] as const))
    for (const [sz, width, height, portrait] of quick ? sizes.slice(0, 1) : sizes) {
      const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: true, isMobile: !useWebkit, deviceScaleFactor: 1 });
      await forceTheme(ctx, theme);
      const page = await ctx.newPage();
      if (block)
        await page.route(
          (u) => u.href.includes(block),
          (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }),
        );
      for (const scene of todo) {
        const res = results.get(scene.id)!;
        let m: Measure;
        try {
          await page.goto(srv.base + (scene.route ?? '/#/'));
          await page.reload();
          await scene.open(page);
          await page.addStyleTag({ content: '.ach-toasts, .toasts { display: none !important; }' }); // toasts are not part of a dialog
          await page.waitForSelector('dialog[open], [role="dialog"]', { timeout: 4000 }).catch(() => undefined);
          await page.waitForTimeout(scene.settle ?? 400);
          await assertTheme(page, theme);
          m = await measure(page);
          if (out) await page.screenshot({ path: `${out}/${scene.id}-${sz}-${theme}.png` });
          if (runAxe && sz === '375x812' && m.open) {
            const ax = await axeOn(page);
            if (ax.length) res.notes.push(`axe ${theme}: ${ax.join(', ')}`);
          }
        } catch (e) {
          m = { open: false, problems: [`could not open: ${(e as Error).message.split('\n')[0].slice(0, 90)}`] };
          if (quick) console.log(`${scene.id}: ${m.problems[0]}`);
        }
        const hard = m.problems.filter((x) => !x.includes('[allowed list]'));
        // landscape is advice: a dialog that cannot be reached on a landscape phone (its button is hidden there) is not counted
        if (!portrait && hard.some((x) => x.startsWith('could not open'))) {
          res.cells.push('n/a');
          continue;
        }
        const bad = hard.length > 0;
        const fails = bad && (portrait || landscapeFails);
        if (fails) failures++;
        else if (bad) advisories++;
        res.cells.push(!bad ? 'ok' : fails ? 'FAIL' : 'tight');
        if (bad && !res.notes.some((n) => n.startsWith(`${sz} ${theme}`))) res.notes.push(`${sz} ${theme}: ${hard.slice(0, 3).join('; ')}`);
      }
      await ctx.close();
    }
} finally {
  await browser.close();
  srv.stop();
}
for (const [id, r] of results)
  console.log(
    `${id.padEnd(22)} ${r.cells.slice(0, 4).join(' ').padEnd(24)} | ${r.cells.slice(4).join(' ').padEnd(24)}${
      r.notes.length
        ? '\n' +
          r.notes
            .slice(0, 4)
            .map((n) => '    ' + n)
            .join('\n')
        : ''
    }`,
  );
console.log(`\n${'dialog'.padEnd(22)} light 375 390 360 844L   | dark 375 390 360 844L`);
console.log(`${failures} failing cell(s) at phone portrait sizes, ${advisories} tight in landscape.`);
if (failures) process.exit(1);
