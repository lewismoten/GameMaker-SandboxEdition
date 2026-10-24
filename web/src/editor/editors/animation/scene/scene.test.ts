// The animation maker: text placement and its edge warnings, actor paths and mirroring,
// palette matching, rendering to an .FLI PLAYGAME can play, and the generators.
import { describe, expect, it } from 'vitest';
import { ADVTYPE, emptyScene as emptyGameScene, newGame, type Game } from '../../../../formats/game';
import { BLEN, newBlockSet, serializeBlocks } from '../../../../formats/blocks';
import { newCharacter, serializeCharacter } from '../../../../formats/character';
import { emptyMonster, serializeMonsters } from '../../../../formats/monster';
import { newMap, serializeMap } from '../../../../formats/map';
import { defaultPalette } from '../../../../formats/palette';
import { decodeFliFrames } from '../../../../formats/fliFrames';
import { textBytes } from '../../../../formats/binary';
import { actorAt, allItems, emptyScene, normalizeScene, textItem, type ActorItem, type Scene, type TextItem } from './sceneModel';
import { fitText, restBox, textAt, textSize, textWarnings, wrapText } from './sceneText';
import { mergePalettes, sceneAssets, walkSequence } from './sceneAssets';
import { mirrored, renderScene, sceneFli } from './sceneRender';
import { generateScene, MONSTER_NAMES, storyText, type GenerateSource } from './sceneGenerate';

/** A one-level game in memory: a red/blue hero walking right, two monsters on the map, a story. */
function fixture(): GenerateSource {
  const pal = defaultPalette();
  // colors only the sprites use, so they are matched into a picture's palette
  pal.set([63, 0, 0], 200 * 3);
  pal.set([0, 0, 63], 201 * 3);
  const cbl = newBlockSet('cbl');
  cbl[0].pixels.fill(255);
  cbl[0].pixels[0] = 200; // top-left pixel red: shows mirroring
  cbl[1].pixels.fill(201);
  const chr = newCharacter();
  const walk = chr.sequences[5];
  walk.frames[0] = { ...walk.frames[0], x: 4, y: 0, pic1: 0, pic2: 1, pause: 2 };
  walk.frames[1] = { ...walk.frames[1], x: 4, y: 0, pic1: 0, pic2: 1, pause: 2, orient: 0 };
  const mbl = newBlockSet('mbl');
  mbl[3].pixels.fill(201);
  const mons = Array.from({ length: 64 }, emptyMonster);
  mons[2].pic[0] = [3, 4];
  mons[2].pic[1] = [100, 0];
  mons[5].pic[0] = [3, 4];
  mons[5].pic[1] = [100, 0];
  const map = newMap();
  map.monsters[0].monnum = 2;
  map.monsters[1].monnum = 5;
  const game: Game = newGame('Test Quest: The Return');
  const level = emptyGameScene(ADVTYPE);
  level.files = ['lvl.pal', 'lvl.map', 'lvl.bbl', 'lvl.mon', 'lvl.mbl', 'hero.chr', 'hero.cbl', '', '', '', '', ...new Array(9).fill('')];
  game.scenes.push(level);
  game.scenes[0].links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: { x: 10, y: 20 } };
  game.scenes[0].files[4] = 'story.txt';
  const files = new Map<string, Uint8Array>([
    ['lvl.pal', pal],
    ['lvl.map', serializeMap(map)],
    ['lvl.bbl', serializeBlocks(newBlockSet('bbl'))],
    ['lvl.mon', serializeMonsters(mons)],
    ['lvl.mbl', serializeBlocks(mbl)],
    ['hero.chr', serializeCharacter(chr)],
    ['hero.cbl', serializeBlocks(cbl)],
    ['story.txt', textBytes('Long ago the hero lost\r\nthe key.\r\n\r\nNow the hero\r\nwants it back.\r\n')],
  ]);
  return {
    name: 'Test',
    files: { get: (n) => files.get(n.toLowerCase()), byExtension: (e) => [...files.keys()].filter((n) => n.endsWith(`.${e}`)) },
    game: () => game,
    paletteFor: () => ({ palette: pal, source: 'lvl.pal' }),
    extras: <T>(file: string, section: string, fallback: T): T => (file === 'lvl.mon' && section === MONSTER_NAMES ? (['', '', 'Slime King'] as T) : fallback),
  };
}

const hero = (over: Partial<ActorItem> = {}): ActorItem => ({
  id: 'hero',
  kind: 'actor',
  start: 0,
  end: 10,
  source: { type: 'chr', chr: 'hero.chr', cbl: 'hero.cbl', seq: -1 },
  path: [
    { f: 0, x: 0, y: 100 },
    { f: 9, x: 90, y: 100 },
  ],
  scale: 1,
  faces: 'right',
  mirror: true,
  ...over,
});

