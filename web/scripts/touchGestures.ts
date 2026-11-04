// Touch gestures in the map editor, driven with real touch events (CDP Input.dispatchTouchEvent)
// at iPad and iPhone sizes: pinch zoom, two-finger pan, one-finger paint, a stray stroke that a
// second finger must not leave behind, long-press for the block menu, and a long-press that
// moved (no menu). Each step prints zoom, scroll, a canvas hash and the menu state, with PASS
// or FAIL against what it should do; exit 1 on any FAIL. Starts its own Vite (never 5173) via perfLib.
// Usage: npm run check:gestures -- [--route '/#/p/look:blaster/bus2.map'] [--out dir] [--port 5292] [--dist dir] [--url u]
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Page } from 'playwright-core';
import { arg, launch, target } from './perfLib';

const route = arg('route') ?? '/#/p/look:blaster/bus2.map';
const outArg = arg('out');
const out = outArg ? resolve(outArg) : undefined;
if (out) mkdirSync(out, { recursive: true });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const sizes = [
  ['ipad-1024x768', 1024, 768],
  ['iphone-390x844', 390, 844],
] as const;

interface State {
  zoom?: string;
  cw: number;
  sl: number;
  st: number;
  hash: number;
  menu: boolean;
}
type Pt = [number, number];
const REGION = 'div[role=region][aria-label^="The map"]';

const readState = (page: Page): Promise<State> =>
  page.evaluate((region) => {
    const s = document.querySelector(region)!;
    const c = s.querySelector('canvas')!;
    const sel = [...document.querySelectorAll('select')].find((x) => [...x.options].some((o) => o.value === 'custom'));
    let hash = 0;
    const d = c.toDataURL();
    for (let i = 0; i < d.length; i += 7) hash = (hash * 31 + d.charCodeAt(i)) | 0;
    return {
      zoom: sel?.value,
      cw: Math.round(c.getBoundingClientRect().width),
      sl: Math.round(s.scrollLeft),
      st: Math.round(s.scrollTop),
      hash,
      menu: /Pick this block/.test(document.body.innerText),
    };
  }, REGION);

/** What each step should do, as a reason when it didn't (undefined = PASS). */
const checks: Record<string, (a: State, b: State) => string | undefined> = {
  pinch: (a, b) => (b.cw > a.cw ? undefined : `canvas width ${a.cw} -> ${b.cw}: two fingers moving apart should zoom in`),
  pan: (a, b) =>
    b.cw !== a.cw
      ? 'zoom changed during a pan'
      : b.hash !== a.hash
        ? 'the map changed during a pan'
        : b.sl === a.sl && b.st === a.st
          ? 'did not scroll'
          : undefined,
  paint: (a, b) => (b.hash !== a.hash ? undefined : 'one finger dragging left the map unchanged'),
  'stray-stroke': (a, b) => (b.hash === a.hash ? undefined : 'a second finger joining left a stray painted stroke'),
  'long-press': (_a, b) => (b.menu ? undefined : 'holding still did not open the block menu'),
  'long-press-moved': (_a, b) => (b.menu ? 'a held finger that moved opened the block menu' : undefined),
};

const srv = await target(5292);
const browser = await launch();
let failed = 0;
try {
  for (const [device, w, h] of sizes) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    const touch = (type: string, pts: Pt[]) =>
      cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((p, i) => ({ x: p[0], y: p[1], id: i + 1 })) } as never);
    await page.goto(srv.base + route);
    const sc = page.locator(REGION);
    await sc.waitFor({ timeout: 90000 });
    await sleep(2500);
    await page
      .getByRole('button', { name: /Edit a copy/ })
      .first()
      .click()
      .catch(() => undefined);
    await sleep(2500);
    await page
      .locator('button.selected')
      .first()
      .locator('xpath=..')
      .locator('> *')
      .nth(6)
      .click()
      .catch(() => undefined);
    await sc.scrollIntoViewIfNeeded();
    await sleep(500);
    const box = (await sc.boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + Math.min(box.height / 2, 150);
    const run = async (label: string, fn: () => Promise<void>) => {
      const a = await readState(page);
      await fn();
      await sleep(300);
      const b = await readState(page);
      const why = checks[label](a, b);
      if (why) failed++;
      console.log(
        `${why ? 'FAIL' : 'PASS'}  ${device.padEnd(15)} ${label.padEnd(17)} zoom ${a.zoom}->${b.zoom}  width ${a.cw}->${b.cw}  scroll ${a.sl},${a.st}->${b.sl},${b.st}  canvas ${a.hash === b.hash ? 'same' : 'changed'}  menu ${b.menu}${why ? `  (${why})` : ''}`,
      );
      if (out) await page.screenshot({ path: `${out}/${device}-${label}.png` });
    };
    await run('pinch', async () => {
      await touch('touchStart', [
        [cx - 20, cy],
        [cx + 20, cy],
      ]);
      for (let i = 1; i <= 10; i++) {
        await touch('touchMove', [
          [cx - 20 - i * 3, cy],
          [cx + 20 + i * 3, cy],
        ]);
        await sleep(30);
      }
      await touch('touchEnd', []);
    });
    await run('pan', async () => {
      await touch('touchStart', [
        [cx - 40, cy],
        [cx + 40, cy],
      ]);
      for (let i = 1; i <= 10; i++) {
        await touch('touchMove', [
          [cx - 40 - i * 6, cy - i * 4],
          [cx + 40 - i * 6, cy - i * 4],
        ]);
        await sleep(30);
      }
      await touch('touchEnd', []);
    });
    await run('paint', async () => {
      await touch('touchStart', [[cx - 30, cy + 30]]);
      for (let i = 1; i <= 8; i++) {
        await touch('touchMove', [[cx - 30 + i * 8, cy + 30]]);
        await sleep(40);
      }
      await touch('touchEnd', []);
    });
    await run('stray-stroke', async () => {
      await touch('touchStart', [[cx - 100, cy - 60]]);
      await sleep(60);
      await touch('touchStart', [
        [cx - 100, cy - 60],
        [cx + 60, cy - 60],
      ]);
      for (let i = 1; i <= 5; i++) {
        await touch('touchMove', [
          [cx - 100 - i * 4, cy - 60],
          [cx + 60 + i * 4, cy - 60],
        ]);
        await sleep(30);
      }
      await touch('touchEnd', []);
    });
    await run('long-press', async () => {
      await touch('touchStart', [[cx + 40, cy + 40]]);
      await sleep(700);
      await touch('touchEnd', []);
    });
    await page.keyboard.press('Escape');
    await sleep(200);
    await run('long-press-moved', async () => {
      await touch('touchStart', [[cx + 40, cy + 40]]);
      await touch('touchMove', [[cx + 70, cy + 40]]);
      await sleep(700);
      await touch('touchEnd', []);
    });
    await ctx.close();
  }
} finally {
  await browser.close();
  srv.stop();
}
console.log(failed ? `\n${failed} step(s) FAILED.` : '\nAll gesture steps passed.');
process.exit(failed ? 1 : 0);
