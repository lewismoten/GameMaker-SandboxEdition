// The Library's print shop: a game's 3.5" disk labels and its retail box laid out flat, and the
// labels for the Game-Maker CD and TURBO BUTTON's cover disc, each as an art image and a die-cut
// image the same size (dieLines.ts), to print at home on sticker paper or send to a print shop.
// Opened from the Library's cards (library/printShelf.ts) in the box viewer, with a choice of
// what the sheets show (the art, the die cut, or the art with the die lines over it), the bleed,
// crop marks, and the files at 300 dpi: a PNG of each, and an SVG of the die lines.
import './printShop.css';
import { download, h } from '../../editor/core/ui';
import type { CatalogEntry } from '../../project/files';
import { withDetails } from '../../project/files';
import { gameDisks } from '../../project/diskFacts';
import { sheet, type Sheet } from './kit';
import { openBox, type BoxItem } from './viewer';
import { pngWithDpi } from './stickerArt';
import { BLEED, DPI, dieSvg, drawCropMarks, drawDie, pixelSize, type DieLines, type SheetView } from './dieLines';
import { CD_CENTERS, cdSheetDie, diskSheetDie, diskSlots, DISK_LABEL, LETTER } from './labelSheets';
import { BOX, boxDie } from './retailBoxTemplate';
import { diskLabelArt, paintDiskLabel, type DiskLabelArt } from './diskLabelArt';
import { CDS, paintCdLabel, type CdId } from './cdLabelArt';
import { paintBoxSheet, printFaces, type BoxSheet } from './retailBoxArt';

/** The pieces, by the id the Library opens them at. */
export type PrintId = 'disklabels' | 'retailbox' | CdId;

/** One sheet of a piece: its art and die lines, and the part shown and printed here (inches). */
interface PrintSheet {
  label: string;
  /** The art file's name, without "-art.png". */
  file: string;
  /** The die-cut file's name, without "-diecut.png" (the box's two sheets share one). */
  dieFile: string;
  die(bleed: boolean): DieLines;
  paint(dpi: number, bleed: boolean): Promise<HTMLCanvasElement>;
  /** The part of the sheet shown and printed: letter paper's printable 8 x 10.5 in, or all of it. */
  window: [x: number, y: number, w: number, h: number];
}

interface PrintPiece {
  id: PrintId;
  title: string;
  note: string;
  icon: string;
  /** Offers crop marks (sheets of labels; a box's printer has its own die). */
  crop: boolean;
  /** What it is and how to use it, a paragraph or two. */
  about: (string | Node)[][];
  sheets: PrintSheet[];
}

interface Options {
  view: SheetView;
  bleed: boolean;
  crop: boolean;
}

/** The choices, kept per browser. */
const OPT_KEY = 'gm-print-shop';
/** The sheets on screen and printed from here: sharp enough for print, quick to draw. */
const SCREEN_DPI = 150;
/** Letter paper's area inside a printer's margins, which the viewer prints at actual size. */
const LETTER_WINDOW: PrintSheet['window'] = [0.25, 0.25, 8, 10.5];

function loadOptions(): Options {
  const fallback: Options = { view: 'art', bleed: true, crop: false };
  try {
    const o = JSON.parse(localStorage.getItem(OPT_KEY) ?? '{}') as Partial<Options>;
    return {
      view: o.view === 'die' || o.view === 'both' ? o.view : 'art',
      bleed: o.bleed !== false,
      crop: o.crop === true,
    };
  } catch {
    return fallback;
  }
}

function saveOptions(o: Options): void {
  try {
    localStorage.setItem(OPT_KEY, JSON.stringify(o));
  } catch {
    // kept for this page only
  }
}

const blank = (die: Pick<DieLines, 'w' | 'h'>, dpi: number, white = true): [HTMLCanvasElement, CanvasRenderingContext2D] => {
  const c = document.createElement('canvas');
  [c.width, c.height] = pixelSize(die, dpi);
  const g = c.getContext('2d')!;
  if (white) {
    g.fillStyle = '#fff';
    g.fillRect(0, 0, c.width, c.height);
  }
  return [c, g];
};

// ---- the pieces

