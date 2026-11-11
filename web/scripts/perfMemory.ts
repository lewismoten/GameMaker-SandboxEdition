// Memory check: repeats a task (open a view, use it, leave it) several times in headless Chromium
// and records, after a forced garbage collection each time: JS heap, DOM nodes, event listeners,
// blob URLs still alive and their bytes, workers and audio contexts started. A task that leaves
// more behind every cycle leaks. With --snapshot it also takes a V8 heap snapshot after the first
// and last cycle and lists the objects that grew (and any detached DOM). Then a long session of
// switching between every view tracks the heap. Never 5173.
//   npm run perf:memory -- [--dist <scratch vite build>] [--port 5195] [--url http://…] [--cycles 4] [--snapshot] [--only song,desk] [--out <folder>]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Browser, CDPSession, Page } from 'playwright-core';
import { arg, launch, OBSERVE, target, type Target } from './perfLib';

interface Sample {
  heapMb: number;
  nodes: number;
  listeners: number;
  liveBlobs: number;
  liveBlobMb: number;
  workers: number;
  audio: number;
}

let cdp: CDPSession;

async function sample(page: Page): Promise<Sample> {
  await cdp.send('HeapProfiler.collectGarbage');
  await page.waitForTimeout(150);
  await cdp.send('HeapProfiler.collectGarbage');
  const { metrics } = await cdp.send('Performance.getMetrics');
  const m = (n: string) => metrics.find((x) => x.name === n)?.value ?? 0;
  const p = await page.evaluate(() => {
    const w = (window as unknown as { __perf: { liveBlobs: Set<string>; workers: number; audio: number } }).__perf;
    return { blobs: w.liveBlobs.size, bytes: [...w.liveBlobs].reduce((s, k) => s + Number(k.split('|')[1]), 0), workers: w.workers, audio: w.audio };
  });
  return {
    heapMb: Math.round((m('JSHeapUsedSize') / 1048576) * 10) / 10,
    nodes: m('Nodes'),
    listeners: m('JSEventListeners'),
    liveBlobs: p.blobs,
    liveBlobMb: Math.round((p.bytes / 1048576) * 10) / 10,
    workers: p.workers,
    audio: p.audio,
  };
}

/** A heap snapshot as {constructor: [count, bytes]} for the objects in it, plus the detached DOM count. */
async function snapshot(): Promise<{ by: Map<string, [number, number]>; detached: number }> {
  let text = '';
  const onChunk = (e: { chunk: string }) => (text += e.chunk);
  cdp.on('HeapProfiler.addHeapSnapshotChunk', onChunk);
  try {
    await cdp.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false });
  } finally {
    cdp.off('HeapProfiler.addHeapSnapshotChunk', onChunk);
  }
  const snap = JSON.parse(text) as { snapshot: { meta: { node_fields: string[] } }; nodes: number[]; strings: string[] };
  text = '';
  const f = snap.snapshot.meta.node_fields;
  const [iType, iName, iSize] = [f.indexOf('type'), f.indexOf('name'), f.indexOf('self_size')];
  const by = new Map<string, [number, number]>();
  let detached = 0;
  for (let i = 0; i < snap.nodes.length; i += f.length) {
    const name = snap.strings[snap.nodes[i + iName]];
    if (snap.nodes[i + iType] === 9 /* synthetic */) continue;
    if (name.startsWith('Detached ')) detached++;
    const e = by.get(name) ?? [0, 0];
    e[0]++;
    e[1] += snap.nodes[i + iSize];
    by.set(name, e);
  }
  return { by, detached };
}

