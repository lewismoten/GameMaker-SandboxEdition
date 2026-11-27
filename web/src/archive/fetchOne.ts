// Fetch one file for the archive, waiting a bounded time for a dev server to prepare it.
import { retryDelayMs } from '../project/archiveWait';

const ATTEMPT_TIMEOUT_MS = 30_000;

export async function fetchOne(url: string): Promise<boolean> {
  let pending = 0;
  for (let tries = 0; tries < 2;) {
    // A stalled header or body aborts after a while, so the attempt counts as failed and retries.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);
    try {
      // 'reload': past the browser's cache, so the archive's crawler sees the request
      const r = await fetch(url, { cache: 'reload', signal: controller.signal });
      if (r.status === 202) {
        if (pending >= 5) return false;
        // Match the catalog loader's backoff in project/archiveWait.ts, but stop after five retries.
        const delay = retryDelayMs(pending++, Number(r.headers.get('retry-after')) || 0);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      await r.arrayBuffer();
      if (r.ok) return true;
    } catch {
      /* try once more */
    } finally {
      clearTimeout(timer);
    }
    tries++;
  }
  return false;
}
