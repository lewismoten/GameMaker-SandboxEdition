// Packs a book (book.ts) as an EPUB 3 file: the `mimetype` first and stored uncompressed,
// META-INF/container.xml pointing at the package document, the package (metadata, manifest and
// spine), the nav document, an EPUB 2 table of contents (toc.ncx) for older readers, the styles,
// a cover page and the chapters, with every picture inside. Nothing refers outside the file.
// Written from the EPUB 3.3 specification (W3C); the zip is project/zip.ts.
import { createZip, type ZipEntry } from '../../project/zip';
import type { EpubBook, EpubChapter } from './book';
import { EPUB_CSS } from './style';
import { xmlAttr, xmlText } from './xml';

const OPF_DIR = 'OEBPS';
const LANG = 'en-US';

/** A name-based UUID (version 5 layout) from the book's key, so the same book keeps its identifier. */
async function bookUuid(key: string): Promise<string> {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(`gamemaker-se-epub:${key}`)));
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = [...hash.slice(0, 16)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** An XHTML content document around `body`. */
export function xhtmlPage(title: string, body: string, bodyClass?: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${LANG}" lang="${LANG}">
<head>
<meta charset="UTF-8"/>
<title>${xmlText(title)}</title>
<link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body${bodyClass ? ` class="${xmlAttr(bodyClass)}"` : ''}>
${body}
</body>
</html>
`;
}

const file = (c: EpubChapter) => `${c.id}.xhtml`;

function navDoc(book: EpubBook, hasCover: boolean): string {
  const listed = book.chapters.filter((c) => !c.unlisted);
  const items = listed
    .map((c) => {
      const parts = c.parts?.length
        ? `\n<ol>${c.parts.map((p) => `<li><a href="${file(c)}#${xmlAttr(p.id)}">${xmlText(p.title)}</a></li>`).join('')}</ol>\n`
        : '';
      return `<li><a href="${file(c)}">${xmlText(c.title)}</a>${parts}</li>`;
    })
    .join('\n');
  const first = listed[0] ?? book.chapters[0];
  const landmarks = [
    hasCover ? `<li><a epub:type="cover" href="cover.xhtml">Cover</a></li>` : '',
    first ? `<li><a epub:type="bodymatter" href="${file(first)}">${xmlText(first.title)}</a></li>` : '',
  ].join('');
  return xhtmlPage(
    book.title,
    `<nav epub:type="toc" id="toc" role="doc-toc">
<h1>Contents</h1>
<ol>
${items}
</ol>
</nav>
<nav epub:type="landmarks" id="landmarks" hidden="hidden">
<h2>Landmarks</h2>
<ol>${landmarks}</ol>
</nav>`,
  );
}

function ncxDoc(book: EpubBook, uuid: string): string {
  let order = 0;
  const point = (id: string, label: string, src: string, inner = '') =>
    `<navPoint id="${xmlAttr(id)}" playOrder="${++order}"><navLabel><text>${xmlText(label)}</text></navLabel><content src="${xmlAttr(src)}"/>${inner}</navPoint>`;
  const points = book.chapters
    .filter((c) => !c.unlisted)
    .map((c) => {
      // the parts nest inside the chapter's point, numbered after it
      const head = point(`n-${c.id}`, c.title, file(c));
      const parts = (c.parts ?? []).map((p) => point(`n-${c.id}-${p.id}`, p.title, `${file(c)}#${p.id}`)).join('');
      return head.replace(/<\/navPoint>$/, `${parts}</navPoint>`);
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1" xml:lang="${LANG}">
<head>
<meta name="dtb:uid" content="urn:uuid:${uuid}"/>
<meta name="dtb:depth" content="${book.chapters.some((c) => c.parts?.length) ? 2 : 1}"/>
<meta name="dtb:totalPageCount" content="0"/>
<meta name="dtb:maxPageNumber" content="0"/>
</head>
<docTitle><text>${xmlText(book.title)}</text></docTitle>
<navMap>
${points}
</navMap>
</ncx>
`;
}

/** The time in the form the package's dcterms:modified takes (no fractions of a second). */
const stamp = (d: Date) => d.toISOString().replace(/\.\d+Z$/, 'Z');

function opfDoc(book: EpubBook, uuid: string, now: Date): string {
  const items: string[] = [
    `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`,
    `<item id="css" href="style.css" media-type="text/css"/>`,
  ];
  const spine: string[] = [];
  if (book.cover) {
    items.push(`<item id="cover-image" href="${xmlAttr(book.cover.path)}" media-type="${book.cover.type}" properties="cover-image"/>`);
    items.push(`<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>`);
    spine.push(`<itemref idref="cover"/>`);
  }
  for (const c of book.chapters) {
    items.push(`<item id="${xmlAttr(c.id)}" href="${file(c)}" media-type="application/xhtml+xml"/>`);
    spine.push(`<itemref idref="${xmlAttr(c.id)}"/>`);
  }
  book.files.forEach((f, i) => items.push(`<item id="f${i + 1}" href="${xmlAttr(f.path)}" media-type="${f.type}"/>`));
  const meta = [
    `<dc:identifier id="uid">urn:uuid:${uuid}</dc:identifier>`,
    `<dc:title>${xmlText(book.title)}</dc:title>`,
    `<dc:language>${LANG}</dc:language>`,
    `<dc:creator id="creator">${xmlText(book.creator)}</dc:creator>`,
    book.publisher ? `<dc:publisher>${xmlText(book.publisher)}</dc:publisher>` : '',
    book.date ? `<dc:date>${xmlText(book.date)}</dc:date>` : '',
    book.description ? `<dc:description>${xmlText(book.description)}</dc:description>` : '',
    `<meta property="dcterms:modified">${stamp(now)}</meta>`,
    book.cover ? `<meta name="cover" content="cover-image"/>` : '',
  ].filter(Boolean);
  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid" xml:lang="${LANG}">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
${meta.join('\n')}
</metadata>
<manifest>
${items.join('\n')}
</manifest>
<spine toc="ncx">
${spine.join('\n')}
</spine>
${book.cover ? `<guide><reference type="cover" title="Cover" href="cover.xhtml"/></guide>` : ''}
</package>
`;
}

const CONTAINER = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles>
<rootfile full-path="${OPF_DIR}/content.opf" media-type="application/oebps-package+xml"/>
</rootfiles>
</container>
`;

/** The book as the bytes of an .epub file. */
export async function packEpub(book: EpubBook, now = new Date()): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const uuid = await bookUuid(book.key);
  const text = (name: string, s: string): ZipEntry => ({ name, data: enc.encode(s) });
  const inside = (name: string) => `${OPF_DIR}/${name}`;
  const entries: ZipEntry[] = [
    { name: 'mimetype', data: enc.encode('application/epub+zip'), store: true },
    text('META-INF/container.xml', CONTAINER),
    text(inside('content.opf'), opfDoc(book, uuid, now)),
    text(inside('nav.xhtml'), navDoc(book, !!book.cover)),
    text(inside('toc.ncx'), ncxDoc(book, uuid)),
    text(inside('style.css'), EPUB_CSS + (book.css ?? '')),
  ];
  if (book.cover)
    entries.push(
      text(
        inside('cover.xhtml'),
        xhtmlPage(
          book.title,
          `<section epub:type="cover" class="cover"><img src="${xmlAttr(book.cover.path)}" alt="${xmlAttr(book.cover.alt)}"/></section>`,
          'cover',
        ),
      ),
      { name: inside(book.cover.path), data: book.cover.data },
    );
  for (const c of book.chapters) entries.push(text(inside(file(c)), xhtmlPage(`${c.title} · ${book.title}`, c.body)));
  for (const f of book.files) entries.push({ name: inside(f.path), data: f.data });
  return createZip(entries, now);
}