describe('text', () => {
  it('measures the 8x8 font at its scale, outline included', () => {
    expect(textSize({ text: 'ABC', scale: 2, outline: -1 })).toEqual({ w: 48, h: 16 });
    expect(textSize({ text: 'ABC\nD', scale: 1, outline: 3 })).toEqual({ w: 26, h: 20 });
  });

  it('warns when a text runs off the frame, and not when a scroll passes the edge on purpose', () => {
    const wide = textItem('A TITLE FAR TOO LONG TO FIT', { scale: 3, x: 160 });
    expect(textWarnings(wide).join(' ')).toMatch(/left edge.*right edge/);
    expect(textWarnings(textItem('HI', { y: 196 }))).toEqual([expect.stringMatching(/bottom/)]);
    expect(textWarnings(textItem('CREDITS', { y: 300, motion: 'scroll-up' }))).toEqual([]);
    expect(textWarnings(textItem('OK'))).toEqual([]);
  });

  it('fits a text by wrapping, then shrinking, then moving it in', () => {
    const fixed = fitText(textItem('A TITLE FAR TOO LONG TO FIT', { scale: 3, x: 160 }));
    expect(textWarnings(fixed)).toEqual([]);
    expect(fixed.scale).toBe(3);
    expect(fixed.text.split('\n').length).toBeGreaterThan(1);
    expect(textWarnings(fitText(textItem('SUPERCALIFRAGILISTIC', { scale: 4 })))).toEqual([]);
    expect(textWarnings(fitText(textItem('EDGE', { align: 'left', x: 300, y: -5 })))).toEqual([]);
    expect(wrapText('one two three', 7)).toBe('one two\nthree');
  });

  it('slides in to rest, types a letter at a time, and scrolls right across', () => {
    const t = textItem('HELLO', { motion: 'slide-left', rate: 10, start: 0, end: 40 });
    expect(textAt(t, 0).x).toBe(320);
    expect(textAt(t, 10).x).toBe(restBox(t).x);
    const typed = { ...t, motion: 'type' as const, rate: 2 };
    expect(textAt(typed, 0).letters).toBe(1);
    expect(textAt(typed, 4).letters).toBe(3);
    const roll = { ...t, motion: 'scroll-up' as const } satisfies TextItem;
    expect(textAt(roll, 0).y).toBe(200);
    expect(textAt(roll, 39).y).toBe(-textSize(roll).h);
  });
});

describe('actors', () => {
  it('moves along its keys, and mirrors when it goes against the way it faces', () => {
    const path = [
      { f: 0, x: 0, y: 0 },
      { f: 10, x: 100, y: 50 },
      { f: 20, x: 40, y: 50 },
    ];
    expect(actorAt(path, 5)).toEqual({ x: 50, y: 25, dx: 100 });
    expect(actorAt(path, 15)).toEqual({ x: 70, y: 50, dx: -60 });
    expect(actorAt(path, 99)).toMatchObject({ x: 40, y: 50 });
    expect(mirrored('right', -1, true)).toBe(true);
    expect(mirrored('right', 1, true)).toBe(false);
    expect(mirrored('left', 1, true)).toBe(true);
    expect(mirrored('right', -1, false)).toBe(false);
  });

  it('finds the walk: the sequence that goes farthest sideways', () => {
    const chr = newCharacter();
    chr.sequences[3].frames[0] = { ...chr.sequences[3].frames[0], x: -5, pic1: 0, pic2: 1 };
    expect(walkSequence(chr.sequences)).toEqual({ seq: 3, faces: 'left' });
  });
});

describe('palette', () => {
  it('matches exactly, then gives sprites the free entries, then takes the nearest', () => {
    const base = new Uint8Array(768);
    base.set([63, 63, 63], 3);
    const used = new Set(Array.from({ length: 254 }, (_, i) => i)); // 254, 255 free
    const sp = new Uint8Array(768);
    sp.set([63, 63, 63], 10 * 3);
    sp.set([10, 20, 30], 11 * 3);
    sp.set([40, 0, 0], 12 * 3);
    sp.set([0, 40, 0], 13 * 3);
    const { palette, maps } = mergePalettes(base, used, [{ palette: sp, indices: new Set([10, 11, 12, 13]) }]);
    expect(maps[0][10]).toBe(1);
    expect(maps[0][11]).toBe(255);
    expect(maps[0][12]).toBe(254);
    expect([...palette.subarray(255 * 3)]).toEqual([10, 20, 30]);
    expect(maps[0][13]).toBe(255); // no room left: the nearest color
  });
});

