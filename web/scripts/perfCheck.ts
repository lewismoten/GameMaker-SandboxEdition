// Interaction performance check: clicks through the site the way a person does (each page from
// the nav, the editor's biggest song, map and blocks, play and stop, leaving again) in headless
// Chromium (Playwright's bundled one) and reports, per step, the time until the page is quiet,
// the largest contentful paint, the slowest click to next paint (INP), layout shift and long
// tasks, plus frame times while a song plays. Writes a JSON report and compares it with the
// previous one. Runs its own dev server on --port (default 5196); never point it at 5173.
//   npm run perf:check -- [--port 5196] [--url http://localhost:5196] [--out ../.for-lewis/research/perf]
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium, type Page } from 'playwright-core';

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const port = Number(arg('port') ?? 5196);
if (port === 5173) throw new Error('Port 5173 is the maintainer’s dev server: pick another.');
const outDir = resolve(arg('out') ?? new URL('../../.for-lewis/research/perf', import.meta.url).pathname);
let base = arg('url') ?? `http://localhost:${port}`;

interface Step {
  step: string;
  readyMs: number;
  lcpMs?: number;
  inpMs?: number;
  cls: number;
  longTasks: number;
  longestTaskMs: number;
  frames?: { median: number; p95: number; max: number };
}

// observers installed before any page script: LCP, event timing (INP), layout shift, long tasks
const OBSERVE = () => {
  const w = window as unknown as Record<string, unknown>;
  const m = { lcp: 0, events: new Map<number, number>(), cls: 0, long: [] as number[], lastLong: 0 };
  w.__perf = m;
  const watch = (type: string, fn: (e: PerformanceEntry) => void, extra: Record<string, unknown> = {}) => {
    try {
      new PerformanceObserver((l) => l.getEntries().forEach(fn)).observe({ type, buffered: true, ...extra });
    } catch {
      /* not supported here */
    }
  };
  watch('largest-contentful-paint', (e) => (m.lcp = e.startTime));
  watch(
    'event',
    (e) => {
      const id = (e as PerformanceEntry & { interactionId?: number }).interactionId;
      if (id) m.events.set(id, Math.max(m.events.get(id) ?? 0, e.duration));
    },
    { durationThreshold: 16 },
  );
  watch('layout-shift', (e) => {
    const s = e as PerformanceEntry & { value: number; hadRecentInput: boolean };
    if (!s.hadRecentInput) m.cls += s.value;
  });
  watch('longtask', (e) => {
    m.long.push(e.duration);
    m.lastLong = e.startTime + e.duration;
  });
};

/** Resets the counters, runs the action, then waits until no long task for 600 ms (at most 30 s). */
async function measure(page: Page, step: string, action: () => Promise<unknown>, withLcp = false): Promise<Step> {
  await page.evaluate(() => {
    const m = (window as unknown as { __perf?: { events: Map<number, number>; cls: number; long: number[] } }).__perf;
    if (!m) return; // a blank page before the first visit
    m.events.clear();
    m.cls = 0;
    m.long = [];
  });
  const t0 = Date.now();
  await action();
  await page.evaluate(
    () =>
      new Promise<void>((done) => {
        const m = (window as unknown as { __perf: { lastLong: number } }).__perf;
        const start = performance.now();
        const check = () => (performance.now() - Math.max(m.lastLong, start) > 600 || performance.now() - start > 30_000 ? done() : setTimeout(check, 100));
        requestAnimationFrame(() => requestAnimationFrame(check));
      }),
  );
  const r = await page.evaluate(() => {
    const m = (window as unknown as { __perf: { lcp: number; events: Map<number, number>; cls: number; long: number[] } }).__perf;
    return { lcp: m.lcp, inp: Math.max(0, ...m.events.values()), cls: m.cls, long: m.long };
  });
  const out: Step = {
    step,
    readyMs: Date.now() - t0 - 600,
    lcpMs: withLcp ? Math.round(r.lcp) : undefined,
    inpMs: r.inp ? Math.round(r.inp) : undefined,
    cls: Math.round(r.cls * 1000) / 1000,
    longTasks: r.long.length,
    longestTaskMs: Math.round(Math.max(0, ...r.long)),
  };
  console.log(`  ${step}: ${out.readyMs} ms`);
  return out;
}

/** Frame gaps for a few seconds (while a song plays). */
async function frames(page: Page, ms: number): Promise<Step['frames']> {
  const gaps = await page.evaluate(
    (ms) =>
      new Promise<number[]>((done) => {
        const out: number[] = [];
        let last = performance.now();
        const t0 = last;
        const f = (t: number) => {
          out.push(t - last);
          last = t;
          if (t - t0 < ms) requestAnimationFrame(f);
          else done(out);
        };
        requestAnimationFrame(f);
      }),
    ms,
  );
  gaps.sort((a, b) => a - b);
  const q = (x: number) => Math.round(gaps[Math.min(gaps.length - 1, Math.floor(gaps.length * x))] * 10) / 10;
  return { median: q(0.5), p95: q(0.95), max: q(1) };
}

async function startServer(): Promise<ChildProcess | undefined> {
  if (arg('url')) return undefined;
  const vite = spawn(process.execPath, [resolve('../node_modules/vite/bin/vite.js'), '--port', String(port), '--strictPort'], { stdio: 'ignore' });
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(base)).ok) return vite;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  vite.kill();
  throw new Error(`The dev server on ${port} did not start.`);
}

