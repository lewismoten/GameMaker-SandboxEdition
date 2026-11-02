// Page-load trace: opens each page of the site in a fresh headless Chromium (nothing saved), and
// reports requests and bytes, scripts fetched, time until quiet, LCP, CLS, long tasks, the main
// thread's time (script / layout / style), the heap, and what the page allocated (blob URLs left
// alive and their bytes, workers, audio contexts, bitmaps). Writes JSON, and with --trace a
// Chrome trace per page that opens in DevTools. Runs its own server; never 5173.
//   npm run perf:trace -- [--dist <scratch vite build>] [--port 5195] [--url http://…] [--only desk,help] [--trace <folder>] [--out <folder>]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { CDPSession, Page } from 'playwright-core';
import { arg, launch, OBSERVE, target } from './perfLib';

const PAGES: [string, string][] = [
  ['home', '/#/'],
  ['editor overview', '/#/p/look:carl/menu.cmf'],
  ['editor map', '/#/p/look:blaster/bus2.map'],
  ['editor blocks', '/#/p/look:blaster/b1.bbl'],
  ['guide', '/#/help'],
  ['library', '/#/library'],
  ['achievements', '/#/achievements'],
  ['cast', '/#/cast'],
  ['credits', '/#/credits'],
  ['mac', '/#/mac'],
  ['desk', '/#/desk'],
  ['magazine', '/#/magazine'],
  ['dos.html', '/dos.html'],
  ['play.html', '/play.html'],
];

interface Row {
  page: string;
  requests: number;
  kb: number;
  jsFiles: number;
  jsKb: number;
  imgKb: number;
  readyMs: number;
  lcpMs: number;
  cls: number;
  longTasks: number;
  longestMs: number;
  scriptMs: number;
  layoutMs: number;
  styleMs: number;
  heapMb: number;
  nodes: number;
  listeners: number;
  blobs: number;
  liveBlobKb: number;
  workers: number;
  audio: number;
  bitmaps: number;
  biggest: string;
}

const metric = async (cdp: CDPSession) => {
  const { metrics } = await cdp.send('Performance.getMetrics');
  return (n: string) => metrics.find((m) => m.name === n)?.value ?? 0;
};

