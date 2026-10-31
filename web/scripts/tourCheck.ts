// Plays tour chapters in headless Chrome and reports whether every step's control was found.
//   npm run tour:check -- edit-sounds[,edit-animation]     (chapter ids; 'all' for the whole tour)
// It starts its own vite on a free port (never 5173, Lewis's dev server) with a scratch cache, plays
// each chapter at 1440 and 390 wide, light and dark, steps through it paused, runs axe on every
// step (so on what the chapter opens too), prints a table, stops the server, and exits non-zero when
// a step that is not optional found no control. Needs Chrome; playwright-core and axe-core are
// dev dependencies.
import { mkdtempSync, readFileSync } from 'node:fs';
import { createServer as netServer } from 'node:net';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { chromium, type Page } from 'playwright-core';
import { createServer } from 'vite';
import { CHAPTERS } from '../src/tour/chapters/index';

const SIZES = [1440, 390];
const SCHEMES = ['light', 'dark'] as const;

/** A free port from 5190 up, never 5173. */
async function freePort(): Promise<number> {
  for (let port = 5190; ; port++) {
    const ok = await new Promise<boolean>((done) => {
      const s = netServer();
      s.once('error', () => done(false));
      s.listen(port, '127.0.0.1', () => s.close(() => done(true)));
    });
    if (ok) return port;
  }
}

interface Run {
  size: number;
  scheme: string;
  /** step id -> how it went: ok, skipped (optional, no control) or MISSING. */
  steps: Map<string, string>;
  axe: Set<string>;
  problems: string[];
}

async function play(page: Page, url: string, ids: string[], axeSrc: string, run: Run): Promise<void> {
  const bySay = new Map(CHAPTERS.flatMap((c) => c.steps.map((s) => [s.say, { id: s.id, optional: !!s.optional }] as const)));
  const missing = new Set<string>();
  page.on('console', (m) => {
    const hit = /^Tour: nothing on the page for (\S+)/.exec(m.text());
    if (hit?.[1]) missing.add(hit[1]);
  });
  page.on('pageerror', (e) => run.problems.push(`page error: ${e.message}`));
  await page.goto(`${url}/#/`);
  await page.waitForSelector('.lib-cats [role=tab]', { timeout: 30000 });
  await page.evaluate((w) => (location.hash = `#/?tour=${w}`), ids.join(','));
  await page.waitForSelector('.tour-bar', { timeout: 15000 });
  await page.evaluate(() => document.querySelector<HTMLElement>('.tour-pause')?.click());
  let last = '';
  for (let guard = 0; guard < 120; guard++) {
    const say = await page
      .waitForFunction(
        (prev) => {
          if (!document.querySelector('.tour-bar')) return 'END';
          const b = document.querySelector<HTMLElement>('.tour-bubble');
          return b && !b.hidden && b.textContent && b.textContent !== prev ? b.textContent : false;
        },
        last,
        { timeout: 20000 },
      )
      .then((h) => h.jsonValue() as Promise<string>)
      .catch(() => 'TIMEOUT');
    if (say === 'END') break;
    if (say === 'TIMEOUT') {
      run.problems.push(`stuck after "${last.slice(0, 40)}"`);
      break;
    }
    last = say;
    await page.waitForTimeout(400);
    const step = bySay.get(say);
    if (step) run.steps.set(step.id, 'ok');
    if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1))
      run.problems.push(`horizontal scroll at ${step?.id ?? '?'}`);
    await page.addScriptTag({ content: axeSrc }).catch(() => undefined);
    const found = await page.evaluate(async () => {
      const axe = (window as unknown as { axe: { run: (c: Document, o: object) => Promise<{ violations: { id: string; nodes: { target: unknown[] }[] }[] }> } })
        .axe;
      return (await axe.run(document, { resultTypes: ['violations'] })).violations.map(
        (v) =>
          `${v.id}: ${v.nodes
            .slice(0, 2)
            .map((n) => String(n.target.at(-1)))
            .join(' | ')}`,
      );
    });
    for (const f of found) run.axe.add(f);
    // a script click: an overlay the chapter opened may sit over the bar for a real pointer
    await page.evaluate(() => document.querySelector<HTMLElement>('.tour-next')?.click());
  }
  for (const id of missing) {
    const optional = CHAPTERS.flatMap((c) => c.steps).find((s) => s.id === id)?.optional;
    run.steps.set(id, optional ? 'skipped' : 'MISSING');
  }
}

async function main(): Promise<number> {
  const arg = process.argv.slice(2).find((a) => !a.startsWith('-'));
  if (!arg) {
    console.error('Usage: npm run tour:check -- <chapter>[,<chapter>]   (or all)');
    return 2;
  }
  const ids = arg === 'all' ? CHAPTERS.map((c) => c.id) : arg.split(',');
  const unknown = ids.filter((id) => !CHAPTERS.some((c) => c.id === id));
  if (unknown.length) {
    console.error(`No such chapter: ${unknown.join(', ')}. Chapters: ${CHAPTERS.map((c) => c.id).join(', ')}`);
    return 2;
  }
  const axeSrc = readFileSync(join(dirname(createRequire(import.meta.url).resolve('axe-core')), 'axe.min.js'), 'utf8');
  const port = await freePort();
  const server = await createServer({
    cacheDir: mkdtempSync(join(tmpdir(), 'tourcheck-')),
    server: { port, strictPort: true, host: '127.0.0.1' },
    logLevel: 'error',
  });
  await server.listen();
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const runs: Run[] = [];
  try {
    for (const size of SIZES)
      for (const scheme of SCHEMES) {
        const ctx = await browser.newContext({ viewport: { width: size, height: size < 600 ? 844 : 900 }, colorScheme: scheme, reducedMotion: 'reduce' });
        await ctx.addInitScript((s) => {
          if (sessionStorage.getItem('tc')) return;
          sessionStorage.setItem('tc', '1');
          localStorage.setItem('gm-ui', 'web');
          localStorage.setItem('gm-theme', s);
          localStorage.setItem('gm-tour-sound', 'off');
        }, scheme);
        const run: Run = { size, scheme, steps: new Map(), axe: new Set(), problems: [] };
        try {
          await play(await ctx.newPage(), `http://127.0.0.1:${port}`, ids, axeSrc, run);
        } catch (e) {
          run.problems.push(String(e instanceof Error ? e.message : e).split('\n')[0] ?? 'failed');
        }
        runs.push(run);
        await ctx.close();
      }
  } finally {
    await browser.close();
    await server.close();
  }
  let bad = 0;
  console.log(['step', ...runs.map((r) => `${r.size}${r.scheme[0]}`)].join('\t'));
  for (const c of CHAPTERS.filter((c) => ids.includes(c.id)))
    for (const s of c.steps) {
      const row = runs.map((r) => r.steps.get(s.id) ?? (s.optional ? 'skipped' : 'MISSING'));
      if (row.includes('MISSING')) bad++;
      console.log([s.id, ...row].join('\t'));
    }
  for (const r of runs) {
    const tag = `${r.size} ${r.scheme}`;
    console.log(`${tag}: axe ${r.axe.size ? [...r.axe].join('; ') : 'clean'}${r.problems.length ? ` | problems: ${r.problems.join('; ')}` : ''}`);
    if (r.problems.length) bad++;
  }
  console.log(bad ? `FAIL: ${bad} problem(s)` : 'ok');
  return bad ? 1 : 0;
}

main().then(
  (code) => process.exit(code),
  (e: unknown) => {
    console.error(e);
    process.exit(1);
  },
);
