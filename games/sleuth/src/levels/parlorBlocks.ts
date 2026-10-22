// GREEN.BBL: the blocks of the rooms where Ada talks: green carpet, wallpaper and velvet
// curtains, the evidence board on the north wall, armchairs, a portrait of each suspect
// behind the interview table, the question cards (and SHOW cards beside the evidence in
// Ada's pocket), the stage at dawn, and the blocks that keep score of the accusation: a
// wrong answer passes over a block that owes a strike and costs 500, the Commissioner's
// block collects it (and the right answer passes over one worth 5000).
import { Pixels } from '../../../kit/pixels';
import { BlockSet, SOLID, type BlockDef } from '../blocks/blockset';
import { CLEAR, blob, microC, pool, speckle } from '../art/draw';
import { c, ramp as r } from '../art/pal';
import { T, boards, clone, footlight, stageBoards, wallFace, wallTop } from '../blocks/painters';
import { addItems, symbol } from '../blocks/items';
import { portrait } from '../art/people';
import { CTR } from '../ids';
import { addEggBlocks } from '../blocks/egg';
import { CARDS, HOW, SUSPECTS, WHY } from './parlor';

// ---------------------------------------------------------------- art

function icon(p: Pixels, x: number, y: number, kind: string): void {
  const k = (n: string, s: number) => c(n, s);
  switch (kind) {
    case 'clock':
      p.disc(x + 6, y + 6, 6, k('gold', 3));
      p.disc(x + 6, y + 6, 5, k('paper', 5));
      p.line(x + 6, y + 6, x + 6, y + 2, k('black', 0)).line(x + 6, y + 6, x + 9, y + 6, k('black', 0));
      break;
    case 'mask':
      symbol(p, x, y, 'mask', k('paper', 5), k('black', 0));
      break;
    case 'eye':
      for (let i = 0; i < 12; i++) {
        const h = Math.round(Math.sin((i / 11) * Math.PI) * 4);
        p.rect(x + i, y + 6 - h, 1, h * 2 + 1, k('paper', 5));
      }
      p.disc(x + 6, y + 6, 3, k('teal', 2));
      p.disc(x + 6, y + 6, 1, k('black', 0));
      break;
    case 'dagger':
      p.line(x + 1, y + 11, x + 9, y + 3, k('grey', 6)).line(x + 2, y + 11, x + 10, y + 3, k('grey', 4));
      p.rect(x + 1, y + 8, 4, 2, k('gold', 3));
      p.line(x + 6, y + 2, x + 11, y + 7, k('velvet', 5));
      p.line(x + 11, y + 7, x + 9, y + 7, k('velvet', 5)).line(x + 11, y + 7, x + 11, y + 5, k('velvet', 5));
      break;
    case 'goblet':
      p.rect(x + 2, y + 1, 8, 5, k('gold', 3)).rect(x + 3, y + 2, 6, 2, k('green', 4));
      p.rect(x + 5, y + 6, 2, 4, k('gold', 2)).rect(x + 3, y + 10, 6, 2, k('gold', 3));
      break;
    case 'bulb':
      p.disc(x + 6, y + 5, 5, k('black', 2));
      p.rect(x + 4, y + 9, 5, 3, k('grey', 3));
      p.line(x + 1, y + 1, x + 11, y + 11, k('velvet', 5));
      break;
    case 'heart':
      p.disc(x + 4, y + 4, 3, k('velvet', 5)).disc(x + 8, y + 4, 3, k('velvet', 5));
      for (let i = 0; i < 6; i++) p.rect(x + 1 + i, y + 5 + i, 11 - i * 2, 1, k('velvet', 5));
      break;
    case 'coins':
      for (const [dx, dy] of [
        [2, 6],
        [6, 3],
        [7, 8],
      ])
        p.disc(x + dx + 1, y + dy + 1, 3, k('gold', 4)).set(x + dx + 1, y + dy + 1, k('gold', 1));
      break;
    case 'book':
      p.rect(x + 1, y + 1, 10, 11, k('paper', 5)).rect(x, y + 2, 10, 11, k('paper', 3));
      for (let i = 0; i < 4; i++) p.rect(x + 2, y + 4 + i * 2, 6, 1, k('black', 2));
      p.rect(x, y + 2, 1, 11, k('velvet', 3));
      break;
  }
}

/** A card on the floor, 40x20: an icon on the left and a word on the right. */
function card(word: string, iconKind?: string, floor = boards(11)): Pixels {
  const p = new Pixels(40, 20);
  p.blit(floor, 0, 0).blit(floor, 20, 0);
  p.rect(1, 2, 38, 16, c('paper', 4)).frame(1, 2, 38, 16, c('gold', 2)).frame(2, 3, 36, 14, c('paper', 2));
  if (iconKind) {
    icon(p, 4, 4, iconKind);
    microC(p, 27, 8, word, c('velvet', 2));
  } else microC(p, 20, 8, word, c('velvet', 2));
  return p;
}

