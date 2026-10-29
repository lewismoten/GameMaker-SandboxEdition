// A printed piece drawn as a picture, for a page of an ePub that is only a picture (a cover, a
// full-page ad): a copy of it, laid out at its printed width with the site's own styles, is put
// in an SVG's foreignObject and drawn onto a canvas. Its canvases and pictures go in as data
// URLs (an SVG drawn as an image loads nothing). A browser that won't let such a canvas be
// read (it calls it tainted) gives undefined, and the caller sets the page as text instead.

let siteCss: string | undefined;

/** Every style rule the page has loaded, as text (sheets from elsewhere can't be read, and are skipped). */
function pageCss(): string {
  if (siteCss !== undefined) return siteCss;
  const out: string[] = [];
  for (const sheet of document.styleSheets)
    try {
      for (const rule of sheet.cssRules) if (!(rule instanceof CSSFontFaceRule)) out.push(rule.cssText);
    } catch {
      // another origin's sheet
    }
  // kept only while drawing a book: the next book may have loaded more styles
  siteCss = out.join('\n');
  setTimeout(() => (siteCss = undefined), 2000);
  return siteCss;
}

async function asDataUrl(src: string): Promise<string | undefined> {
  if (src.startsWith('data:')) return src;
  const res = await fetch(src).catch(() => undefined);
  if (!res?.ok) return undefined;
  const blob = await res.blob();
  return new Promise((r) => {
    const fr = new FileReader();
    fr.onload = () => r(typeof fr.result === 'string' ? fr.result : undefined);
    fr.onerror = () => r(undefined);
    fr.readAsDataURL(blob);
  });
}

export interface Raster {
  type: string;
  data: Uint8Array;
  w: number;
  h: number;
}

export interface RasterOptions {
  /** Its printed width in CSS pixels. */
  width: number;
  /** Its height; measured when not given. */
  height?: number;
  /** Pixels drawn per CSS pixel (default 2). */
  scale?: number;
  /** 'image/jpeg' for a busy picture, which comes out much smaller (default PNG). */
  type?: 'image/png' | 'image/jpeg';
}

export async function rasterize(el: HTMLElement, o: RasterOptions): Promise<Raster | undefined> {
  const scale = o.scale ?? 2;
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = `position:fixed;left:-100000px;top:0;width:${o.width}px;${o.height ? `height:${o.height}px;` : ''}overflow:hidden;background:#fff`;
  const copy = el.cloneNode(true) as HTMLElement;
  const canvases = [...el.querySelectorAll('canvas')];
  [...copy.querySelectorAll('canvas')].forEach((c, i) => {
    const img = document.createElement('img');
    img.className = c.className;
    img.setAttribute('style', c.getAttribute('style') ?? '');
    try {
      img.src = canvases[i].toDataURL();
    } catch {
      return;
    }
    c.replaceWith(img);
  });
  host.append(copy);
  document.body.append(host);
  try {
    await Promise.all(
      [...copy.querySelectorAll('img')].map(async (img) => {
        const src = img.currentSrc || img.src;
        const url = src ? await asDataUrl(src) : undefined;
        img.removeAttribute('srcset');
        if (url) img.src = url;
        else img.removeAttribute('src');
        await img.decode().catch(() => undefined);
      }),
    );
    const w = o.width;
    const h = Math.ceil(o.height ?? host.scrollHeight);
    if (!h) return undefined;
    host.style.position = 'static';
    host.style.left = '0';
    const markup = new XMLSerializer().serializeToString(host);
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject x="0" y="0" width="${w}" height="${h}">` +
      `<div xmlns="http://www.w3.org/1999/xhtml"><style>${pageCss().replace(/<\/style/gi, '<\\/style')}</style>${markup}</div></foreignObject></svg>`;
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const g = canvas.getContext('2d')!;
    g.fillStyle = '#fff';
    g.fillRect(0, 0, canvas.width, canvas.height);
    g.drawImage(img, 0, 0, canvas.width, canvas.height);
    const type = o.type ?? 'image/png';
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, type, 0.86));
    return blob ? { type, data: new Uint8Array(await blob.arrayBuffer()), w: canvas.width, h: canvas.height } : undefined;
  } catch {
    return undefined; // a tainted canvas, or a picture that would not draw
  } finally {
    host.remove();
  }
}
