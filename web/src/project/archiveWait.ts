// Fetching a game's archive while the dev server may still be building it: 202 means "not ready, ask again".
// Retries back off from a few seconds to 30, and a polite live region says a request is pending.

/** Seconds to wait before retry number `n` (0-based): 2, 4, 8, 16, then 30 at most; the server's Retry-After raises the first. */
export function retryDelayMs(n: number, retryAfter = 0): number {
  return Math.min(30_000, Math.max(retryAfter * 1000, 2000 * 2 ** n));
}

let region: HTMLElement | undefined;
const waiting = new Map<symbol, string>();

/** Shows (or clears) the short pending message for one waiting request. */
function say(label: string | undefined): void {
  if (typeof document === 'undefined') return;
  if (!region) {
    region = document.createElement('div');
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.style.cssText =
      'position:fixed;left:16px;bottom:16px;z-index:99;max-width:calc(100vw - 32px);padding:6px 10px;border-radius:6px;font:14px system-ui,sans-serif;background:Canvas;color:CanvasText;border:1px solid GrayText';
    region.hidden = true;
    document.body.append(region);
  }
  const text = label ? `Preparing ${label}… (still building)` : '';
  if (region.textContent !== text) region.textContent = text;
  region.hidden = !label;
}

/** A readable name for an archive URL such as ./games/gameware/sample/sample.zip. */
export const archiveLabel = (url: string): string => url.split('/').filter(Boolean).slice(-2, -1)[0] ?? 'game';

/** Like fetch, but a 202 is waited out (with backoff) instead of returned. `wait` is injectable for tests. */
export async function fetchArchive(url: string, init?: RequestInit, wait?: (ms: number) => Promise<void>): Promise<Response> {
  let shown = false;
  const id = Symbol();
  try {
    for (let n = 0; ; n++) {
      const res = await fetch(url, init);
      if (res.status !== 202) return res;
      if (!shown) {
        shown = true;
        waiting.set(id, archiveLabel(url));
        say(archiveLabel(url));
      }
      await pause(retryDelayMs(n, Number(res.headers.get('retry-after')) || 0), init?.signal, wait);
    }
  } finally {
    if (shown) {
      waiting.delete(id);
      say([...waiting.values()].at(-1));
    }
  }
}

/** Settle immediately on cancellation and release the timer and listener. */
function pause(ms: number, signal?: AbortSignal | null, wait?: (ms: number) => Promise<void>): Promise<void> {
  return new Promise((resolve, reject) => {
    signal?.throwIfAborted();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const clean = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    };
    const abort = () => {
      clean();
      reject(signal?.reason);
    };
    signal?.addEventListener('abort', abort, { once: true });
    if (wait)
      void wait(ms).then(
        () => {
          clean();
          resolve();
        },
        (error: unknown) => {
          clean();
          reject(error);
        },
      );
    else
      timer = setTimeout(() => {
        clean();
        resolve();
      }, ms);
  });
}
