// Task trace: does what a person does (open a game, switch editors and tabs, play and stop, zoom
// the map, step through a walkthrough, open and close desk overlays, leave views) and reports,
// per step, INP, long tasks, time until quiet, frames while playing, and the hottest functions from
// a CPU profile of every step that ran long. --throttle N slows the CPU N times (4 is a middling
// laptop; Lewis's reported INP was 6.9 s). Never 5173.
//   (add --desk-only 1 to run only the desk steps; --budget 1 for the short set; --repeat N opens and closes each desk overlay N times; --profiles <folder> keeps slow steps' CPU profiles verifyPerf.ts uses:
//    home, the map editor and its tabs, the desk, the Virus Blaster box)
//   npm run perf:tasks -- [--dist <scratch vite build>] [--port 5195] [--url http://…] [--throttle 4] [--network 4g|slow-4g] [--out <folder>]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { CDPSession, Page } from 'playwright-core';
import { applySlowdown, arg, launch, OBSERVE, target } from './perfLib';

interface Hot {
  fn: string;
  ms: number;
}
interface Step {
  step: string;
  readyMs: number;
  inpMs: number;
  longTasks: number;
  longestMs: number;
  heapMb: number;
  frames?: string;
  hot?: Hot[];
}

type PerfState = { events: Map<number, number>; cls: number; long: number[]; lastLong: number };

let cdp: CDPSession;
const steps: Step[] = [];
const SLOW = 120;

/** Self time per function from a CPU profile, biggest first. */
function hottest(profile: {
  nodes: { id: number; callFrame: { functionName: string; url: string; lineNumber: number }; hitCount?: number }[];
  samples?: number[];
  timeDeltas?: number[];
}): Hot[] {
  const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  const self = new Map<string, number>();
  (profile.samples ?? []).forEach((id, i) => {
    const f = byId.get(id)?.callFrame;
    if (!f) return;
    const key = `${f.functionName || '(anonymous)'} ${f.url.split('/').pop() ?? ''}:${f.lineNumber + 1}`;
    self.set(key, (self.get(key) ?? 0) + (profile.timeDeltas?.[i] ?? 0) / 1000);
  });
  return [...self.entries()]
    .filter(([k]) => !k.startsWith('(idle)') && !k.startsWith('(program)'))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([fn, ms]) => ({ fn, ms: Math.round(ms) }));
}

async function measure(page: Page, step: string, action: () => Promise<unknown>): Promise<Step> {
  await page.evaluate(() => {
    const m = (window as unknown as { __perf?: PerfState }).__perf;
    if (m) {
      m.events.clear();
      m.long = [];
    }
  });
  await cdp.send('Profiler.start');
  const t0 = Date.now();
  await action().catch((e: Error) => console.log(`  ! ${step}: ${e.message.split('\n')[0].slice(0, 90)}`));
  await page.evaluate(
    () =>
      new Promise<void>((done) => {
        const m = (window as unknown as { __perf: PerfState }).__perf;
        const start = performance.now();
        const check = () => (performance.now() - Math.max(m.lastLong, start) > 600 || performance.now() - start > 30_000 ? done() : setTimeout(check, 100));
        requestAnimationFrame(() => requestAnimationFrame(check));
      }),
  );
  const { profile } = await cdp.send('Profiler.stop');
  const keepDir = arg('profiles');
  const r = await page.evaluate(() => {
    const m = (window as unknown as { __perf: PerfState }).__perf;
    return { inp: Math.max(0, ...m.events.values()), long: m.long };
  });
  const { metrics } = await cdp.send('Performance.getMetrics');
  const out: Step = {
    step,
    readyMs: Date.now() - t0 - 600,
    inpMs: Math.round(r.inp),
    longTasks: r.long.length,
    longestMs: Math.round(Math.max(0, ...r.long)),
    heapMb: Math.round((metrics.find((m) => m.name === 'JSHeapUsedSize')?.value ?? 0) / 1048576),
  };
  if (out.inpMs > SLOW || out.longestMs > SLOW || out.readyMs > 600) out.hot = hottest(profile);
  // --profiles <folder>: keep the whole CPU profile (open in DevTools) of every slow step
  if (keepDir && out.inpMs > SLOW) {
    mkdirSync(keepDir, { recursive: true });
    writeFileSync(join(keepDir, `${steps.length}-${step.replace(/\W+/g, '-')}.cpuprofile`), JSON.stringify(profile));
  }
  console.log(`  ${step}: ready ${out.readyMs} ms, INP ${out.inpMs}, longest ${out.longestMs}`);
  steps.push(out);
  return out;
}

