// Things in the snow: pines, bushes, fences, lamps, buried hydrants, snowmen, the snow forts
// (a kid ducks and pops up by a next/ntime pair, and both frames give birth to a snowball
// monster every 66 ticks; touching one knocks it down to a pile for 100 points), cocoa mugs,
// dollar bills and a $5 tip on the walk, signposts, two-block street-name signs and the cars
// buried in the mall lot. Returns the pine, mug and bill painters, which the sled run reuses.
import { Pixels } from '../../../kit/pixels';
import { blob, shadeAt } from '../art/draw';
import { micro, microWidth } from '../art/font';
import { MON } from '../ids';
import { Ctx, MONEY, SOLID } from './book';
import type { addGround } from './ground';

type Painters = ReturnType<typeof addGround>;

export function addThings(k: Ctx, { yardBase, sidewalk, lot }: Painters) {
  const { book, R, c, snow } = k;
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
  return { pine, mug, bill };
}