/** A game's disk labels: a sheet of six, its disks in turn (Disk 1, Disk 2, Disk 1, ...). */
function diskPiece(entry: CatalogEntry): PrintPiece {
  let art: Promise<DiskLabelArt> | undefined;
  const disks = Math.max(1, gameDisks(entry));
  const name = `${entry.id}-disk-labels`;
  return {
    id: 'disklabels',
    title: 'Disk labels',
    note: `3½" disk labels for its ${disks === 1 ? 'disk' : `${disks} disks`}, six to a sheet`,
    icon: '💾',
    crop: true,
    about: [
      [
        `Six 3½" disk labels on letter-size sticker paper: the usual wrap-around diskette label, ${DISK_LABEL.w} × ${DISK_LABEL.h} in. The front (${DISK_LABEL.w} × 2 in) is the label the desk's disks show; the strip above it folds over the disk's top edge onto the back (the two dashed lines are the folds), so its words are upside down here.`,
      ],
      [
        'The labels are 1/2 in apart, inside a cutting machine’s print-then-cut area. Cut them by hand on the cut lines, or load the art and the die lines (the SVG’s cut layer) into a cutting program and line them up on the sheet.',
      ],
    ],
    sheets: [
      {
        label: 'Sheet',
        file: name,
        dieFile: 'disk-labels',
        die: diskSheetDie,
        window: LETTER_WINDOW,
        paint: async (dpi, bleed) => {
          const pics = await (art ??= diskLabelArt(entry));
          const [c, g] = blank({ w: LETTER[0], h: LETTER[1] }, dpi);
          g.scale(dpi / 100, dpi / 100);
          diskSlots().forEach(([x, y], i) => {
            g.save();
            g.translate(x * 100, y * 100);
            paintDiskLabel(g, entry, pics, (i % disks) + 1, disks, bleed ? BLEED * 100 : 0);
            g.restore();
          });
          return c;
        },
      },
    ],
  };
}

/** A game's retail box, flat: the lid and the bottom, on The Game Crafter's large retail box layout. */
function boxPiece(entry: CatalogEntry): PrintPiece {
  const faces = new Map<number, ReturnType<typeof printFaces>>();
  const sheetOf = (which: BoxSheet, label: string): PrintSheet => ({
    label,
    file: `${entry.id}-retail-box-${which}`,
    dieFile: `${entry.id}-retail-box`,
    die: boxDie,
    window: [0, 0, BOX.sheet[0], BOX.sheet[1]],
    paint: async (dpi) => {
      let f = faces.get(dpi);
      if (!f) faces.set(dpi, (f = printFaces(entry, dpi)));
      const drawn = await f;
      if (!drawn) throw new Error('This game has no box');
      return paintBoxSheet(entry, which, drawn, dpi);
    },
  });
  const [fw, fh] = BOX.face;
  return {
    id: 'retailbox',
    title: 'Retail box',
    note: 'The box laid out flat to print and fold: lid and bottom',
    icon: '📦',
    crop: false,
    about: [
      [
        `A two-piece box, laid out on the measurements of The Game Crafter’s Large Retail Box template: the same die for the lid and the bottom. The lid has the front cover on its face (${fw} × ${fh} in) and the spines, top and bottom on its ${BOX.wall} in walls; the bottom has the back cover, its walls hidden under the lid’s. The turn-ins fold inside; the slanted tabs glue inside the short walls.`,
      ],
      [
        `Each sheet is ${BOX.sheet[0]} × ${BOX.sheet[1]} in with a 1/8 in bleed: upload the art PNGs (300 dpi) to a print shop that makes this box, or print them on tabloid card. Printed from here they are scaled to fit letter paper.`,
      ],
    ],
    sheets: [sheetOf('lid', 'Lid'), sheetOf('bottom', 'Bottom')],
  };
}

/** A CD label: two to a sheet. */
function cdPiece(id: CdId): PrintPiece {
  const cd = CDS[id];
  return {
    id,
    title: cd.title,
    note: cd.note,
    icon: '💿',
    crop: true,
    about: [
      [
        'Two full-face CD labels on letter-size sticker paper: 117 mm across with a 41 mm hole, the size CD label sheets and their applicators are made for (it clears the disc’s clear hub).',
      ],
      ['Cut the edge and the hole on the cut lines, or load the art and the die lines (the SVG’s cut layer) into a cutting program.'],
    ],
    sheets: [
      {
        label: 'Sheet',
        file: cd.file,
        dieFile: 'cd-labels',
        die: cdSheetDie,
        window: LETTER_WINDOW,
        paint: (dpi, bleed) => {
          const [c, g] = blank({ w: LETTER[0], h: LETTER[1] }, dpi);
          g.scale(dpi / 100, dpi / 100);
          for (const [x, y] of CD_CENTERS) {
            g.save();
            g.translate(x * 100, y * 100);
            paintCdLabel(g, id, bleed ? BLEED * 100 : 0);
            g.restore();
          }
          return Promise.resolve(c);
        },
      },
    ],
  };
}

// ---- drawing a sheet

/** The art at `dpi`, with crop marks when chosen. */
/** A drawn canvas's context with its painter's scale undone, to draw over it in pixels. */
function over(c: HTMLCanvasElement): CanvasRenderingContext2D {
  const g = c.getContext('2d')!;
  g.setTransform(1, 0, 0, 1, 0, 0);
  return g;
}

