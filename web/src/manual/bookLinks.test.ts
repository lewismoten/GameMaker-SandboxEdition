// Links and references across the books and the box's files, checked without a browser: the Guide's #/ links land on
// a section or page; the Owner's Guide contents name the page each chapter opens on and its chapter cross-references
// exist; Dex's report page references reach the page they describe; and each file a Feelie's page offers to download
// (laser kits, trinkets, the phone kit's ZIPs) exists in the built output (skipped where `games/` has not been built).
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { listZip } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { unpackFiles } from '@lewismoten/gamemaker-sandbox-tools/pack/meshPack';
import { CHAPTERS as tourChapters } from '../tour/chapters';
import { parseHash } from '../urlState';
import { ZINE } from './zine/zinePages';
import { GUIDE_SECTIONS } from './guideSections';
import { CHAPTERS as programmerChapters, chapterById, loadChapter } from '../programmersGuide/chapters';
import { CHAPTERS } from './ultimate/plan';
import { STARTER_ORDER } from '../project/starter';
import { pagesA } from './printables/dexReportPagesA';
import { pagesB } from './printables/dexReportPagesB';
import { pagesC } from './printables/dexReportPagesC';
import { kitOf } from '../desk/boxes/laserKits';
import { phoneAttachments } from './printables/feelieItems';
import { BRIEF_STORY_ZINE_VOLUMES } from './zine/briefStoryZine';
import { phoneChapters } from './printables/phoneBook';
import { blockText } from './printables/markdownBlocks';

const here = import.meta.dirname;
const src = (f: string) => readFileSync(join(here, f), 'utf8');
const pub = resolve(here, '../../public');
/** The DOS folder name of every game that has one. */
function sampleNames(): Set<string> {
  const games = resolve(here, '../../../games');
  return new Set(
    readdirSync(games).flatMap((g) => {
      const f = join(games, g, 'about.json');
      return existsSync(f) ? [String(JSON.parse(readFileSync(f, 'utf8')).dosName ?? '')] : [];
    }),
  );
}

describe('the Guide’s links', () => {
  it('point at a Guide section or a page of the site', () => {
    const destinations = new Set(['#/credits', '#/magazine', '#/mac', '#/windows', '#/linux', ...GUIDE_SECTIONS.map(([id]) => `#/help/${id}`)]);
    for (const [id, , html] of GUIDE_SECTIONS) {
      for (const [, href] of html.matchAll(/\bhref=["'](#[^"']*)["']/gi)) {
        expect(destinations, `${id} links to ${href}`).toContain(href);
      }
    }
  });

  it('names the Ultimate chapter that shows the Level check and walkthrough bot', () => {
    const overview = GUIDE_SECTIONS.find(([id]) => id === 'ultimate')![2];
    const reference = overview.match(/Chapter (\d+)[^.]*Level check[^.]*walkthrough bot/);
    expect(reference).toBeTruthy();
    expect(CHAPTERS[Number(reference![1]) - 1].title).toBe('The Level Check and the Walkthrough Bot');
  });

  it('has Try it boxes whose game/question keys exist in the Starters’ manuals', () => {
    const games = resolve(here, '../../../games');
    for (const [id, , html] of GUIDE_SECTIONS) {
      for (const m of html.matchAll(/data-try="([^"]+)"/g)) {
        for (const key of m[1].split(/\s+/)) {
          const [game, q] = key.split('/');
          const f = join(games, game, 'manual.json');
          expect(existsSync(f), `${id}: ${key} names a game`).toBe(true);
          const asked = (JSON.parse(readFileSync(f, 'utf8')).howDoI ?? []) as { id: string }[];
          expect(
            asked.some((x) => x.id === q),
            `${id}: ${key} is a question of ${game}`,
          ).toBe(true);
        }
      }
    }
  });

  it('points the Owner’s Guide at Sample CD folders that are games on the CD', () => {
    const names = sampleNames();
    for (const m of src('dosManualDesign.ts').matchAll(/<i>On the Sample CD[\s\S]*?<\/p>/g)) {
      for (const c of m[0].matchAll(/<code>([A-Z0-9]+)<\/code>/g)) expect(names.has(c[1]), `SAMPLES\\${c[1]}`).toBe(true);
    }
  });

  it('points the Ultimate Owner’s Guide at Sample CD folders that are games on the CD', () => {
    const names = sampleNames();
    let lines = 0;
    for (const c of CHAPTERS) {
      for (const m of c.html.matchAll(/<i>On the Sample CD:<\/i>[\s\S]*?<\/p>/g)) {
        lines++;
        const codes = [...m[0].matchAll(/<code>([A-Z0-9]+)<\/code>/g)];
        expect(codes.length, `${c.id}: a pointer names a folder`).toBeGreaterThan(0);
        for (const k of codes) expect(names.has(k[1]), `${c.id}: SAMPLES\\${k[1]}`).toBe(true);
      }
    }
    expect(lines).toBeGreaterThan(20);
  });

  it('names every Starter in the Owner’s Guide, the Ultimate Owner’s Guide or a Guide Try it box', () => {
    const games = resolve(here, '../../../games');
    const named = new Set<string>();
    for (const m of src('dosManualDesign.ts').matchAll(/<code>([A-Z0-9]+)<\/code>/g)) named.add(m[1]);
    for (const c of CHAPTERS) for (const m of c.html.matchAll(/<code>([A-Z0-9]+)<\/code>/g)) named.add(m[1]);
    for (const [, , html] of GUIDE_SECTIONS) {
      for (const m of html.matchAll(/data-try="([^"]+)"/g)) {
        for (const key of m[1].split(/\s+/)) {
          const f = join(games, key.split('/')[0], 'about.json');
          if (existsSync(f)) named.add(String(JSON.parse(readFileSync(f, 'utf8')).dosName));
        }
      }
    }
    for (const id of STARTER_ORDER) {
      const f = join(games, id, 'about.json');
      if (!existsSync(f)) continue;
      const dos = String(JSON.parse(readFileSync(f, 'utf8')).dosName);
      expect(named.has(dos), `${id} (SAMPLES\\${dos}) is named`).toBe(true);
    }
  });
});

