import { describe, expect, it } from 'vitest';
import { BACKBL, newBlockSet, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, parseGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { newMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { GameFiles } from '../../project/files';
import { scenePixels } from '../../gfx/levelPicture';
import { planColorFolds } from './lookAlikeColors';

function game(opts: { sharedPalette?: boolean; otherUse?: boolean } = {}): GameFiles {
  const f = new GameFiles();
  const bbl = newBlockSet('bbl');
  const half = (c1: number, c2: number) => Uint8Array.from({ length: 400 }, (_, i) => (i % 20 < 10 ? c1 : c2));
  bbl[5] = { ...bbl[5], pixels: half(40, 41) };
  bbl[6] = { ...bbl[6], pixels: half(50, 51) };
  f.set('x.bbl', serializeBlocks(bbl.slice(0, BACKBL)));
  const pal = (a: [number, number, number][]) => {
    const p = new Uint8Array(768);
    for (let i = 0; i < 256; i++) p.set([(i * 5) % 64, (i * 3) % 64, (i * 7) % 64], i * 3);
    a.forEach((c, k) => p.set(c, (k + 40) * 3));
    return p;
  };
  f.set(
    'p1.pal',
    pal([
      [63, 0, 0],
      [0, 0, 63],
    ]),
  );
  f.set(
    'p2.pal',
    opts.sharedPalette
      ? f.get('p1.pal')!
      : pal([
          [10, 20, 30],
          [30, 20, 10],
        ]),
  );
  f.set(
    'p1.pal',
    pal([
      [63, 0, 0],
      [0, 0, 63],
    ]),
  );
  const g = newGame('T');
  for (const [i, cell] of [5, 6].entries()) {
    const m = newMap();
    m.blocks.fill(0);
    m.blocks[5] = opts.otherUse && i === 1 ? 5 : cell;
    f.set(`m${i + 1}.map`, serializeMap(m));
    const s = emptyScene(ADVTYPE);
    s.links = Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
    s.files = [`p${i + 1}.pal`, `m${i + 1}.map`, 'x.bbl', '', '', '', '', '', '', '', '', ...new Array(9).fill('')];
    g.scenes.push(s);
  }
  f.set('t.gam', serializeGame(g));
  return f;
}

const draw = (f: GameFiles) => parseGame(f.get('t.gam')!).scenes.map((s) => scenePixels(f, s, 0, 0, 100, 100));
const rgb = (p: ReturnType<typeof scenePixels>) =>
  !p ? 'none' : Array.from(p.pixels, (v) => `${p.palette[v * 3]}.${p.palette[v * 3 + 1]}.${p.palette[v * 3 + 2]}`).join();

describe('same shape in other colors', () => {
  it('folds block 6 into block 5, rewriting only the palette its scene opens, and every scene draws the same', () => {
    const f = game();
    const step = planColorFolds(f, 't.gam')!;
    expect(step.kind).toBe('look');
    const before = draw(f).map(rgb);
    expect(before.map((x) => x === 'none')).toEqual([true, true, false, false]);
    step.apply(f, 't.gam');
    expect(draw(f).map(rgb)).toEqual(before);
    expect(step.moves![0].at.get(6)).toBe(5);
    expect(planColorFolds(f, 't.gam')).toBeUndefined();
  });
  it('does not fold when a scene that opens the rewritten palette draws the kept block', () => {
    expect(planColorFolds(game({ sharedPalette: true, otherUse: true }), 't.gam')).toBeUndefined();
  });
});
