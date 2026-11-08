// Performance budgets: a scratch production build, previewed on a port of its own, measured with
// perfTrace.ts (bytes and requests per page) and perfTasks.ts --budget 1 (INP per click at 4x CPU
// slowdown). Prints budget, measured and delta per item and exits 1 when anything is over.
// Budgets are in perfBudgets.json; --update rewrites them on purpose (a reviewed diff).
//   npm run verify:perf [-- --update] [--port 5190] [--dist <existing scratch build>] [--runs 3]
// Never uses 5173.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { arg } from './perfLib';

const FILE = resolve('scripts/perfBudgets.json');
const PAGES = ['home', 'editor map', 'desk', 'library', 'dos.html'];
const update = process.argv.includes('--update');
const runs = Number(arg('runs') ?? (update ? 3 : 1));
const vite = resolve('../node_modules/vite/bin/vite.js');
const viteNode = resolve('../node_modules/vite-node/vite-node.mjs');

interface Budgets {
  pages: Record<string, { kb: number; requests: number }>;
  clicks: Record<string, { inpMs: number }>;
}
interface Sample {
  pages: Record<string, { kb: number; requests: number }>;
  clicks: Record<string, number>;
}

// another agent's preview may already hold a port, and perfLib would then measure *its* build:
// take the first free one of 5190-5196
const free = (p: number) =>
  new Promise<boolean>((done) => {
    const srv = createServer();
    srv.once('error', () => done(false));
    srv.listen(p, () => srv.close(() => done(true)));
  });
let port = arg('port') ?? '';
for (let p = 5190; !port && p <= 5196; p++) if (await free(p)) port = String(p);
if (!port) throw new Error('No free port in 5190-5196: another preview is running.');

const scratch = mkdtempSync(join(tmpdir(), 'gm-perf-'));
const dist = arg('dist') ?? join(scratch, 'dist');

function run(args: string[], env: NodeJS.ProcessEnv = process.env) {
  const r = spawnSync('nice', ['-n', '15', process.execPath, ...args], { stdio: ['ignore', 'ignore', 'inherit'], env });
  if (r.status !== 0) throw new Error(`failed: ${args.slice(0, 3).join(' ')}`);
}
const newest = (dir: string, prefix: string) => {
  const f = readdirSync(dir)
    .filter((n) => n.startsWith(prefix))
    .sort()
    .pop();
  if (!f) throw new Error(`no ${prefix} report`);
  return JSON.parse(readFileSync(join(dir, f), 'utf8'));
};
function once(): Sample {
  const out = mkdtempSync(join(scratch, 'out-'));
  run([viteNode, 'scripts/perfTrace.ts', '--dist', dist, '--port', port, '--only', PAGES.join(','), '--out', out]);
  const sample: Sample = { pages: {}, clicks: {} };
  for (const r of newest(out, 'trace-').rows as { page: string; kb: number; requests: number }[]) sample.pages[r.page] = { kb: r.kb, requests: r.requests };
  run([viteNode, 'scripts/perfTasks.ts', '--dist', dist, '--port', port, '--throttle', '4', '--budget', '1', '--out', out]);
  // only the steps that are one key click (a tab, a box): page loads and leaving are not INP
  for (const s of newest(out, 'tasks-').steps as { step: string; inpMs: number }[]) if (/: tab |box$/.test(s.step)) sample.clicks[s.step] = s.inpMs;
  return sample;
}

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

