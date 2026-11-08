// The "Feelies" of a game's box as pieces in its "What's in the box" list (items.ts has the paper ones): each plastic trinket and laser kit
// with its short words, its pictures and its files to download as attachments (named for what they are, with their sizes), and the phone kit
// as an instruction book (phoneBook.ts, apart from Dex's report) and a page of its downloads (the 3D-printer parts and circuit board ZIPs, the
// parts lists). The strip under the turning box (desk/boxes/trinketShelf.ts) shows only thumbnails and the 3D; everything to read or save is here.
import './feelieItems.css';
import { h } from '../../editor/core/ui';
import { loadFeelies, fileSize, sizeText, PHONE_TITLE, type Feelie } from '../../desk/boxes/feelies';
import { thumbnail } from '../../desk/boxes/feelieThumbs';
import { phoneBase, variantBase } from '../../desk/boxes/phone/phoneData';
import { trinketDownload } from '../../desk/boxes/trinketData';
import { sheet, type Sheet } from './kit';
import type { BoxItem } from './viewer';

/** One file to download: its link, what it is, and its size once known. */
interface Attachment {
  href: string;
  /** The saved file's name. */
  file: string;
  label: string;
  bytes?: number;
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
  return f.kit.downloads.map((d) => ({ href: `${f.kit.base}${d.file}`, file: d.file.split('/').pop() ?? d.file, label: d.label }));
}

/** The phone kit's downloads: the printer parts and board files as ZIPs, the parts lists as CSV. */
export function phoneAttachments(): Attachment[] {
  return [
    { href: `${phoneBase}phone-3d-printer-parts.zip`, file: 'phone-3d-printer-parts.zip', label: '3D printer parts (ZIP of the STLs, both builds)' },
    {
      href: `${phoneBase}phone-circuit-board.zip`,
      file: 'phone-circuit-board.zip',
      label: 'Circuit board files (ZIP: KiCad project and PIC firmware for both builds, with Gerbers when the build had KiCad)',
    },
    { href: `${phoneBase}parts-list.csv`, file: 'phone-parts-list-junior-lab.csv', label: 'Parts list, Junior Lab build (CSV)' },
    { href: `${variantBase('deluxe')}parts-list.csv`, file: 'phone-parts-list-deluxe.csv', label: 'Parts list, Deluxe build (CSV)' },
  ];
}

/** The attachments as a list of download links, each with its size. */
function attachmentList(list: Attachment[]): HTMLElement {
  return h(
    'ul',
    { class: 'fe-files', 'aria-label': 'Attachments' },
    ...list.map((a) => {
      const size = h('span', { class: 'fe-size' }, a.bytes ? sizeText(a.bytes) : '');
      if (!a.bytes) void fileSize(a.href).then((n) => (size.textContent = n ? sizeText(n) : ''));
      const link = h('a', { class: 'fe-dl', href: a.href, download: a.file }, a.label);
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
        kit.previews.map((p) => img(`${kit.base}${p.file}`, p.alt)),
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
