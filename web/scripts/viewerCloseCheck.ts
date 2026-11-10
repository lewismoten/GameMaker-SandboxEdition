// Opens a game's Level Maps from the Library, closes the viewer at once, while its maps are still being laid out and
// painted (a second game, so the viewer's code is already loaded), lets that finish, then checks nothing was left behind: no extra window
// resize listener, no live blob URL, and that opening Level Maps again still draws the maps. Dark mode.
// Exits 1 on a FAIL. Starts nothing; pass your own server (a scratch build previewed on another port).
// Usage: npm run check:viewer-close -- --base <url> [--out dir]
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { arg, launch } from './perfLib';
import { assertTheme, forceTheme } from './forceTheme';

const base = arg('base')?.replace(/\/$/, '');
if (!base) throw new Error('Pass --base <url> of your own server (this starts none).');
const out = arg('out');
if (out) mkdirSync(out, { recursive: true });
let fail = 0;
const check = (ok: boolean, what: string) => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${what}`);
  if (!ok) fail++;
};
const browser = await launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
  await forceTheme(ctx, 'dark');
  await ctx.addInitScript(() => {
    const w = window as unknown as { __resize: number; __blobs: Map<string, string> };
    w.__resize = 0;
    w.__blobs = new Map();
    const add = window.addEventListener.bind(window);
    const rem = window.removeEventListener.bind(window);
    window.addEventListener = ((t: string, ...r: unknown[]) => (t === 'resize' && w.__resize++, (add as (...a: unknown[]) => void)(t, ...r))) as typeof add;
    window.removeEventListener = ((t: string, ...r: unknown[]) => (t === 'resize' && w.__resize--, (rem as (...a: unknown[]) => void)(t, ...r))) as typeof rem;
    const mk = URL.createObjectURL.bind(URL);
    const rv = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = (o: Blob | MediaSource) => {
      const u = mk(o);
      Error.stackTraceLimit = 30;
      w.__blobs.set(u, new Error().stack ?? '');
      return u;
    };
    URL.revokeObjectURL = (u: string) => (w.__blobs.delete(u), rv(u));
  });
  const page = await ctx.newPage();
  await page.goto(`${base}/#/privacy`, { waitUntil: 'load' });
  await page.waitForSelector('body');
  await assertTheme(page, 'dark');
  await page.goto(`${base}/#/library?by=type&only=levelmap`, { waitUntil: 'load' });
  const state = () =>
    page.evaluate(() => ({ r: (window as never as { __resize: number }).__resize, b: (window as never as { __blobs: Map<string, string> }).__blobs.size }));
  const spines = page.locator('button.lib-spine-btn[aria-label*="Level Maps"]');
  await spines.first().waitFor({ timeout: 30000 });
  // warm up on one game, so the viewer's own code is loaded and only the second game's data is fetched late
  await spines.nth(0).dispatchEvent('click'); // the librarian's art sits over the shelf
  await page.waitForSelector('.gmb-loading', { state: 'detached', timeout: 30000 }).catch(() => undefined);
  await page.waitForTimeout(3000);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);
  const before = await state();
  const card = spines.nth(1);
  await card.dispatchEvent('click');
  await page.waitForSelector('.gmb-loading', { timeout: 30000 });
  await page.keyboard.press('Escape'); // close while the data is held
  await page.waitForTimeout(300);
  const closed = await state();
  check(closed.r === before.r, `resize listeners after close: ${closed.r} (before open ${before.r})`);
  await page.waitForTimeout(4000);
  const after = await state();
  check(after.r === before.r, `resize listeners after the late load: ${after.r} (before open ${before.r})`);
  if (after.b !== before.b) console.log(await page.evaluate(() => [...(window as never as { __blobs: Map<string, string> }).__blobs.values()].join('\n---\n')));
  check(after.b === before.b, `live blob URLs after the late load: ${after.b} (before open ${before.b})`);
  // open again: the data is no longer held
  await card.dispatchEvent('click'); // the librarian's art sits over the shelf
  await page.waitForSelector('.gmb-loading', { state: 'detached', timeout: 30000 }).catch(() => undefined);
  await page.waitForTimeout(3000);
  const imgs = await page.evaluate(
    () => [...document.querySelectorAll('.gm-box img, .gmb-stage img, canvas')].filter((e) => (e as HTMLElement).offsetWidth > 40).length,
  );
  check(imgs > 0, `the maps draw again (${imgs} pictures/canvases)`);
  if (out) await page.screenshot({ path: join(out, 'levelmaps-reopened-dark.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  const end = await state();
  check(end.r === before.r && end.b === before.b, `after closing again: resize ${end.r}, blob URLs ${end.b}`);
} finally {
  await browser.close();
}
process.exit(fail ? 1 : 0);
