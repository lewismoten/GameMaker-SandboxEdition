// SNOW.BBL: every background block of Dowden Additions and LaVale Mall, drawn in code. Index assignments are
// by name; attributes (solid sides, money, gravity, what a block turns into when touched
// or after time) are what make the game: deep snow is solid and pays $1 when you push
// into it, parking-lot asphalt quietly snows back over, ice slides you, forts throw.
import { newBlockSet, type Block } from '../../../../web/src/formats/blocks';
import { Pixels, rng } from '../../../kit/pixels';
import { blob, gradient, shadeAt, speckle } from '../art/draw';
import { micro, microWidth } from '../art/font';
import { MON, THROWSEQ } from '../ids';
import type { Pal } from '../art/pal';

interface Attrs {
  solid?: number;
  score?: number;
  hp?: number;
  grav?: number;
  effect?: number;
  eamt?: number;
  birthMon?: number;
  birthTime?: number;
  touch?: string;
  next?: string;
  ntime?: number;
}

export class BlockBook {
  readonly blocks: Block[] = newBlockSet('bbl');
  readonly index = new Map<string, number>();
  private links: [number, Attrs][] = [];
  readonly pics = new Map<string, Pixels>();

  add(name: string, pic: Pixels, a: Attrs = {}): number {
    const i = this.index.size;
    if (i >= 150) throw new Error('Out of background blocks');
    if (this.index.has(name)) throw new Error(`Duplicate block ${name}`);
    this.index.set(name, i);
    this.pics.set(name, pic);
    const b = this.blocks[i];
    b.pixels = Uint8Array.from(pic.px);
    b.solid = a.solid ?? 0;
    b.scorePts = a.score ?? 0;
    b.chHitPt = a.hp ?? 0;
    b.grav = a.grav ?? 0;
    b.effect = a.effect ?? 0;
    b.eamt = a.eamt ?? 0;
    b.birthMon = a.birthMon ?? 0;
    b.birthTime = a.birthTime ?? 0;
    b.ntime = a.ntime ?? 0;
    this.links.push([i, a]);
    return i;
  }

  n(name: string): number {
    const i = this.index.get(name);
    if (i === undefined) throw new Error(`No block ${name}`);
    return i;
  }

  /** Resolves touch/next names once every block exists. */
  finish(): Block[] {
    for (const [i, a] of this.links) {
      if (a.touch) this.blocks[i].touchBl = this.n(a.touch);
      if (a.next) this.blocks[i].nextBl = this.n(a.next);
    }
    return this.blocks;
  }
}

export const SOLID = 15;
const MONEY = 3;