function greenCarpet(): Pixels {
  const p = speckle(T(), 0, 0, 20, 20, r('green'), 1, 1, 77, 0.15);
  for (let i = 0; i < 20; i += 2) p.set(i, i, c('green', 2)).set(19 - i, i, c('green', 2));
  p.set(9, 9, c('gold', 1)).set(10, 10, c('gold', 1));
  return p;
}

function wallpaper(): Pixels {
  const p = T(c('teal', 1));
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if ((x + y) % 10 === 0 || (x - y + 20) % 10 === 0) p.set(x, y, c('teal', 2));
  for (const [x, y] of [
    [5, 5],
    [15, 15],
  ])
    p.disc(x, y, 1, c('gold', 1));
  for (let x = 0; x < 20; x++) p.set(x, 0, c('gold', 2)).set(x, 17, c('panel', 2)).set(x, 18, c('panel', 1)).set(x, 19, c('black', 0));
  return p;
}

function velvetCurtain(seed = 0): Pixels {
  const p = T();
  for (let x = 0; x < 20; x++) {
    const fold = [1, 3, 5, 6, 5, 3, 2][(x + seed) % 7];
    for (let y = 0; y < 20; y++) p.set(x, y, c('velvet', fold));
  }
  return p;
}

export function buildParlorBlocks(): BlockSet {
  const bs = new BlockSet(150, false);
  const add = (name: string, p: Pixels, d: BlockDef = {}) => bs.add(name, p, d);
  const S = { solid: SOLID };
  addItems(bs, false);
  const B = boards(11);
  const RUG = greenCarpet();
  const ST = stageBoards(12);
  add('boards', B);
  add('rug', RUG);
  add('stage', ST);
  add('walltop', wallTop(), S);
  add('wallpaper', wallpaper(), S);
  add('wall', wallFace(), S);
  add('curtain0', velvetCurtain(0), S);
  add('curtain1', velvetCurtain(3), S);
  // the coroner's note: a pin on the board like the evidence
  add(
    'coroner',
    ((): Pixels => {
      const p = clone(B);
      p.rect(3, 2, 14, 16, c('paper', 5)).frame(3, 2, 14, 16, c('paper', 2));
      p.rect(5, 4, 10, 2, c('black', 1));
      for (let i = 0; i < 4; i++) p.rect(5, 8 + i * 2, 9, 1, c('black', 3));
      p.line(5, 16, 14, 16, c('velvet', 4));
      return p;
    })(),
  );
  // the evidence board on the north wall
  for (let i = 0; i < 4; i++)
    add(
      `cork${i}`,
      ((): Pixels => {
        const p = wallpaper();
        speckle(p, 0, 2, 20, 15, r('wood'), 4, 1, 30 + i, 0.4);
        p.rect(0, 2, 20, 1, c('wood', 1)).rect(0, 16, 20, 1, c('wood', 1));
        const xs = [3, 11, 7, 14];
        p.rect(xs[i], 5, 5, 6, c('paper', 4 + (i % 2)));
        p.set(xs[i] + 2, 5, c('velvet', 5));
        p.line(xs[i] + 2, 5, (xs[i] + 12) % 20, 9, c('velvet', 4));
        return p;
      })(),
      S,
    );
  add(
    'armchair',
    ((): Pixels => {
      const p = clone(RUG);
      blob(p, 10, 6, 9, 6, r('green'), 0, 2);
      blob(p, 10, 13, 8, 6, r('green'), 1, 3);
      blob(p, 2, 12, 2, 6, r('green'), 0, 2);
      blob(p, 18, 12, 2, 6, r('green'), 0, 2);
      return p;
    })(),
    S,
  );
  add(
    'sofa',
    ((): Pixels => {
      const p = clone(RUG);
      p.rect(0, 3, 20, 14, c('velvet', 2)).rect(0, 3, 20, 4, c('velvet', 1)).rect(0, 15, 20, 2, c('wood', 1));
      for (let x = 4; x < 20; x += 6) p.set(x, 10, c('gold', 3));
      return p;
    })(),
    S,
  );
  add(
    'fire',
    ((): Pixels => {
      const p = wallpaper();
      p.rect(1, 3, 18, 15, c('grey', 3)).rect(4, 7, 12, 11, c('black', 0));
      pool(p, 10, 16, 7, 6, r('glow'), 0, 3);
      p.rect(1, 3, 18, 2, c('grey', 5));
      return p;
    })(),
    { ...S, next: 'fire2', ntime: 4 },
  );
  add(
    'fire2',
    ((): Pixels => {
      const p = wallpaper();
      p.rect(1, 3, 18, 15, c('grey', 3)).rect(4, 7, 12, 11, c('black', 0));
      pool(p, 10, 15, 6, 7, r('glow'), 0, 4);
      p.rect(1, 3, 18, 2, c('grey', 5));
      return p;
    })(),
    { ...S, next: 'fire', ntime: 5 },
  );
  add(
    'plant',
    ((): Pixels => {
      const p = clone(RUG);
      p.disc(10, 14, 5, c('brick', 2));
      for (let a = 0; a < 8; a++) {
        const ang = (a / 8) * Math.PI * 2;
        p.line(10, 10, 10 + Math.cos(ang) * 9, 9 + Math.sin(ang) * 7, c('green', 2 + (a % 3)));
      }
      return p;
    })(),
    S,
  );
  add(
    'talk',
    ((): Pixels => {
      const p = clone(RUG);
      p.disc(10, 10, 7, c('gold', 1));
      p.disc(10, 10, 6, c('paper', 4));
      microC(p, 10, 8, '?', c('velvet', 2));
      return p;
    })(),
  );
  add(
    'exit',
    ((): Pixels => {
      const p = clone(B);
      p.rect(2, 4, 16, 12, c('velvet', 1)).frame(2, 4, 16, 12, c('gold', 2));
      microC(p, 10, 8, 'EXIT', c('gold', 4));
      return p;
    })(),
  );
  add(
    'door',
    ((): Pixels => {
      const p = T(c('panel', 3));
      p.rect(0, 0, 2, 20, c('panel', 1)).rect(18, 0, 2, 20, c('panel', 1));
      p.frame(4, 3, 12, 14, c('panel', 2));
      p.set(15, 10, c('gold', 4));
      return p;
    })(),
    S,
  );
  // a portrait of each suspect across four blocks, behind the table
  const frame = c('gold', 2);
  for (const who of SUSPECTS) {
    const big = new Pixels(40, 40, c('teal', 0));
    for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) big.set(x, y, c('teal', y < 20 ? 0 : 1));
    big.blit(portrait(who, 40), 0, 2, CLEAR);
    big.frame(0, 0, 40, 40, frame);
    for (let i = 0; i < 4; i++) add(`por_${who}${i}`, big.crop((i % 2) * 20, Math.floor(i / 2) * 20, 20, 20), S);
  }
  const tbl = new Pixels(40, 20);
  tbl.blit(RUG, 0, 0).blit(RUG, 20, 0);
  tbl.rect(0, 2, 40, 14, c('wood', 2)).rect(0, 2, 40, 2, c('wood', 4)).rect(0, 15, 40, 2, c('wood', 0));
  tbl.disc(10, 8, 3, c('paper', 5)).disc(10, 8, 2, c('wood', 1)); // a cup of tea
  tbl.rect(26, 6, 9, 6, c('paper', 4)); // Ada's notebook
  for (let i = 0; i < 3; i++) tbl.rect(27, 7 + i * 2, 7, 1, c('navy', 1));
  add('table0', tbl.crop(0, 0, 20, 20), S);
  add('table1', tbl.crop(20, 0, 20, 20), S);
  // question cards
  const cardBlocks = (key: string, word: string, iconKind?: string, floor?: Pixels) => {
    const p = card(word, iconKind, floor);
    add(`${key}0`, p.crop(0, 0, 20, 20));
    add(`${key}1`, p.crop(20, 0, 20, 20));
  };
  for (const [w, ic] of CARDS.r1) cardBlocks(`q_${w}`, w, ic);
  for (const w of ['LETTER?', 'ROLE?', 'WINE?']) cardBlocks(`q_${w}`, w);
  // "SHOW" beside an item from Ada's pocket
  add(
    'show',
    ((): Pixels => {
      const p = clone(B);
      p.rect(0, 2, 19, 16, c('paper', 4)).frame(0, 2, 19, 16, c('gold', 2));
      microC(p, 9, 8, 'SHOW', c('velvet', 2));
      return p;
    })(),
  );
  // the stage at dawn
  add(
    'dawnwall',
    ((): Pixels => {
      const p = velvetCurtain(1);
      p.rect(0, 0, 20, 2, c('gold', 3));
      return p;
    })(),
    S,
  );
  add('footlights', footlight(1), S);
  add(
    'spot',
    ((): Pixels => {
      const p = clone(ST);
      pool(p, 10, 10, 10, 10, r('glow'), 0, 2);
      p.ring(10, 10, 8, c('glow', 3));
      return p;
    })(),
  );
  for (const [w, ic] of [...HOW, ...WHY]) cardBlocks(`a_${w}`, w, ic, ST);
  add(
    'backdoor',
    ((): Pixels => {
      const p = clone(ST);
      p.rect(2, 4, 16, 12, c('navy', 1)).frame(2, 4, 16, 12, c('gold', 2));
      microC(p, 10, 6, 'BACK', c('gold', 4));
      microC(p, 10, 12, 'OFF', c('gold', 4));
      return p;
    })(),
  );
  // the Commissioner's verdict: one strike (when one is owed)
  add(
    'strike',
    ((): Pixels => {
      const p = clone(ST);
      pool(p, 10, 10, 10, 10, r('ghost'), 0, 1);
      return p;
    })(),
    { effect: CTR.strike, eamt: -1, hp: -200 },
  );
  // Behind the curtain: a wrong answer owes a strike (and costs points) on its way to the
  // Commissioner; the right one is worth a fortune on its way to the curtain call.
  const dark = T(c('black', 0));
  pool(dark, 10, 10, 9, 9, r('velvet'), 0, 2);
  add('zcell', clone(dark), { effect: CTR.strike, eamt: 1, score: -500 });
  add('solved', clone(dark), { score: 5000 });
  addEggBlocks(add, wallpaper, bs.pic('fire'), bs.pic('fire2'));
  return bs;
}
