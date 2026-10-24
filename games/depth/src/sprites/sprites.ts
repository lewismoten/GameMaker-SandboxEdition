// RAY.CBL and DEPTH.MBL: every sprite rendered from its 3D model, in one set of 64 colors that
// every level's palette carries at the same place (entries 9..72), so the sprites look the same
// on every scene.
import { emptyBlock, type Block } from '../../../../web/src/formats/blocks';
import { toBytes } from '../render/image';
import { Matcher, medianCut, putColors, type Col } from '../render/quant';
import { rgb } from '../render/tracer';
import * as C from '../models/cast';
import { rayDeath, rayModel } from '../models/ray';
import { FAR_COL, NEAR_COL } from '../tiles/cells';
import { renderSprite, type SpritePic } from './render';

/** Palette entries the sprites use. 0..8 are Game-Maker's designer colors. */
export const SPRITE_FIRST = 9;
export const SPRITE_COUNT = 64;
export const SHADOW_INDEX = SPRITE_FIRST;

export interface SpriteSet {
  cbl: Block[];
  mbl: Block[];
  /** Block numbers by name. */
  c: (name: string) => number;
  m: (name: string) => number;
  /** The 64 sprite colors (8-bit). */
  colors: Col[];
  /** The rendered pictures (for big versions on screens). */
  pics: Map<string, SpritePic>;
}

type Entry = [string, () => SpritePic];

function charEntries(): Entry[] {
  const out: Entry[] = [];
  for (const [plane, col] of [
    ['n', NEAR_COL],
    ['f', FAR_COL],
  ] as const) {
    for (let k = 0; k < 4; k++) out.push([`${plane}h${k}`, () => renderSprite(rayModel('y', (k * Math.PI) / 8, col))]);
    for (let k = 0; k < 4; k++) out.push([`${plane}v${k}`, () => renderSprite(rayModel('x', (k * Math.PI) / 8, col))]);
    out.push([`${plane}hurt`, () => renderSprite(rayModel('y', 0, rgb(255, 255, 255)), { flash: 0.55 })]);
    out.push([`${plane}fire`, () => renderSprite(rayModel('y', Math.PI / 16, [1, 1, 0.8]), { flash: 0.25 })]);
  }
  for (let s = 0; s < 6; s++) out.push([`die${s}`, () => renderSprite(rayDeath(s), { noShadow: s >= 2 })]);
  return out;
}

function monsterEntries(): Entry[] {
  const out: Entry[] = [];
  const add = (name: string, n: number, make: (f: number) => SpritePic) => {
    for (let f = 0; f < n; f++) out.push([`${name}${f}`, () => make(f)]);
  };
  add('shot', 1, () => renderSprite(C.shot(), { noShadow: true }));
  // henchmen get a dark rim: a green wireframe on the Glass Garden's mint, a bat on the dark grid
  const RIM = rgb(14, 10, 30);
  add('wire', 4, (f) => renderSprite(C.wire(f), { outline: RIM }));
  add('crystal', 2, (f) => renderSprite(C.crystal(f)));
  add('jaggy', 2, (f) => renderSprite(C.jaggy(f)));
  add('steam', 3, (f) => renderSprite(C.steam(f), { noShadow: true }));
  add('double', 4, (f) => renderSprite(C.double(f)));
  // the friends stroll, so they are side on, facing right (their paths mirror them going left)
  add('teddy', 4, (f) => renderSprite(C.sideOn(C.teddy(f))));
  add('gwinn', 4, (f) => renderSprite(C.sideOn(C.gwinn(f))));
  add('leo', 2, (f) => renderSprite(C.sideOn(C.docLeo(f))));
  // each friend's one-tick hello: the only picture that gives light (see characters/monsters.ts)
  add('teddyhi', 1, () => renderSprite(C.sideOn(C.teddy(2))));
  add('gwinnhi', 1, () => renderSprite(C.sideOn(C.gwinn(2))));
  add('leohi', 1, () => renderSprite(C.sideOn(C.docLeo(1))));
  add('bat', 2, (f) => renderSprite(C.scaled(C.bat(f), 1.3), { noShadow: true, outline: RIM }));
  // the Count a size up from his model, rimmed, so his smaller stages still show on the dark grid
  const big = (s: number, f: number) => C.scaled(C.count(s, f), s < 2 ? 1.1 : 1.3);
  for (let s = 0; s < 5; s++) add(`count${s}_`, 2, (f) => renderSprite(big(s, f), { outline: RIM }));
  // cracked: he blinks white
  for (let s = 0; s < 5; s++) add(`count${s}_hit`, 2, (f) => renderSprite(big(s, f), { flash: f ? 0.5 : 0.15, outline: RIM }));
  add('crown', 2, (f) => renderSprite(C.crown(f)));
  add('stolen', 2, (f) => renderSprite(C.stolenLens(f)));
  add('shard', 2, (f) => renderSprite(C.scaled(C.shard(f), 1.7), { noShadow: true, outline: RIM }));
  add('pop', 3, (f) => renderSprite(C.pop(f), { noShadow: true }));
  return out;
}

