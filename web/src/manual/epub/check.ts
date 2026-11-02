// Checks an .epub file's structure the way a validator would, for the tests and for checking the
// site's books in a browser (no Java epubcheck needed): the stored `mimetype` first, the
// container pointing at the package, a manifest that lists every file with its media type (and
// nothing missing), the spine, the nav document, every XML file well-formed, and every
// picture, link and style reference resolving inside the file, with nothing on the network.
import { readZip } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { checkXml, type XmlElement } from './xmlCheck';

const TYPES: Record<string, string> = {
  xhtml: 'application/xhtml+xml',
  ncx: 'application/x-dtbncx+xml',
  css: 'text/css',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
};

const XML_FILE = /\.(xhtml|ncx|opf|svg|xml)$/;

/** `ref` (a relative URL, no fragment) seen from the file `from`, as a path in the zip. */
function resolve(from: string, ref: string): string {
  const parts = from.split('/').slice(0, -1);
  for (const seg of decodeURIComponent(ref).split('/')) {
    if (seg === '..') parts.pop();
    else if (seg && seg !== '.') parts.push(seg);
  }
  return parts.join('/');
}

/** Attributes that refer to another file (or a place in one). */
const REF_ATTRS = ['src', 'href', 'xlink:href', 'poster', 'data'];

export interface EpubReport {
  problems: string[];
  /** Every file, in zip order, with its size unpacked. */
  files: { name: string; size: number }[];
  /** The spine's documents in reading order. */
  spine: string[];
}

export async function checkEpub(bytes: Uint8Array): Promise<EpubReport> {
  const problems: string[] = [];
  const say = (s: string) => problems.length < 200 && problems.push(s);
  // the first local header: its name must be `mimetype`, stored (method 0), with no extra field
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const nameLen = view.getUint16(26, true);
  const firstName = new TextDecoder().decode(bytes.subarray(30, 30 + nameLen));
  if (view.getUint32(0, true) !== 0x04034b50) say('not a zip file');
  if (firstName !== 'mimetype') say(`the first file is ${firstName}, not mimetype`);
  if (view.getUint16(8, true) !== 0) say('mimetype is compressed');
  if (view.getUint16(28, true) !== 0) say('mimetype has an extra field');
  const entries = await readZip(bytes);
  const files = new Map(entries.map((e) => [e.name, e.data]));
  const text = (name: string) => new TextDecoder().decode(files.get(name));
  if (text('mimetype') !== 'application/epub+zip') say('mimetype does not say application/epub+zip');

  // every XML file, parsed once
  const parsed = new Map<string, XmlElement[]>();
  for (const name of files.keys())
    if (XML_FILE.test(name)) {
      const r = checkXml(text(name));
      for (const e of r.errors) say(`${name}: ${e}`);
      parsed.set(name, r.elements);
    }
  const container = parsed.get('META-INF/container.xml');
  const rootfile = container?.find((e) => e.name === 'rootfile');
  const opfPath = rootfile?.attrs['full-path'] ?? '';
  if (!rootfile) say('no META-INF/container.xml rootfile');
  if (rootfile?.attrs['media-type'] !== 'application/oebps-package+xml') say('the rootfile is not a package document');
  const opf = parsed.get(opfPath);
  if (!opf) return { problems: [...problems, `no package document at ${opfPath}`], files: [], spine: [] };

  const pkg = opf.find((e) => e.name === 'package');
  if (pkg?.attrs.version !== '3.0') say('the package is not EPUB 3.0');
  const uidId = pkg?.attrs['unique-identifier'];
  if (!opf.some((e) => e.name === 'dc:identifier' && e.attrs.id === uidId)) say('no dc:identifier for unique-identifier');
  for (const need of ['dc:title', 'dc:language']) if (!opf.some((e) => e.name === need)) say(`no ${need}`);
  if (!/<meta property="dcterms:modified">\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ<\/meta>/.test(text(opfPath))) say('no dcterms:modified');

  // the manifest: each item's file is there with the right media type, and every file is listed
  const items = opf.filter((e) => e.name === 'item');
  const byId = new Map<string, XmlElement>();
  const listed = new Set<string>();
  for (const it of items) {
    const { id, href, 'media-type': type } = it.attrs;
    if (byId.has(id)) say(`manifest id ${id} twice`);
    byId.set(id, it);
    const path = resolve(opfPath, href);
    listed.add(path);
    if (!files.has(path)) say(`manifest lists ${path}, which is missing`);
    const ext = path.split('.').pop()!.toLowerCase();
    if (TYPES[ext] !== type) say(`${path} is listed as ${type}`);
  }
  for (const name of files.keys())
    if (name !== 'mimetype' && name !== opfPath && !name.startsWith('META-INF/') && !listed.has(name)) say(`${name} is not in the manifest`);
  const navs = items.filter((i) => (i.attrs.properties ?? '').split(/\s+/).includes('nav'));
  if (navs.length !== 1) say(`${navs.length} nav documents`);
  const nav = navs[0] && parsed.get(resolve(opfPath, navs[0].attrs.href));
  if (nav && !nav.some((e) => e.name === 'nav' && e.attrs['epub:type'] === 'toc')) say('the nav document has no toc nav');

  // the spine, in reading order
  const spineEl = opf.find((e) => e.name === 'spine');
  if (spineEl?.attrs.toc && byId.get(spineEl.attrs.toc)?.attrs['media-type'] !== TYPES.ncx) say('the spine toc is not the NCX');
  const spine: string[] = [];
  for (const ref of opf.filter((e) => e.name === 'itemref')) {
    const it = byId.get(ref.attrs.idref);
    if (!it) say(`spine names ${ref.attrs.idref}, not in the manifest`);
    else if (it.attrs['media-type'] !== TYPES.xhtml) say(`spine item ${ref.attrs.idref} is not XHTML`);
    else spine.push(resolve(opfPath, it.attrs.href));
  }
  if (!spine.length) say('an empty spine');

  // references: each one inside the zip, a fragment naming an id in its file, nothing remote
  const ids = new Map<string, Set<string>>();
  for (const [name, els] of parsed) ids.set(name, new Set(els.flatMap((e) => (e.attrs.id ? [e.attrs.id] : []))));
  const follow = (from: string, ref: string) => {
    if (/^[a-z][\w+.-]*:/i.test(ref) || ref.startsWith('//')) return say(`${from} refers outside the book: ${ref.slice(0, 60)}`);
    const [path, frag] = ref.split('#');
    const target = path ? resolve(from, path) : from;
    if (!files.has(target)) return say(`${from} refers to ${target}, which is missing`);
    if (frag && ids.has(target) && !ids.get(target)!.has(frag)) say(`${from} links to #${frag}, not in ${target}`);
  };
  for (const [name, els] of parsed) {
    if (name === opfPath || name.startsWith('META-INF/')) continue;
    for (const e of els) {
      if (name.endsWith('.xhtml') && e.name === 'html' && e.attrs.xmlns !== 'http://www.w3.org/1999/xhtml') say(`${name} is not XHTML`);
      for (const a of REF_ATTRS) if (e.attrs[a] !== undefined) follow(name, e.attrs[a]);
      if (e.attrs.style) for (const m of e.attrs.style.matchAll(/url\(\s*['"]?([^'")]+)/g)) follow(name, m[1]);
    }
  }
  for (const name of files.keys()) if (name.endsWith('.css')) for (const m of text(name).matchAll(/url\(\s*['"]?([^'")]+)/g)) follow(name, m[1]);
  return { problems, files: entries.map((e) => ({ name: e.name, size: e.data.length })), spine };
}
