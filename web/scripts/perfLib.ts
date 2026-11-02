// Shared by the perf scripts (perfTrace.ts, perfMemory.ts): command-line options, a server of
// our own (dev server, or `vite preview` of a scratch production build), Playwright's bundled
// headless Chromium, and the page observers. Never serves or touches port 5173.
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium, type Browser } from 'playwright-core';

export const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};

/** Playwright's bundled headless shell: GM_CHROMIUM, else the newest one installed. */
export function headlessShell(): string | undefined {
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

export function launch(): Promise<Browser> {
  return chromium.launch({
    executablePath: headlessShell(),
    args: ['--autoplay-policy=no-user-gesture-required', '--js-flags=--expose-gc', '--enable-precise-memory-info'],
  });
}

export interface Target {
  base: string;
  stop(): void;
}

/**
 * Where to measure: `--url` (someone else's server), `--dist <folder>` (a scratch production
 * build, previewed on --port), or a dev server on --port. The port defaults to `fallback` and is
 * never 5173.
 */
export async function target(fallback: number): Promise<Target> {
  const url = arg('url');
  const port = Number(arg('port') ?? fallback);
  if (port === 5173 || /:5173\b/.test(url ?? '')) throw new Error('Port 5173 is the maintainer’s dev server: pick another.');
  if (url) return { base: url.replace(/\/$/, ''), stop() {} };
  const dist = arg('dist');
  const vite = resolve('../node_modules/vite/bin/vite.js');
  const args = dist ? [vite, 'preview', '--outDir', resolve(dist), '--port', String(port), '--strictPort'] : [vite, '--port', String(port), '--strictPort'];
  const child: ChildProcess = spawn(process.execPath, args, { stdio: 'ignore' });
  const base = `http://localhost:${port}`;
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(base)).ok) return { base, stop: () => child.kill() };
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  child.kill();
  throw new Error(`The server on ${port} did not start.`);
}

/** Installed before any page script: LCP, event timing (INP), layout shift, long tasks, and what the page allocates. */
export const OBSERVE = () => {
  const w = window as unknown as Record<string, unknown>;
  const m = {
    lcp: 0,
    events: new Map<number, number>(),
    cls: 0,
    long: [] as number[],
    lastLong: 0,
    blobs: 0,
    blobBytes: 0,
    liveBlobs: new Set<string>(),
    workers: 0,
    audio: 0,
    bitmaps: 0,
  };
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
  // blobs made and not yet revoked, workers and audio contexts started, bitmaps decoded
  const create = URL.createObjectURL.bind(URL);
  URL.createObjectURL = (o: Blob | MediaSource) => {
    const u = create(o);
    m.blobs++;
    m.blobBytes += (o as Blob).size ?? 0;
    m.liveBlobs.add(u + '|' + ((o as Blob).size ?? 0));
    return u;
  };
  const revoke = URL.revokeObjectURL.bind(URL);
  URL.revokeObjectURL = (u: string) => {
    for (const k of m.liveBlobs) if (k.startsWith(u + '|')) m.liveBlobs.delete(k);
    revoke(u);
  };
  const W = window.Worker;
  window.Worker = class extends W {
    constructor(...a: ConstructorParameters<typeof Worker>) {
      super(...a);
      m.workers++;
    }
  };
  const A = window.AudioContext;
  if (A)
    window.AudioContext = class extends A {
      constructor(...a: ConstructorParameters<typeof AudioContext>) {
        super(...a);
        m.audio++;
      }
    };
  const cb = window.createImageBitmap.bind(window);
  window.createImageBitmap = (...a: unknown[]) => {
    m.bitmaps++;
    return (cb as (...x: unknown[]) => Promise<ImageBitmap>)(...a);
  };
};
