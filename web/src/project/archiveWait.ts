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
export async function fetchArchive(
  url: string,
  init?: RequestInit,
  wait: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
): Promise<Response> {
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
      await wait(retryDelayMs(n, Number(res.headers.get('retry-after')) || 0));
      if (init?.signal?.aborted) return res;
    }
  } finally {
    if (shown) {
      waiting.delete(id);
      say([...waiting.values()].at(-1));
    }
  }
}
