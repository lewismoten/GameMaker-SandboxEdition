// The kid, drawn as ASCII rows: a color key per outfit (the kid, or a bully in other colors),
// head/body/leg pieces for the front, back and side views that are stacked into one 20x20
// picture, and the shovel held three ways. Also makeBook, a named block set for .MBL/.CBL.
import { newBlockSet, type Block } from '../../../../web/src/formats/blocks';
import { Pixels } from '../../../kit/pixels';
import { sprite } from '../art/draw';
import type { Pal } from '../art/pal';

export const T = 255;

/** Keys for the ASCII sprites. */
export function keyFor(pal: Pal, scheme: 'kid' | 'bully' = 'kid'): Record<string, number> {
  const c = pal.c;
  const bully = scheme === 'bully';
  return {
    k: c('ink', 0),
    K: c('ink', 1),
    p: c('snow', 6),
    h: bully ? c('jeans', 2) : c('coat', 3),
    H: bully ? c('jeans', 0) : c('coat', 1),
    s: c('skin', 2),
    S: c('skin', 1),
    e: c('ink', 0),
    r: c('hair', 1),
    g: bully ? c('grey', 3) : c('gold', 3),
    G: bully ? c('grey', 2) : c('gold', 1),
    c: bully ? c('pine', 3) : c('coat', 2),
    C: bully ? c('pine', 1) : c('coat', 1),
    m: bully ? c('grey', 2) : c('gold', 2),
    j: c('jeans', 2),
    J: c('jeans', 0),
    b: c('wood', 0),
    w: c('wood', 3),
    x: c('grey', 4),
    X: c('grey', 2),
    d: c('dog', 2),
    D: c('dog', 0),
    l: c('dog', 3),
    n: c('ink', 0),
    t: c('pink', 3),
    o: c('orange', 2),
    O: c('orange', 1),
    q: c('glow', 3),
    i: c('ice', 3),
    W: c('snow', 6),
  };
}

export const HEAD_DOWN = [
  '........kpk',
  '.......khhhk',
  '......khhhhhk',
  '.....khhhhhhhk',
  '.....kHHHHHHHk',
  '.....ksssssssk',
  '.....ksesssesk',
  '.....kSsssssSk',
];
export const HEAD_BLINK = [...HEAD_DOWN.slice(0, 6), '.....ksksssksk', HEAD_DOWN[7]];
export const HEAD_UP = [...HEAD_DOWN.slice(0, 5), '.....krrrrrrrk', '.....krrrrrrrk', '.....kSrrrrrSk'];
export const BODY_FRONT = [
  '....kgggggggggk',
  '....kcGcccccccck',
  '...kccccccccccck',
  '...kcCcccccccCck',
  '...kmCcccccccCmk',
  '....kccccccccck',
  '....kCCCCCCCCCk',
];
export const BODY_BACK = [
  '....kgggggggggk',
  '....kcccccgccck',
  '...kccccccgccccck',
  '...kcCcccgcccCck',
  '...kmCcccccccCmk',
  '....kccccccccck',
  '....kCCCCCCCCCk',
];
export const LEGS_STAND = ['.....kjjjjjjjk', '.....kjjjkjjjk', '.....kjjk.kjjk', '.....kbbk.kbbk', '.....kkkk.kkkk'];
export const LEGS_A = ['.....kjjjjjjjk', '.....kjjjkjjjk', '.....kbbk.kjjk', '......kk..kbbk', '..........kkkk'];
export const LEGS_B = ['.....kjjjjjjjk', '.....kjjjkjjjk', '.....kjjk.kbbk', '.....kbbk..kk', '.....kkkk'];

export const HEAD_SIDE = [
  '.........kpk',
  '........khhhk',
  '.......khhhhhk',
  '......khhhhhhhk',
  '......kHHHHHHHk',
  '......krrsssssk',
  '......krrssesssk',
  '......krssssssk',
];
export const BODY_SIDE = ['......kgggggggk', '.....gGkcccccck', '......kccccccck', '......kcccccmck', '......kcccccmck', '......kccccccck', '......kCCCCCCCk'];
export const LEGS_SIDE_A = ['......kjjjjjjjk', '.....kjjjk.kjjjk', '....kjjjk...kjjjk', '....kbbbk...kbbbbk', '....kkkk....kkkkk'];
export const LEGS_SIDE_B = ['......kjjjjjjjk', '.......kjjjjjk', '.......kjjjjjk', '.......kbbbbbbk', '.......kkkkkkkk'];

export function kidPic(rows: string[], key: Record<string, number>): Pixels {
  for (const r of rows) if (r.length > 20) throw new Error(`Sprite row too long: ${r}`);
  return sprite(rows, key, 20, 20, 0, 0);
}

/** Adds the shovel the kid always carries. */
export function shovel(p: Pixels, pal: Pal, view: 'front' | 'side' | 'back'): Pixels {
  const c = pal.c;
  if (view === 'side') {
    p.line(9, 10, 16, 15, c('wood', 3)).line(9, 11, 16, 16, c('wood', 2));
    p.rect(15, 14, 4, 5, c('grey', 4)).rect(18, 14, 1, 5, c('grey', 2)).rect(15, 18, 4, 1, c('grey', 2));
  } else {
    const x = view === 'front' ? 16 : 3;
    p.rect(x, 4, 1, 12, c('wood', 3)).rect(x - 1, 3, 3, 1, c('wood', 1));
    p.rect(x - 1, 15, 3, 5, c('grey', 4)).rect(x - 1, 19, 3, 1, c('grey', 2));
  }
  return p;
}

export interface Book<T> {
  index: Map<string, number>;
  pics: Map<string, Pixels>;
  blocks: T[];
}

export function makeBook(kind: 'mbl' | 'cbl') {
  const blocks: Block[] = newBlockSet(kind);
  const index = new Map<string, number>();
  const pics = new Map<string, Pixels>();
  const add = (name: string, pic: Pixels, attrs: Partial<Pick<Block, 'chHitPt' | 'effect' | 'eamt' | 'scorePts' | 'solid'>> = {}) => {
    const i = index.size;
    index.set(name, i);
    pics.set(name, pic);
    blocks[i].pixels = Uint8Array.from(pic.px);
    Object.assign(blocks[i], attrs);
    return i;
  };
  return { blocks, index, pics, add, n: (name: string) => index.get(name)! };
}