try {
  if (!arg('dist')) {
    console.log('Building a scratch production bundle...');
    // vite-node sets NODE_ENV=development, which would build an unminified bundle twice the size
    run([vite, 'build', '--outDir', dist, '--emptyOutDir'], { ...process.env, NODE_ENV: 'production' });
  }
  const samples: Sample[] = [];
  for (let i = 0; i < runs; i++) {
    console.log(`Measuring (run ${i + 1} of ${runs})...`);
    samples.push(once());
  }

  if (update) {
    const b: Budgets = { pages: {}, clicks: {} };
    for (const p of Object.keys(samples[0].pages)) {
      const kb = samples.map((s) => s.pages[p].kb);
      const rq = samples.map((s) => s.pages[p].requests);
      b.pages[p] = { kb: Math.ceil(median(kb) * 1.1), requests: Math.ceil(median(rq) * 1.1) };
      console.log(`${p}: KB ${kb.join('/')}  requests ${rq.join('/')}`);
    }
    for (const c of Object.keys(samples[0].clicks)) {
      const v = samples.map((s) => s.clicks[c] ?? 0);
      const m = median(v);
      // spreads seen on this Mac: 0-290 ms between runs, once 1.5 s; the check measures a failing click twice, which
      // drops such outliers, so the margin only covers the ordinary swing: 50% or 80 ms over the median, whichever is more
      b.clicks[c] = { inpMs: Math.ceil(Math.max(1.5 * m, m + 80)) };
      console.log(`${c}: INP ${v.join('/')}`);
    }
    const about =
      'Written by npm run verify:perf -- --update. Bytes and requests: median of the runs plus 10%. INP at 4x CPU slowdown: median plus 50% or 80 ms, whichever is more (timings swing; a failing click is measured twice).';
    writeFileSync(FILE, JSON.stringify({ about, ...b }, null, 2) + '\n');
    console.log(`Wrote ${FILE}`);
  } else {
    const budgets = JSON.parse(readFileSync(FILE, 'utf8')) as Budgets;
    let over = 0;
    const rows: string[][] = [['item', 'budget', 'measured', 'delta']];
    const add = (item: string, budget: number, measured: number, unit: string) => {
      const bad = measured > budget;
      if (bad) over++;
      rows.push([item, `${budget} ${unit}`, `${measured} ${unit}`, `${measured - budget >= 0 ? '+' : ''}${measured - budget}${bad ? '  OVER' : ''}`]);
    };
    const s = samples[0];
    // timings and the home page's idle prefetch (59 requests, sometimes 76) swing with the machine's load:
    // when anything is over, measure once more and the lower figure of the two counts
    const isOver = () =>
      Object.entries(budgets.pages).some(([p, b]) => (s.pages[p]?.kb ?? 0) > b.kb || (s.pages[p]?.requests ?? 0) > b.requests) ||
      Object.entries(budgets.clicks).some(([c, b]) => (s.clicks[c] ?? 0) > b.inpMs);
    if (isOver()) {
      console.log('Something is over budget: measuring once more...');
      const again = once();
      for (const p of Object.keys(s.pages)) {
        const a = again.pages[p];
        if (a) s.pages[p] = { kb: Math.min(s.pages[p].kb, a.kb), requests: Math.min(s.pages[p].requests, a.requests) };
      }
      for (const c of Object.keys(s.clicks)) s.clicks[c] = Math.min(s.clicks[c], again.clicks[c] ?? Infinity);
    }
    for (const [p, b] of Object.entries(budgets.pages)) {
      if (!s.pages[p]) {
        over++;
        rows.push([p, 'page', 'not measured', 'OVER']);
        continue;
      }
      add(`${p}: bytes`, b.kb, s.pages[p].kb, 'KB');
      add(`${p}: requests`, b.requests, s.pages[p].requests, 'req');
    }
    for (const [c, b] of Object.entries(budgets.clicks)) {
      if (s.clicks[c] === undefined) {
        over++;
        rows.push([c, 'step', 'not measured', 'OVER']);
        continue;
      }
      add(`${c}: INP`, b.inpMs, s.clicks[c], 'ms');
    }
    const w = [0, 1, 2, 3].map((i) => Math.max(...rows.map((r) => r[i].length)));
    for (const r of rows) console.log(r.map((c, i) => c.padEnd(w[i])).join('  '));
    console.log(over ? `\n${over} over budget. If the change is deliberate: npm run verify:perf -- --update, and review the diff.` : '\nWithin budget.');
    process.exitCode = over ? 1 : 0;
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
