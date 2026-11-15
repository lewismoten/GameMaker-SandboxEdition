// The "Feelies" of a game's box as pieces in its "What's in the box" list (items.ts has the paper ones): each plastic trinket and laser kit
// with its short words, its pictures and its files to download as attachments (named for what they are, with their sizes), and the phone kit
// as an instruction book (phoneBook.ts, apart from Dex's report) and a page of its downloads (the 3D-printer parts and circuit board ZIPs, the
// parts lists). The strip under the turning box (desk/boxes/trinketShelf.ts) shows only thumbnails and the 3D; everything to read or save is here.
import './feelieItems.css';
import { h } from '../../editor/core/ui';
import { loadFeelies, fileSize, sizeText, PHONE_TITLE, type Feelie } from '../../desk/boxes/feelies';
import { thumbnail } from '../../desk/boxes/feelieThumbs';
import { phoneBase, phonePrinterZip, variantBase } from '../../desk/boxes/phone/phoneData';
import { madeDownload } from '../../desk/boxes/madeDownload';
import { trinketDownload } from '../../desk/boxes/trinketData';
import { sheet, type Sheet } from './kit';
import type { BoxItem } from './viewer';
import type { ViewerItem } from './svgViewer';

/** One file to download: its link, what it is, and its size once known. */
interface Attachment {
  href: string;
  /** The saved file's name. */
  file: string;
  label: string;
  bytes?: number;
  /** A file read in the page instead of saved (a kit's build notes): the link becomes a button that calls this. */
  open?: (from: HTMLElement) => void;
  /** Sets the link up when the site makes the file on demand (a packed trinket file: trinketData.ts). */
  link?: (a: HTMLAnchorElement) => HTMLAnchorElement;
}

const mm = (v: number[]) => v.map((n) => Math.round(n)).join(' × ');

/** A trinket's downloads, from its manifest (which has the sizes). */
function trinketAttachments(f: Extract<Feelie, { kind: 'trinket' }>): Attachment[] {
  const { item, base } = f;
  const file = (name: string, label: string, bytes: number): Attachment => ({
    href: `${base}${name}`,
    file: name,
    label,
    bytes,
    link: (a) => trinketDownload(a, base, item, name),
  });
  return [
    file(item.file, '3D printer parts, one color (STL)', item.bytes),
    file(item.colors.file, '3D printer parts, up to 4 colors (3MF)', item.colors.bytes),
    ...(item.supports ? [file(item.supports.file, 'Supports for a second material (STL)', item.supports.bytes)] : []),
  ];
}

/** A laser kit's downloads, from its manifest (sizes are asked of the site). */
function kitAttachments(f: Extract<Feelie, { kind: 'nickel' | 'box' | 'kit' | 'patch' }>): Attachment[] {
  return f.kit.downloads.map((d) => {
    const href = `${f.kit.base}${d.file}`;
    const file = d.file.split('/').pop() ?? d.file;
    // the build notes are written in Markdown for the repository; a player reads them as a page, with pictures (kitNotes.ts)
    if (/\.md$/i.test(file))
      return { href, file, label: d.label, open: (from: HTMLElement) => void import('./kitNotes').then((m) => m.openKitNotes(f.kit, href, from)) };
    return { href, file, label: d.label };
  });
}

