// A new game's opening: the shipped sting files, the cards each choice puts first in the
// title list (and taking them out again exactly), the "presents" card fitting its 320x200
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
import { NAME_MAX, addOpening, nameProblem, openingOf, removeOpening, type OpeningProject, type OpeningStyle } from './openingWire';

const PUBLIC = join(__dirname, '../../../../public/opening');
const STING = { animation: readFileSync(join(PUBLIC, 'madewith.fli')), still: readFileSync(join(PUBLIC, 'madewith.gif')) };

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
  addOpening(p, p.start, openingCards(style, name, style === 'none' ? undefined : STING[style]), style, name);

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

  it('has a 320x200 still picture', () => {
    const g = decodeGif(STING.still);
    expect([g.width, g.height]).toEqual([320, 200]);
  });
});

describe('the opening in a new game', () => {
  const cases: [OpeningStyle, string, string[]][] = [
    ['animation', '', ['madewith.fli 0']],
    ['animation', 'Doc Leo', ['madewith.fli 0', 'presents.fli 0']],
    ['still', '', ['madewith.gif 4']],
    ['still', 'Doc Leo', ['madewith.gif 4', 'presents.gif 4']],
    ['none', 'Doc Leo', ['presents.fli 0']],
  ];
  for (const [style, name, want] of cases)
    it(`${style}${name ? ' with a name' : ''}: ${want.join(', ')} in a new TITLE.LST`, () => {
      const p = project();
      add(p, style, name);
      expect(p.start.files[0]).toBe('title.lst');
      expect(listOf(p, 'title.lst').map((e) => `${e.name} ${e.pause}`)).toEqual(want);
      for (const w of want) expect(p.files.has(w.split(' ')[0])).toBe(true);
      expect(openingOf(p, p.start)?.files).toEqual(want.map((w) => w.split(' ')[0]));
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
    vi.stubGlobal('fetch', async (url: URL) => new Response(url.pathname.endsWith('.gif') ? STING.still : STING.animation));
    await applyOpening(p, p.start, [p.start], 'animation', 'Doc Leo');
    await applyOpening(p, p.start, [p.start], 'still', '');
    expect(listOf(p, 'title.lst').map((e) => e.name)).toEqual(['madewith.gif']);
    expect(p.files.has('presents.fli') || p.files.has('madewith.fli')).toBe(false);
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