const server = await startServer();
base = base.replace(/\/$/, '');
// Playwright's bundled headless shell: GM_CHROMIUM, else the newest one installed (an update of
// playwright-core may expect a build not downloaded yet)
function headlessShell(): string | undefined {
  if (process.env.GM_CHROMIUM) return process.env.GM_CHROMIUM;
  const cache = join(homedir(), 'Library/Caches/ms-playwright');
  if (!existsSync(cache)) return undefined;
  const builds = readdirSync(cache)
    .filter((d) => d.startsWith('chromium_headless_shell-'))
    .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
  for (const d of builds) {
    const exe = join(cache, d, 'chrome-headless-shell-mac-arm64/chrome-headless-shell');
    if (existsSync(exe)) return exe;
  }
  return undefined;
}
let browser: Awaited<ReturnType<typeof chromium.launch>>;
try {
  browser = await chromium.launch({ executablePath: headlessShell(), args: ['--autoplay-policy=no-user-gesture-required'] });
} catch (err) {
  server?.kill();
  throw err;
}
const steps: Step[] = [];
try {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.addInitScript(OBSERVE);
  const nav = (href: string) => page.locator(`a[href="${href}"]:visible`).first();
  steps.push(await measure(page, 'home: first load', () => page.goto(`${base}/#/`), true));
  // a person reads the page before the first click (idle work such as the sound warm-up runs then)
  await page.waitForTimeout(1500);
  for (const [name, href] of [
    ['Guide', '#/help'],
    ['Library', '#/library'],
    ['What you’ve done', '#/achievements'],
    ['Cast', '#/cast'],
  ])
    if (await nav(href).count()) steps.push(await measure(page, `nav: ${name}`, () => nav(href).click()));
  // the editor, look-only, with the biggest built-in song, map and block set
  for (const [what, path] of [
    ['song', 'carl/menu.cmf'],
    ['map', 'blaster/bus2.map'],
    ['blocks', 'blaster/b1.bbl'],
  ]) {
    steps.push(
      await measure(page, `editor: open ${what} (${path})`, async () => {
        await page.goto(`${base}/#/p/look:${path}`);
        // a hash change: wait for the editor itself, not the page load
        await page.locator('main.editor [role=tab]:visible, main.editor canvas:visible').first().waitFor({ timeout: 30_000 });
      }),
    );
    // the labels first: a click can rebuild the tab list
    const labels = (await page.locator('main.editor [role=tab]:visible').allTextContents()).map((t) => t.trim()).filter(Boolean);
    for (const label of [...new Set(labels)]) {
      const tab = page.locator('main.editor [role=tab]:visible', { hasText: label }).first();
      if (await tab.count()) steps.push(await measure(page, `editor ${what}: tab ${label.slice(0, 24)}`, () => tab.click({ timeout: 5000 })));
    }
    if (what === 'song') {
      const play = page.getByRole('button', { name: /^▶ Play/ }).first();
      if (await play.count()) {
        const s = await measure(page, 'editor song: play', () => play.click());
        s.frames = await frames(page, 4000);
        steps.push(s);
        steps.push(await measure(page, 'editor song: stop', () => page.getByRole('button', { name: /Stop/ }).first().click()));
      }
    }
    if (what === 'map') {
      const map = page.locator('canvas').first();
      steps.push(
        await measure(page, 'editor map: wheel zoom x10', async () => {
          await map.hover();
          for (let i = 0; i < 10; i++) await page.mouse.wheel(0, i < 5 ? -120 : 120);
        }),
      );
    }
  }
  steps.push(await measure(page, 'leave editor: home', () => page.goto(`${base}/#/`)));
  steps.push(
    await measure(
      page,
      'desk: open',
      async () => {
        await page.goto(`${base}/#/desk`);
        await page.locator('[aria-label="The 1994 desk"]').waitFor({ timeout: 30_000 });
      },
      true,
    ),
  );
} finally {
  await browser.close();
  server?.kill();
}

// report: this run, the last one beside it
mkdirSync(outDir, { recursive: true });
const earlier = existsSync(outDir)
  ? readdirSync(outDir)
      .filter((f) => /^perf-.*\.json$/.test(f))
      .sort()
  : [];
const prev = earlier.length ? (JSON.parse(readFileSync(join(outDir, earlier[earlier.length - 1]), 'utf8')) as { steps: Step[] }).steps : [];
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
writeFileSync(join(outDir, `perf-${stamp}.json`), JSON.stringify({ when: new Date().toISOString(), base, steps }, null, 2));
const was = (s: Step) => prev.find((p) => p.step === s.step);
const cell = (v: number | undefined, p: number | undefined) => (v === undefined ? '' : p === undefined ? String(v) : `${v} (${p})`);
console.log('step | ready ms | LCP ms | INP ms | CLS | long tasks | longest | frames med/p95/max   (last run in brackets)');
for (const s of steps)
  console.log(
    [
      s.step,
      cell(s.readyMs, was(s)?.readyMs),
      cell(s.lcpMs, was(s)?.lcpMs),
      cell(s.inpMs, was(s)?.inpMs),
      s.cls,
      s.longTasks,
      cell(s.longestTaskMs, was(s)?.longestTaskMs),
      s.frames ? `${s.frames.median}/${s.frames.p95}/${s.frames.max}` : '',
    ].join(' | '),
  );
console.log(`Report: ${join(outDir, `perf-${stamp}.json`)}`);
// the dev server's child process can keep node waiting
process.exit(0);
