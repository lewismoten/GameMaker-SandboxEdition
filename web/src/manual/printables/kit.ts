// Shared bits for the paper in the box: sheets of a given size, map pictures, and the
// note that says the addresses are made up.
import { h } from '../../editor/ui';
import { mapShot } from '../../desk/boxArt';
import type { CatalogEntry } from '../../project/files';
import type { MapPanel, PrintablesFile } from './types';

/** Printed on everything with an address on it. */
export const FICTIONAL_NOTE =
  'Fictional address. This is a 1990s-style shareware manual recreated today. Nothing to mail: registration is free and everything is in the box.';

export const BBS_PHONE = '1-412-555-SAND';

export interface PrintContext {
  entry: CatalogEntry;
  /** Every Sandbox Software game in the catalog. */
  family: CatalogEntry[];
  printables: PrintablesFile;
  /** The manual's pages (head + html), for key descriptions and the hint offer. */
  manual: { title: string; pages: { head: string; html: string }[] };
  /** A map window as a PNG data URL (cached). */
  shot(panel: Pick<MapPanel, 'map' | 'x' | 'y' | 'w' | 'h'>): Promise<string | undefined>;
}

export function shotCache(entry: CatalogEntry): PrintContext['shot'] {
  const cache = new Map<string, Promise<string | undefined>>();
  return (p) => {
    const key = `${p.map}:${p.x}:${p.y}:${p.w}:${p.h}`;
    let hit = cache.get(key);
    if (!hit) {
      hit = mapShot(entry, p.map, p.x, p.y, p.w, p.h)
        .then((c) => c?.toDataURL())
        .catch(() => undefined);
      cache.set(key, hit);
    }
    return hit;
  };
}

/** One printed piece: w x h inches. Inside it, size things in cqw (1cqw = 1% of its width). */
export interface Sheet {
  el: HTMLElement;
  w: number;
  h: number;
}

export function sheet(w: number, h_: number, cls: string, ...children: (Node | string | null | undefined | false)[]): Sheet {
  const el = h('div', { class: `pp-sheet ${cls}`, style: `aspect-ratio: ${w} / ${h_}` }, ...children);
  el.dataset.w = String(w);
  el.dataset.h = String(h_);
  return { el, w, h: h_ };
}

/** A small deterministic random generator, so every print of a sheet looks the same. */
export function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619);
  return x >>> 0;
}

/** Simple HTML from our own JSON files. */
export function html(tag: keyof HTMLElementTagNameMap, cls: string, markup: string): HTMLElement {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  el.innerHTML = markup;
  return el;
}

/** A picture of a map window, screened like a magazine photo. */
export async function mapPicture(ctx: PrintContext, p: MapPanel, cls = ''): Promise<HTMLElement> {
  const src = await ctx.shot(p);
  const fig = h('figure', { class: `pp-photo ${cls}` });
  if (src) fig.append(h('span', { class: 'pp-shot' }, h('img', { src, alt: p.caption ?? 'Picture', width: p.w * 20, height: p.h * 20 })));
  else fig.append(h('div', { class: 'pp-photo-missing', style: `aspect-ratio: ${p.w} / ${p.h}` }));
  if (p.caption) fig.append(h('figcaption', null, p.caption));
  return fig;
}

/** The publisher's little logo: a sand pail and the name. */
export function sandboxLogo(cls = ''): HTMLElement {
  return h('div', { class: `pp-logo ${cls}` }, h('span', { class: 'pp-logo-mark', 'aria-hidden': 'true' }), h('span', null, 'SANDBOX', h('br'), 'SOFTWARE'));
}

/** THE -= S A N D B O X =- with each letter in its own color. */
export function sandboxBanner(): HTMLElement {
  const colors = ['#ff5555', '#ffff55', '#55ff55', '#55ffff', '#5555ff', '#ff55ff', '#ffaa00'];
  return h('span', { class: 'pp-sandbox-banner' }, 'THE -= ', ...'SANDBOX'.split('').map((c, i) => h('b', { style: `color:${colors[i]}` }, c)), ' =- BBS');
}

export function fictionalNote(): HTMLElement {
  return h('p', { class: 'pp-fictional' }, `(${FICTIONAL_NOTE})`);
}

/** Main title and subtitle of "Main: Subtitle". */
export function splitTitle(title: string): [string, string] {
  const i = title.indexOf(':');
  return i < 0 ? [title, ''] : [title.slice(0, i), title.slice(i + 1).trim()];
}
