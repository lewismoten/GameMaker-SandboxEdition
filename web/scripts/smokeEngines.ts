// Engine smoke pass: opens the site's main flows (home, editor, play, desk, dos.html, export) in
// WebKit, Firefox and Chromium at desktop, iPhone and iPad (touch) sizes and prints one table of
// checks. Exit 1 when a check fails in an engine that passed in Chromium (an engine-only failure),
// or when it fails anywhere and Chromium was not run. An engine that is not installed is skipped
// with a note (`npx playwright-core install firefox webkit`). Starts its own server (never 5173)
// through perfLib.ts: use `--dist <scratch build>` for a production preview.
// Usage: npm run smoke:engines -- [--engines webkit,firefox,chromium] [--profiles desktop,iphone,ipad]
//   [--flows home,editor,play,desk,dos,export] [--port 5280] [--dist dir] [--url u] [--out shots-dir]
import { existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { chromium, devices, firefox, webkit, type Browser, type BrowserContext, type Locator, type Page } from 'playwright-core';
import { arg, launch, target } from './perfLib';

const engines = (arg('engines') ?? 'webkit,firefox,chromium').split(',');
const profiles = (arg('profiles') ?? 'desktop,iphone,ipad').split(',');
const only = arg('flows')?.split(',');
const out = resolve(arg('out') ?? '../.for-lewis/research/engines/smoke-shots');
mkdirSync(out, { recursive: true });
const NOISE = /preloaded using link preload|blob:|WebKitBlobResource|ERR_FILE_NOT_FOUND/;
const hash = (b: Buffer) => createHash('md5').update(b).digest('hex').slice(0, 8);
// at iPad size these flows add little over desktop and iPhone: the editor, home and export keep all three
const IPAD_SKIPS = ['play', 'desk', 'dos'];
const types = { webkit, firefox, chromium };

type Checks = Map<string, string>; // check name -> 'ok' | 'FAIL: why'
interface Run {
  p: Page;
  base: string;
  touch: boolean;
  tag: string;
  set: (name: string, ok: boolean, why?: string) => void;
  tap: (l: Locator) => Promise<void>;
  shot: (name: string) => Promise<void>;
}

/** Hash of a canvas's own pixels: unlike an element screenshot it ignores toasts and palettes laid over it. */
const pixels = async (cv: Locator) => hash(Buffer.from(await cv.evaluate((c) => (c as HTMLCanvasElement).toDataURL())));

const flows: Record<string, (r: Run) => Promise<void>> = {
  async home({ p, base, set, shot }) {
    await p.goto(base + '/');
    await p.waitForTimeout(2500);
    await shot('home-desk');
    await p.goto(base + '/#/');
    await p.waitForTimeout(3000);
    await shot('home-web');
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    set('home: no sideways scroll', ov <= 0, `overflow ${ov}px`);
  },
  async editor({ p, base, set, tap, shot }) {
    await p.goto(base + '/#/p/look:blaster/bus2.map');
    await p.waitForTimeout(5000);
    await tap(p.getByRole('button', { name: /Edit a copy/ })).catch(() => undefined);
    await p.waitForTimeout(3000);
    await shot('editor-map');
    const cv = p.locator('canvas[style*=crosshair]').first();
    const bx = (await cv.count()) ? await cv.boundingBox() : null;
    set('editor: map canvas shown', !!bx);
    if (bx) {
      await p.mouse.move(5, 5);
      // the canvas redraws for a couple of seconds after the map opens: wait until two looks match
      let a = await pixels(cv);
      for (let i = 0; i < 12; i++) {
        await p.waitForTimeout(700);
        const b = await pixels(cv);
        if (b === a) break;
        a = b;
      }
      await p.waitForTimeout(700);
      set('editor: map canvas steady at rest', a === (await pixels(cv)));
      await cv.click({ position: { x: 120, y: 100 } }); // scrolls it into view on a phone
      await p.mouse.move(5, 5);
      await p.waitForTimeout(500);
      set('editor: click paints', a !== (await pixels(cv)));
      const undo = p.getByRole('button', { name: /Undo/ }).first();
      const canUndo = await undo.isEnabled();
      set('editor: undo enabled after paint', canUndo);
      if (canUndo) {
        await tap(undo);
        await p.mouse.move(5, 5);
        await p.waitForTimeout(500);
        set('editor: undo restores', a === (await pixels(cv)));
      }
    }
    await p.goto(base + '/#/p/look:blaster/bus2.bbl');
    await p.waitForTimeout(3500);
    await shot('editor-blocks');
    await p.goto(base + '/#/p/look:blaster/boss.cmf');
    await p.waitForTimeout(3500);
    await shot('editor-music');
    set('editor: music has a play button', (await p.getByRole('button', { name: /Play|▶/ }).count()) > 0);
  },
  async play({ p, base, set, shot }) {
    await p.goto(base + '/play-blaster.html?autoplay');
    await p.waitForTimeout(4000);
    await shot('play-a');
    const cv = p.locator('canvas').first();
    const a = hash(await cv.screenshot());
    for (const k of ['Enter', 'ArrowRight', 'ArrowRight', 'Space', 'ArrowRight']) {
      await p.keyboard.down(k);
      await p.waitForTimeout(400);
      await p.keyboard.up(k);
    }
    await p.waitForTimeout(1500);
    await shot('play-b');
    set('play: keys change the picture', a !== hash(await cv.screenshot()));
  },
  async desk({ p, base, set, tap, shot }) {
    await p.goto(base + '/#/desk');
    await p.waitForTimeout(2500);
    for (const [n, name] of [
      ['power', /^⏻$|Power/],
      ['disk box', /Disk box/],
      ['open the box', /open the box/],
      ['catalog', /Shareware catalog/],
    ] as const) {
      try {
        // the catalog sits in a menu that the "Catalog & magazine" button opens
        if (n === 'catalog') await tap(p.getByRole('button', { name: /Catalog & magazine/ }).first());
        await tap(p.getByRole('button', { name }).first());
        await p.waitForTimeout(2500);
        await shot('desk-' + n.replace(/\W/g, ''));
        await p.keyboard.press('Escape');
        await p.waitForTimeout(500);
        set(`desk: ${n}`, true);
      } catch (e) {
        set(`desk: ${n}`, false, String(e).split('\n')[0].slice(0, 80));
      }
    }
  },
  async dos({ p, base, set, shot }) {
    await p.goto(base + '/dos.html');
    await p.waitForTimeout(4500);
    await shot('dos-boot');
    const screen = async () => hash(Buffer.from(await p.evaluate(() => [...document.querySelectorAll('canvas')].map((c) => c.toDataURL()).join())));
    const a = await screen();
    await p.keyboard.type('dir');
    await p.keyboard.press('Enter');
    await p.waitForTimeout(1500);
    await shot('dos-dir');
    set('dos.html: typing changes the screen', a !== (await screen()));
  },
  async export({ p, base, set, tap, shot, tag }) {
    await p.goto(base + '/#/p/look:blaster/bus2.map');
    await p.waitForTimeout(4500);
    const openExport = async () => {
      const dl = p.getByRole('button', { name: /^Download Virus/ });
      // on a phone the game's Download button waits in the Files drawer
      if (!(await dl.count())) await tap(p.getByRole('button', { name: /^Files/ }).first());
      await tap(dl.first());
    };
    await openExport();
    await p.waitForTimeout(1200);
    await shot('export-dialog');
    for (const name of ['Web page', 'DOS']) {
      try {
        if (name === 'DOS') {
          await p.waitForTimeout(1500);
          if (!(await p.getByRole('button', { name: /^Download \./ }).count())) await openExport();
          await p.waitForTimeout(800);
        }
        const opt = p
          .locator('label,button,[role=radio]')
          .filter({ hasText: name === 'DOS' ? /^\s*DOS\s*\.zip/ : /^\s*Web page/ })
          .first();
        await tap(opt).catch(() => undefined);
        const dl = p.waitForEvent('download', { timeout: 60000 });
        dl.catch(() => undefined);
        await tap(p.getByRole('button', { name: /^Download \./ }).last());
        const d = await dl;
        await d.saveAs(`${out}/${tag}-${name.replace(' ', '')}-${d.suggestedFilename()}`);
        set(`export: ${name} downloads`, true);
      } catch (e) {
        set(`export: ${name} downloads`, false, String(e).split('\n')[0].slice(0, 80));
      }
      await shot('export-after-' + name.replace(' ', ''));
    }
  },
};

async function runProfile(browser: Browser, eng: string, prof: string, base: string, checks: Checks, logs: Set<string>) {
  const dev = prof === 'iphone' ? devices['iPhone 14'] : devices['iPad (gen 7)'];
  // Firefox has no mobile emulation: it gets the size and touch only.
  const opts =
    prof === 'desktop'
      ? { viewport: { width: 1280, height: 800 } }
      : eng === 'firefox'
        ? { viewport: dev.viewport, userAgent: dev.userAgent, hasTouch: true }
        : dev;
  const ctx: BrowserContext = await browser.newContext({ ...opts, acceptDownloads: true });
  const tag = `${eng}-${prof}`;
  let cur = '';
  ctx.on('page', (p) => {
    p.on('console', (m) => {
      if (['error', 'warning'].includes(m.type()) && !NOISE.test(m.text())) logs.add(`[${tag} ${cur}] ${m.type()}: ${m.text().slice(0, 140)}`);
    });
    p.on('pageerror', (e) => logs.add(`[${tag} ${cur}] PAGEERR ${e.message.slice(0, 140)}`));
  });
  try {
    for (const [name, fn] of Object.entries(flows)) {
      if (only && !only.includes(name)) continue;
      if (prof === 'ipad' && IPAD_SKIPS.includes(name)) continue; // same layout class as the iPhone run: save the time
      cur = name;
      const p = await ctx.newPage();
      const run: Run = {
        p,
        base,
        tag,
        touch: prof !== 'desktop',
        set: (n, ok, why = '') => void checks.set(n, ok ? 'ok' : `FAIL${why ? ': ' + why : ''}`),
        tap: (l) => (prof === 'desktop' ? l.click({ timeout: 8000 }) : l.tap({ timeout: 8000 })),
        shot: async (n) => void (await p.screenshot({ path: `${out}/${tag}-${n}.png` })),
      };
      try {
        await Promise.race([fn(run), new Promise((_, no) => setTimeout(() => no(new Error('flow timeout 75 s')), 75000))]);
      } catch (e) {
        checks.set(`${name}: ran to the end`, `FAIL: ${String(e).split('\n')[0].slice(0, 80)}`);
      }
      await Promise.race([p.close(), new Promise((r) => setTimeout(r, 5000))]);
    }
  } finally {
    await ctx.close().catch(() => undefined);
  }
}

const srv = await target(5280);
const results = new Map<string, Checks>(); // 'engine profile' -> checks
const logs = new Set<string>();
const active = engines.filter((eng) => {
  const type = types[eng as keyof typeof types];
  if (!type) throw new Error(`Unknown engine "${eng}".`);
  if (eng !== 'chromium' && !existsSync(type.executablePath())) {
    console.log(`Skipping ${eng}: not installed (npx playwright-core install ${eng}).`);
    return false;
  }
  return true;
});
for (const eng of active) for (const prof of profiles) results.set(`${eng} ${prof}`, new Map());
try {
  // the engines run side by side (one browser each); an engine's sizes run one after another
  await Promise.all(
    active.map(async (eng) => {
      const browser = eng === 'chromium' ? await launch() : await types[eng as keyof typeof types].launch();
      try {
        for (const prof of profiles) {
          const checks = results.get(`${eng} ${prof}`)!;
          await runProfile(browser, eng, prof, srv.base, checks, logs);
          console.log(`${eng} ${prof}: ${[...checks.values()].filter((v) => v !== 'ok').length} failing of ${checks.size}`);
        }
      } finally {
        await Promise.race([browser.close(), new Promise((r) => setTimeout(r, 8000))]);
      }
    }),
  );
} finally {
  srv.stop();
}

const cols = [...results.keys()];
const names = [...new Set([...results.values()].flatMap((c) => [...c.keys()]))];
const w = Math.max(...names.map((n) => n.length), 5);
console.log(`\n${'check'.padEnd(w)}  ${cols.map((c) => c.padEnd(15)).join(' ')}`);
let engineOnly = 0;
for (const n of names) {
  const cells = cols.map((c) => results.get(c)!.get(n) ?? '-');
  const bad = cols.filter((c, i) => cells[i].startsWith('FAIL') && !c.startsWith('chromium'));
  for (const c of bad) {
    const ref = results.get(`chromium ${c.split(' ')[1]}`)?.get(n);
    if (!results.has(`chromium ${c.split(' ')[1]}`) || ref === 'ok') engineOnly++;
  }
  console.log(`${n.padEnd(w)}  ${cells.map((v) => (v.startsWith('FAIL') ? 'FAIL' : v).padEnd(15)).join(' ')}`);
}
for (const c of cols) for (const [n, v] of results.get(c)!) if (v.startsWith('FAIL') && v.length > 4) console.log(`  ${c} / ${n} ${v.slice(4)}`);
console.log(`\nConsole errors and warnings:\n${[...logs].join('\n') || 'none'}`);
console.log(`\n${engineOnly ? `FAIL: ${engineOnly} engine-only failure(s).` : 'No engine-only failures.'}`);
process.exitCode = engineOnly ? 1 : 0;
