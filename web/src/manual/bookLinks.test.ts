// Links and references across the books and the box's files, checked without a browser: the Guide's #/ links land on
// a section or page; the Owner's Guide contents name the page each chapter opens on and its chapter cross-references
// exist; Dex's report page references reach the page they describe; and each file a Feelie's page offers to download
// (laser kits, trinkets, the phone kit's ZIPs) exists in the built output (skipped where `games/` has not been built).
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { listZip } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { GUIDE_SECTIONS } from './guideSections';
import { CHAPTERS } from './ultimate/plan';
import { STARTER_ORDER } from '../project/starter';
import { pagesA } from './printables/dexReportPagesA';
import { pagesB } from './printables/dexReportPagesB';
import { pagesC } from './printables/dexReportPagesC';
import { kitOf } from '../desk/boxes/laserKits';
import { phoneAttachments } from './printables/feelieItems';

const here = import.meta.dirname;
const src = (f: string) => readFileSync(join(here, f), 'utf8');
const pub = resolve(here, '../../public');
const SITE_PATHS = ['p', 'game', 'help', 'cast', 'credits', 'achievements', 'mac', 'windows', 'linux', 'magazine', 'library', 'programmers-guide'];

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
    const ids = new Set(GUIDE_SECTIONS.map(([id]) => id));
    for (const [id, , html] of GUIDE_SECTIONS) {
      for (const m of html.matchAll(/href="#\/([a-z]+)(?:\/([a-z-]+))?"/g)) {
        expect(SITE_PATHS, `${id} links #/${m[1]}`).toContain(m[1]);
        if (m[1] === 'help' && m[2]) expect(ids.has(m[2]), `${id} links #/help/${m[2]}`).toBe(true);
      }
    }
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

  it('names chapters and appendices that exist', () => {
    const heads = new Set(pages.map((p) => p.head));
    for (const p of pages) {
      for (const m of p.body.matchAll(/\(Chapter (\d)\)/g))
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
    for (const id of readdirSync(join(pub, 'laser'))) {
      for (const sub of ['', 'stage-box/', 'patch/']) {
        const dir = join(pub, 'laser', id, sub);
        if (!existsSync(join(dir, 'manifest.json'))) continue;
        const kit = kitOf(JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8')), dir);
        if (!kit) continue;
        kits++;
        const files = [...kit.previews.map((p) => p.file), ...kit.downloads.map((d) => d.file), ...(kit.sheets ?? []).map((s) => s.preview)];
        for (const f of files) expect(existsSync(resolve(dir, f)), `laser/${id}/${sub}${f}`).toBe(true);
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
    for (const a of phoneAttachments()) expect(existsSync(join(pub, a.href.replace(/^\.\//, ''))), a.href).toBe(true);
    const zip = (f: string) => listZip(new Uint8Array(readFileSync(join(pub, 'trinkets/phone', f)))).map((e) => e.name);
    const parts = zip('phone-3d-printer-parts.zip');
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
      expect(board, `${b} firmware for the book’s programming step`).toContain(`${b}/firmware/phone.asm`);
    }
  });
});
