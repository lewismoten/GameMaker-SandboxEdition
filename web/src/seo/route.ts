// index.html at run time: keeps the page's title, description and Open Graph / Twitter
// tags in step with what is on screen (the 1994 desk, today's home page, the Guide, a game
// in the editor). It watches the page rather than being called by the app: main.ts sets
// document.title and switches #app between the desk and the modern UI.
import { clip } from './site';
import { PAGE_ROUTES as ROUTES, type PageRoute as RouteName } from './pageRoutes';

const GENERIC_TITLES = new Set(['Game-Maker 1994', 'Game-Maker: Sandbox Edition', '']);

function routeOf(hash: string, modern: boolean): RouteName {
  if (!modern) return 'desk';
  if (hash.startsWith('#/help')) return 'guide';
  if (hash.startsWith('#/cast')) return 'cast';
  if (hash.startsWith('#/credits')) return 'credits';
  if (hash.startsWith('#/magazine')) return 'magazine';
  if (hash.startsWith('#/achievements')) return 'achievements';
  if (hash.startsWith('#/mac')) return 'mac';
  if (hash.startsWith('#/windows')) return 'windows';
  if (hash.startsWith('#/linux')) return 'linux';
  if (hash.startsWith('#/p/')) return 'editor';
  return 'home';
}

function setMeta(selector: string, make: () => HTMLElement, attr: string, value: string): void {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) document.head.append((el = make()));
  if (el.getAttribute(attr) !== value) el.setAttribute(attr, value);
}

const named = (name: string) => () => Object.assign(document.createElement('meta'), { name });
const property = (p: string) => () => {
  const m = document.createElement('meta');
  m.setAttribute('property', p);
  return m;
};

function syncRouteMeta(): void {
  const app = document.getElementById('app');
  const route = routeOf(location.hash, !!app?.classList.contains('modern'));
  const info = ROUTES[route];
  // Swap the app's short titles for the descriptive ones; keep specific ones (a game's name).
  if (route !== 'editor' && GENERIC_TITLES.has(document.title)) document.title = info.title;
  const title = document.title;
  const description = pageDescription(route) ?? info.description;
  for (const [sel, make] of [
    ['meta[name="description"]', named('description')],
    ['meta[property="og:description"]', property('og:description')],
    ['meta[name="twitter:description"]', named('twitter:description')],
  ] as const)
    setMeta(sel, make, 'content', description);
  setMeta('meta[property="og:title"]', property('og:title'), 'content', title);
  setMeta('meta[name="twitter:title"]', named('twitter:title'), 'content', title);
  // Fragments are not separate pages to a search engine: one canonical address. A game
  // being edited lives only in this browser, so it is not for indexing.
  setMeta('meta[name="robots"]', named('robots'), 'content', route === 'editor' ? 'noindex' : 'index, follow');
}

/**
 * A guide section's own summary: its first paragraph (each section is one view at
 * #/help/<id>, so each gets a description of what it says rather than the guide's).
 */
function pageDescription(route: RouteName): string | undefined {
  // the guide's front page keeps the guide's own description
  if (route !== 'guide' || !/^#\/help\/[^/?]/.test(location.hash)) return undefined;
  const p = document.querySelector('.guide article > h1 ~ p:not(.guide-kicker, .lead)');
  const text = p?.textContent?.trim();
  return text && text.length > 40 ? clip(text, 160) : undefined;
}

let pending = false;
function schedule(): void {
  if (pending) return;
  pending = true;
  queueMicrotask(() => {
    pending = false;
    syncRouteMeta();
  });
}

function watchRouteMeta(): void {
  window.addEventListener('hashchange', schedule);
  const observer = new MutationObserver(schedule);
  const title = document.head.querySelector('title');
  if (title) observer.observe(title, { childList: true, characterData: true, subtree: true });
  const app = document.getElementById('app');
  if (app) observer.observe(app, { attributes: true, attributeFilter: ['class'] });
  schedule();
}

if (typeof document !== 'undefined') watchRouteMeta();
