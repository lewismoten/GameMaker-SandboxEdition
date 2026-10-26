// A new game's opening: the shipped intros (each a few seconds, ending on black, and readable by
// DOS PLAYGAME), the classic one taken from the CD as it is, the cards each choice puts first in
// the title list (and taking them out again exactly), the "presents" card fitting its 320x200
// screen for any name the field takes, and the name check.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { newGame, serializeGame, type Scene } from '../../../formats/game';
import { decodeGif } from '../../../formats/gif';
import { decodeFliFrames } from '../../../formats/fliFrames';
import { parseSlideList, serializeSlideList } from '../../../formats/graphicScripts';
import { GameFiles } from '../../../project/files';
import { SCENE_H, SCENE_W } from '../../editors/animation/scene/sceneModel';
import { restBox, textWarnings } from '../../editors/animation/scene/sceneText';
import { applyOpening, openingCards, presentsCard, presentsText } from './openingCards';
import { fliFaults } from '../../../formats/fliLimits';
import { NAME_MAX, addOpening, nameProblem, openingOf, removeOpening, type OpeningProject } from './openingWire';
import { CLASSIC_SITE, INTROS, introOf, type OpeningStyle } from './openingIntros';

const PUBLIC = join(__dirname, '../../../../public');
const CD = join(__dirname, '../../../../../cd');
/** An intro's file where the site serves it from: public/, or the CD's games (scripts/cdGames.ts serves cd/gameware/ as games/gameware/). */
const siteFile = (site: string) => new Uint8Array(readFileSync(site.startsWith('games/') ? join(CD, site.slice('games/'.length)) : join(PUBLIC, site)));
const BYTES = new Map(INTROS.filter((i) => i.site).map((i) => [i.style, siteFile(i.site!)]));
const STING = { animation: BYTES.get('animation')!, still: BYTES.get('still')! };

/** A game's files with a companion kept in memory, as a Project keeps them. */
function project(): OpeningProject & { start: Scene } {
  const files = new GameFiles();
  const game = newGame('Test');
  files.set('test.gam', serializeGame(game));
  const extras = new Map<string, unknown>();
  return {
    files,
    gam: 'test.gam',
    start: game.scenes[0],
    extras: <T>(f: string, s: string, fb: T) => (extras.has(`${f}/${s}`) ? (extras.get(`${f}/${s}`) as T) : fb),
    setExtras: (f, s, v) => void (v === undefined ? extras.delete(`${f}/${s}`) : extras.set(`${f}/${s}`, v)),
    freeName: (base, ext) => {
      for (let i = 0; ; i++) {
        const n = `${i ? base.slice(0, 8 - String(i).length) + i : base}.${ext}`;
        if (!files.has(n)) return n;
      }
    },
  };
}

const listOf = (p: OpeningProject, name: string) => parseSlideList(p.files.get(name)!);
const add = (p: ReturnType<typeof project>, style: OpeningStyle, name: string) =>
  addOpening(p, p.start, openingCards(style, name, BYTES.get(style)), style, name);

describe('the shipped sting', () => {
  it('is a 320x200 FLI of a few seconds that fades in from and out to black', () => {
    const fli = decodeFliFrames(STING.animation);
    expect(fli.width).toBe(320);
    expect(fli.height).toBe(200);
    const seconds = (fli.frames.length * fli.speed) / 70;
    expect(seconds).toBeGreaterThan(3);
    expect(seconds).toBeLessThan(6);
    const light = (pal: Uint8Array) => pal.reduce((a, b) => a + b, 0);
    expect(light(fli.frames[0].palette)).toBeLessThan(light(fli.frames[20].palette) / 4);
    expect(light(fli.frames[fli.frames.length - 1].palette)).toBe(0);
  });

  const flis = INTROS.filter((i) => i.file?.endsWith('.fli') && i.style !== 'classic');
  it('comes in four animations', () => expect(flis.length).toBe(4));
  for (const intro of flis)
    it(`${intro.label}: 320x200, 4 to 5 seconds, ends on black, and DOS PLAYGAME reads it`, () => {
      const bytes = BYTES.get(intro.style)!;
      expect(fliFaults(bytes)).toEqual([]); // chunks of at most 16,000 bytes, no all-black chunk, known types
      const fli = decodeFliFrames(bytes);
      expect([fli.width, fli.height]).toEqual([320, 200]);
      const seconds = (fli.frames.length * fli.speed) / 70;
      expect(seconds).toBeGreaterThanOrEqual(4);
      expect(seconds).toBeLessThanOrEqual(5);
      expect(fli.frames[fli.frames.length - 1].palette.every((v) => v === 0)).toBe(true);
      expect(intro.file).toBe('madewith.fli');
    });

  it('has a 320x200 still picture', () => {
    const g = decodeGif(STING.still);
    expect([g.width, g.height]).toEqual([320, 200]);
  });
});

