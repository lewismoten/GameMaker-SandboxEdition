// The Phone of the Future kit's instruction book, a booklet in the year-2000 box (feelieItems.ts), apart from Dex's report: the kit's own
// README and parts list (games/year2000/phone, copied to trinkets/phone/ by games/kit/phoneDownloads.ts) read as Markdown (markdownBlocks.ts),
// the build chapters only (how it is printed, built, programmed and what has not been checked; the developer's commands and repository
// notes are left out) and flowed onto the manual's own booklet pages (paginate.ts).
import { h } from '../../editor/core/ui';
import { bookletPageCount } from './imposition';
import { measurer, type BookPage } from './manualPages';
import { paginate } from './paginate';
import { blockText, element, readMarkdown, type Block, type Inline } from './markdownBlocks';

const BOOK = 'The Phone of the Future';
const BASE = './trinkets/phone/';
/** The README's chapters a builder reads, by the start of their headings; their ### parts come with them. */
const CHAPTERS = [
  'The 3D-printed shell',
  'What is printed on the board',
  'Build order for a beginner',
  'Programming the PIC',
  'Checked and not checked',
  'Assumptions to confirm',
];
/** A paragraph about the repository, not the kit, stays out of the book. */
const DEV = /\.for-lewis|\btools\/|viewer\/|games\/year2000|vite-node|\bnpm\b/;

interface Chapter {
  head: string;
  blocks: Block[];
}

const readable = (b: Block) => b.tag !== 'p' || !DEV.test(blockText(b));

/** The book's chapters from the README's and the parts list's Markdown: the intro, the build chapters, the parts. */
export function phoneChapters(readme: string, parts: string): Chapter[] {
  const sections = readMarkdown(readme);
  const chapters: Chapter[] = [];
  const intro = sections.find((s) => s.level === 1);
  if (intro) chapters.push({ head: 'About this kit', blocks: intro.blocks.filter(readable) });
  let inside = false;
  for (const s of sections) {
    if (s.level === 2) inside = CHAPTERS.some((c) => s.title.startsWith(c));
    if (!inside || s.level < 2) continue;
    chapters.push({
      head: s.title,
      blocks: [...(s.level > 2 ? [{ tag: 'p', kids: [{ tag: 'strong', kids: [s.title] }] } as Block] : []), ...s.blocks.filter(readable)],
    });
  }
  const list = readMarkdown(parts, ['Refs', 'Qty', 'Value', 'Description']).find((s) => s.level === 1);
  if (list) chapters.push({ head: 'Parts list', blocks: list.blocks.filter(readable) });
  return chapters
    .filter((c) => c.blocks.length)
    .map((c) => ({ head: c.head.replace(/\s*\(.*$/, ''), blocks: c.blocks.map((b) => (b.tag === 'ol' ? fixSteps(b) : b)) }));
}

/** Steps that point to files made on the builder's own machine point to the ZIPs in the book: the Gerbers, and the firmware's hex. */
function fixSteps(b: Block): Block {
  if (b.tag !== 'ol') return b;
  const swap = (s: unknown): unknown =>
    typeof s === 'string'
      ? s.replace(/out\/phone-gerbers\.zip/g, 'the circuit board ZIP’s gerbers folder').replace(/out\/firmware\/phone\.hex/g, 'phone.hex')
      : s;
  const flat = (k: Inline[]): string => k.map((x) => (typeof x === 'string' ? x : flat(x.kids))).join('');
  const hex: Inline[] = [
    { tag: 'code', kids: ['phone.hex'] },
    ' is in the firmware folder of the circuit board ZIP. If the ZIP has only ',
    { tag: 'code', kids: ['phone.asm'] },
    ', assemble it with gpasm (gputils): ',
    { tag: 'code', kids: ['gpasm -p p16f628a -o phone.hex phone.asm'] },
    '.',
  ];
  const fixed = JSON.parse(JSON.stringify(b, (_, v) => swap(v))) as Extract<Block, { items: Inline[][] }>;
  fixed.items = fixed.items.map((it) => (flat(it).startsWith('tools/build_firmware.sh') ? hex : it));
  return fixed;
}

const notes = (): HTMLElement[] => [h('h2', null, 'Notes'), h('div', { class: 'mp-ruled' })];

/** The book as booklet pages: a cover, the chapters flowed onto pages, notes pages to fill the last sheet, a back cover. */
export async function phoneBookPages(): Promise<BookPage[]> {
  const read = async (file: string) => {
    const res = await fetch(`${BASE}${file}`);
    if (!res.ok) throw new Error(file);
    return res.text();
  };
  const chapters = phoneChapters(await read('README.md'), await read('PARTS.md'));
  const host = h('div', { class: 'gmb-measure gmb-pages', 'aria-hidden': 'true' });
  document.body.append(host);
  try {
    const next = measurer(host);
    const pages: BookPage[] = [
      {
        kind: 'cover',
        body: [
          h(
            'div',
            {
              class: 'game-cover',
              style:
                'background:#1b1630;color:#fff;display:flex;flex-direction:column;justify-content:center;gap:.7em;padding:12%;text-align:center;font-family:system-ui,sans-serif',
            },
            h('div', { style: 'font-size:2.1em;font-weight:800;line-height:1.1' }, BOOK.toUpperCase()),
            h('div', { style: 'font-size:1.2em' }, 'Build book'),
            h('div', { style: 'font-size:.9em;opacity:.8' }, 'An untested design: every claim is a “should”.'),
          ),
        ],
      },
    ];
    for (const c of chapters) for (const body of paginate(c.blocks.map(element), next)) pages.push({ kind: 'text', head: [BOOK, c.head], body });
    const pads = bookletPageCount(pages.length + 1) - pages.length - 1;
    for (let i = 0; i < pads; i++) pages.push({ kind: 'notes', head: [BOOK, 'Notes'], body: notes() });
    pages.push({ kind: 'back', body: [h('div', { class: 'game-cover', style: 'background:#1b1630' })] });
    return pages;
  } finally {
    host.remove();
  }
}
