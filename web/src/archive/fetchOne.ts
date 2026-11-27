// Fetch one file for the archive, waiting a bounded time for a dev server to prepare it.
import { retryDelayMs } from '../project/archiveWait';

export async function fetchOne(url: string): Promise<boolean> {
  let pending = 0;
  for (let tries = 0; tries < 2;) {
    try {
      // 'reload': past the browser's cache, so the archive's crawler sees the request
      const r = await fetch(url, { cache: 'reload' });
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
    }
    tries++;
  }
  return false;
}
