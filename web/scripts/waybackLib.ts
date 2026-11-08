// Shared pieces of the Wayback helpers: a polite user agent, URL scanning, and the two requests
// (availability lookup, Save Page Now). The fetch function is passed in, so tests never touch the network.

export const USER_AGENT = 'wayback-helpers (research script; one request at a time, rate limited)';

export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

const URL_RE = /https?:\/\/[^\s"'`<>()[\]{}\\|^]+/g;

/** Unique outside URLs in a text, in order of first appearance. Hosts matching `skip` are left out. */
export function extractUrls(text: string, skip?: RegExp): string[] {
  const seen = new Set<string>();
  for (const m of text.matchAll(URL_RE)) {
    const u = m[0].replace(/[.,;:!?*]+$/, '');
    let host: string;
    try {
      host = new URL(u).hostname.toLowerCase();
    } catch {
      continue;
    }
    if (!host.includes('.') || skip?.test(host)) continue;
    seen.add(u);
  }
  return [...seen];
}

/** URLs of the unticked items (`- [ ] <url>`) of a Markdown checklist. */
export function uncheckedUrls(markdown: string): string[] {
  return markdown
    .split('\n')
    .filter((l) => l.startsWith('- [ ] <'))
    .map((l) => /<([^>]+)>/.exec(l)?.[1] ?? '')
    .filter(Boolean);
}

export interface Lookup {
  snapshot: string | null;
  error: string | null;
}

/** Asks the availability API about one URL; retries a refused or failed request after `retryMs`. */
export async function lookup(url: string, fetchFn: FetchFn, sleep: (ms: number) => Promise<void>, retryMs = 5000): Promise<Lookup> {
  let error: string | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetchFn('https://archive.org/wayback/available?url=' + encodeURIComponent(url), {
        headers: { 'User-Agent': USER_AGENT },
      });
      if (r.status === 429 || r.status >= 500) {
        error = 'HTTP ' + r.status;
        await sleep(retryMs);
        continue;
      }
      const j = (await r.json()) as { archived_snapshots?: { closest?: { available?: boolean; url?: string } } };
      const c = j.archived_snapshots?.closest;
      return { snapshot: c?.available && c.url ? c.url : null, error: null };
    } catch (e) {
      error = String(e);
      await sleep(retryMs);
    }
  }
  return { snapshot: null, error };
}

export interface SaveResult {
  status: string;
  snapshot?: string;
}

/** One anonymous Save Page Now request. Status is saved, refused-<code>, failed-<code>, unclear-<code> or error-<name>. */
export async function savePage(url: string, fetchFn: FetchFn, timeoutMs = 180_000): Promise<SaveResult> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetchFn('https://web.archive.org/save/' + url, {
      redirect: 'manual',
      signal: ctl.signal,
      headers: { 'User-Agent': USER_AGENT },
    });
    const loc = r.headers.get('location') ?? r.headers.get('content-location') ?? '';
    const snap = loc ? new URL(loc, 'https://web.archive.org').href : '';
    if (r.status === 429 || r.status >= 500) return { status: `refused-${r.status}` };
    if (/\/web\/\d{14}/.test(snap)) return { status: 'saved', snapshot: snap };
    if (r.ok) {
      const m = /\/web\/\d{14}\/[^"'\s<]+/.exec(await r.text());
      return m ? { status: 'saved', snapshot: 'https://web.archive.org' + m[0] } : { status: `unclear-${r.status}` };
    }
    return { status: `failed-${r.status}` };
  } catch (e) {
    return { status: `error-${(e as Error).name}` };
  } finally {
    clearTimeout(timer);
  }
}