export function buildBlocks(pal: Pal): BlockBook {
  const book = new BlockBook();
  const R = pal.r;
  const c = pal.c;
  const snow = R('snow');
  const P = () => new Pixels(20, 20);

  // ---------- ground ----------
  const yardBase = (seed: number) => {
    const p = speckle(P(), 0, 0, 20, 20, snow, 5, 1, seed, 0.16);
    const r = rng(seed + 9);
    // soft drifts
    for (let k = 0; k < 2; k++) {
      const x0 = Math.floor(r() * 16);
      const y0 = Math.floor(r() * 18);
      for (let x = 0; x < 6; x++) p.set((x0 + x) % 20, y0 + (x > 1 && x < 5 ? 0 : 1), c('snow', 4));
    }
    return p;
  };
  const flakes = (p: Pixels, seed: number, frame: number) => {
    const r = rng(seed);
    for (let k = 0; k < 4; k++) {
      const x = Math.floor(r() * 19);
      const y = (Math.floor(r() * 20) + frame * 5) % 20;
      p.set(x + 1, (y + 1) % 20, c('snow', 3));
      p.set(x, y, c('snow', 6));
      if (k === 0) p.set(x + 1, y, c('snow', 6));
    }
    return p;
  };
  for (const v of ['A', 'B'])
    for (let f = 0; f < 4; f++) {
      const seed = v === 'A' ? 11 : 23;
      book.add(`yard${v}${f}`, flakes(yardBase(seed), seed * 7, f), { next: `yard${v}${(f + 1) % 4}`, ntime: 4 });
    }
  book.add('plain', yardBase(31));

  const mound = (bg: Pixels, seed: number, bright = 0) => {
    const p = blob(bg, 10, 10.5, 10.6, 10, snow, 2 + bright, 6, 1.1);
    const r = rng(seed);
    for (let k = 0; k < 3; k++) p.set(3 + Math.floor(r() * 12), 2 + Math.floor(r() * 8), c('snow', 6));
    // crisp shadow line under the lump
    for (let x = 3; x < 17; x++) if (p.get(x, 19) !== snow[2]) p.set(x, 19, c('snow', 1));
    return p;
  };
  const asphalt = (seed: number) => {
    const p = speckle(P(), 0, 0, 20, 20, R('asphalt'), 2, 1, seed, 0.3);
    const r = rng(seed);
    for (let k = 0; k < 3; k++) {
      const y = 2 + Math.floor(r() * 16);
      const x = Math.floor(r() * 8);
      for (let i = 0; i < 8; i++) p.set(x + i, y, c('asphalt', 3));
    }
    // snow left at the edges by the shovel
    for (let y = 0; y < 20; y += 3) {
      p.set(0, y + (seed % 2), c('snow', 4));
      p.set(19, y + 1, c('snow', 4));
    }
    return p;
  };
  const sidewalk = (seed: number) => {
    const p = speckle(P(), 0, 0, 20, 20, R('concrete'), 2, 1, seed, 0.2);
    p.rect(0, 0, 20, 1, c('concrete', 0)).rect(0, 0, 1, 20, c('concrete', 0));
    p.rect(0, 10, 20, 1, c('concrete', 1));
    p.set(1, 1, c('snow', 5)).set(2, 1, c('snow', 4)).set(18, 18, c('snow', 5));
    return p;
  };
  const lot = (seed: number) => {
    return speckle(P(), 0, 0, 20, 20, R('asphalt'), 1, 1, seed, 0.3);
  };

  // Shoveling: deep snow is solid; pushing into it scoops it (and pays a dollar).
  book.add('asphalt', asphalt(41));
  book.add('deep', mound(asphalt(41), 5), { solid: SOLID, effect: MONEY, eamt: 1, score: 10, touch: 'asphalt' });
  book.add('walk', sidewalk(43));
  book.add('deepWalk', mound(sidewalk(43), 6), { solid: SOLID, effect: MONEY, eamt: 1, score: 10, touch: 'walk' });
  // The mall lot: a cleared space slowly dusts over and fills back in (a global squall).
  book.add('lot', lot(47), { next: 'lotDust', ntime: 540 });
  const dust = lot(47);
  const rd = rng(5);
  for (let k = 0; k < 90; k++) dust.set(Math.floor(rd() * 20), Math.floor(rd() * 20), c('snow', 4 + (k % 3 === 0 ? 1 : 0)));
  book.add('lotDust', dust, { next: 'lotRefill', ntime: 70 });
  book.add('lotRefill', mound(lot(47), 9, 1), { solid: SOLID, effect: MONEY, eamt: 1, score: 10, touch: 'lotDone', next: 'lot', ntime: 160 });
  book.add('lotDone', lot(47));
  book.add('deepLot', mound(lot(47), 8), { solid: SOLID, effect: MONEY, eamt: 1, score: 10, touch: 'lot' });

  // Roads: two lanes, slushy tire tracks, a yellow center line.
  const road = (line: boolean) => {
    const p = speckle(P(), 0, 0, 20, 20, R('asphalt'), 1, 1, 61, 0.25);
    for (const y of line ? [3, 4] : [14, 15]) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R('snow'), 1, 2, ((x * 7) % 5) / 5, x, y));
    if (line) for (let x = 2; x < 14; x++) p.set(x, 18, c('gold', 3)).set(x, 19, c('gold', 2));
    return p;
  };
  book.add('roadA', road(true));
  book.add('roadB', road(false));

  // Plow banks: solid, packed snow; scooping one gives snowballs.
  const bankBg = () => speckle(P(), 0, 0, 20, 20, snow, 3, 1, 71, 0.4);
  const dirty = (p: Pixels, seed: number) => {
    const r = rng(seed);
    for (let k = 0; k < 14; k++) {
      const x = Math.floor(r() * 20);
      const y = Math.floor(r() * 20);
      if (p.get(x, y) !== c('snow', 3)) p.set(x, y, c('asphalt', 3 + (k % 2)));
    }
    return p;
  };
  book.add('bank0', dirty(bankBg(), 3));
  book.add('bank1', dirty(blob(bankBg(), 10, 12, 8, 7, snow, 1, 6), 4), { solid: SOLID, effect: THROWSEQ, eamt: 2, score: 5, touch: 'bank0' });
  const bank2 = blob(bankBg(), 6, 12, 7, 7, snow, 1, 6);
  blob(bank2, 14, 11, 7, 8, snow, 1, 6);
  book.add('bank2', dirty(bank2, 5), { solid: SOLID, effect: THROWSEQ, eamt: 3, score: 5, touch: 'bank1' });

  // Ice: gravity slides you the way the chevrons point.
  const ice = (dir: 'N' | 'E' | 'S' | 'W') => {
    const p = speckle(P(), 0, 0, 20, 20, R('ice'), 3, 1, 81, 0.2);
    for (let k = -20; k < 20; k += 7) for (let i = 0; i < 6; i++) p.set(k + i + 6, 14 - i, c('ice', 4));
    const chev = (x: number, y: number) => {
      for (let i = 0; i < 4; i++) {
        const [a, b] = dir === 'E' ? [x + i, y - 3 + i] : dir === 'W' ? [x - i, y - 3 + i] : dir === 'S' ? [x - 3 + i, y + i] : [x - 3 + i, y - i];
        const [a2, b2] = dir === 'E' ? [x + i, y + 3 - i] : dir === 'W' ? [x - i, y + 3 - i] : dir === 'S' ? [x + 3 - i, y + i] : [x + 3 - i, y - i];
        p.set(a, b, c('ice', 1)).set(a2, b2, c('ice', 1));
      }
    };
    if (dir === 'E' || dir === 'W') chev(dir === 'E' ? 7 : 12, 10);
    else chev(10, dir === 'S' ? 7 : 12);
    return p;
  };
  book.add('iceN', ice('N'), { grav: 1 });
  book.add('iceE', ice('E'), { grav: 2 });
  book.add('iceS', ice('S'), { grav: 4 });
  book.add('iceW', ice('W'), { grav: 8 });

  const bridge = () => {
    const p = P();
    for (let y = 0; y < 20; y++) {
      const plank = Math.floor(y / 4);
      for (let x = 0; x < 20; x++) p.set(x, y, c('wood', y % 4 === 3 ? 0 : 2 + ((plank + (x > 9 ? 1 : 0)) % 2)));
    }
    p.rect(0, 0, 2, 20, c('wood', 0)).rect(18, 0, 2, 20, c('wood', 0));
    for (let y = 1; y < 20; y += 4) p.set(4 + (y % 7), y, c('snow', 5)).set(12, y + 1, c('snow', 4));
    return p;
  };
  book.add('bridge', bridge());

  // ---------- things in the snow ----------
  const pine = (bg: Pixels) => {
    const p = bg;
    blob(p, 10, 18, 8, 2.2, snow, 2, 3);
    p.rect(9, 15, 2, 4, c('wood', 1));
    const pn = R('pine');
    const tier = (top: number, bottom: number, half: number) => {
      for (let y = top; y <= bottom; y++) {
        const w = Math.round(((y - top + 1) / (bottom - top + 1)) * half);
        for (let x = 10 - w; x <= 9 + w; x++) {
          const l = 1 - (x - (10 - w)) / (2 * w + 1);
          p.set(x, y, shadeAt(pn, 0, 4, l * 0.9 + (y === bottom ? -0.3 : 0), x, y));
        }
        // snow on the upper-left of each tier
        if (y < top + (bottom - top) / 2) for (let x = 10 - w; x <= 10; x++) if ((x + y) % 3) p.set(x, y, c('snow', y === top ? 6 : 5));
      }
    };
    tier(0, 7, 4);
    tier(4, 12, 6);
    tier(8, 16, 8);
    p.set(10, 0, c('snow', 6));
    return p;
  };
  book.add('tree', pine(yardBase(91)), { solid: SOLID });
  const bush = blob(yardBase(93), 10, 13, 9, 6.5, R('pine'), 0, 4);
  blob(bush, 9, 10, 7, 3.5, snow, 3, 6);
  book.add('bush', bush, { solid: SOLID });
  const fence = yardBase(95);
  fence.rect(2, 6, 3, 13, c('wood', 1)).rect(15, 6, 3, 13, c('wood', 1));
  fence.rect(0, 8, 20, 3, c('wood', 3)).rect(0, 14, 20, 3, c('wood', 3));
  fence.rect(0, 10, 20, 1, c('wood', 0)).rect(0, 16, 20, 1, c('wood', 0));
  fence.rect(0, 7, 20, 1, c('snow', 6)).rect(2, 5, 3, 1, c('snow', 6)).rect(15, 5, 3, 1, c('snow', 6));
  book.add('fence', fence, { solid: SOLID });
  const lamp = yardBase(97);
  blob(lamp, 10, 17, 9, 3, R('glow'), 1, 3);
  lamp.rect(9, 6, 2, 13, c('ink', 1)).rect(8, 18, 4, 1, c('ink', 0));
  lamp.rect(6, 1, 8, 1, c('ink', 1)).rect(7, 2, 6, 4, c('glow', 3)).rect(8, 3, 4, 2, c('glow', 3)).rect(6, 6, 8, 1, c('ink', 1));
  lamp.rect(7, 0, 6, 1, c('snow', 6));
  book.add('lamp', lamp, { solid: SOLID });
  // No mailboxes in Dowden Additions (the carrier walks the mail to every door slot), so
  // the plows have only the fire hydrants to bury.
  const hydrant = yardBase(99);
  hydrant.rect(6, 7, 8, 11, c('coat', 2)).rect(6, 7, 2, 11, c('coat', 3)).rect(12, 7, 2, 11, c('coat', 1));
  hydrant.rect(4, 10, 12, 3, c('coat', 2)).rect(4, 10, 2, 3, c('coat', 3)).rect(15, 10, 1, 3, c('coat', 0));
  hydrant.rect(7, 4, 6, 3, c('coat', 2)).rect(9, 2, 2, 2, c('gold', 3)).rect(5, 17, 10, 2, c('coat', 0));
  blob(hydrant, 10, 4, 5, 2.4, snow, 4, 6);
  blob(hydrant, 10, 18, 9, 3, snow, 3, 6);
  book.add('hydrant', hydrant, { solid: SOLID });
  const snowman = yardBase(101);
  blob(snowman, 10, 15, 6, 4.5, snow, 2, 6);
  blob(snowman, 10, 9, 4.5, 3.8, snow, 2, 6);
  blob(snowman, 10, 4.5, 3.5, 3, snow, 2, 6);
  snowman.rect(7, 0, 6, 2, c('ink', 0)).rect(6, 2, 8, 1, c('ink', 0));
  snowman.set(9, 4, c('ink', 0)).set(11, 4, c('ink', 0)).rect(12, 5, 3, 1, c('orange', 2));
  snowman.rect(6, 7, 8, 2, c('coat', 2)).rect(12, 8, 2, 4, c('coat', 1));
  snowman.set(10, 10, c('ink', 0)).set(10, 13, c('ink', 0));
  snowman.line(4, 9, 1, 6, c('wood', 1)).line(16, 9, 19, 6, c('wood', 1));
  book.add('snowman', snowman, { solid: SOLID });

  // Snow forts: a kid ducks and pops up; the fort lobs a snowball every couple of seconds.
  const fort = (up: boolean) => {
    const p = yardBase(103);
    if (up) {
      // kid with a blue hat, arm cocked with a snowball
      p.rect(8, 1, 5, 2, c('jeans', 2)).set(10, 0, c('snow', 6));
      p.rect(8, 3, 5, 4, c('skin', 2)).set(9, 4, c('ink', 0)).set(11, 4, c('ink', 0));
      p.rect(7, 7, 7, 3, c('jeans', 1));
      p.rect(14, 2, 2, 6, c('jeans', 1));
      blob(p, 15.5, 2, 2, 2, snow, 3, 6);
    } else {
      p.rect(8, 6, 5, 2, c('jeans', 2)).set(10, 5, c('snow', 6));
    }
    for (let y = 8; y < 20; y++)
      for (let x = 1; x < 19; x++) {
        const row = Math.floor((y - 8) / 4);
        const joint = (y - 8) % 4 === 3 || (x + (row % 2) * 4) % 8 === 0;
        p.set(x, y, joint ? c('snow', 2) : shadeAt(snow, 3, 6, 1 - (y - 8) / 14 - (x > 14 ? 0.3 : 0), x, y));
      }
    p.rect(1, 19, 18, 1, c('snow', 1));
    return p;
  };
  book.add('fort', fort(false), { solid: SOLID, birthMon: MON.snowball, birthTime: 66, touch: 'pile', score: 100, next: 'fortUp', ntime: 18 });
  book.add('fortUp', fort(true), { solid: SOLID, birthMon: MON.snowball, birthTime: 66, touch: 'pile', score: 100, next: 'fort', ntime: 9 });
  const pile = yardBase(105);
  blob(pile, 10, 12, 9, 7, snow, 2, 6);
  blob(pile, 5, 14, 4, 4, snow, 2, 6);
  blob(pile, 15, 9, 4, 4, snow, 2, 6);
  book.add('pile', pile, { solid: SOLID, effect: MONEY, eamt: 2, score: 10, touch: 'yardA0' });

  const mug = (bg: Pixels, frame: number) => {
    const p = bg;
    blob(p, 10, 17, 6, 2, snow, 2, 3);
    p.rect(6, 9, 8, 8, c('coat', 2)).rect(6, 9, 2, 8, c('coat', 3)).rect(12, 9, 2, 8, c('coat', 1));
    p.rect(14, 11, 3, 1, c('coat', 1)).rect(16, 11, 1, 4, c('coat', 1)).rect(14, 14, 3, 1, c('coat', 1));
    p.rect(6, 8, 8, 2, c('snow', 6)).rect(7, 9, 6, 1, c('wood', 1));
    blob(p, 9, 8, 2, 1.5, snow, 5, 6);
    for (let i = 0; i < 6; i++) {
      p.set(8 + Math.round(Math.sin((i + frame * 3) * 0.9) * 1.5), 6 - i, c('grey', 4));
      p.set(12 + Math.round(Math.sin((i + frame * 3 + 2) * 0.9) * 1.5), 5 - i, c('grey', 4));
    }
    return p;
  };
  book.add('cocoa', mug(yardBase(107), 0), { hp: 35, score: 25, touch: 'yardA0', next: 'cocoa2', ntime: 6 });
  book.add('cocoa2', mug(yardBase(107), 1), { hp: 35, score: 25, touch: 'yardA0', next: 'cocoa', ntime: 6 });

  const bill = (bg: Pixels, tilt: number) => {
    const p = bg;
    for (let y = 0; y < 7; y++)
      for (let x = 0; x < 13; x++) {
        const px = 4 + x;
        const py = 7 + y + Math.round((x - 6) * tilt);
        const edge = x === 0 || y === 0 || x === 12 || y === 6;
        p.set(px, py, edge ? c('money', 0) : c('money', 1 + ((x + y) % 5 === 0 ? 1 : 0)));
      }
    p.set(9, 9 + Math.round(-0.5 * tilt * 3), c('money', 2));
    micro(p, 9, 8 + Math.round(-tilt), '$', c('money', 2));
    blob(p, 10, 17, 6, 1.5, snow, 2, 3);
    return p;
  };
  book.add('bill', bill(yardBase(109), 0.15), { effect: MONEY, eamt: 1, score: 10, touch: 'yardA0', next: 'bill2', ntime: 5 });
  book.add('bill2', bill(yardBase(109), -0.15), { effect: MONEY, eamt: 1, score: 10, touch: 'yardA0', next: 'bill', ntime: 5 });
  const tip = sidewalk(111);
  tip.rect(3, 5, 14, 10, c('snow', 6)).frame(3, 5, 14, 10, c('grey', 3));
  tip.line(3, 5, 10, 10, c('grey', 3)).line(16, 5, 10, 10, c('grey', 3));
  micro(tip, 8, 10, '$5', c('coat', 2));
  book.add('tip', tip, { effect: MONEY, eamt: 5, score: 50, touch: 'walk' });

  const signpost = (label: string, arrow: '>' | '<' | 'v' | '^') => {
    const p = yardBase(113);
    p.rect(9, 11, 2, 9, c('wood', 1));
    p.rect(1, 3, 18, 9, c('wood', 3)).frame(1, 3, 18, 9, c('wood', 0)).rect(1, 2, 18, 1, c('snow', 6));
    micro(p, 10 - Math.floor(microWidth(label) / 2), 5, label, c('ink', 0));
    const ay = 15;
    if (arrow === '>')
      p.line(13, ay, 18, ay, c('coat', 3))
        .line(16, ay - 2, 18, ay, c('coat', 3))
        .line(16, ay + 2, 18, ay, c('coat', 3));
    if (arrow === '<')
      p.line(1, ay, 6, ay, c('coat', 3))
        .line(3, ay - 2, 1, ay, c('coat', 3))
        .line(3, ay + 2, 1, ay, c('coat', 3));
    if (arrow === 'v') p.line(15, 12, 15, 18, c('coat', 3)).line(13, 16, 15, 18, c('coat', 3)).line(17, 16, 15, 18, c('coat', 3));
    if (arrow === '^') p.line(15, 13, 15, 19, c('coat', 3)).line(13, 15, 15, 13, c('coat', 3)).line(17, 15, 15, 13, c('coat', 3));
    return p;
  };
  book.add('signHill', signpost('HILL', '>'), { solid: SOLID });
  book.add('signTown', signpost('TOWN', 'v'), { solid: SOLID });
  book.add('signMall', signpost('MALL', '>'), { solid: SOLID });
  book.add('signHome', signpost('HOME', '<'), { solid: SOLID });
  book.add('signPlow', signpost('PLOWS', '^'), { solid: SOLID });
  book.add('signBus', signpost('BUS', 'v'), { solid: SOLID });

  // Green street-name signs on a corner post, two blocks wide: name0 (left) and name1.
  const streetSign = (name: string, top: string, bottom: string, bottomBlade = 'pine') => {
    const big = new Pixels(40, 20);
    big.blit(yardBase(115), 0, 0).blit(yardBase(117), 20, 0);
    big.rect(19, 2, 2, 18, c('grey', 3)).rect(19, 2, 1, 18, c('grey', 4));
    blob(big, 20, 19, 5, 2, snow, 3, 6);
    const blade = (y: number, label: string, ramp: string) => {
      const w = microWidth(label) + 6;
      const x = 20 - Math.ceil(w / 2);
      big
        .rect(x, y, w, 8, c(ramp, 3))
        .frame(x, y, w, 8, c('snow', 6))
        .rect(x, y + 8, w, 1, c('ink', 0));
      micro(big, x + 3, y + 2, label, c('snow', 6));
      big.rect(x, y - 1, w, 1, c('snow', 6)).rect(x + 2, y - 2, w - 5, 1, c('snow', 5));
    };
    blade(2, top, 'pine');
    blade(11, bottom, bottomBlade);
    for (let t = 0; t < 2; t++) book.add(`${name}${t}`, big.crop(t * 20, 0, 20, 20), { solid: SOLID });
  };
  streetSign('stGaleDunn', 'GALE ST', 'DUNN DR');
  streetSign('stGaleLeota', 'GALE ST', 'LEOTA ST');
  streetSign('stGaleLeon', 'GALE ST', 'LEON DR');
  streetSign('stLeonJamie', 'LEON DR', 'JAMIE ST');
  streetSign('stJamieBowden', 'JAMIE ST', 'BOWDEN DR');
  streetSign('stBowdenLaVale', 'BOWDEN DR', 'TO LAVALE', 'siding');

  // Parked cars buried in the mall lot (two blocks: rear, front).
  const parked = (front: boolean) => {
    const p = lot(51);
    const k = c('ink', 0);
    if (!front) {
      p.rect(2, 8, 18, 9, k).rect(3, 9, 17, 7, c('coat', 1)).rect(3, 9, 17, 2, c('coat', 2));
      p.rect(10, 4, 10, 5, k).rect(11, 5, 9, 4, c('ice', 1));
      blob(p, 6, 17, 3, 3, R('ink'), 0, 1);
      blob(p, 13, 7, 9, 4, snow, 3, 6);
      blob(p, 6, 8, 5, 2, snow, 3, 6);
    } else {
      p.rect(0, 8, 17, 9, k).rect(0, 9, 16, 7, c('coat', 1)).rect(0, 9, 16, 2, c('coat', 2));
      p.rect(0, 4, 8, 5, k).rect(0, 5, 7, 4, c('ice', 1));
      p.rect(15, 11, 2, 2, c('glow', 1));
      blob(p, 12, 17, 3, 3, R('ink'), 0, 1);
      blob(p, 5, 6, 7, 3, snow, 3, 6);
      blob(p, 12, 8, 5, 2, snow, 3, 6);
    }
    return p;
  };
  book.add('parkedL', parked(false), { solid: SOLID });
  book.add('parkedR', parked(true), { solid: SOLID });

  // ---------- houses (3/4 view: two rows of snowy roof over one row of wall) ----------
  const roofTop = (edge: 'L' | 'M' | 'R') => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(snow, 3, 6, 0.95 - y / 30 + Math.sin(x * 0.8 + y) * 0.06, x, y));
    p.rect(0, 0, 20, 2, c('brick', 0)).rect(0, 2, 20, 1, c('snow', 6));
    if (edge === 'L') for (let y = 0; y < 20; y++) p.set(0, y, c('ink', 0)).set(1, y, c('wood', 1));
    if (edge === 'R') for (let y = 0; y < 20; y++) p.set(19, y, c('ink', 0)).set(18, y, c('wood', 1));
    return p;
  };
  const eave = (edge: 'L' | 'M' | 'R', frame: number) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(snow, 2, 6, 0.75 - y / 22 + Math.sin(x * 0.7) * 0.05, x, y));
    // overhanging snow lip, fascia board and a string of Christmas lights
    for (let x = 0; x < 20; x++) p.set(x, 14 + (x % 5 === 2 ? 1 : 0), c('snow', 6));
    p.rect(0, 16, 20, 3, c('wood', 1)).rect(0, 19, 20, 1, c('ink', 0));
    const bulbs = R('bulbs');
    for (let x = 1; x < 20; x += 4) {
      const k = (x >> 2) + frame;
      p.set(x, 17, c('ink', 0))
        .set(x + 1, 18, bulbs[k % 4])
        .set(x + 1, 19, bulbs[k % 4]);
    }
    if (edge === 'L') for (let y = 0; y < 20; y++) p.set(0, y, c('ink', 0)).set(1, y, c('wood', 1));
    if (edge === 'R') for (let y = 0; y < 20; y++) p.set(19, y, c('ink', 0)).set(18, y, c('wood', 1));
    return p;
  };
  for (const e of ['L', 'M', 'R'] as const) book.add(`roof${e}`, roofTop(e), { solid: SOLID });
  for (const e of ['L', 'M', 'R'] as const) {
    book.add(`eave${e}`, eave(e, 0), { solid: SOLID, next: `eave${e}2`, ntime: 9 });
    book.add(`eave${e}2`, eave(e, 1), { solid: SOLID, next: `eave${e}`, ntime: 9 });
  }
  const chimney = (frame: number) => {
    const p = roofTop('M');
    for (let y = 6; y < 16; y++)
      for (let x = 11; x < 17; x++) p.set(x, y, y % 3 === 0 || (x + (Math.floor(y / 3) % 2) * 3) % 6 === 0 ? c('brick', 0) : c('brick', 2 + (x < 13 ? 1 : 0)));
    p.rect(10, 5, 8, 2, c('snow', 6));
    const r = rng(7 + frame);
    for (let k = 0; k < 3; k++) {
      const yy = 4 - k * 2 - frame;
      if (yy >= 0) blob(p, 13 + k + frame, yy, 2 + k * 0.3, 1.5, R('grey'), 3, 5);
    }
    void r;
    return p;
  };
  book.add('chimney', chimney(0), { solid: SOLID, next: 'chimney2', ntime: 7 });
  book.add('chimney2', chimney(1), { solid: SOLID, next: 'chimney', ntime: 7 });

  const walls = { red: 'brick', blue: 'siding', yellow: 'butter' } as const;
  for (const [name, ramp] of Object.entries(walls)) {
    const wr = R(ramp);
    const wall = () => {
      const p = P();
      for (let y = 0; y < 20; y++)
        for (let x = 0; x < 20; x++) {
          let k: number;
          if (ramp === 'brick') k = y % 4 === 3 || (x + (Math.floor(y / 4) % 2) * 4) % 8 === 0 ? 0 : 2 + ((x * 3 + y) % 7 === 0 ? 1 : 0);
          else k = y % 4 === 3 ? 1 : wr.length - 2 - (y % 4 === 0 ? 0 : 1);
          p.set(x, y, wr[Math.max(0, Math.min(wr.length - 1, k))]);
        }
      // shadow under the eaves and icicles
      p.rect(0, 0, 20, 2, c('ink', 0));
      for (let x = 2; x < 20; x += 5) for (let i = 0; i < 2 + (x % 3); i++) p.set(x, 2 + i, c('ice', 4 - i));
      return p;
    };
    book.add(`${name}Wall`, wall(), { solid: SOLID });
    const win = wall();
    win.rect(3, 5, 14, 11, c('wood', 4)).rect(4, 6, 12, 9, c('glow', 2));
    gradient(win, 4, 6, 12, 9, R('glow'), 3, 1);
    win.rect(9, 6, 2, 9, c('wood', 4)).rect(4, 10, 12, 1, c('wood', 4));
    win.rect(4, 6, 2, 9, c('coat', 2)).rect(14, 6, 2, 9, c('coat', 2));
    win.rect(2, 16, 16, 2, c('snow', 6)).rect(2, 18, 16, 1, c('wood', 2));
    book.add(`${name}Win`, win, { solid: SOLID });
    const door = wall();
    door.rect(4, 4, 12, 16, c('wood', 4)).rect(5, 5, 10, 15, c(name === 'red' ? 'siding' : 'coat', 1));
    door.rect(6, 6, 8, 5, c(name === 'red' ? 'siding' : 'coat', 2)).rect(6, 12, 8, 6, c(name === 'red' ? 'siding' : 'coat', 2));
    door.ring(10, 9, 3.4, c('pine', 2)).ring(10, 9, 2.6, c('pine', 3)).set(10, 12, c('coat', 3)).set(9, 13, c('coat', 3)).set(11, 13, c('coat', 3));
    door.set(13, 14, c('gold', 3));
    door.rect(2, 19, 16, 1, c('concrete', 3));
    book.add(`${name}Door`, door, { solid: SOLID });
    for (const side of ['L', 'R'] as const) {
      const g = wall();
      const x0 = side === 'L' ? 3 : 0;
      const x1 = side === 'L' ? 20 : 17;
      for (let y = 4; y < 20; y++) for (let x = x0; x < x1; x++) g.set(x, y, c('concrete', y % 4 === 3 ? 1 : 3));
      g.rect(x0, 4, x1 - x0, 1, c('ink', 0));
      if (side === 'L') g.rect(3, 4, 1, 16, c('ink', 0));
      else g.rect(16, 4, 1, 16, c('ink', 0));
      for (let x = x0 + 2; x < x1 - 1; x += 4) g.rect(x, 6, 2, 2, c('glow', 1));
      book.add(`${name}Garage${side}`, g, { solid: SOLID });
    }
  }

  // ---------- LaVale Mall ----------
  const flat = P();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) flat.set(x, y, shadeAt(snow, 3, 6, 0.9 - y / 40 + ((x * 13 + y * 7) % 11 === 0 ? -0.2 : 0), x, y));
  flat.rect(0, 16, 20, 1, c('snow', 6)).rect(0, 17, 20, 3, c('brick', 1)).rect(0, 19, 20, 1, c('ink', 0));
  book.add('flatRoof', flat, { solid: SOLID });

  const mallWall = (seed: number) => {
    const p = speckle(P(), 0, 0, 20, 20, R('butter'), 1, 1, seed, 0.15);
    p.rect(0, 0, 1, 20, c('butter', 0)).rect(0, 9, 20, 1, c('butter', 0));
    return p;
  };
  book.add('mallWall', mallWall(1), { solid: SOLID });
  {
    const label = 'LAVALE MALL';
    const tiles = 6;
    const big = new Pixels(tiles * 20, 20);
    for (let t = 0; t < tiles; t++) big.blit(mallWall(t + 3), t * 20, 0);
    big.rect(1, 3, tiles * 20 - 2, 14, c('ink', 0));
    micro(big, Math.floor((tiles * 20 - microWidth(label, 2)) / 2), 5, label, c('glow', 3), 2);
    big.rect(0, 2, tiles * 20, 1, c('snow', 6));
    for (let t = 0; t < tiles; t++) book.add(`mall${t}`, big.crop(t * 20, 0, 20, 20), { solid: SOLID });
  }
  const glassDoor = mallWall(9);
  glassDoor.rect(1, 2, 18, 18, c('concrete', 0));
  gradient(glassDoor, 2, 3, 7, 17, R('glow'), 2, 0);
  gradient(glassDoor, 11, 3, 7, 17, R('glow'), 2, 0);
  glassDoor.rect(7, 9, 1, 5, c('concrete', 3)).rect(12, 9, 1, 5, c('concrete', 3));
  book.add('mallDoor', glassDoor, { solid: SOLID });
  {
    const label = 'BITS & BYTES';
    const tiles = 5;
    const big = new Pixels(tiles * 20, 20);
    for (let t = 0; t < tiles; t++) big.blit(mallWall(t + 13), t * 20, 0);
    big.rect(1, 3, tiles * 20 - 2, 14, c('ink', 0));
    const x = Math.floor((tiles * 20 - microWidth(label, 2)) / 2);
    micro(big, x + 1, 6, label, c('pink', 1), 2);
    micro(big, x, 5, label, c('pink', 4), 2);
    big.rect(0, 2, tiles * 20, 1, c('snow', 6));
    for (let t = 0; t < tiles; t++) book.add(`store${t}`, big.crop(t * 20, 0, 20, 20), { solid: SOLID });
  }
  // The window with THE box in it: pink, $89.
  const boxWin = mallWall(21);
  boxWin.rect(1, 2, 18, 16, c('concrete', 0));
  gradient(boxWin, 2, 3, 16, 14, R('glow'), 3, 1);
  boxWin.rect(5, 4, 9, 12, c('pink', 3)).rect(5, 4, 9, 1, c('pink', 4)).rect(13, 4, 1, 12, c('pink', 1)).rect(14, 5, 1, 11, c('pink', 0));
  micro(boxWin, 6, 6, 'GM', c('snow', 6));
  boxWin.rect(6, 12, 7, 1, c('siding', 2)).rect(6, 14, 5, 1, c('gold', 3));
  boxWin.rect(10, 15, 9, 3, c('snow', 6));
  micro(boxWin, 11, 15, '89', c('coat', 2));
  boxWin.rect(1, 18, 18, 2, c('snow', 6));
  book.add('boxWindow', boxWin, { solid: SOLID });
  const storeDoor = (open: boolean) => {
    const p = mallWall(23);
    if (open) {
      p.rect(2, 2, 16, 18, c('glow', 3));
      gradient(p, 2, 2, 16, 18, R('glow'), 3, 2);
      p.rect(2, 2, 3, 18, c('ice', 2)).rect(3, 2, 1, 18, c('ice', 4));
      for (let x = 2; x < 18; x++) p.set(x, 19, c('pink', 2));
    } else {
      p.rect(2, 2, 16, 18, c('concrete', 0)).rect(3, 3, 14, 16, c('ice', 1));
      gradient(p, 3, 3, 14, 16, R('glow'), 2, 0);
      p.rect(4, 6, 12, 8, c('snow', 6)).frame(4, 6, 12, 8, c('pink', 2));
      micro(p, 5, 8, '$89', c('pink', 1));
      p.rect(9, 3, 2, 3, c('ink', 0));
      p.rect(15, 11, 1, 4, c('concrete', 3));
    }
    return p;
  };
  // The register: it only opens when you have $89 (the touch is refused below that).
  book.add('storeDoor', storeDoor(false), { solid: SOLID, effect: MONEY, eamt: -89, score: 8900, touch: 'storeOpen' });
  book.add('storeOpen', storeDoor(true));

  // Timeout, the arcade: a marquee with chasing bulbs, two glowing cabinets in the
  // windows, and a door that eats four quarters ($1) a push for a game - and warms you up.
  const marquee = (frame: number) => {
    const big = new Pixels(60, 20);
    for (let t = 0; t < 3; t++) big.blit(mallWall(t + 31), t * 20, 0);
    big.rect(1, 3, 58, 15, c('ink', 0));
    for (let x = 2; x < 58; x += 2) big.set(x, 3, c('bulbs', (x / 2 + frame) % 4)).set(x, 17, c('bulbs', (x / 2 + frame + 2) % 4));
    const label = 'TIMEOUT';
    const x = Math.floor((60 - microWidth(label, 2)) / 2);
    micro(big, x + 1, 7, label, c('orange', 0), 2);
    micro(big, x, 6, label, frame ? c('orange', 3) : c('gold', 3), 2);
    big.rect(0, 2, 60, 1, c('snow', 6));
    return big;
  };
  for (const f of [0, 1]) {
    const big = marquee(f);
    for (let t = 0; t < 3; t++) book.add(`arcade${f}${t}`, big.crop(t * 20, 0, 20, 20), { solid: SOLID, next: `arcade${1 - f}${t}`, ntime: 6 });
  }
  const arcadeWin = mallWall(35);
  arcadeWin.rect(1, 2, 18, 16, c('concrete', 0)).rect(2, 3, 16, 15, c('ink', 0));
  for (const cx of [3, 11]) {
    arcadeWin
      .rect(cx, 5, 6, 13, c('siding', 1))
      .rect(cx + 1, 6, 4, 4, c('money', 2))
      .set(cx + 2, 7, c('gold', 3))
      .set(cx + 3, 8, c('coat', 3));
    arcadeWin.rect(cx + 1, 12, 4, 1, c('grey', 4)).set(cx + 2, 11, c('coat', 3));
  }
  arcadeWin.rect(1, 18, 18, 2, c('snow', 6));
  book.add('arcadeWin', arcadeWin, { solid: SOLID });
  const arcadeDoor = mallWall(37);
  arcadeDoor.rect(2, 2, 16, 18, c('concrete', 0));
  gradient(arcadeDoor, 3, 3, 14, 17, R('pink'), 1, 3);
  arcadeDoor.rect(5, 6, 10, 7, c('ink', 0));
  micro(arcadeDoor, 6, 7, '25', c('gold', 3));
  arcadeDoor.rect(11, 8, 2, 3, c('grey', 4));
  arcadeDoor.rect(15, 11, 1, 4, c('concrete', 3));
  book.add('arcadeDoor', arcadeDoor, { solid: SOLID, effect: MONEY, eamt: -1, hp: 5, score: 100 });

  // ---------- the Jamie Street sled run ----------
  const slope = (seed: number, tracks: boolean, steep = 0) => {
    const p = P();
    const r = rng(seed);
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(snow, 3 - steep, 6, 0.78 + Math.sin((x + y * 0.3 + seed) * 0.314) * 0.06 + (r() - 0.5) * 0.16, x, y));
    if (tracks)
      for (let y = 0; y < 20; y++)
        p.set(6 + Math.round(Math.sin(y * 0.3 + seed) * 1.2), y, c('snow', 3)).set(13 + Math.round(Math.sin(y * 0.3 + seed) * 1.2), y, c('snow', 3));
    if (steep)
      for (const [x, y] of [
        [5, 6],
        [14, 13],
      ])
        for (let i = 0; i < 3; i++) p.set(x - i, y - i, c('snow', 2)).set(x + i, y - i, c('snow', 2));
    return p;
  };
  // grav 5 = up AND down: the pulls cancel, so the sled keeps whatever speed it has.
  const GLIDE = 5;
  book.add('slope', slope(1, false), { grav: GLIDE });
  book.add('slopeT', slope(2, true), { grav: GLIDE });
  book.add('steep', slope(3, false, 1), { grav: 4 });
  const mogul = slope(4, false);
  blob(mogul, 10, 11, 8, 5, snow, 1, 6);
  book.add('mogul', mogul, { grav: 1 });
  const rock = slope(5, false);
  blob(rock, 10, 12, 8, 6, R('grey'), 1, 4);
  blob(rock, 9, 8, 6, 2.5, snow, 4, 6);
  book.add('rock', rock, { solid: SOLID, hp: -8 });
  book.add('slopeTree', pine(slope(6, false)), { solid: SOLID, hp: -10 });
  const flag = (col: string) => {
    const p = slope(7, false);
    p.rect(9, 3, 1, 15, c('ink', 1));
    for (let y = 0; y < 6; y++) p.rect(10, 3 + y, 6 - y, 1, c(col, 3));
    blob(p, 9, 18, 3, 1, snow, 2, 3);
    return p;
  };
  book.add('flagRed', flag('coat'), { grav: GLIDE });
  book.add('flagBlue', flag('siding'), { grav: GLIDE });
  const finish = slope(8, false);
  for (let y = 6; y < 14; y++) for (let x = 0; x < 20; x++) finish.set(x, y, ((x >> 2) + (y >> 2)) % 2 ? c('coat', 3) : c('snow', 6));
  book.add('finish', finish);
  book.add('slopeBill', bill(slope(9, false), 0.1), { grav: GLIDE, effect: MONEY, eamt: 1, score: 10, touch: 'slope' });
  book.add('slopeCocoa', mug(slope(10, false), 0), { grav: GLIDE, hp: 35, score: 25, touch: 'slope' });

  return book;
}