async function artOf(piece: PrintPiece, s: PrintSheet, dpi: number, o: Options): Promise<HTMLCanvasElement> {
  const art = await s.paint(dpi, o.bleed);
  if (piece.crop && o.crop) drawCropMarks(over(art), s.die(o.bleed), dpi);
  return art;
}

/** The die cut at `dpi`: on white to look at, or on a clear ground to lay over the art (a downloaded file). */
function dieOf(s: PrintSheet, dpi: number, o: Options, white: boolean): HTMLCanvasElement {
  const die = s.die(o.bleed);
  const [c, g] = blank(die, dpi, white);
  drawDie(g, die, dpi);
  return c;
}

/** What the sheet shows, cut to its window. */
async function viewOf(piece: PrintPiece, s: PrintSheet, dpi: number, o: Options): Promise<HTMLCanvasElement> {
  const die = s.die(o.bleed);
  let full: HTMLCanvasElement;
  if (o.view === 'die') full = dieOf(s, dpi, o, true);
  else {
    full = await artOf(piece, s, dpi, o);
    if (o.view === 'both') drawDie(over(full), die, dpi);
  }
  const [x, y, w, hh] = s.window;
  if (x === 0 && y === 0 && w === die.w && hh === die.h) return full;
  const c = document.createElement('canvas');
  c.width = Math.round(w * dpi);
  c.height = Math.round(hh * dpi);
  c.getContext('2d')!.drawImage(full, -x * dpi, -y * dpi);
  return c;
}

const VIEW_NAMES: Record<SheetView, string> = { art: 'art', die: 'die cut', both: 'art with die lines' };

/** A sheet's picture as a URL for an <img> (a blob, let go when replaced). */
async function urlOf(c: HTMLCanvasElement): Promise<string> {
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/png'));
  return blob ? URL.createObjectURL(blob) : c.toDataURL();
}

async function sheetsOf(piece: PrintPiece, o: Options, owner: string): Promise<Sheet[]> {
  return Promise.all(
    piece.sheets.map(async (s) => {
      const img = h('img', {
        class: 'ps-art',
        src: await urlOf(await viewOf(piece, s, SCREEN_DPI, o)),
        alt: `${owner} ${piece.title.toLowerCase()}${piece.sheets.length > 1 ? `, ${s.label.toLowerCase()}` : ''}: ${VIEW_NAMES[o.view]}`,
      });
      return sheet(s.window[2], s.window[3], 'ps', img);
    }),
  );
}

// ---- the files

async function pngFile(c: HTMLCanvasElement): Promise<Blob> {
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/png'));
  if (!blob) throw new Error('The picture could not be made');
  const png = pngWithDpi(new Uint8Array(await blob.arrayBuffer()), DPI);
  return new Blob([png as Uint8Array<ArrayBuffer>], { type: 'image/png' });
}

function fileButton(label: string, make: () => Promise<[string, Blob]>): HTMLButtonElement {
  const b = h('button', { type: 'button' }, label);
  b.addEventListener('click', async () => {
    b.disabled = true;
    const was = b.textContent;
    b.textContent = 'Making the file…';
    try {
      const [name, blob] = await make();
      download(name, blob);
    } finally {
      b.disabled = false;
      b.textContent = was;
    }
  });
  return b;
}

// ---- on screen

