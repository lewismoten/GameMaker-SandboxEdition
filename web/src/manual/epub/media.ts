// The pictures a book takes along: each one once (the same bytes are one file), named
// images/<n>.<ext>. A canvas becomes a PNG; a picture in a format older readers may not show
// (WebP, AVIF) is drawn again as a JPEG; anything fetched comes from this site, never elsewhere.
import type { EpubFile } from './book';
import { fnv1a } from '../../seededRandom';

const EXT: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/svg+xml': 'svg' };

function dataUrlBytes(url: string): { type: string; data: Uint8Array } | undefined {
  const m = /^data:([^;,]+)?((?:;[^;,]*)*?)(;base64)?,(.*)$/s.exec(url);
  if (!m) return undefined;
  const type = (m[1] || 'text/plain').toLowerCase();
  if (m[3]) {
    const bin = atob(m[4]);
    const data = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) data[i] = bin.charCodeAt(i);
    return { type, data };
  }
  return { type, data: new TextEncoder().encode(decodeURIComponent(m[4])) };
}

async function canvasBytes(c: HTMLCanvasElement, type = 'image/png', quality?: number): Promise<Uint8Array | undefined> {
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, type, quality));
  return blob ? new Uint8Array(await blob.arrayBuffer()) : undefined;
}

/** Draws a picture in another format again as a JPEG (a photo) on white. */
async function asJpeg(type: string, data: Uint8Array): Promise<Uint8Array | undefined> {
  const url = URL.createObjectURL(new Blob([data as BlobPart], { type }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const g = c.getContext('2d')!;
    g.fillStyle = '#fff';
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(img, 0, 0);
    return await canvasBytes(c, 'image/jpeg', 0.88);
  } catch {
    return undefined;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export class EpubMedia {
  readonly files: EpubFile[] = [];
  private byHash = new Map<string, string>();

  /** Adds bytes of a known type; gives the path to refer to them by. */
  add(type: string, data: Uint8Array): string {
    const ext = EXT[type];
    if (!ext) throw new Error(`An ePub can't hold ${type}`);
    // a cheap fingerprint (fnv1a of a sample) plus the length tells copies apart
    const sample = data.length > 4096 ? [...data.subarray(0, 2048), ...data.subarray(data.length - 2048)] : [...data];
    const key = `${type}:${data.length}:${fnv1a(String.fromCharCode(...sample))}`;
    const had = this.byHash.get(key);
    if (had) return had;
    const path = `images/${this.files.length + 1}.${ext}`;
    this.files.push({ path, type, data });
    this.byHash.set(key, path);
    return path;
  }

  /** A canvas, as a PNG. */
  async canvas(c: HTMLCanvasElement): Promise<string | undefined> {
    if (!c.width || !c.height) return undefined;
    const data = await canvasBytes(c).catch(() => undefined);
    return data && this.add('image/png', data);
  }

  /** An <img>'s picture (a data URL or one of this site's own files); undefined if it can't be had. */
  async image(src: string): Promise<string | undefined> {
    let got: { type: string; data: Uint8Array } | undefined;
    if (src.startsWith('data:')) got = dataUrlBytes(src);
    else {
      const url = new URL(src, document.baseURI);
      if (url.origin !== location.origin && url.protocol !== 'blob:') return undefined;
      const res = await fetch(url).catch(() => undefined);
      if (!res?.ok) return undefined;
      got = { type: (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase(), data: new Uint8Array(await res.arrayBuffer()) };
    }
    if (!got) return undefined;
    if (EXT[got.type]) return this.add(got.type, got.data);
    const jpeg = await asJpeg(got.type, got.data);
    return jpeg && this.add('image/jpeg', jpeg);
  }

  /** An inline <svg>, as a picture file of its own. */
  svg(el: SVGSVGElement): string {
    const copy = el.cloneNode(true) as SVGSVGElement;
    copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const box = copy.viewBox?.baseVal;
    if (box && box.width && !copy.getAttribute('width')) {
      copy.setAttribute('width', String(box.width));
      copy.setAttribute('height', String(box.height));
    }
    for (const a of ['class', 'role', 'aria-label', 'style']) copy.removeAttribute(a);
    return this.add('image/svg+xml', new TextEncoder().encode(new XMLSerializer().serializeToString(copy)));
  }
}