// Return control to vite-node so it can close its own Vite server and flush output.
async function main(): Promise<number> {
  const cycles = Number(arg('cycles') ?? 4);
  const withSnap = process.argv.includes('--snapshot');
  const only = arg('only')?.split(',');
  const report: Record<string, unknown> = {};
  let srv: Target | undefined;
  let browser: Browser | undefined;
  let phase = 'starting target';
  let failed = false;
  const fail = (where: string, error: unknown) => {
    failed = true;
    console.error(`perf:memory failed while ${where}:`, error);
  };
  try {
    const server = await target(5195);
    srv = server;
    phase = 'launching browser';
    browser = await launch();
    phase = 'setting up measurement';
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.addInitScript(OBSERVE);
    cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
    await cdp.send('HeapProfiler.enable');
    const go = (hash: string) => page.goto(`${server.base}/${hash}`);
    const editor = async (path: string) => {
      await go(`#/p/look:${path}`);
      await page.locator('main.editor [role=tab]:visible, main.editor canvas:visible').first().waitFor({ timeout: 30_000 });
      await page.waitForTimeout(800);
    };
    const tabs = async () => {
      const labels = (await page.locator('main.editor [role=tab]:visible').allTextContents()).map((t) => t.trim()).filter(Boolean);
      for (const l of new Set(labels))
        await page
          .locator('main.editor [role=tab]:visible', { hasText: l })
          .first()
          .click({ timeout: 5000 })
          .catch(() => undefined);
    };
    // each task enters a view and uses it; leaving is always back to the home page
    const tasks: Record<string, () => Promise<void>> = {
      'editor song': async () => {
        await editor('carl/menu.cmf');
        await tabs();
        await page
          .getByRole('button', { name: /^▶ Play/ })
          .first()
          .click({ timeout: 5000 })
          .catch(() => undefined);
        await page.waitForTimeout(1500);
        await page
          .getByRole('button', { name: /Stop/ })
          .first()
          .click({ timeout: 5000 })
          .catch(() => undefined);
      },
      'editor map': async () => {
        await editor('blaster/bus2.map');
        await tabs();
        await page.locator('canvas').first().hover();
        for (let i = 0; i < 10; i++) await page.mouse.wheel(0, i < 5 ? -120 : 120);
      },
      'editor blocks': async () => {
        await editor('blaster/b1.bbl');
        await tabs();
      },
      'walkthrough player': async () => {
        await go('#/');
        await page
          .getByRole('button', { name: /^Walkthrough of/ })
          .first()
          .click({ timeout: 8000 });
        await page.waitForTimeout(1200);
        await page
          .locator('.wt-play')
          .click({ timeout: 8000 })
          .catch(() => undefined);
        for (let i = 0; i < 4; i++)
          await page
            .locator('.wt-item-btn[aria-label="Next item"]')
            .click({ timeout: 4000 })
            .catch(() => undefined);
        await page.keyboard.press('Escape');
      },
      desk: async () => {
        await go('#/desk');
        await page.locator('[aria-label="The 1994 desk"]').waitFor({ timeout: 30_000 });
        await page.waitForTimeout(2500);
        for (const sel of ['[aria-label^="Shareware catalog"]', '[aria-label^="Disk box"]', '[aria-label="Virus Blaster box"]']) {
          await page
            .locator(`[aria-label="The 1994 desk"] ${sel}`)
            .first()
            .click({ timeout: 5000 })
            .catch(() => undefined);
          await page.waitForTimeout(600);
          await page.keyboard.press('Escape');
        }
      },
      // views added since 2026-11-02: a kit's 3D assembly viewer in its desk box, the balloon cube's 3D fold, the Library video dialog
      'desk kit 3D': async () => {
        await go('#/desk');
        await page.locator('[aria-label="The 1994 desk"]').waitFor({ timeout: 30_000 });
        await page.waitForTimeout(2500);
        await page.locator('[aria-label="The 1994 desk"] [aria-label^="Snowbound"][aria-label$=" box"]').first().click({ timeout: 5000 });
        await page.waitForTimeout(1500);
        await page.locator('button.feelie[aria-label*="Plowed Street"]').first().click({ timeout: 8000 });
        await page.waitForTimeout(1500);
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(1500);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        await page.keyboard.press('Escape');
      },
      'die fold 3D': async () => {
        await go('#/desk');
        await page.locator('[aria-label="The 1994 desk"]').waitFor({ timeout: 30_000 });
        await page.waitForTimeout(2500);
        await page.locator('[aria-label="The 1994 desk"] [aria-label^="In The Year 2000"][aria-label$=" box"]').first().click({ timeout: 5000 });
        await page.waitForTimeout(1500);
        await page
          .locator('.box-list-item', { hasText: /Wrong-Number Die/ })
          .first()
          .click({ timeout: 8000 });
        await page
          .getByRole('button', { name: /Watch it fold in 3D/ })
          .first()
          .click({ timeout: 15_000 });
        await page.waitForTimeout(2500);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        await page.keyboard.press('Escape');
      },
      'library video': async () => {
        await go('#/library');
        await page.waitForTimeout(2000);
        await page.locator('.lib-o-tv').click({ timeout: 8000 });
        await page
          .locator('.lib-card', { hasText: /Plays from YouTube/ })
          .first()
          .click({ timeout: 8000 });
        await page.locator('.lib-video').waitFor({ timeout: 10_000 });
        await page.waitForTimeout(800);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        await page.keyboard.press('Escape');
      },
      library: async () => {
        await go('#/library');
        await page.waitForTimeout(1500);
      },
      guide: async () => {
        await go('#/help');
        await page.waitForTimeout(800);
      },
    };
    for (const [name, run] of Object.entries(tasks)) {
      if (only && !only.some((o) => name.includes(o))) continue;
      phase = `measuring ${name}`;
      const rows: Sample[] = [];
      let first: Awaited<ReturnType<typeof snapshot>> | undefined;
      await go('#/');
      await page.waitForTimeout(1000);
      const base = await sample(page);
      for (let c = 0; c < cycles; c++) {
        phase = `running ${name}, cycle ${c + 1}`;
        await run();
        phase = `sampling ${name}, cycle ${c + 1}`;
        await go('#/');
        await page.waitForTimeout(3500); // home’s own timers (the featured demo waits 2.5 s) have fired by now
        rows.push(await sample(page));
        if (withSnap && c === 0) {
          phase = `taking first snapshot of ${name}`;
          first = await snapshot();
        }
      }
      const last = rows[rows.length - 1];
      const growth = rows.map((r, i) => (i ? Math.round((r.heapMb - rows[i - 1].heapMb) * 10) / 10 : Math.round((r.heapMb - base.heapMb) * 10) / 10));
      console.log(
        `${name}: heap MB after leaving, per cycle ${rows.map((r) => r.heapMb).join(' -> ')} (base ${base.heapMb}); change per cycle ${growth.join(', ')}; nodes ${base.nodes}->${last.nodes}; listeners ${base.listeners}->${last.listeners}; blobs alive ${last.liveBlobs} (${last.liveBlobMb} MB); workers ${last.workers}; audio ${last.audio}`,
      );
      const entry: Record<string, unknown> = { base, rows };
      if (withSnap && first) {
        phase = `taking final snapshot of ${name}`;
        const end = await snapshot();
        const grown = [...end.by.entries()]
          .map(([k, [n, b]]) => ({ k, n: n - (first.by.get(k)?.[0] ?? 0), b: b - (first.by.get(k)?.[1] ?? 0) }))
          .filter((g) => g.b > 20_000)
          .sort((a, b) => b.b - a.b)
          .slice(0, 12);
        entry.grown = grown;
        entry.detached = [first.detached, end.detached];
        console.log(
          `  detached DOM nodes ${first.detached} -> ${end.detached}; grown since cycle 1: ${grown.map((g) => `${g.k} +${g.n} (${Math.round(g.b / 1024)} KB)`).join('; ')}`,
        );
      }
      report[name] = entry;
    }
    // a long session: every view in turn, three rounds, heap after each (forced GC)
    if (!only) {
      phase = 'measuring long session';
      const hashes = [
        '#/',
        '#/help',
        '#/library',
        '#/achievements',
        '#/cast',
        '#/credits',
        '#/p/look:carl/menu.cmf',
        '#/p/look:blaster/bus2.map',
        '#/p/look:blaster/b1.bbl',
        '#/desk',
        '#/magazine',
      ];
      const heap: number[] = [];
      for (let r = 0; r < 3; r++)
        for (const h of hashes) {
          await go(h);
          await page.waitForTimeout(h === '#/desk' ? 2500 : 700);
          heap.push((await sample(page)).heapMb);
        }
      console.log(`long session (${hashes.length} views x 3), heap MB after each view: ${heap.join(' ')}`);
      report['long session'] = { hashes, heap };
    }
    phase = 'writing report';
    const out = resolve(arg('out') ?? '../.for-lewis/research/perf');
    mkdirSync(out, { recursive: true });
    const file = join(out, `memory-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`);
    writeFileSync(file, JSON.stringify({ base: server.base, cycles, report }, null, 2));
    console.log(`Report: ${file}`);
  } catch (error) {
    fail(phase, error);
  } finally {
    try {
      await browser?.close();
    } catch (error) {
      fail('closing browser', error);
    }
    try {
      srv?.stop();
    } catch (error) {
      fail('stopping target', error);
    }
  }
  return failed ? 1 : 0;
}

process.exitCode = await main();