it('keeps the Programmer’s Guide chapter map in reading order through the appendix', async () => {
  const numbered = programmerChapters.filter((c) => c.no);
  const map = (await loadChapter('reading')).split('## Chapter map')[1];
  expect(numbered.map((c) => Number(c.no))).toEqual(numbered.map((_, i) => i + 1));
  expect([...map.matchAll(/(?:^|;)\s*(\d+) /g)].map((m) => m[1])).toEqual(numbered.slice(1).map((c) => c.no));
  expect(programmerChapters.at(-1)?.id).toBe('limits');
  expect(map).toMatch(/appendix.*limits at a glance/i);
  const memory = programmerChapters.findIndex((c) => c.id === 'memory');
  expect(programmerChapters[memory + 1].id).toBe('screen');
});

it('resolves the documentation’s Markdown heading links in their destination files', () => {
  const docs = import.meta.glob<string>('../../../docs/**/*.md', { eager: true, query: '?raw', import: 'default' });
  for (const [file, markdown] of Object.entries(docs)) {
    for (const [, path, anchor] of markdown.matchAll(/\]\(([^():#\s]*)#([\w-]+)\)/g)) {
      const destination = path ? resolve(here, file, '..', path) : resolve(here, file);
      const contents = readFileSync(destination, 'utf8').replace(/^```[^\n]*[\s\S]*?^```/gm, '');
      const anchors = [...contents.matchAll(/^#{1,6} (.+)$/gm)].map((m) =>
        m[1]
          .toLowerCase()
          .replace(/[^\w -]/g, '')
          .replace(/ /g, '-'),
      );
      expect(anchors, `${file} links to ${path}#${anchor}`).toContain(anchor);
    }
  }
});

it('opens the Programmer’s Guide chapter named in the Under the Hood manual', async () => {
  const manual = JSON.parse(src('../../../games/under-the-hood/manual.json')) as { pages: { html: string }[] };
  const reference = manual.pages
    .map((p) => p.html)
    .join('')
    .match(/chapter (\d+) of the Programmer’s Guide, <a href="#\/programmers-guide\/([^"]+)">([^<]+)<\/a>/);
  expect(reference).toBeTruthy();
  const [, no, id, title] = reference!;
  expect(chapterById(id)).toMatchObject({ no, title });
  expect((await loadChapter(id)).trim()).not.toBe('');
});

function expectTourDestinations(readme: string) {
  const rows = [...readme.matchAll(/^\| `([a-z-]+)`[^|\n]*\|([^|\n]*)\|/gm)];
  expect(rows.map(([, id]) => id)).toEqual(tourChapters.map((chapter) => chapter.id));

  rows.forEach(([, id, page], index) => {
    const chapter = tourChapters[index];
    const stops = [chapter.file ?? chapter.hash, ...chapter.steps.flatMap((step) => (step.go ? [step.go.hash] : []))];
    let route = chapter.hash;
    const documented = [...page.matchAll(/`([^`]+)`/g)].map(([, reference]) => {
      if (chapter.file || reference.startsWith('#/')) route = reference;
      else if (reference.startsWith('?')) route = route.split('?')[0] + reference;
      else route = route.slice(0, route.lastIndexOf('/') + 1) + reference;
      return route;
    });
    expect(documented.length, id).toBeGreaterThan(0);
    // Some rows give only the opening page and omit later navigation within the chapter.
    expect(documented, id).toEqual(stops.slice(0, documented.length));
  });
}

it.each([
  ['intro.fli', 'missing.fli', 'edit-animation'],
  ['blender.lst', 'missing.lst', 'edit-animation'],
  ['?tab=player', '?tab=missing', 'edit-player'],
])('rejects the documented tour destination %s when mistyped as %s', (original, typo, chapter) => {
  const readme = src('../tour/README.md').replace(`\`${original}\``, `\`${typo}\``);
  expect(() => expectTourDestinations(readme)).toThrow(chapter);
});

it('opens the documented tour chapter routes and their sample files', () => {
  expectTourDestinations(src('../tour/README.md'));
  for (const c of tourChapters) {
    for (const hash of [c.hash, ...c.steps.flatMap((s) => (s.go ? [s.go.hash] : []))]) {
      const {
        path: [kind, id, file],
      } = parseHash(hash);
      if (kind === 'help' && id) expect(GUIDE_SECTIONS.map(([section]) => section)).toContain(id);
      if (kind === 'p') {
        expect(id, hash).toMatch(/^look:/);
        expect(existsSync(resolve(here, '../../../games', id.slice(5), 'disk', file ?? '')), hash).toBe(true);
      }
    }
  }
});

it('continues the NO CARRIER phone list on the next page', () => {
  const start = ZINE.findIndex((p) => p.scrawl?.includes('continued over ->'));
  expect(ZINE[start].title).toBe('THE PHONE LIST');
  expect(ZINE[start + 1].title).toBe('MORE NUMBERS');
  expect(ZINE[start + 1].list?.length).toBeGreaterThan(0);
});

it('indexes each Tiny Pockets story under the volume that prints it', () => {
  const entries = BRIEF_STORY_ZINE_VOLUMES.flatMap((v) => v.pages.filter((p) => p.kind === 'story').map((p) => `Vol. ${v.number} · ${p.title}`));
  const index = BRIEF_STORY_ZINE_VOLUMES.flatMap((v) => v.pages.filter((p) => p.kind === 'index').flatMap((p) => p.text.split('\n')));
  expect(index).toEqual(entries);
});

it('sends the phone builder to the front-panel step and the available parts lists', () => {
  const chapters = phoneChapters(src('../../../games/year2000/phone/README.md'), src('../../../games/year2000/phone/PARTS.md'));
  const chapter = (head: string) => chapters.find((c) => c.head === head)!.blocks;
  const steps = chapter('Build order for a beginner').find((b) => b.tag === 'ol');
  expect(steps?.tag === 'ol' && steps.items[5]?.[0]).toMatch(/^Front:/);
  expect(chapter('Programming the PIC').map(blockText).join(' ')).toContain('step 6 of Build order for a beginner');
  expect(chapter('Checked and not checked').map(blockText).join(' ')).toContain('Parts list chapter and the Junior Lab parts list CSV');
  expect(chapter('Parts list').some((b) => b.tag === 'table')).toBe(true);
  expect(phoneAttachments().some((a) => a.file === 'phone-parts-list-junior-lab.csv')).toBe(true);
});

describe('the Owner’s Guide', () => {
  const files = ['dosManualFront.ts', 'dosManualDesign.ts', 'dosManualBack.ts'].map(src);
  // Each page is a cover or page('running head', `body`); the page's number is its place in the booklet.
  const pages = files.flatMap((s) =>
    [...s.matchAll(/(cover: true,)|\bpage\(\s*'([^']+)',\s*`([\s\S]*?)`/g)].map((m) => ({ head: m[2] ?? '', body: m[3] ?? '' })),
  );

  it('lists each chapter, and each section it names, at the page it opens on', () => {
    const contents = pages.find((p) => p.head === 'Contents')!.body;
    let chapter = '';
    for (const m of contents.matchAll(/<tr><td>((?:&nbsp;)*)([^<]+)<\/td><td>(\d+)<\/td><\/tr>/g)) {
      const [, indent, title, no] = m;
      if (!indent) {
        chapter = title;
        expect(pages[Number(no)].head, `“${title}” opens on page ${no}`).toBe(title);
        expect(pages[Number(no) - 1].head, `“${title}” opens a new chapter`).not.toBe(title);
      } else {
        // A section's line may word its heading its own way, so it must be a page of its chapter; one with a matching heading must be on that page.
        expect(pages[Number(no)].head, `“${title}” on page ${no}`).toBe(chapter);
        const named = pages.findIndex((p) => new RegExp(`<h[12]>${title}</h[12]>`).test(p.body));
        if (named >= 0) expect(named, `“${title}”`).toBe(Number(no));
      }
    }
  });

  it('sends the sample backup reference to the ZIP instructions', () => {
    const reference = pages
      .map((p) => p.body)
      .join('')
      .match(/SAMPLE\.ZIP<\/code> under its own name \(page (\d+)\)/);
    expect(reference).toBeTruthy();
    expect(pages[Number(reference![1])].body).toMatch(/<h3>Backup<\/h3>[\s\S]*?\.ZIP/);
  });

  it('names chapters and appendices that exist', () => {
    const heads = new Set(pages.map((p) => p.head));
    for (const p of pages) {
      for (const m of p.body.matchAll(/\bChapter (\d+)\b/gi))
        expect(
          [...heads].some((h) => h.startsWith(`${m[1]}. `)),
          `${p.head}: Chapter ${m[1]}`,
        ).toBe(true);
      for (const m of p.body.matchAll(/Appendix ([A-Z])\b/g))
        expect(heads.has([...heads].find((h) => h.startsWith(`Appendix ${m[1]}.`)) ?? ''), `${p.head}: Appendix ${m[1]}`).toBe(true);
    }
  });
});

describe('Dex’s report', () => {
  const pages = [...pagesA, ...pagesB, ...pagesC];
  const page = (n: number) => pages[n]?.body ?? '';
  it('sends “page N” to the page it describes', () => {
    expect(page(17)).toContain('Programming (3)');
    expect(page(16)).toContain('configuration word');
    expect(page(14)).toContain('<ol start="5"');
    expect(page(8)).toContain('Circuit 1');
    expect(page(15)).toContain('Programming (1)');
    expect(page(14)).toContain('(pages 15-17)');
  });
});

describe.skipIf(!existsSync(join(pub, 'laser')))('the files the Feelies offer (built output)', () => {
  it('exist for every laser kit: its pictures, sheets and downloads', () => {
    let kits = 0;
    for (const game of readdirSync(join(pub, 'laser'), { withFileTypes: true })) {
      if (!game.isDirectory()) continue;
      const id = game.name;
      const gameDir = join(pub, 'laser', id);
      const subfolders = readdirSync(gameDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
      for (const sub of ['', ...subfolders]) {
        const dir = join(pub, 'laser', id, sub);
        if (!existsSync(join(dir, 'manifest.json'))) continue;
        const kit = kitOf(JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8')), dir);
        if (!kit) throw new Error(`Unrecognized kit manifest in ${dir}`);
        kits++;
        const files = [...kit.previews.map((p) => p.file), ...kit.downloads.map((d) => d.file), ...(kit.sheets ?? []).map((s) => s.preview)];
        for (const f of files) expect(existsSync(resolve(dir, f)), resolve(dir, f)).toBe(true);
      }
    }
    expect(kits).toBeGreaterThan(0);
  });

  it('exist for every trinket: its STL, 3MF and supports (or the pack the site makes each from)', () => {
    for (const id of readdirSync(join(pub, 'trinkets'))) {
      const manifest = join(pub, 'trinkets', id, 'manifest.json');
      if (!existsSync(manifest)) continue;
      const m = JSON.parse(readFileSync(manifest, 'utf8')) as {
        items: { file: string; preview?: string; colors: { file: string }; supports: { file: string } | null }[];
        packed?: string[];
      };
      for (const it of m.items)
        for (const f of [it.file, it.preview, it.colors.file, it.supports?.file])
          if (f) {
            const served = m.packed?.includes(f) ? `${f}.pack` : f;
            expect(existsSync(join(pub, 'trinkets', id, served)), `trinkets/${id}/${served}`).toBe(true);
          }
    }
  });

  it('exist for the phone kit, and its ZIPs hold both builds’ printer parts and board projects', () => {
    // the printer-parts ZIP is made in the browser from its pack (phoneData.ts phonePrinterZip)
    for (const a of phoneAttachments()) if (!a.link) expect(existsSync(join(pub, a.href.replace(/^\.\//, ''))), a.href).toBe(true);
    const zip = (f: string) => listZip(new Uint8Array(readFileSync(join(pub, 'trinkets/phone', f)))).map((e) => e.name);
    const parts = unpackFiles(new Uint8Array(inflateRawSync(readFileSync(join(pub, 'trinkets/phone/phone-3d-printer-parts.pack'))))).map((e) => e.name);
    const board = zip('phone-circuit-board.zip');
    for (const b of ['junior-lab', 'deluxe']) {
      expect(
        parts.some((n) => n.startsWith(`${b}/`) && n.endsWith('.stl')),
        `${b} STLs`,
      ).toBe(true);
      expect(board, `${b} KiCad project`).toContain(`${b}/kicad/phone.kicad_pro`);
      expect(
        board.some((n) => n.startsWith(`${b}/gerbers/`)),
        `${b} Gerbers`,
      ).toBe(true);
      expect(board, `${b} firmware for the book’s programming step`).toContain(`${b}/firmware/phone.hex`);
      expect(board).toContain(`${b}/firmware/phone.asm`);
    }
  });
});