async function trace(page: Page, cdp: CDPSession, name: string, url: string, traceDir?: string): Promise<Row> {
  const reqs = new Map<string, { url: string; type: string; bytes: number }>();
  cdp.on('Network.requestWillBeSent', (e: { requestId: string; request: { url: string }; type?: string }) =>
    reqs.set(e.requestId, { url: e.request.url, type: e.type ?? '', bytes: 0 }),
  );
  cdp.on('Network.loadingFinished', (e: { requestId: string; encodedDataLength: number }) => {
    const r = reqs.get(e.requestId);
    if (r) r.bytes = e.encodedDataLength;
  });
  await cdp.send('Network.enable');
  await cdp.send('Performance.enable');
  if (traceDir)
    await cdp.send('Tracing.start', { categories: 'devtools.timeline,v8.execute,disabled-by-default-devtools.timeline', transferMode: 'ReturnAsStream' });
  const t0 = Date.now();
  await page.goto(url);
  // quiet: no request for 1 s and no long task for 1 s (at most 40 s)
  await page.waitForLoadState('networkidle', { timeout: 40_000 }).catch(() => undefined);
  await page.evaluate(
    () =>
      new Promise<void>((done) => {
        const m = (window as unknown as { __perf: { lastLong: number } }).__perf;
        const start = performance.now();
        const check = () => (performance.now() - Math.max(m.lastLong, start) > 1000 || performance.now() - start > 40_000 ? done() : setTimeout(check, 100));
        check();
      }),
  );
  const readyMs = Date.now() - t0 - 1000;
  await page.waitForTimeout(1500); // idle work (sound warm-up, prefetch) runs after the page is quiet
  const p = await page.evaluate(() => {
    const m = (
      window as unknown as {
        __perf: { lcp: number; cls: number; long: number[]; blobs: number; liveBlobs: Set<string>; workers: number; audio: number; bitmaps: number };
      }
    ).__perf;
    return {
      lcp: m.lcp,
      cls: m.cls,
      long: m.long,
      blobs: m.blobs,
      live: [...m.liveBlobs].reduce((s, k) => s + Number(k.split('|')[1]), 0),
      workers: m.workers,
      audio: m.audio,
      bitmaps: m.bitmaps,
    };
  });
  if (traceDir) {
    const done = await new Promise<{ stream?: string }>((res) => {
      cdp.once('Tracing.tracingComplete', res);
      void cdp.send('Tracing.end');
    });
    const stream = done.stream ?? '';
    let out = '';
    for (;;) {
      const r = await cdp.send('IO.read', { handle: stream });
      out += r.data;
      if (r.eof) break;
    }
    mkdirSync(traceDir, { recursive: true });
    writeFileSync(join(traceDir, `${name.replace(/\W+/g, '-')}.json`), out);
  }
  const m = await metric(cdp);
  const all = [...reqs.values()];
  const sum = (f: (r: (typeof all)[number]) => boolean) => all.filter(f).reduce((s, r) => s + r.bytes, 0) / 1024;
  const big = [...all].sort((a, b) => b.bytes - a.bytes)[0];
  return {
    page: name,
    requests: all.length,
    kb: Math.round(sum(() => true)),
    jsFiles: all.filter((r) => r.type === 'Script').length,
    jsKb: Math.round(sum((r) => r.type === 'Script')),
    imgKb: Math.round(sum((r) => r.type === 'Image')),
    readyMs,
    lcpMs: Math.round(p.lcp),
    cls: Math.round(p.cls * 1000) / 1000,
    longTasks: p.long.length,
    longestMs: Math.round(Math.max(0, ...p.long)),
    scriptMs: Math.round(m('ScriptDuration') * 1000),
    layoutMs: Math.round(m('LayoutDuration') * 1000),
    styleMs: Math.round(m('RecalcStyleDuration') * 1000),
    heapMb: Math.round(m('JSHeapUsedSize') / 1048576),
    nodes: m('Nodes'),
    listeners: m('JSEventListeners'),
    blobs: p.blobs,
    liveBlobKb: Math.round(p.live / 1024),
    workers: p.workers,
    audio: p.audio,
    bitmaps: p.bitmaps,
    biggest: big ? `${big.url.split('/').pop()?.slice(0, 40)} ${Math.round(big.bytes / 1024)} KB` : '',
  };
}

const srv = await target(5195);
const browser = await launch();
const only = arg('only')?.split(',');
const traceDir = arg('trace') ? resolve(arg('trace')!) : undefined;
const rows: Row[] = [];
try {
  for (const [name, path] of PAGES) {
    if (only && !only.some((o) => name.includes(o))) continue;
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.addInitScript(OBSERVE);
    const cdp = await context.newCDPSession(page);
    rows.push(
      await trace(page, cdp, name, srv.base + path, traceDir).catch((e: Error) => ({ page: name, biggest: `FAILED ${e.message.slice(0, 80)}` }) as Row),
    );
    console.log(JSON.stringify(rows[rows.length - 1]));
    await context.close();
  }
} finally {
  await browser.close();
  srv.stop();
}
const out = resolve(arg('out') ?? '../.for-lewis/research/perf');
mkdirSync(out, { recursive: true });
const file = join(out, `trace-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`);
writeFileSync(file, JSON.stringify({ base: srv.base, rows }, null, 2));
console.log('page | req | KB | js files/KB | ready ms | LCP | CLS | long (max) | script/layout/style ms | heap MB | live blobs KB | workers');
for (const r of rows)
  console.log(
    [
      r.page,
      r.requests,
      r.kb,
      `${r.jsFiles}/${r.jsKb}`,
      r.readyMs,
      r.lcpMs,
      r.cls,
      `${r.longTasks} (${r.longestMs})`,
      `${r.scriptMs}/${r.layoutMs}/${r.styleMs}`,
      r.heapMb,
      r.liveBlobKb,
      r.workers,
    ].join(' | '),
  );
console.log(`Report: ${file}`);
process.exit(0);
