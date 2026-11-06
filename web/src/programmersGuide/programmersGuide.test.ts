// The Programmer's Guide: every chapter has its file, its citations link to real files and lines, and no draft wording is left in the text.
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { CHAPTERS } from './chapters';
import { citationHref } from './citations';
import { SOURCE_FILES } from './sourceFiles';
import { readMarkdown } from '../manual/printables/markdownBlocks';

const here = import.meta.dirname;
const md = (id: string) => readFileSync(join(here, 'chapters', `${id}.md`), 'utf8');
const gm = resolve(here, '../../../code/GM');

describe('the chapters', () => {
  it('have one file each, and every file is in the contents', () => {
    const files = readdirSync(join(here, 'chapters'))
      .map((f) => f.replace(/\.md$/, ''))
      .sort();
    expect(CHAPTERS.map((c) => c.id).sort()).toEqual(files);
  });

  it('start with a title and keep to the headings the page draws', () => {
    for (const c of CHAPTERS) {
      const sections = readMarkdown(md(c.id));
      expect(sections[1]?.level, c.id).toBe(1);
      expect(
        sections.filter((s) => s.level === 1),
        c.id,
      ).toHaveLength(1);
    }
  });

  it('carry no drafting notes, names of agents, buyers or secret games', () => {
    const bad = /\[verify\]|\(draft|Kaylee|\.for-lewis|ask Lewis|owner name|serial number:|HEART OF TIN|BAKER'S DOZEN/i;
    for (const c of CHAPTERS) expect(md(c.id).match(bad)?.[0], c.id).toBeUndefined();
  });

  it('keep the corrected hidden band: a whole cell, and a hidden monster cannot hurt', () => {
    const s = md('screen');
    expect(s).toContain('whole cell, not one pixel');
    expect(s).toContain('A hidden monster cannot hurt the hero');
    expect(md('quirks')).not.toContain("corrects chapter 3's");
  });
});

describe('citations', () => {
  it('link the source by short name, file name, path and the port', () => {
    const base = 'https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/';
    expect(citationHref('PG:2344')).toBe(`${base}code/GM/PLAYGAME.C#L2344`);
    expect(citationHref('PG:2281-2290')).toBe(`${base}code/GM/PLAYGAME.C#L2281-L2290`);
    expect(citationHref('BLOC.H:35-52')).toBe(`${base}code/GM/BLOC.H#L35-L52`);
    expect(citationHref('code/GM/MAKERS.MAK:8-9')).toBe(`${base}code/GM/MAKERS.MAK#L8-L9`);
    expect(citationHref('engine/formats/character.ts:10')).toBe(`${base}web/packages/engine/src/formats/character.ts#L10`);
    expect(citationHref('engine/render.ts:36-42')).toBe(`${base}web/packages/engine/src/engine/render.ts#L36-L42`);
    expect(citationHref('engine/player/patchTable.ts:92')).toBe(`${base}web/packages/engine/src/player/patchTable.ts#L92`);
    expect(citationHref('NOSUCH.H:4')).toBeUndefined();
    expect(citationHref('ci.meter[effect]')).toBeUndefined();
  });

  it('name files that are in code/GM', () => {
    for (const f of SOURCE_FILES) expect(existsSync(join(gm, f)), f).toBe(true);
    for (const f of readdirSync(gm)) if (!/\.bak$/i.test(f)) expect(SOURCE_FILES.has(f), f).toBe(true);
  });

  it('in every chapter point at lines inside their file', () => {
    for (const c of CHAPTERS) {
      for (const m of md(c.id).matchAll(/`([^`\n]+)`/g)) {
        const href = citationHref(m[1]);
        if (!href?.includes('/code/GM/')) continue;
        const [file, from] = [/code\/GM\/([^#]+)/.exec(href)![1], /#L(\d+)/.exec(href)?.[1]];
        if (!from) continue;
        const count = readFileSync(join(gm, file), 'latin1').split('\n').length;
        expect(Number(from), `${c.id}: ${m[1]} (file has ${count} lines)`).toBeLessThanOrEqual(count);
      }
    }
  });
});
