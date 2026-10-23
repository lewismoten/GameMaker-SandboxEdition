// index.html at run time: keeps the page's title, description and Open Graph / Twitter
// tags in step with what is on screen (the 1994 desk, today's home page, the Guide, a game
// in the editor). It watches the page rather than being called by the app: main.ts sets
// document.title and switches #app between the desk and the modern UI.
import { ROUTES, type RouteName } from './site';

const GENERIC_TITLES = new Set(['Game-Maker 1994', 'Game-Maker: Sandbox Edition', '']);

export function routeOf(hash: string, modern: boolean): RouteName {
  if (!modern) return 'desk';
  if (hash.startsWith('#/help')) return 'guide';
  if (hash.startsWith('#/cast')) return 'cast';
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

export function syncRouteMeta(): void {
  const app = document.getElementById('app');
  const route = routeOf(location.hash, !!app?.classList.contains('modern'));
  const info = ROUTES[route];
  // Swap the app's short titles for the descriptive ones; keep specific ones (a game's name).
  if (route !== 'editor' && GENERIC_TITLES.has(document.title)) document.title = info.title;
  const title = document.title;
  for (const [sel, make] of [
    ['meta[name="description"]', named('description')],
    ['meta[property="og:description"]', property('og:description')],
    ['meta[name="twitter:description"]', named('twitter:description')],
  ] as const)
    setMeta(sel, make, 'content', info.description);
  setMeta('meta[property="og:title"]', property('og:title'), 'content', title);
  setMeta('meta[name="twitter:title"]', named('twitter:title'), 'content', title);
  // Fragments are not separate pages to a search engine: one canonical address. A game
  // being edited lives only in this browser, so it is not for indexing.
  setMeta('meta[name="robots"]', named('robots'), 'content', route === 'editor' ? 'noindex' : 'index, follow');
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

export function watchRouteMeta(): void {
  window.addEventListener('hashchange', schedule);
  const observer = new MutationObserver(schedule);
  const title = document.head.querySelector('title');
  if (title) observer.observe(title, { childList: true, characterData: true, subtree: true });
  const app = document.getElementById('app');
  if (app) observer.observe(app, { attributes: true, attributeFilter: ['class'] });
  schedule();
}

if (typeof document !== 'undefined') watchRouteMeta();