describe('the classic RSD intro', () => {
  it('is the CD’s RSDTBOX.FLI, written into the game byte for byte', () => {
    const cd = readFileSync(join(CD, 'gameware/donut/rsdtbox.fli'));
    expect(CLASSIC_SITE).toBe('games/gameware/donut/rsdtbox.fli');
    const p = project();
    add(p, 'classic', '');
    expect(listOf(p, 'title.lst')).toEqual([{ name: 'rsdtbox.fli', pause: 0 }]);
    expect(p.files.get('rsdtbox.fli')).toEqual(new Uint8Array(cd));
    expect(openingOf(p, p.start)?.style).toBe('classic');
  });

  it('shows the same pictures as TEXTBOX3.FLI (they differ only in a color no pixel of theirs uses)', () => {
    const shown = (file: string) =>
      decodeFliFrames(readFileSync(join(CD, file))).frames.map((f) => [...f.pixels].map((c) => f.palette.subarray(c * 3, c * 3 + 3).join()).join(' '));
    expect(shown('gameware/heart/textbox3.fli')).toEqual(shown('gameware/donut/rsdtbox.fli'));
  });
});

describe('the opening in a new game', () => {
  const cases: [OpeningStyle, string, string[]][] = [
    ['animation', '', ['madewith.fli 0']],
    ['animation', 'Doc Leo', ['madewith.fli 0', 'presents.fli 0']],
    ['still', '', ['madewith.gif 4']],
    ['still', 'Doc Leo', ['madewith.gif 4', 'presents.gif 4']],
    ['none', 'Doc Leo', ['presents.fli 0']],
    ['blocks', '', ['madewith.fli 0']],
    ['wipe', 'Doc Leo', ['madewith.fli 0', 'presents.fli 0']],
    ['type', '', ['madewith.fli 0']],
    ['classic', 'Doc Leo', ['rsdtbox.fli 0', 'presents.fli 0']],
  ];
  for (const [style, name, want] of cases)
    it(`${style}${name ? ' with a name' : ''}: ${want.join(', ')} in a new TITLE.LST`, () => {
      const p = project();
      add(p, style, name);
      expect(p.start.files[0]).toBe('title.lst');
      expect(listOf(p, 'title.lst').map((e) => `${e.name} ${e.pause}`)).toEqual(want);
      for (const w of want) expect(p.files.has(w.split(' ')[0])).toBe(true);
      expect(openingOf(p, p.start)?.files).toEqual(want.map((w) => w.split(' ')[0]));
      const intro = introOf(style).file;
      if (intro) expect(p.files.get(intro)).toEqual(BYTES.get(style));
    });

  it('none without a name adds nothing', () => {
    const p = project();
    add(p, 'none', '');
    expect(p.start.files[0]).toBe('');
    expect(p.files.size).toBe(1);
  });

  it('wraps a title picture in a list and gives it back when removed', () => {
    const p = project();
    p.files.set('title.gif', STING.still);
    p.start.files[0] = 'title.gif';
    add(p, 'animation', 'Doc Leo');
    expect(p.start.files[0]).toBe('title.lst');
    expect(listOf(p, 'title.lst')).toEqual([
      { name: 'madewith.fli', pause: 0 },
      { name: 'presents.fli', pause: 0 },
      { name: 'title.gif', pause: 15 }, // as long as PLAYGAME shows a title picture
    ]);
    expect(removeOpening(p, p.start)).toBe(true);
    expect(p.start.files[0]).toBe('title.gif');
    expect(p.files.names().sort()).toEqual(['test.gam', 'title.gif']);
    expect(openingOf(p, p.start)).toBeUndefined();
  });

  it('goes at the top of a title list the game has, and comes out of it again', () => {
    const p = project();
    const own = serializeSlideList([
      { name: 'intro.fli', pause: 0 },
      { name: 'title.gif', pause: 10 },
    ]);
    p.files.set('title.lst', own);
    p.start.files[0] = 'title.lst';
    add(p, 'still', '');
    expect(listOf(p, 'title.lst').map((e) => e.name)).toEqual(['madewith.gif', 'intro.fli', 'title.gif']);
    removeOpening(p, p.start);
    expect(p.files.get('title.lst')).toEqual(own);
    expect(p.files.has('madewith.gif')).toBe(false);
  });

  it('is found by its file names in a game whose editor extras were lost (an import)', () => {
    const p = project();
    p.files.set('madewith.fli', STING.animation);
    p.files.set('title.lst', serializeSlideList([{ name: 'madewith.fli', pause: 0 }]));
    p.start.files[0] = 'title.lst';
    expect(openingOf(p, p.start)?.style).toBe('animation');
    removeOpening(p, p.start);
    expect(listOf(p, 'title.lst')).toEqual([]);
    expect(p.files.has('madewith.fli')).toBe(false);
  });

  it('is replaced, not doubled, when chosen again (fetching the sting from the site)', async () => {
    const p = project();
    vi.stubGlobal('document', { baseURI: 'http://localhost/' });
    vi.stubGlobal('fetch', async (url: URL) => new Response(siteFile(url.pathname.slice(1))));
    await applyOpening(p, p.start, [p.start], 'animation', 'Doc Leo');
    await applyOpening(p, p.start, [p.start], 'still', '');
    expect(listOf(p, 'title.lst').map((e) => e.name)).toEqual(['madewith.gif']);
    expect(p.files.has('presents.fli') || p.files.has('madewith.fli')).toBe(false);
    // changing one's mind: swapped for the classic one, then for another intro
    await applyOpening(p, p.start, [p.start], 'classic', '');
    expect(listOf(p, 'title.lst').map((e) => e.name)).toEqual(['rsdtbox.fli']);
    await applyOpening(p, p.start, [p.start], 'wipe', '');
    expect(listOf(p, 'title.lst').map((e) => e.name)).toEqual(['madewith.fli']);
    expect(p.files.get('madewith.fli')).toEqual(BYTES.get('wipe'));
    expect(p.files.has('rsdtbox.fli') || p.files.has('madewith.gif')).toBe(false);
    expect(openingOf(p, p.start)?.style).toBe('wipe');
  });
  afterEach(() => vi.unstubAllGlobals());
});

