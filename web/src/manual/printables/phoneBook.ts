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
/** Repository references omitted from the printed build instructions. */
const DEV =
  /\.for[-]lewis|\btools\/|viewer\/|games\/year2000|vite-node|\bnpm\b|\b(?:shell\.ts|picsim\.py)\b|\bNOTICE\.md\b|\bmy own\b[^.]*\bsimulator\b|\bRev B sheet\b/;

interface Chapter {
  head: string;
  blocks: Block[];
}

const hasReference = (kids: Inline[]) => DEV.test(blockText({ tag: 'p', kids }));

/** Keep complete builder clauses and their inline formatting when a tool note shares an entry. */
function builderText(kids: Inline[]): Inline[] {
  const text = blockText({ tag: 'p', kids });
  if (!DEV.test(text)) return kids;
  const kept: Inline[] = [];
  let offset = 0;
  for (const clause of text.split(/(?<=[.;])(?=\s)/)) {
    const end = offset + clause.length;
    if (!DEV.test(clause)) {
      const start = kept.length ? offset : end - clause.trimStart().length;
      kept.push(...sliceInline(kids, start, end));
    }
    offset = end;
  }
  // A surviving clause that used to introduce a tool note now ends the entry.
  function finish(nodes: Inline[]) {
    const last = nodes.at(-1);
    if (typeof last === 'string') nodes[nodes.length - 1] = last.replace(/;$/, '.');
    else if (last) finish(last.kids);
  }
  finish(kept);
  return kept;
}

/** Take a range in the visible text, retaining the marks around each surviving piece. */
function sliceInline(kids: Inline[], start: number, end: number): Inline[] {
  const result: Inline[] = [];
  for (const kid of kids) {
    if (end <= 0) break;
    const length = typeof kid === 'string' ? kid.length : blockText({ tag: 'p', kids: kid.kids }).length;
    if (start < length) {
      if (typeof kid === 'string') result.push(kid.slice(Math.max(0, start), end));
      else result.push({ ...kid, kids: sliceInline(kid.kids, start, end) });
    }
    start -= length;
    end -= length;
  }
  return result;
}

function readable(b: Block): Block[] {
  if (b.tag === 'p') {
    const kids = builderText(b.kids);
    return kids.length ? [{ ...b, kids }] : [];
  }
  if (b.tag === 'ol' || b.tag === 'ul') {
    const list = b.tag === 'ol' ? fixSteps(b) : b;
    const runs: (typeof list)[] = [];
    let run: typeof list | undefined;
    for (const [index, item] of list.items.entries()) {
      const kids = builderText(item);
      if (!kids.length) {
        if (list.tag === 'ol') run = undefined;
        continue;
      }
      if (!run) {
        const start = (list.start ?? 1) + index;
        run = { tag: list.tag, items: [], ...(list.tag === 'ol' && start !== 1 ? { start } : {}) };
        runs.push(run);
      }
      run.items.push(kids);
    }
    return runs;
  }
  if (b.tag === 'table') {
    const rows = b.rows.flatMap((row) => {
      const cells = row.map(builderText);
      // A check label alone cannot report a result. Keep other surviving columns in place.
      const removedCell = cells.some((cell, i) => !cell.length && row[i].length);
      return removedCell && !cells.slice(1).some((cell) => cell.length) ? [] : [cells];
    });
    return rows.length && !b.head.some(hasReference) ? [{ ...b, rows }] : [];
  }
  return [b];
}

/** The book's chapters from the README's and the parts list's Markdown: the intro, the build chapters, the parts. */
export function phoneChapters(readme: string, parts: string): Chapter[] {
  const sections = readMarkdown(
    readme
      .replace(', so NOTICE.md has no entry for it', '')
      .replace('`shell.ts` prints an estimate for several greases; the first print decides', 'The first print decides')
      .replace('see `PARTS.md` and the cost sheet', 'see the Parts list chapter and the Junior Lab parts list CSV')
      .replace('continue with step 6 above', 'continue with step 6 of Build order for a beginner'),
  );
  const chapters: Chapter[] = [];
  const intro = sections.find((s) => s.level === 1);
  if (intro) chapters.push({ head: 'About this kit', blocks: intro.blocks.flatMap(readable) });
  let inside = false;
  for (const s of sections) {
    if (s.level === 2) inside = CHAPTERS.some((c) => s.title.startsWith(c));
    if (!inside || s.level < 2) continue;
    chapters.push({
      head: s.title,
      blocks: [...(s.level > 2 ? [{ tag: 'p', kids: [{ tag: 'strong', kids: [s.title] }] } as Block] : []), ...s.blocks.flatMap(readable)],
    });
  }
  const list = readMarkdown(parts, ['Refs', 'Qty', 'Value', 'Description']).find((s) => s.level === 1);
  if (list) chapters.push({ head: 'Parts list', blocks: list.blocks.flatMap(readable) });
  return chapters.filter((c) => c.blocks.length).map((c) => ({ head: c.head.replace(/\s*\(.*$/, ''), blocks: c.blocks }));
}

/** Steps that point to files made on the builder's own machine point to the ZIPs in the book: the Gerbers, and the firmware's hex. */
function fixSteps(b: Extract<Block, { items: Inline[][] }>) {
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