const stem = (file: string) => file.replace(/^.*\//, '').replace(/\.[^.]+$/, '');

/** A kit's preview picture as a button: it opens the drawing it is a picture of (same name, .svg) large, among the kit's drawings. */
function previewButton(f: Extract<Feelie, { kind: 'nickel' | 'box' | 'kit' | 'patch' }>, p: { file: string; alt: string }): HTMLElement {
  const src = `${f.kit.base}${p.file}`;
  const svgs = kitAttachments(f).filter((a) => isSvgHref(a.href));
  const at = svgs.findIndex((a) => stem(a.file) === stem(p.file));
  const items: ViewerItem[] =
    at >= 0 ? svgs.map(({ href, file, label }) => ({ href, file, label })) : [{ href: src, file: p.file.split('/').pop() ?? p.file, label: p.alt }];
  const b = h('button', { type: 'button', class: 'fe-pic-btn', 'aria-label': `Open ${p.alt} large`, title: 'Open large' }, img(src, p.alt));
  b.addEventListener('click', () => void import('./svgViewer').then((m) => m.openSvgViewer(items, Math.max(0, at), b)));
  return b;
}

/** The phone kit's downloads: the printer parts and board files as ZIPs, the parts lists as CSV. */
export function phoneAttachments(): Attachment[] {
  return [
    {
      href: '#',
      file: 'phone-3d-printer-parts.zip',
      label: '3D printer parts (ZIP of the STLs, both builds)',
      link: (a) => madeDownload(a, 'phone-3d-printer-parts.zip', phonePrinterZip),
    },
    {
      href: `${phoneBase}phone-circuit-board.zip`,
      file: 'phone-circuit-board.zip',
      label: 'Circuit board files (ZIP: KiCad project and PIC firmware for both builds, with Gerbers when the build had KiCad)',
    },
    { href: `${phoneBase}parts-list.csv`, file: 'phone-parts-list-junior-lab.csv', label: 'Parts list, Junior Lab build (CSV)' },
    { href: `${variantBase('deluxe')}parts-list.csv`, file: 'phone-parts-list-deluxe.csv', label: 'Parts list, Deluxe build (CSV)' },
  ];
}

/** A link to an SVG drawing: it opens in the page's viewer (svgViewer.ts). */
export const isSvgHref = (href: string): boolean => /\.svg(?:[?#].*)?$/i.test(href);

/** The drawings a link steps through, and where it is among them. */
const drawings1 = (a: Attachment, all: Attachment[]) => ({
  items: all.map(({ href, file, label }) => ({ href, file, label })),
  at: Math.max(0, all.indexOf(a)),
});

/** The attachments as a list of download links, each with its size. */
function attachmentList(list: Attachment[]): HTMLElement {
  const svgs = list.filter((a) => isSvgHref(a.href));
  return h(
    'ul',
    { class: 'fe-files', 'aria-label': 'Attachments' },
    ...list.map((a) => {
      const size = h('span', { class: 'fe-size' }, a.bytes ? sizeText(a.bytes) : '');
      if (!a.bytes && !a.link) void fileSize(a.href).then((n) => (size.textContent = n ? sizeText(n) : ''));
      if (a.open) {
        const read = a.open;
        const b = h('button', { type: 'button', class: 'fe-dl fe-read', onclick: () => read(b) }, a.label);
        return h('li', null, b, h('span', { class: 'fe-size' }, 'read here'));
      }
      const link = h('a', { class: 'fe-dl', href: a.href, download: a.file }, a.label);
      // a drawing opens large in the page (pan, zoom, Download there), with Previous and Next through the kit's drawings; the other files download as before
      if (isSvgHref(a.href)) {
        const own = drawings1(a, svgs);
        link.addEventListener('click', (e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          e.preventDefault();
          void import('./svgViewer').then((m) => m.openSvgViewer(own.items, own.at, link));
        });
      }
      return h('li', null, a.link ? a.link(link) : link, size);
    }),
  );
}

/** A piece's page: its name, words, pictures, then its attachments. */
function card(title: string, words: string[], pictures: HTMLElement[], files: Attachment[], extra: Node[] = []): HTMLElement {
  return h(
    'article',
    { class: 'fe-card' },
    h('h2', null, title),
    ...words.map((w) => h('p', { class: 'fe-words' }, w)),
    pictures.length ? h('div', { class: 'fe-pics' }, ...pictures) : null,
    ...extra,
    h('h3', null, 'Attachments'),
    attachmentList(files),
  );
}

/** A real picture of a feelie for its tray thumbnail: its render, laid on a small sheet. */
async function thumbSheet(f: Feelie, alt: string): Promise<Sheet | undefined> {
  const src = await thumbnail(f);
  if (!src) return undefined;
  return sheet(4, 3, 'fe-thumb', h('img', { src, alt }));
}

const img = (src: string, alt: string) => h('img', { class: 'fe-pic', src, alt, width: '160', height: '160', loading: 'lazy' });

function pieceOf(f: Feelie): BoxItem | undefined {
  if (f.kind === 'phone') return undefined;
  const lead = { id: `feelie-${f.key.replace(/[^\w-]/g, '-')}`, title: f.title };
  const first = async () => thumbSheet(f, `${f.title}, rendered`);
  const render = async (): Promise<Sheet[]> => {
    const s = await first();
    return s ? [s] : [];
  };
  if (f.kind === 'trinket') {
    const { item } = f;
    const supports = item.supports
      ? 'On a plain printer it needs supports: print the supports body in a second material, or let your slicer add them.'
      : 'Prints without supports.';
    return {
      ...lead,
      note: `Plastic trinket · ${mm(item.mm)} mm`,
      icon: '🧸',
      first,
      render,
      live: () =>
        thumbnail(f).then((src) =>
          card(item.title, [item.blurb, `${mm(item.mm)} mm. ${supports}`], src ? [img(src, `${item.title}, rendered`)] : [], trinketAttachments(f)),
        ),
    };
  }
  const { kit } = f;
  return {
    ...lead,
    note: kit.kind === 'nickel' ? 'Wooden nickel · laser files' : kit.kind === 'patch' ? 'Embroidery patch · stitch files' : 'Laser kit · cut files',
    icon: kit.kind === 'nickel' ? '🪙' : kit.kind === 'patch' ? '🧵' : '📦',
    first,
    render,
    live: async () =>
      card(
        kit.title,
        [kit.summary],
        kit.previews.map((p) => previewButton(f, p)),
        kitAttachments(f),
      ),
  };
}

/** The phone kit's two pieces: its instruction book and its downloads. */
function phoneItems(f: Feelie): BoxItem[] {
  const first = async () => thumbSheet(f, 'The phone, rendered');
  const render = async (): Promise<Sheet[]> => {
    const s = await first();
    return s ? [s] : [];
  };
  const files = phoneAttachments();
  return [
    {
      id: 'feelie-phone-book',
      title: 'The Phone of the Future: build book',
      note: 'Instructions for the kit (an untested design)',
      icon: '📖',
      first,
      render,
      pages: () => import('./phoneBook').then((m) => m.phoneBookPages()),
    },
    {
      id: 'feelie-phone-files',
      title: `${PHONE_TITLE}: files`,
      note: 'Printer parts, circuit boards, parts lists',
      icon: '📎',
      first,
      render,
      live: () =>
        thumbnail(f).then((src) =>
          card(
            PHONE_TITLE,
            [
              'A build-it-yourself phone: print the shell, solder the board. An untested design; nobody has built one. Both builds, the Junior Lab Edition and the Deluxe Model, are in each ZIP.',
            ],
            src ? [img(src, 'The phone, rendered')] : [],
            files,
          ),
        ),
    },
  ];
}

/** Game `id`'s feelies as box pieces (none for a game without any, a secret game included). */
export async function feelieItems(id: string): Promise<BoxItem[]> {
  const list = await loadFeelies(id);
  return list.flatMap((f) => (f.kind === 'phone' ? phoneItems(f) : [pieceOf(f)].filter((x): x is BoxItem => !!x)));
}