describe('the presents card', () => {
  const names = ['Doc Leo', 'Sandbox Software of Fort Ashby', 'W'.repeat(NAME_MAX), 'A'.repeat(20) + ' ' + 'B'.repeat(11), 'I', '“Quoted” Games…'];
  for (const name of names)
    it(`fits “${name}” inside the screen`, () => {
      const t = presentsText(name);
      for (const item of [t.name, t.presents]) {
        expect(textWarnings(item)).toEqual([]);
        const b = restBox(item);
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.y).toBeGreaterThanOrEqual(0);
        expect(b.x + b.w).toBeLessThanOrEqual(SCENE_W);
        expect(b.y + b.h).toBeLessThanOrEqual(SCENE_H);
      }
      expect(restBox(t.presents).y).toBeGreaterThan(restBox(t.name).y + restBox(t.name).h);
    });

  it('is a short FLI, or a picture for a still opening', () => {
    const fli = decodeFliFrames(presentsCard('Doc Leo', false).bytes);
    expect(fli.frames.length).toBe(40);
    const gif = decodeGif(presentsCard('Doc Leo', true).bytes);
    expect([gif.width, gif.height]).toEqual([320, 200]);
  });
});

describe('the name check', () => {
  it('takes plain names up to the limit and refuses longer ones or letters the PC font lacks', () => {
    expect(nameProblem('')).toBeUndefined();
    expect(nameProblem('Doc Leo’s “Games”')).toBeUndefined();
    expect(nameProblem('x'.repeat(NAME_MAX))).toBeUndefined();
    expect(nameProblem('x'.repeat(NAME_MAX + 1))).toMatch(/32 letters/);
    expect(nameProblem('Café')).toMatch(/é/);
  });
});