describe('render', () => {
  it('writes a 320x200 .FLI whose frames are the scene, sprites in the picture’s colors', () => {
    const src = fixture();
    const scene: Scene = { ...emptyScene(), frames: 10, backgrounds: [{ start: 0, kind: 'color', palette: '', color: 7 }] };
    scene.tracks.push({ name: 'A', items: [hero(), { id: 'b', kind: 'block', start: 2, end: 10, bbl: 'lvl.bbl', block: 0, x: 0, y: 0, scale: 2 }] });
    const assets = sceneAssets(scene, src);
    expect(assets.problems).toEqual([]);
    const r = renderScene(scene, assets);
    expect(r.frames).toHaveLength(10);
    // frame 0: hero at (0, 100), red pixel at its top-left
    const red = r.frames[0][100 * 320];
    expect([...r.palettes[0].subarray(red * 3, red * 3 + 3)]).toEqual([63, 0, 0]);
    // the block (scaled 2) is there from frame 2
    expect(r.frames[1][0]).toBe(7);
    expect(r.frames[2][39 * 320 + 39]).toBe(0);
    const fli = decodeFliFrames(sceneFli(scene, r));
    expect([fli.width, fli.height, fli.frames.length, fli.speed]).toEqual([320, 200, 10, 5]);
    expect(fli.frames[5].pixels).toEqual(r.frames[5]);
  });

  it('mirrors a character walking left', () => {
    const src = fixture();
    const scene: Scene = { ...emptyScene(), frames: 10 };
    scene.tracks.push({
      name: 'A',
      items: [
        hero({
          path: [
            { f: 0, x: 100, y: 100 },
            { f: 9, x: 10, y: 100 },
          ],
        }),
      ],
    });
    const r = renderScene(scene, sceneAssets(scene, src));
    const pal = r.palettes[0];
    const at = (x: number) => [...pal.subarray(r.frames[0][100 * 320 + x] * 3, r.frames[0][100 * 320 + x] * 3 + 3)];
    expect(at(100 + BLEN - 1)).toEqual([63, 0, 0]);
  });

  it('fades each background in and out', () => {
    const src = fixture();
    const scene: Scene = {
      ...emptyScene(),
      frames: 20,
      fadeIn: 3,
      fadeOut: 3,
      backgrounds: [
        { start: 0, kind: 'color', palette: '', color: 15 },
        { start: 10, kind: 'color', palette: '', color: 15 },
      ],
    };
    const r = renderScene(scene, sceneAssets(scene, src));
    const light = (f: number) => r.palettes[f][15 * 3];
    expect(light(0)).toBeLessThan(light(5));
    expect(light(9)).toBe(0);
    expect(light(10)).toBeLessThan(light(15));
  });
});

describe('model', () => {
  it('keeps a stored scene and repairs a broken one', () => {
    const s = generateScene('intro', fixture());
    expect(normalizeScene(JSON.parse(JSON.stringify(s)))).toEqual(s);
    const odd = normalizeScene({
      frames: -4,
      background: { kind: 'picture', file: 'x.gif' },
      tracks: [{ items: [{ kind: 'text', start: 9, end: 2 }, { kind: 'nope' }] }],
    })!;
    expect(odd.frames).toBe(1);
    expect(odd.backgrounds).toEqual([{ start: 0, kind: 'picture', file: 'x.gif' }]);
    expect(odd.tracks[0].items).toHaveLength(1);
    expect(normalizeScene('junk')).toBeUndefined();
  });
});

describe('generators', () => {
  const texts = (s: Scene) => allItems(s).flatMap(({ item }) => (item.kind === 'text' ? [item] : []));

  it('makes an intro: the title over the first level, the hero walking across', () => {
    const s = generateScene('intro', fixture());
    expect(s.backgrounds[0]).toMatchObject({ kind: 'map', map: 'lvl.map' });
    expect(texts(s).map((t) => t.text)).toContain('TEST QUEST');
    const walker = allItems(s).find(({ item }) => item.kind === 'actor')!.item as ActorItem;
    expect(walker.path[0].x).toBeLessThan(0);
    expect(walker.path[walker.path.length - 1].x).toBeGreaterThanOrEqual(320);
    for (const t of texts(s)) expect(textWarnings(t), t.text).toEqual([]);
    expect(sceneAssets(s, fixture()).problems).toEqual([]);
  });

  it('makes a cast: the hero, then each placed monster with its name or its number', () => {
    const s = generateScene('cast', fixture());
    expect(texts(s).map((t) => t.text)).toEqual(['STARRING', 'HERO', 'SLIME KING', 'MONSTER 5']);
    for (const t of texts(s)) expect(textWarnings(t), t.text).toEqual([]);
    const r = renderScene(s, sceneAssets(s, fixture()));
    expect(r.frames).toHaveLength(s.frames);
  });

  it('makes a story: the storyline typed over the levels, a page at a time', () => {
    expect(storyText(fixture())).toMatch(/^Long ago/);
    const s = generateScene('story', fixture());
    const t = texts(s);
    expect(t[0].text).toMatch(/^LONG AGO THE HERO LOST THE KEY\./);
    expect(t[0].motion).toBe('type');
    for (const x of t) expect(textWarnings(x), x.text).toEqual([]);
    expect(s.backgrounds[0]).toMatchObject({ kind: 'map' });
  });
});
