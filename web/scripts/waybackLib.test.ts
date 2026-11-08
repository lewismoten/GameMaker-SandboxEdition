// Tests for the Wayback helpers' pure parts, with a fake fetch (no network).
import { describe, expect, it, vi } from 'vitest';
import { extractUrls, lookup, savePage, uncheckedUrls, USER_AGENT } from './waybackLib';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const nap = async () => {};

describe('wayback helpers', () => {
  it('uses a generic user agent with no email', () => {
    expect(USER_AGENT).not.toMatch(/@|mailto/);
  });

  it('extracts unique URLs and skips hosts', () => {
    const text = 'See https://a.example.org/x, and https://a.example.org/x. Also http://skip.test/y and localhost';
    expect(extractUrls(text, /skip\.test/)).toEqual(['https://a.example.org/x']);
  });

  it('reads unticked checklist items only', () => {
    const md = '- [ ] <https://one.test/a>\n- [x] <https://two.test/b>\n- [ ] <https://three.test/c> note';
    expect(uncheckedUrls(md)).toEqual(['https://one.test/a', 'https://three.test/c']);
  });

  it('looks up a snapshot, and sends the user agent', async () => {
    const f = vi.fn(async () => json({ archived_snapshots: { closest: { available: true, url: 'https://web.archive.org/web/2020/x' } } }));
    expect(await lookup('https://x.test', f, nap)).toEqual({ snapshot: 'https://web.archive.org/web/2020/x', error: null });
    const init = (f.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect((init.headers as Record<string, string>)['User-Agent']).toBe(USER_AGENT);
  });

  it('reports no snapshot, and gives up after three refusals', async () => {
    expect((await lookup('u', async () => json({ archived_snapshots: {} }), nap)).snapshot).toBeNull();
    const f = vi.fn(async () => json({}, 429));
    expect((await lookup('u', f, nap)).error).toBe('HTTP 429');
    expect(f).toHaveBeenCalledTimes(3);
  });

  it('saves a page from the redirect location or reports a refusal', async () => {
    const ok = async () => new Response(null, { status: 302, headers: { location: '/web/20240101000000/https://x.test' } });
    expect(await savePage('https://x.test', ok)).toEqual({ status: 'saved', snapshot: 'https://web.archive.org/web/20240101000000/https://x.test' });
    expect((await savePage('u', async () => new Response('', { status: 429 }))).status).toBe('refused-429');
  });
});