const pixelsOf = (p: SpritePic): Uint8Array => toBytes({ w: 20, h: 20, rgb: p.rgb });

export function buildSprites(): SpriteSet {
  const chars = charEntries().map(([n, f]) => [n, f()] as const);
  const mons = monsterEntries().map(([n, f]) => [n, f()] as const);
  if (chars.length > 50) throw new Error(`${chars.length} character blocks`);
  if (mons.length > 100) throw new Error(`${mons.length} monster blocks`);
  // colors: only the pixels that show
  const shown: Uint8Array[] = [];
  for (const [, p] of [...chars, ...mons]) {
    const b = pixelsOf(p);
    const keep: number[] = [];
    for (let i = 0; i < 400; i++) if (p.alpha[i] >= 0.5) keep.push(b[i * 3], b[i * 3 + 1], b[i * 3 + 2]);
    shown.push(Uint8Array.from(keep));
  }
  const shadow: Col = [22, 18, 36];
  const colors: Col[] = [shadow, ...medianCut(shown, SPRITE_COUNT - 1)];
  while (colors.length < SPRITE_COUNT) colors.push([0, 0, 0]);
  const pal = new Uint8Array(768);
  putColors(pal, SPRITE_FIRST, colors);
  const matcher = new Matcher(
    pal,
    Array.from({ length: SPRITE_COUNT - 1 }, (_, i) => SPRITE_FIRST + 1 + i),
  );
  const toBlock = (p: SpritePic, i: number): Block => {
    const b = emptyBlock(i, true);
    const bytes = pixelsOf(p);
    const idx = matcher.ordered(bytes, 20, 20, 6, 0, 0, p.alpha);
    for (let k = 0; k < 400; k++) {
      const x = k % 20;
      const y = Math.floor(k / 20);
      if (idx[k] === 255 && p.shadow[k] > 0.4 && ((x + y) & 1) === 0) idx[k] = SHADOW_INDEX;
    }
    b.pixels = idx;
    return b;
  };
  const cbl = Array.from({ length: 50 }, (_, i) => emptyBlock(i, true));
  const mbl = Array.from({ length: 100 }, (_, i) => emptyBlock(i, true));
  const cIndex = new Map<string, number>();
  const mIndex = new Map<string, number>();
  const pics = new Map<string, SpritePic>();
  chars.forEach(([n, p], i) => {
    cbl[i] = toBlock(p, i);
    cIndex.set(n, i);
    pics.set(`c:${n}`, p);
  });
  mons.forEach(([n, p], i) => {
    mbl[i] = toBlock(p, i);
    mIndex.set(n, i);
    pics.set(`m:${n}`, p);
  });
  const get = (m: Map<string, number>, kind: string) => (name: string) => {
    const v = m.get(name);
    if (v === undefined) throw new Error(`No ${kind} sprite ${name}`);
    return v;
  };
  return { cbl, mbl, c: get(cIndex, 'character'), m: get(mIndex, 'monster'), colors, pics };
}