function screenOf(piece: PrintPiece, o: Options, owner: string): (sheets: Sheet[]) => HTMLElement {
  return (sheets) => {
    const imgs = sheets.map((s) => s.el.querySelector<HTMLImageElement>('img.ps-art')!);
    let turn = 0;
    const redraw = async () => {
      saveOptions(o);
      const mine = ++turn;
      const fresh = await sheetsOf(piece, o, owner);
      if (mine !== turn) return;
      fresh.forEach((s, i) => {
        const img = s.el.querySelector<HTMLImageElement>('img.ps-art')!;
        if (imgs[i].src.startsWith('blob:')) URL.revokeObjectURL(imgs[i].src);
        imgs[i].src = img.src;
        imgs[i].alt = img.alt;
      });
    };
    const radios = (['art', 'die', 'both'] as const).map((v) => {
      const input = h('input', { type: 'radio', name: `ps-view-${piece.id}`, value: v });
      input.checked = o.view === v;
      input.addEventListener('change', () => input.checked && ((o.view = v), void redraw()));
      return h('label', { class: 'check' }, input, h('span', null, v === 'art' ? 'Art' : v === 'die' ? 'Die cut' : 'Art with die lines'));
    });
    const box = (text: string, on: boolean, set: (v: boolean) => void, title: string) => {
      const input = h('input', { type: 'checkbox' });
      input.checked = on;
      input.addEventListener('change', () => (set(input.checked), void redraw()));
      return h('label', { class: 'check', title }, input, h('span', null, text));
    };
    const suffix = () => (o.bleed ? '' : '-no-bleed');
    const artRows = piece.sheets.map((s) =>
      h(
        'div',
        { class: 'ps-files-row' },
        piece.sheets.length > 1 ? h('b', null, s.label) : null,
        fileButton('⬇ Art (PNG)', async () => [`${s.file}-art${suffix()}.png`, await pngFile(await artOf(piece, s, DPI, o))]),
      ),
    );
    const dies = [...new Map(piece.sheets.map((s) => [s.dieFile, s])).values()];
    const dieRows = dies.map((s) =>
      h(
        'div',
        { class: 'ps-files-row' },
        dies.length < piece.sheets.length ? h('b', null, 'Both') : null,
        fileButton('⬇ Die cut (PNG)', async () => [`${s.dieFile}-diecut${suffix()}.png`, await pngFile(dieOf(s, DPI, o, false))]),
        fileButton('⬇ Die lines (SVG)', () =>
          Promise.resolve([`${s.dieFile}-diecut${suffix()}.svg`, new Blob([dieSvg(s.die(o.bleed), `${piece.title}: die lines`)], { type: 'image/svg+xml' })]),
        ),
      ),
    );
    const [pw, ph] = pixelSize(piece.sheets[0].die(true));
    const controls = h(
      'div',
      { class: 'ps-controls' },
      h('fieldset', { class: 'ps-view' }, h('legend', null, 'Show'), ...radios),
      h(
        'fieldset',
        { class: 'ps-opts' },
        h('legend', null, 'Options'),
        box(
          'Bleed: art runs 1/8 in past the cut',
          o.bleed,
          (v) => (o.bleed = v),
          'The background colors run 1/8 inch past each cut line, so a cut a little off shows no white edge',
        ),
        piece.crop ? box('Crop marks', o.crop, (v) => (o.crop = v), 'Short lines outside each corner, to line up a paper cutter') : null,
      ),
      h(
        'details',
        { class: 'ps-files' },
        h('summary', null, '⬇ Files to print or cut (300 dpi)'),
        h(
          'div',
          { class: 'ps-files-body' },
          ...piece.about.map((para) => h('p', null, ...para)),
          h(
            'p',
            null,
            `The art and the die cut are both ${pw} × ${ph} pixels (${piece.sheets[0].die(true).w} × ${piece.sheets[0].die(true).h} in at 300 dpi), so one lies exactly over the other. Cut lines are red, folds green and dashed, the safe line (keep words inside it) cyan and dashed, and the bleed a gray band. The SVG has each on its own layer.`,
          ),
          ...artRows,
          ...dieRows,
        ),
      ),
    );
    return h('div', { class: 'gmb-sheets ps-screen' }, controls, ...sheets.map((s) => s.el));
  };
}

function itemOf(piece: PrintPiece, owner: string): BoxItem {
  const o = loadOptions();
  return {
    id: piece.id,
    title: piece.title,
    note: piece.note,
    icon: piece.icon,
    render: () => sheetsOf(piece, o, owner),
    screen: screenOf(piece, o, owner),
  };
}

/** A game's pieces: its disk labels, and its retail box when it has one. */
function gamePieces(entry: CatalogEntry): PrintPiece[] {
  return [diskPiece(entry), ...(entry.original?.box ? [boxPiece(entry)] : [])];
}

const CD_PIECES = (): PrintPiece[] => [cdPiece('gmcd'), cdPiece('turbocd')];

/**
 * Opens the print shop at a piece: a game's disk labels or retail box (with `listed`, the game
 * as the catalog lists it), or the CD labels (without).
 */
export async function openPrintShop(start: PrintId, listed?: CatalogEntry): Promise<void> {
  const entry = listed && (await withDetails(listed));
  const pieces = entry ? gamePieces(entry) : CD_PIECES();
  const owner = entry?.title ?? 'CD';
  await openBox(
    entry ? `${entry.title}: labels and box` : 'CD labels',
    [],
    pieces.map((p) => itemOf(p, owner)),
    { trayHeading: 'Print your own', start },
  );
}

/** A card's picture in the Library: the art, small. */
export async function printThumb(id: PrintId, listed?: CatalogEntry): Promise<Sheet | undefined> {
  const entry = listed && (await withDetails(listed));
  const piece = (entry ? gamePieces(entry) : CD_PIECES()).find((p) => p.id === id);
  const s = piece?.sheets[0];
  if (!piece || !s) return undefined;
  const c = await viewOf(piece, s, 40, { view: 'art', bleed: false, crop: false });
  return sheet(s.window[2], s.window[3], 'ps', h('img', { class: 'ps-art', src: c.toDataURL(), alt: '' }));
}
