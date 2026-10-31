// The made-up sites of TURBO BUTTON's Log Off the Games article, read from mockSites.json (the
// registry of every fictional domain in the project). Change a domain, path or title in the JSON.
import registry from './mockSites.json';

export interface MockSite {
  id: string;
  domain: string;
  scheme: string;
  host: string;
  port?: number;
  path: string;
  query: string;
  title: string;
  description: string;
  org?: string;
  dept?: string;
  contact?: string;
  bannerText?: string;
}

export const MOCK_REGISTRY = registry;

export function mockSite(id: string): MockSite {
  const s = registry.sites.find((x) => x.id === id);
  if (!s) throw new Error(`mockSites.json has no site "${id}"`);
  return s;
}

/** The site's full address; `query: false` leaves off the ?query part (as the article's prose does). */
export function mockUrl(id: string, query = true): string {
  const s = mockSite(id);
  return `${s.scheme}://${s.host}${s.port ? `:${s.port}` : ''}${s.path}${query && s.query ? `?${s.query}` : ''}`;
}
