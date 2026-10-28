// A reader's pages (HTML elements, as the screen shows them) written out as an ePub chapter's
// XHTML: well-formed, with its pictures taken along (media.ts), canvases and inline SVG made
// picture files, a piece that is only a picture drawn as one (raster.ts), links kept only where
// the book can follow them, and what an ePub can't use (scripts, buttons, form fields, styles
// that need the site's layout, anything hidden or only decorative) left out or made plain.
import type { EpubMedia } from './media';
import { rasterize, type RasterOptions } from './raster';
import { xmlAttr, xmlText } from './xml';

/** A kind of element drawn as a picture: those matching `selector`, laid out as `raster` says. */
export interface PictureRule extends RasterOptions {
  selector: string;
  /** Its words for a screen reader (default: its aria-label, else its text). */
  alt?: (el: Element) => string;
}

export interface XhtmlOptions {
  media: EpubMedia;
  /** A link's target in the book ('c3.xhtml#x'), or undefined to keep only its words. */
  link?: (href: string, a: HTMLAnchorElement) => string | undefined;
  pictures?: PictureRule[];
  /** Keep elements marked aria-hidden (by default they are decoration, and left out). */
  keepAriaHidden?: boolean;
}

const KEEP = new Set(
  'a abbr address article aside b bdi bdo blockquote br caption cite code col colgroup dd del dfn div dl dt em figcaption figure footer h1 h2 h3 h4 h5 h6 header hr i img ins kbd li mark nav ol p pre q s samp section small span strong sub sup table tbody td tfoot th thead time tr u ul var wbr'.split(
    ' ',
  ),
);
const RENAME: Record<string, string> = {
  main: 'div',
  details: 'div',
  summary: 'p',
  button: 'span',
  label: 'span',
  font: 'span',
  center: 'div',
  big: 'span',
  tt: 'code',
  legend: 'p',
  fieldset: 'div',
  form: 'div',
  output: 'span',
  picture: 'span',
};
const DROP = new Set('script style template noscript iframe video audio object embed link meta head title source track map area dialog'.split(' '));
const BLANK = new Set(['input', 'select', 'textarea']);
const VOID = new Set(['br', 'hr', 'img', 'col', 'wbr']);
const ATTRS = new Set(
  'id class title lang dir role colspan rowspan start reversed type scope headers abbr datetime aria-label aria-labelledby aria-describedby aria-level span'.split(
    ' ',
  ),
);
const XML_NAME = /^[A-Za-z_][\w.-]*$/;
/** Style values that only work in the site's own layout. */
const SITE_ONLY = /url\(|var\(|cq[whib]|\bv(?:w|h|min|max)\b|env\(/i;
const SITE_PROPS =
  /^(?:position|top|left|right|bottom|inset|z-index|transform|translate|rotate|scale|filter|backdrop-filter|mix-blend-mode|cursor|pointer-events|user-select|container|container-type|container-name|contain|overflow|clip-path|mask)/;

function cleanStyle(style: string): string {
  return style
    .split(';')
    .map((d) => d.trim())
    .filter((d) => {
      const at = d.indexOf(':');
      if (at < 1) return false;
      const prop = d.slice(0, at).trim().toLowerCase();
      const value = d.slice(at + 1);
      if (SITE_ONLY.test(value) || SITE_PROPS.test(prop) || prop.startsWith('--')) return false;
      // a fixed size in a page measured in inches or pixels would not reflow
      if (/^(?:min-|max-)?(?:width|height)$/.test(prop) && /\d(?:px|in|cm|mm|pt)/.test(value)) return false;
      return true;
    })
    .join('; ');
}

interface Picture {
  path: string;
  alt: string;
  pixel?: boolean;
}

const isHidden = (el: Element, o: XhtmlOptions) => el.hasAttribute('hidden') || (!o.keepAriaHidden && el.getAttribute('aria-hidden') === 'true');

const words = (el: Element) => (el.getAttribute('aria-label') ?? el.textContent ?? '').replace(/\s+/g, ' ').trim();

/** Gathers every picture first (the slow part), so writing the markup after is plain. */
async function gather(nodes: Node[], o: XhtmlOptions): Promise<Map<Element, Picture | null>> {
  const found = new Map<Element, Picture | null>();
  const visit = async (el: Element): Promise<void> => {
    if (isHidden(el, o) || DROP.has(el.localName)) return;
    const rule = o.pictures?.find((r) => el.matches(r.selector));
    if (rule) {
      // drawn whole; if it can't be, its contents are written out instead
      const r = await rasterize(el as HTMLElement, rule);
      if (r) return void found.set(el, { path: o.media.add(r.type, r.data), alt: rule.alt?.(el) ?? words(el) });
    }
    if (el instanceof HTMLImageElement) {
      const src = el.currentSrc || el.getAttribute('src') || '';
      const path = src ? await o.media.image(src) : undefined;
      return void found.set(el, path ? { path, alt: el.alt, pixel: src.startsWith('data:image/png') } : null);
    }
    if (el instanceof HTMLCanvasElement) {
      const path = await o.media.canvas(el);
      return void found.set(el, path ? { path, alt: words(el), pixel: true } : null);
    }
    if (el instanceof SVGSVGElement) return void found.set(el, { path: o.media.svg(el), alt: words(el) });
    await Promise.all([...el.children].map(visit));
  };
  await Promise.all(nodes.filter((n): n is Element => n instanceof Element).map(visit));
  return found;
}

export async function toXhtml(nodes: Node[], o: XhtmlOptions): Promise<string> {
  const pics = await gather(nodes, o);
  const ids = new Set<string>();
  const out: string[] = [];
  const img = (p: Picture, cls?: string) => {
    const c = [cls, p.pixel ? 'pixel' : ''].filter(Boolean).join(' ');
    out.push(`<img src="${xmlAttr(p.path)}" alt="${xmlAttr(p.alt)}"${c ? ` class="${xmlAttr(c)}"` : ''}/>`);
  };
  const write = (n: Node) => {
    if (n.nodeType === Node.TEXT_NODE) return void out.push(xmlText(n.textContent ?? ''));
    if (!(n instanceof Element) || isHidden(n, o)) return;
    const tag = n.localName.toLowerCase();
    if (DROP.has(tag)) return;
    const pic = pics.get(n);
    if (pic) return img(pic, n.getAttribute('class') ?? undefined);
    if (pic === null && (tag === 'img' || tag === 'canvas' || tag === 'svg')) return;
    if (BLANK.has(tag)) {
      const value = (n as HTMLInputElement).value;
      return void out.push(
        value && (n as HTMLInputElement).type !== 'checkbox' ? `<span class="blank">${xmlText(value)}</span>` : '<span class="blank"> </span>',
      );
    }
    let name = KEEP.has(tag) ? tag : (RENAME[tag] ?? 'span');
    let href: string | undefined;
    if (tag === 'a') {
      const raw = n.getAttribute('href');
      href = raw ? o.link?.(raw, n as HTMLAnchorElement) : undefined;
      if (!href) name = 'span';
    }
    let attrs = '';
    for (const a of n.attributes) {
      const key = a.name.toLowerCase();
      if (!ATTRS.has(key)) continue;
      let value = a.value;
      if (key === 'id') {
        if (!XML_NAME.test(value) || ids.has(value)) continue;
        ids.add(value);
      }
      if (key === 'type' && name !== 'ol') continue;
      if (key === 'class') value = value.replace(/\s+/g, ' ').trim();
      if (!value && key !== 'alt') continue;
      attrs += ` ${key}="${xmlAttr(value)}"`;
    }
    const style = n.getAttribute('style');
    const kept = style ? cleanStyle(style) : '';
    if (kept) attrs += ` style="${xmlAttr(kept)}"`;
    if (href) attrs += ` href="${xmlAttr(href)}"`;
    if (VOID.has(name)) return void out.push(`<${name}${attrs}/>`);
    out.push(`<${name}${attrs}>`);
    for (const c of n.childNodes) write(c);
    out.push(`</${name}>`);
  };
  for (const n of nodes) write(n);
  return out.join('');
}
