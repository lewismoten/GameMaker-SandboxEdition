// Fetching ahead: once the page has settled, the code for what a visitor is likely to open
// next (the desk's manuals and catalog, Game-Maker's designers…) is downloaded in the
// background, so it opens at once and, through the service worker, works offline too.
// Not on a connection that asks to save data or is slow.

type Idle = (cb: () => void, opts?: { timeout: number }) => number;

/** Runs each loader one after another when the page is idle, after `delay` ms. Failures are ignored (it loads again when used). */
export function prefetchWhenIdle(loaders: (() => Promise<unknown>)[], delay = 3000): void {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? '')) return;
  const idle: Idle = (window as unknown as { requestIdleCallback?: Idle }).requestIdleCallback ?? ((cb) => window.setTimeout(cb, 200));
  const next = (i: number) => {
    if (i >= loaders.length) return;
    idle(() => void loaders[i]().catch(() => undefined).then(() => next(i + 1)), { timeout: 5000 });
  };
  window.setTimeout(() => next(0), delay);
}
