// The pines behind the park on Gale Street: a few trees there are only drawn (no solid
// sides, so you can walk in among them), a red mitten some kid dropped by the snowman,
// a hollow with a felted egg in it and an old toboggan frozen in at the head of a trail.
// The egg is an object block: walking over it does nothing, the pick-up key takes it into
// the kid's pockets (and its counter thaws the toboggan). Push the toboggan then, and it
// slides you down through the woods to the top of Jamie Street. Added after the snack bar
// so every older block keeps its number.
import { Pixels } from '../../../kit/pixels';
import { blob, shadeAt } from '../art/draw';
import { THAW } from '../ids';
import { Ctx, SOLID } from './book';
import type { addGround } from './ground';
import type { addThings } from './things';

type Painters = ReturnType<typeof addGround>;
type Treats = ReturnType<typeof addThings>;

/** The felted egg on a transparent (255) 20x20 tile, so the screens can scale it up too. */
export function feltEgg(c: Ctx['c']): Pixels {
  const p = new Pixels(20, 20, 255);
  const snow = [c('snow', 2), c('snow', 3), c('snow', 4), c('snow', 5), c('snow', 6)];
  const cx = 9.5;
  const cy = 10;
  const ry = 8.8;
  const rx = 6;
  const inside = (x: number, y: number) => {
    const t = (y + 0.5 - cy) / ry;
    if (Math.abs(t) > 1) return false;
    const hw = rx * Math.sqrt(1 - t * t) * (1 + 0.2 * t);
    return Math.abs(x + 0.5 - cx) <= hw;
  };
  // white felt, lit from the upper left, with a fuzzy speckle
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      if (!inside(x, y)) continue;
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      const z = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      const l = 0.62 * z - 0.42 * nx - 0.5 * ny + ((x * 7 + y * 13) % 5 === 0 ? -0.18 : 0);
      p.set(x, y, shadeAt(snow, 1, 4, (l + 0.4) / 1.15, x, y));
    }
  // blanket stitch in blue thread, every other pixel round the edge
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      if (!inside(x, y)) continue;
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
      if (edge) p.set(x, y, (x + y) % 2 ? c('siding', 2) : c('snow', 1));
    }
  const key: Record<string, number> = {
    B: c('siding', 1),
    b: c('siding', 2),
    R: c('coat', 2),
    r: c('coat', 1),
    h: c('coat', 3),
    G: c('pine', 3),
    g: c('pine', 2),
    Y: c('butter', 3),
    y: c('snow', 6),
  };
  // lazy-daisy snowflakes, a striped scarf with its tail, and the red mitten with a yarn cuff
  const f = new Pixels(20, 20, 255);
  f.draw(
    0,
    0,
    [
      '                    ',
      '                    ',
      '                    ',
      '         b          ',
      '       b B b  B     ',
      '        BBB  BbB    ',
      '       b B b  B     ',
      '         b          ',
      '   RRGGRRGGRRGGRR   ',
      '   RGGRRGGRRGGRRGG  ',
      '            gRR     ',
      '      hR    RGG     ',
      '     hRRR   GRR     ',
      '     RRRRr  RG      ',
      '     RRRrRr         ',
      '     RRRrr     b    ',
      '     YyYy     bBb   ',
      '     yYyY      b    ',
      '                    ',
      '                    ',
    ],
    key,
  );
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (f.get(x, y) !== 255 && inside(x, y)) p.set(x, y, f.get(x, y));
  return p;
}

export function addWoods(k: Ctx, { yardBase }: Painters, { pine }: Treats): void {
  const { book, c, snow } = k;
  // A pine like every other one in the woods, but with no solid sides.
  book.add('pineDrawn', pine(yardBase(91)));

  // A kid's red mitten dropped in the snow, cuff and all.
  const mitten = yardBase(151);
  blob(mitten, 10, 15, 6, 1.6, snow, 2, 3);
  mitten.draw(6, 7, ['  hRR   ', ' hRRRR  ', ' RRRRRhR', ' RRRRRRr', ' RRRRRr ', ' YyYyY  ', '  yYyY  '], {
    R: c('coat', 2),
    r: c('coat', 1),
    h: c('coat', 3),
    Y: c('butter', 3),
    y: c('snow', 6),
  });
  book.add('mitten', mitten);

  // The felted egg, nestled in the snow of the hollow.
  const egg = yardBase(153);
  blob(egg, 10, 18, 7, 1.8, snow, 1, 2);
  egg.blit(feltEgg(c), 0, 0, 255);
  book.add('feltEgg', egg, { obj: 1, effect: THAW, eamt: 2, score: 1992, touch: 'yardA0' });

  // An old wooden toboggan with a curled nose, pointing down the trail: frozen in under a
  // drift until the egg is in your pocket, then one push brushes it off.
  const toboggan = (frozen: boolean) => {
    const p = yardBase(155);
    blob(p, 10, 15, 10, 3, snow, 2, 3);
    for (let x = 1; x < 16; x++) p.rect(x, 11, 1, 4, c('wood', x % 3 === 0 ? 1 : 3)).set(x, 14, c('wood', 1));
    p.rect(1, 11, 15, 1, c('wood', 4));
    // the curl at the front
    p.rect(16, 9, 2, 6, c('wood', 2)).rect(18, 8, 1, 4, c('wood', 2)).set(17, 8, c('wood', 3)).set(16, 9, c('wood', 4));
    // the rope
    p.line(4, 10, 9, 8, c('butter', 1)).line(9, 8, 16, 10, c('butter', 1));
    if (frozen) {
      blob(p, 9, 10, 9, 4.5, snow, 3, 6);
      blob(p, 15, 12, 4, 3, snow, 3, 6);
      p.set(5, 9, c('ice', 4)).set(11, 8, c('ice', 4));
    }
    return p;
  };
  book.add('toboggan', toboggan(true), { solid: SOLID, effect: THAW, eamt: -1, touch: 'tobogganFree' });
  book.add('tobogganFree', toboggan(false));
}
