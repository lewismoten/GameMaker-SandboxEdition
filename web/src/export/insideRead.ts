// Reads back the files an exported page keeps as page content (insideGame.ts): a GIF's bytes from its
// <img> data: URL, a text screen from its <pre>. `readExternalHtml` works on the page's text (an
// importer, a test, no DOM); `readExternalDom` on the live page, for the player.
import { bytesFromText, type TextLayout } from './insideText';

const fromBase64 = (text: string): Uint8Array => {
  const s = atob(text);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
};

/** The bytes of a `data:...;base64,...` URL. */
function dataUrlBytes(url: string | null | undefined): Uint8Array | undefined {
  const m = /^data:[^,;]*;base64,(.*)$/s.exec(url ?? '');
  return m ? fromBase64(m[1]) : undefined;
}

function layoutOf(code: string | null | undefined, eol: string | null | undefined, eof: boolean): TextLayout | undefined {
  return code === 'cp437' && (eol === 'crlf' || eol === 'lf') ? { code, eol, eof } : undefined;
}

const unescapeText = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&(lt|gt|quot|apos|amp);/g, (_, n: string) => ({ lt: '<', gt: '>', quot: '"', apos: "'", amp: '&' })[n]!);

const attr = (tag: string, name: string): string | undefined => new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];

/** Element id -> file bytes, for every element the page keeps a game file in. */
export function readExternalHtml(html: string): Map<string, Uint8Array> {
  const out = new Map<string, Uint8Array>();
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const id = attr(m[0], 'id');
    const bytes = id?.startsWith('gm-f-') ? dataUrlBytes(attr(m[0], 'src')) : undefined;
    if (id && bytes) out.set(id, bytes);
  }
  for (const m of html.matchAll(/<pre\b([^>]*)>([\s\S]*?)<\/pre>/g)) {
    const id = attr(m[1], 'id');
    if (!id?.startsWith('gm-f-')) continue;
    const layout = layoutOf(attr(m[1], 'data-gm-code'), attr(m[1], 'data-gm-eol'), attr(m[1], 'data-gm-eof') === '1');
    // the browser drops one newline right after <pre>
    const bytes = layout && bytesFromText(unescapeText(m[2].replace(/^\n/, '')), layout);
    if (bytes) out.set(id, bytes);
  }
  return out;
}

/** The same from the live page. */
export function readExternalDom(doc: Document, ids: string[]): Map<string, Uint8Array> {
  const out = new Map<string, Uint8Array>();
  for (const id of ids) {
    const el = doc.getElementById(id);
    if (!el) continue;
    let bytes: Uint8Array | undefined;
    if (el instanceof HTMLImageElement) bytes = dataUrlBytes(el.getAttribute('src'));
    else {
      const layout = layoutOf(el.dataset.gmCode, el.dataset.gmEol, el.dataset.gmEof === '1');
      bytes = layout && bytesFromText(el.textContent ?? '', layout);
    }
    if (bytes) out.set(id, bytes);
  }
  return out;
}
