// Run the generated site worker against in-memory Cache Storage.
import { runInNewContext } from 'node:vm';
import { vi } from 'vitest';
import { siteWorkerSource } from '../src/siteWorker';
export const base = 'https://example.test/project/';
export function harness(version: string, options: Partial<Parameters<typeof siteWorkerSource>[0]> = {}) {
  const stores = new Map<string, Map<string, Response>>();
  const key = (u: string | Request) => new URL(typeof u === 'string' ? u : u.url, base).href.split('?')[0];
  const caches = {
    has: async (n: string) => stores.has(n),
    keys: async () => [...stores.keys()],
    delete: async (n: string) => stores.delete(n),
    open: async (n: string) => {
      if (!stores.has(n)) stores.set(n, new Map());
      const store = stores.get(n)!;
      return {
        match: async (u: string | Request) => store.get(key(u))?.clone(),
        put: async (u: string | Request, r: Response) => {
          store.set(key(u), r.clone());
        },
        keys: async () => [...store.keys()].map((u) => new Request(u)),
        delete: async (u: string | Request) => store.delete(key(u)),
      };
    },
  };
  const handlers = new Map<string, (event: unknown) => void>();
  const fetcher = vi.fn(async (_request: Request): Promise<Response> => {
    throw new Error('offline');
  });
  runInNewContext(siteWorkerSource({ version, precache: ['./', 'assets/main.js'], groups: {}, assets: ['assets/main.js'], ...options }), {
    self: {
      location: { href: base + 'sw.js' },
      registration: { active: true, scope: base },
      addEventListener: (type: string, h: (event: unknown) => void) => handlers.set(type, h),
      clients: { claim: async () => {} },
    },
    caches,
    fetch: fetcher,
    URL,
    Request,
    Response,
    Set,
  });
  const lifecycle = (type: string) => new Promise<void>((resolve, reject) => handlers.get(type)!({ waitUntil: (p: Promise<void>) => p.then(resolve, reject) }));
  const request = (path: string, mode = 'cors', cache = 'default') =>
    new Promise<Response>((resolve, reject) =>
      handlers.get('fetch')!({
        request: { url: base + path, method: 'GET', mode, cache, headers: new Headers() },
        respondWith: (p: Promise<Response>) => p.then(resolve, reject),
      }),
    );
  return { caches, handlers, fetcher, lifecycle, request };
}
