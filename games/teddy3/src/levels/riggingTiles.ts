// Level 15's background blocks: high in the Big Top's rigging on the night of the party. The
// tent's dark violet canvas (the same as backstage), the ring's sawdust floor far below, the
// tent's side walls, metal catwalks (stand on them, rise up through them) with a railing post,
// the rigging's ropes and the hooks the sandbags swing from, Juggles and Twirly tossing a pin
// back and forth along a catwalk, strings of
// party bulbs not lit yet, the plug of the light string, and the outlet box at the top, which
// takes the plug.
import { Pixels } from '../../../kit/pixels';
import { speckle } from '../art/draw';
import { CTR } from '../ids';
import { Tiles } from './level';
import { c, copy, r } from '../blocks/tiles';
import { sign, wideSign } from './common';
import { juggler } from '../sprites/folks';
import { KLUB } from '../sprites/klubfolk';
import { leoOn } from '../sprites/leo';
import { bulbs, outlet } from '../sprites/rigging';
import { tent } from './stageTiles';

export const G = 58;
/** The catwalks' rows, from the bottom up (the ring floor is G). */
export const ROWS = { t1: 52, t2: 46, t3: 40, t4: 34, t5: 28, t6: 22 };

export function riggingTiles(): Tiles {
  const t = new Tiles();
  const bg = tent();
  t.air('tent', bg);
  t.wall(
    'roof',
    (() => {
      const p = new Pixels(20, 20, c('ink', 0));
      for (let x = 0; x < 20; x += 5) p.rect(x, 0, 1, 20, c('purple', 0));
      return p;
    })(),
  );
  t.wall(
    'side',
    (() => {
      const p = new Pixels(20, 20, c('red', 0));
      for (let y = 0; y < 20; y += 5) p.rect(0, y, 20, 1, c('red', 1));
      p.rect(9, 0, 2, 20, c('ink', 0));
      return p;
    })(),
  );
  t.wall(
    'floor',
    (() => {
      const p = new Pixels(20, 20);
      speckle(p, 0, 0, 20, 20, r('hay'), 1, 2, 41, 0.3);
      p.rect(0, 0, 20, 2, c('red', 2)).rect(0, 2, 20, 1, c('red', 0));
      return p;
    })(),
  );
  t.wall(
    'under',
    (() => {
      const p = new Pixels(20, 20);
      speckle(p, 0, 0, 20, 20, r('dirt'), 0, 1, 42, 0.2);
      return p;
    })(),
  );
  // a catwalk: metal grating with a toe board
  t.ledge(
    'catwalk',
    (() => {
      const p = copy(bg);
      p.rect(0, 0, 20, 3, c('metal', 3)).rect(0, 3, 20, 1, c('metal', 1));
      for (let x = 1; x < 20; x += 3) p.rect(x, 1, 1, 2, c('metal', 1));
      p.rect(0, 4, 20, 2, c('metal', 0));
      for (const x of [4, 15]) p.line(x, 6, x + 3, 11, c('metal', 1));
      return p;
    })(),
  );
  // the end post of a catwalk's railing (solid: nobody walks off this end)
  t.wall(
    'post',
    (() => {
      const p = copy(bg);
      p.rect(7, 0, 6, 20, c('metal', 2)).rect(7, 0, 1, 20, c('metal', 4)).rect(12, 0, 1, 20, c('metal', 0));
      p.rect(5, 0, 10, 3, c('red', 2));
      return p;
    })(),
  );
  // rigging ropes, and the hook a sandbag swings from
  const rope = (p: Pixels) => p.rect(9, 0, 2, 20, c('hay', 1)).rect(9, 0, 1, 20, c('hay', 2));
  t.air('rope', rope(copy(bg)));
  t.air(
    'hook',
    (() => {
      const p = copy(bg);
      p.rect(9, 0, 2, 8, c('hay', 1)).rect(7, 8, 6, 3, c('metal', 2)).rect(8, 11, 1, 3, c('metal', 2)).rect(8, 13, 4, 1, c('metal', 2));
      return p;
    })(),
  );
  // the bleachers (solid): bench planks in rows, their top is a walkway
  const bench = (shade: number) => {
    const p = new Pixels(20, 20, c('ink', 1));
    for (let y = 0; y < 20; y += 10) p.rect(0, y, 20, 3, c('red', shade)).rect(0, y + 3, 20, 1, c('ink', 0));
    p.rect(9, 4, 2, 6, c('metal', 0)).rect(9, 14, 2, 6, c('metal', 0));
    return p;
  };
  t.wall('bench', bench(1));
  t.wall('benchB', bench(2));
  t.wall(
    'benchTop',
    (() => {
      const p = bench(1);
      p.rect(0, 0, 20, 3, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4));
      return p;
    })(),
  );
  t.air('bulbs', bulbs(bg));
  // Juggles on a catwalk, juggling (two pictures taking turns), and the pins over his head
  for (const ph of [0, 1]) {
    const [a, b] = leoOn(juggler(ph), bg, bg);
    t.air(`juggles${ph}Top`, a, { next: `juggles${1 - ph}Top`, ntime: 7 });
    t.air(`juggles${ph}Bot`, b, { next: `juggles${1 - ph}Bot`, ntime: 7 });
  }
  // Twirly at the other end of the catwalk, catching the pin and tossing it back
  const [tw0, tw1] = leoOn(KLUB.twirly, bg, bg);
  t.air('twirlyTop', tw0);
  t.air('twirlyBot', tw1);
  // the plug of the light string (fetch it), and the outlet at the top (it takes the plug)
  t.clue('plug', 'plug', 'tent');
  t.air('outletOn', outlet(bg, true));
  t.wall('outlet', outlet(bg, false), { effect: CTR.clues, eamt: -1, touch: 'outletOn', score: 250 });
  t.air('outletTop', bulbs(bg));
  // signs
  const signs: [string, string][] = [
    ['signUp', 'UP TO THE\nTOP: 1'],
    ['signPins', 'PINS POP\nBALLOONS!'],
    ['signBags', 'SANDBAGS?\nHOLD 4'],
  ];
  for (const [name, words] of signs) {
    const [a, b] = wideSign(bg, words);
    t.air(`${name}L`, a);
    t.air(`${name}R`, b);
  }
  t.air('signLift', sign(bg, 'LIFT', 'right'));
  t.air('signPlug', sign(bg, 'PLUG', 'left'));
  return t;
}