const frames = (page: Page, ms: number) =>
  page.evaluate(
    (ms) =>
      new Promise<string>((done) => {
        const gaps: number[] = [];
        let last = performance.now();
        const t0 = last;
        const f = (t: number) => {
          gaps.push(t - last);
          last = t;
          if (t - t0 < ms) requestAnimationFrame(f);
          else {
            gaps.sort((a, b) => a - b);
            const q = (x: number) => Math.round(gaps[Math.min(gaps.length - 1, Math.floor(gaps.length * x))] * 10) / 10;
            done(`${q(0.5)}/${q(0.95)}/${q(1)}`);
          }
        };
        requestAnimationFrame(f);
      }),
    ms,
  );

const budget = Boolean(arg('budget'));
const srv = await target(5195);
const browser = await launch();
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.addInitScript(OBSERVE);
  cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  await cdp.send('Profiler.enable');
  await applySlowdown(cdp);
  const go = (hash: string) => page.goto(`${srv.base}/${hash}`);
  // a real mouse click at the element's middle (the page's own animations keep Playwright's
  // "stable" wait from ever finishing, and its hit-testing would show up in the profiles)
  const click = (loc: ReturnType<Page['locator']>) => async () => {
    const el = loc.first();
    await el.waitFor({ state: 'attached', timeout: 8000 });
    await el.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => undefined);
    const box = await el.boundingBox();
    if (!box) throw new Error('not visible');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  };

  await measure(page, 'home: first load', () => go('#/'));
  await page.waitForTimeout(1500);
  if (!arg('desk-only')) {
    if (!budget) {
      await measure(page, 'home: Another featured game', click(page.getByRole('button', { name: /^Another/ })));
      await measure(page, 'home: Look inside', click(page.getByRole('button', { name: /^Look inside/ })));
      await measure(page, 'home: open the Sandbox shelf', click(page.getByRole('button', { name: /^Sandbox\d+ games/ })));
      // the walkthrough player: open, play, step items, chapters, close
      await measure(page, 'walkthrough: open', click(page.getByRole('button', { name: /^Walkthrough of/ })));
      await page.waitForTimeout(1500);
      await measure(page, 'walkthrough: play', click(page.locator('.wt-play')));
      await measure(page, 'walkthrough: 8 x next item', async () => {
        for (let i = 0; i < 8; i++) await click(page.locator('.wt-item-btn[aria-label="Next item"]'))();
      });
      await measure(page, 'walkthrough: chapter click', click(page.locator('.wt-chapter').nth(3)));
      await measure(page, 'walkthrough: close', () => page.keyboard.press('Escape'));
      for (const [name, href] of [
        ['Guide', '#/help'],
        ['Library', '#/library'],
        ['What you’ve done', '#/achievements'],
        ['Cast', '#/cast'],
      ])
        await measure(page, `nav: ${name}`, click(page.locator(`a[href="${href}"]:visible`)));
    }
    for (const [what, path] of [
      ['song', 'carl/menu.cmf'],
      ['map', 'blaster/bus2.map'],
      ['blocks', 'blaster/b1.bbl'],
      ['character', 'blaster/virus.chr'],
    ].filter(([what]) => !budget || what === 'map')) {
      await measure(page, `editor: open ${what} (${path})`, async () => {
        await go(`#/p/look:${path}`);
        await page.locator('main.editor [role=tab]:visible, main.editor canvas:visible').first().waitFor({ timeout: 30_000 });
      });
      const labels = (await page.locator('main.editor [role=tab]:visible').allTextContents()).map((t) => t.trim()).filter(Boolean);
      for (const label of [...new Set(labels)])
        await measure(page, `editor ${what}: tab ${label.slice(0, 24)}`, click(page.locator('main.editor [role=tab]:visible', { hasText: label })));
      if (what === 'song') {
        const play = await measure(page, 'editor song: play', click(page.getByRole('button', { name: /^▶ Play/ })));
        play.frames = await frames(page, 4000);
        await measure(page, 'editor song: stop', click(page.getByRole('button', { name: /Stop/ })));
      }
      if (what === 'map' && !budget) {
        await measure(page, 'editor map: zoom x10', async () => {
          await page.locator('canvas').first().hover();
          for (let i = 0; i < 10; i++) await page.mouse.wheel(0, i < 5 ? -120 : 120);
        });
        await measure(page, 'editor map: paint stroke', async () => {
          const box = await page.locator('canvas').first().boundingBox();
          if (!box) return;
          await page.getByRole('button', { name: 'Paint', exact: true }).click();
          await page.mouse.move(box.x + 60, box.y + 60);
          await page.mouse.down();
          for (let i = 0; i < 40; i++) await page.mouse.move(box.x + 60 + i * 8, box.y + 60 + (i % 5) * 6);
          await page.mouse.up();
        });
        for (const file of ['BUS2.BBL', 'BUS2.MON'])
          await measure(page, `editor map: file ${file}`, click(page.getByRole('button', { name: new RegExp(`^${file}`) })));
      }
    }
    await measure(page, 'leave editor: home', () => go('#/'));
  }
  await measure(page, 'desk: open', async () => {
    await go('#/desk');
    await page.locator('[aria-label="The 1994 desk"]').waitFor({ timeout: 30_000 });
    // the shelf draws its boxes one per task, with a fetch between: a gap of 600 ms is not "quiet",
    // so wait until the count of boxes has not changed for 3 s (this made "ready" swing from 1.3 s to 13 s)
    let last = -1;
    let since = Date.now();
    while (Date.now() - since < 3000) {
      const n = await page.locator('.shelf-box').count();
      if (n !== last) {
        last = n;
        since = Date.now();
      }
      await page.waitForTimeout(250);
    }
  });
  await page.waitForTimeout(2000);
  for (const [name, sel, then] of (
    [
      ['Virus Blaster box', '[aria-label="Virus Blaster box"]'],
      ['Shareware catalog', '.ps-toggle', '.ps-choice-catalog'],
      ['Disk box', '[aria-label^="Disk box"]'],
      ['Notes under the phone', '[aria-label^="Notes under the phone"]'],
      ['Newspaper clipping', '[aria-label^="Newspaper clipping"]'],
      ['Sandbox mug', '[aria-label^="The Sandbox mug"]'],
      ['TURBO BUTTON magazine', '.ps-toggle', '.ps-choice-magazine'],
    ] as [string, string, string?][]
  ).slice(0, budget ? 1 : 99)) {
    // the catalog and the magazine lie in a stack: its menu opens first (not timed), then the choice
    if (then) await click(page.locator(`[aria-label="The 1994 desk"] ${sel}`))();
    // --repeat N: open and close it N times, waiting a different extra time (0 to 6 s) after each open
    const waits = [0, 400, 1000, 2000, 3500, 6000];
    for (let i = 0; i < Number(arg('repeat') ?? 1); i++) {
      const tag = Number(arg('repeat') ?? 1) > 1 ? ` #${i + 1}` : '';
      await measure(page, `desk: open ${name}${tag}`, click(page.locator(`[aria-label="The 1994 desk"] ${then ?? sel}`)));
      const extra = Number(arg('repeat') ?? 1) > 1 ? waits[i % waits.length] : 0;
      if (extra) await page.waitForTimeout(extra);
      await measure(page, `desk: close ${name}${tag}${extra ? ` (+${extra} ms after open)` : ''}`, () => page.keyboard.press('Escape'));
    }
  }
  await measure(page, 'desk: leave to home', () => go('#/'));
} finally {
  await browser.close();
  srv.stop();
}

const out = resolve(arg('out') ?? '../.for-lewis/research/perf');
mkdirSync(out, { recursive: true });
const file = join(out, `tasks-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`);
writeFileSync(file, JSON.stringify({ base: srv.base, throttle: arg('throttle') ?? 1, steps }, null, 2));
console.log('\nstep | ready ms | INP | long tasks (max) | heap MB | frames med/p95/max');
for (const s of steps) console.log([s.step, s.readyMs, s.inpMs, `${s.longTasks} (${s.longestMs})`, s.heapMb, s.frames ?? ''].join(' | '));
console.log('\nHot functions (self ms) for slow steps');
for (const s of steps) if (s.hot) console.log(`${s.step}: ${s.hot.map((h) => `${h.fn} ${h.ms}`).join('; ')}`);
console.log(`Report: ${file}`);
process.exit(0);
