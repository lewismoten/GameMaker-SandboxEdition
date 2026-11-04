// Desktop screenshots of every editor route (1440x900, mouse, light and dark, reduced motion) and
// an optional pixel diff against an earlier folder: the way to show that a CSS change for touch or
// a refactor left the desktop editors identical. Starts its own Vite (never 5173) via perfLib.
// A differing pair gets a red-on-black diff image in <out>/diff/. Exit 1 when any pair differs or
// an earlier shot is missing. Uses Playwright's bundled Chromium only.
// Usage: npm run editor:shots -- --out <dir> [--compare <earlier dir>] [--only map,music] [--port 5281] [--dist dir] [--url u]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Page } from 'playwright-core';
import { arg, launch, target } from './perfLib';

const routes: [string, string, string][] = [
  ['integrator', '/#/p/look:blaster/blaster.gam', '.grator-main'],
  ['backdrop', '/#/p/look:maximus/citadel.bkd', '[class*=bkd]'],
  ['animation', '/#/p/look:blaster/bus2.fli', '[class*=fli]'],
  ['music', '/#/p/look:blaster/board.cmf', '[class*=mus]'],
  ['monsters', '/#/p/look:logic/garage.mon', '[class*=mon]'],
  ['recording', '/#/p/look:blaster/demo.rec', '[class*=rec]'],
  ['sample', '/#/p/look:blaster/blip.voc', '[class*=voc]'],
  ['palette', '/#/p/look:blaster/s1.pal', '.pal-swatches'],
  ['sounds', '/#/p/look:blaster/blaster.snd', '[class*=snd]'],
  ['picture', '/#/p/look:blaster/bus2.gif', '.pic-canvas'],
  ['textScreen', '/#/p/look:blaster/help.txt', '.ts-layout'],
  ['slideShow', '/#/p/look:blaster/help.lst', '.sl-top'],
  ['map', '/#/p/look:blaster/bus3.map', 'canvas'],
  ['blocks', '/#/p/look:blaster/b1.bbl', 'canvas'],
  ['character', '/#/p/look:blaster/ship.chr', 'canvas'],
];
const outArg = arg('out');
if (!outArg) throw new Error('Give --out <dir> for the screenshots.');
const out = resolve(outArg);
const compare = arg('compare') ? resolve(arg('compare')!) : undefined;
const only = arg('only')?.split(',');
mkdirSync(out, { recursive: true });

const srv = await target(5281);
const browser = await launch();
const diffs: string[] = [];
try {
  const shots: string[] = [];
  for (const scheme of ['light', 'dark'] as const) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: scheme });
    for (const [name, route, wait] of routes) {
      if (only && !only.includes(name)) continue;
      const page = await ctx.newPage();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(srv.base + route);
      await page.waitForSelector(wait, { timeout: 90000 }).catch(() => console.log(`${name}: "${wait}" never appeared; shot anyway`));
      await page.waitForTimeout(1500);
      await settle(page);
      await page.screenshot({ path: `${out}/${name}-${scheme}.png` });
      shots.push(`${name}-${scheme}`);
      await page.close();
    }
    await ctx.close();
  }
  console.log(`${shots.length} screenshots in ${out}`);

  if (compare) {
    mkdirSync(`${out}/diff`, { recursive: true });
    const page = await browser.newPage(); // a blank page whose canvas does the pixel work
    console.log(`\n${'shot'.padEnd(22)} differing pixels`);
    for (const s of shots) {
      const old = `${compare}/${s}.png`;
      if (!existsSync(old)) {
        console.log(`${s.padEnd(22)} MISSING in ${compare}`);
        diffs.push(s);
        continue;
      }
      const r = await page.evaluate(
        async ([a, b]) => {
          const load = async (u: string) => {
            const bmp = await createImageBitmap(await (await fetch(u)).blob());
            const c = new OffscreenCanvas(bmp.width, bmp.height);
            const x = c.getContext('2d')!;
            x.drawImage(bmp, 0, 0);
            return x.getImageData(0, 0, bmp.width, bmp.height);
          };
          const A = await load(a);
          const B = await load(b);
          if (A.width !== B.width || A.height !== B.height) return { n: -1, png: '' };
          const D = new ImageData(A.width, A.height);
          let n = 0;
          for (let i = 0; i < A.data.length; i += 4) {
            const d =
              Math.abs(A.data[i] - B.data[i]) > 8 ||
              Math.abs(A.data[i + 1] - B.data[i + 1]) > 8 ||
              Math.abs(A.data[i + 2] - B.data[i + 2]) > 8 ||
              A.data[i + 3] !== B.data[i + 3]; // up to 8 levels of edge anti-aliasing vary between runs of one build
            if (d) n++;
            D.data[i] = d ? 255 : 0;
            D.data[i + 3] = 255;
          }
          if (!n) return { n, png: '' };
          const c = new OffscreenCanvas(A.width, A.height);
          c.getContext('2d')!.putImageData(D, 0, 0);
          const blob = await c.convertToBlob({ type: 'image/png' });
          const buf = new Uint8Array(await blob.arrayBuffer());
          let bin = '';
          for (const v of buf) bin += String.fromCharCode(v);
          return { n, png: btoa(bin) };
        },
        [dataUrl(old), dataUrl(`${out}/${s}.png`)],
      );
      console.log(`${s.padEnd(22)} ${r.n === 0 ? 'identical' : r.n < 0 ? 'SIZE DIFFERS' : `${r.n} differ (diff/${s}.png)`}`);
      if (r.n !== 0) diffs.push(s);
      if (r.png) writeFileSync(`${out}/diff/${s}.png`, Buffer.from(r.png, 'base64'));
    }
    console.log(diffs.length ? `\nFAIL: ${diffs.length} of ${shots.length} differ. Look at the diff images.` : `\nAll ${shots.length} identical.`);
  }
} finally {
  await browser.close();
  srv.stop();
}
process.exitCode = diffs.length ? 1 : 0;

/** Quiet the page, then wait until two screenshots in a row are byte-identical (late fonts and canvases). */
async function settle(page: Page) {
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    (document.activeElement as HTMLElement | null)?.blur?.();
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
  await page.mouse.move(0, 0);
  let last = await page.screenshot();
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(500);
    const now = await page.screenshot();
    if (now.equals(last)) return;
    last = now;
  }
}

function dataUrl(file: string) {
  return `data:image/png;base64,${readFileSync(file).toString('base64')}`;
}
