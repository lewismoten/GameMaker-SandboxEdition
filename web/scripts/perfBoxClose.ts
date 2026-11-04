// Closing the Virus Blaster box with Escape, many times from a fresh page each time, with a trace
// (Chrome's timeline) around every close: what the main thread did in the long tasks after the key.
// Prints the INP of each close and, for a slow one, the time per kind of work (layout, paint, GC,
// image decode, scripts…). Never 5173.
//   npm run … vite-node scripts/perfBoxClose.ts -- --dist <scratch vite build> [--port 5195] [--throttle 4] [--runs 12] [--hold 3000] [--out <folder>]
//   --profile 1: a CPU profile of every close (box-close-run<N>.cpuprofile) in place of a trace
//   --hold: ms to wait after the box opens before Escape (default 3000)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { arg, launch, OBSERVE, target } from './perfLib';

interface Ev {
  name: string;
  ph: string;
  ts: number;
  dur?: number;
  tid: number;
  pid: number;
  args?: { data?: { url?: string; functionName?: string } };
}
type PerfState = { events: Map<number, number>; long: number[]; lastLong: number };

const runs = Number(arg('runs') ?? 12);
const hold = Number(arg('hold') ?? 3000);
const out = resolve(arg('out') ?? '../.for-lewis/research/perf');
mkdirSync(out, { recursive: true });
const srv = await target(5195);
const browser = await launch();
const rows: { run: number; inp: number; longest: number }[] = [];
try {
  for (let run = 1; run <= runs; run++) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.addInitScript(OBSERVE);
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(arg('throttle') ?? 4) });
    await page.goto(`${srv.base}/#/desk`);
    await page.locator('[aria-label="The 1994 desk"]').waitFor({ timeout: 30_000 });
    let last = -1;
    let since = Date.now();
    while (Date.now() - since < 3000) {
      const n = await page.locator('.shelf-box').count();
      if (n !== last) ((last = n), (since = Date.now()));
      await page.waitForTimeout(250);
    }
    await page.waitForTimeout(2000);
    if (arg('watch')) {
      // --watch ms [--nobox 1]: no Escape; list the long tasks (start, length) over that time, box open or not
      const t0 = await page.evaluate(() => performance.now());
      const open = !arg('nobox');
      if (arg('profile')) {
        await cdp.send('Profiler.enable');
        await cdp.send('Profiler.start');
      }
      if (open) {
        const bx = await page.locator('[aria-label="The 1994 desk"] [aria-label="Virus Blaster box"]').first().boundingBox();
        if (bx) await page.mouse.click(bx.x + bx.width / 2, bx.y + bx.height / 2);
      }
      const longs = await page.evaluate(
        (ms) =>
          new Promise<string>((done) => {
            const got: string[] = [];
            new PerformanceObserver((l) => l.getEntries().forEach((e) => got.push(`${Math.round(e.startTime)}+${Math.round(e.duration)}`))).observe({
              type: 'longtask',
            });
            setTimeout(() => done(got.join(' ')), ms);
          }),
        Number(arg('watch')),
      );
      if (arg('profile')) {
        const { profile } = await cdp.send('Profiler.stop');
        writeFileSync(join(out, `box-open-run${run}.cpuprofile`), JSON.stringify(profile));
      }
      console.log(`run ${run} (${open ? 'box open' : 'desk only'}), t0 ${Math.round(t0)}: long tasks start+ms: ${longs || 'none'}`);
      await context.close();
      continue;
    }
    const box = await page.locator('[aria-label="The 1994 desk"] [aria-label="Virus Blaster box"]').first().boundingBox();
    if (!box) throw new Error('no box');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(hold);
    await page.evaluate(() => {
      const m = (window as unknown as { __perf: PerfState }).__perf;
      m.events.clear();
      m.long = [];
    });
    const events: Ev[] = [];
    cdp.on('Tracing.dataCollected', (d) => events.push(...(d.value as unknown as Ev[])));
    if (arg('profile')) {
      await cdp.send('Profiler.enable');
      await cdp.send('Profiler.start');
    } else await cdp.send('Tracing.start', { categories: 'devtools.timeline,v8,disabled-by-default-v8.gc,blink', transferMode: 'ReportEvents' });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(2500);
    if (arg('profile')) {
      const { profile } = await cdp.send('Profiler.stop');
      writeFileSync(join(out, `box-close-run${run}.cpuprofile`), JSON.stringify(profile));
    } else {
      const done = new Promise<void>((r) => cdp.once('Tracing.tracingComplete', () => r()));
      await cdp.send('Tracing.end');
      await done;
    }
    const r = await page.evaluate(() => {
      const m = (window as unknown as { __perf: PerfState }).__perf;
      return { inp: Math.round(Math.max(0, ...m.events.values())), longest: Math.round(Math.max(0, ...m.long)) };
    });
    rows.push({ run, ...r });
    console.log(`run ${run}: close INP ${r.inp} ms, longest task ${r.longest} ms`);
    if (r.inp > 120 || r.longest > 200) {
      // time per kind of work, on the thread with the longest RunTask
      const tasks = events.filter((e) => e.name === 'RunTask' && e.ph === 'X' && (e.dur ?? 0) > 50_000).sort((a, b) => (b.dur ?? 0) - (a.dur ?? 0));
      const t = tasks[0];
      if (t) {
        const inside = events.filter(
          (e) => e.ph === 'X' && e.tid === t.tid && e.pid === t.pid && e.ts >= t.ts && e.ts + (e.dur ?? 0) <= t.ts + (t.dur ?? 0) && e !== t,
        );
        const by = new Map<string, number>();
        for (const e of inside) by.set(e.name, (by.get(e.name) ?? 0) + (e.dur ?? 0) / 1000);
        const top = [...by.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
        console.log(
          `  longest RunTask ${Math.round((t.dur ?? 0) / 1000)} ms; inside (summed, nested events overlap): ${top.map(([n, ms]) => `${n} ${Math.round(ms)}`).join('; ')}`,
        );
      }
      writeFileSync(join(out, `box-close-trace-run${run}.json`), JSON.stringify({ traceEvents: events }));
    }
    await context.close();
  }
} finally {
  await browser.close();
  srv.stop();
}
const inps = rows.map((x) => x.inp).sort((a, b) => a - b);
console.log(`\nclose INP over ${rows.length} runs, sorted: ${inps.join(' ')}`);
process.exit(0);
