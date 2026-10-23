// Level 5's background blocks, the Klown Klub: the night sky and the midway, the big top's
// bleachers, ring and rigging, trampolines (gravity up) and a tightrope, the three-ticket
// turnstile, backstage (mirrors, costume rack, trunks, the stage door), the trapdoor shaft
// with the stage lift, the stage with its curtains and footlights, a spotlight cone cut into
// 3 x 6 blocks, the Klub members over the tent canvas, and Doc Leo waiting for his nose.
import { Pixels, rng } from '../../../kit/pixels';
import { blob, micro, over, speckle } from '../art/draw';
import { CTR } from '../ids';
import { GRAV, Tiles } from './level';
import { KLUB } from '../sprites/klubfolk';
import { FULL, docLeo } from '../sprites/people';
import { c, canvas, copy, cut, dirt, r, sky } from '../blocks/tiles';
import { rootBeer } from '../sprites/toys';

export const G = 40;

/** Big-top canvas stripes (scenery), `solid` for the walls. */
function canvasStripes(seed: number, dark = false): Pixels {
  const p = new Pixels(20, 20);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) p.set(x, y, Math.floor((x + seed * 10) / 10) % 2 ? c('red', dark ? 0 : 2) : dark ? c('red', 1) : c('paint', 2));
  return p;
}

export function klubTiles(): Tiles {
  const t = new Tiles();
  // The night sky and stars outside; the midway.
  for (let k = 0; k < 4; k++) {
    t.air(`sky${k}`, sky(k));
    const p = sky(k);
    const R = rng(k + 5);
    for (let i = 0; i < 2; i++) p.set(1 + Math.floor(R() * 18), 1 + Math.floor(R() * 18), c('glow', 3));
    t.air(`star${k}`, p);
  }
  t.air('tentOut', canvasStripes(0));
  t.air('tentOut2', canvasStripes(1));
  t.air(
    'tentEave',
    (() => {
      const p = sky(3);
      for (let y = 8; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, Math.floor(x / 10) % 2 ? c('red', 2) : c('paint', 2));
      for (let x = 0; x < 20; x += 10) blob(p, x + 5, 18, 5, 3, x % 20 ? [c('paint', 2), c('paint', 3)] : [c('red', 1), c('red', 2)], 0, 1);
      return p;
    })(),
  );
  for (const ph of [0, 1]) {
    t.air(
      `lights_${ph}`,
      (() => {
        const p = sky(3);
        p.line(0, 4, 19, 7, c('ink', 1));
        for (let x = 2; x < 20; x += 5) blob(p, x, 6 + Math.floor(x / 7), 1.6, 1.6, [c('neon', (x / 5 + ph) % 3)], 0, 0);
        return p;
      })(),
      { next: `lights_${1 - ph}`, ntime: 9 },
    );
  }
  t.wall('canvas', canvasStripes(0, true));
  t.wall(
    'sawdust',
    (() => {
      const p = speckle(new Pixels(20, 20), 0, 0, 20, 20, r('wood'), 3, 1, 3, 0.4);
      p.rect(0, 0, 20, 2, c('wood', 4));
      return p;
    })(),
  );
  t.wall('deep', dirt(9, true));
  t.wall(
    'midway',
    (() => {
      const p = speckle(new Pixels(20, 20), 0, 0, 20, 20, r('dirt'), 2, 1, 4, 0.3);
      p.rect(0, 0, 20, 2, c('dirt', 4));
      return p;
    })(),
  );

  // Inside the big top: bleachers full of people, the ring, the rigging.
  t.air('inside', canvasStripes(0, true));
  t.air(
    'rigging',
    (() => {
      const p = canvasStripes(0, true);
      p.line(0, 19, 19, 0, c('ink', 1));
      blob(p, 10, 6, 4, 3, r('glow'), 1, 3);
      return p;
    })(),
  );
  const crowd = (seed: number) => {
    const p = new Pixels(20, 20, c('wood', 1));
    for (let y = 0; y < 20; y += 10) p.rect(0, y + 8, 20, 2, c('wood', 3));
    const R = rng(seed);
    for (let y = 0; y < 20; y += 10)
      for (let x = 1; x < 20; x += 5) {
        const col = ['red', 'blue', 'green', 'purple', 'yellow'][Math.floor(R() * 5)];
        p.rect(x, y + 4, 4, 4, c(col, 2));
        blob(p, x + 2, y + 2, 1.8, 2, r('skin'), 1, 3);
      }
    return p;
  };
  t.wall('bleachers', crowd(1));
  t.wall('bleachers2', crowd(2));
  t.air('crowd', crowd(3));
  t.air(
    'tunnel',
    (() => {
      const p = new Pixels(20, 20, c('ink', 0));
      p.rect(0, 0, 20, 3, c('wood', 1));
      for (let x = 4; x < 20; x += 8) p.rect(x, 3, 2, 17, c('wood', 0));
      return p;
    })(),
  );
  // Trampolines lift Teddy up (gravity up), and a tightrope high above the ring.
  for (const ph of [0, 1]) {
    t.air(
      `tramp_${ph}`,
      (() => {
        const p = canvasStripes(0, true);
        p.rect(1, 14 - ph * 2, 18, 2, c('blue', 2))
          .rect(1, 16, 2, 4, c('metal', 2))
          .rect(17, 16, 2, 4, c('metal', 2));
        return p;
      })(),
      { grav: GRAV.up, next: `tramp_${1 - ph}`, ntime: 3 },
    );
    t.air(
      `boing_${ph}`,
      (() => {
        const p = canvasStripes(0, true);
        for (let i = 0; i < 4; i++) p.set(4 + i * 4, (i * 7 + ph * 9) % 20, c('glow', 3));
        return p;
      })(),
      { grav: GRAV.up, next: `boing_${1 - ph}`, ntime: 3 },
    );
  }
  t.ledge(
    'perch',
    (() => {
      const p = canvasStripes(0, true);
      p.rect(0, 0, 20, 4, c('gold', 1)).rect(0, 0, 20, 1, c('gold', 2));
      p.rect(9, 4, 2, 16, c('metal', 1));
      return p;
    })(),
  );
  t.ledge(
    'rope',
    (() => {
      const p = canvasStripes(0, true);
      p.rect(0, 1, 20, 1, c('paint', 3)).rect(0, 2, 20, 1, c('paint', 1));
      return p;
    })(),
  );

  // The turnstile at the big top's door: three tickets, please.
  t.wall(
    'turnstile',
    (() => {
      const p = new Pixels(20, 20, c('ink', 0));
      p.rect(8, 4, 4, 16, c('metal', 2)).rect(0, 8, 20, 3, c('metal', 3)).rect(2, 0, 16, 4, c('gold', 1));
      micro(p, 7, 0, '3', c('ink', 0));
      return p;
    })(),
    { effect: CTR.tickets, eamt: -3, touch: 'turnstileOpen', score: 100 },
  );
  t.air(
    'turnstileOpen',
    (() => {
      const p = new Pixels(20, 20, c('ink', 0));
      p.rect(8, 4, 4, 16, c('metal', 2)).rect(9, 0, 2, 20, c('metal', 3)).rect(2, 0, 16, 4, c('gold', 1));
      return p;
    })(),
  );
  t.air(
    'doorTop',
    (() => {
      const p = copy(t.pic('canvas'));
      p.rect(0, 6, 20, 14, c('gold', 1));
      micro(p, 1, 9, 'ADMIT', c('red', 1));
      return p;
    })(),
  );

  // Backstage: mirrors with lights, a costume rack, trunks; the stage door.
  t.air(
    'backstage',
    (() => {
      const p = new Pixels(20, 20, c('purple', 0));
      for (let x = 0; x < 20; x += 4) p.rect(x, 0, 1, 20, c('purple', 1));
      return p;
    })(),
  );
  t.air(
    'mirror',
    (() => {
      const p = copy(t.pic('backstage'));
      p.rect(3, 3, 14, 14, c('gold', 1)).rect(5, 5, 10, 10, c('sky', 6));
      for (let i = 3; i < 17; i += 3) p.set(i, 2, c('glow', 3)).set(i, 17, c('glow', 3));
      return p;
    })(),
  );
  t.air(
    'rack',
    (() => {
      const p = copy(t.pic('backstage'));
      p.rect(0, 2, 20, 1, c('metal', 3));
      for (const [x, col] of [
        [1, 'red'],
        [6, 'yellow'],
        [11, 'blue'],
        [15, 'green'],
      ] as [number, string][])
        p.rect(x, 3, 4, 14, c(col, 2)).rect(x + 1, 5, 1, 1, c('paint', 3));
      return p;
    })(),
  );
  t.wall(
    'trunk',
    (() => {
      const p = copy(t.pic('backstage'));
      p.rect(1, 6, 18, 14, c('blue', 1)).rect(1, 6, 18, 2, c('blue', 2)).rect(8, 10, 4, 4, c('gold', 2));
      p.rect(1, 12, 18, 1, c('gold', 1));
      return p;
    })(),
  );
  t.wall(
    'stageWall',
    (() => {
      const p = new Pixels(20, 20, c('red', 0));
      for (let x = 0; x < 20; x += 4) p.rect(x, 0, 2, 20, c('red', 1));
      return p;
    })(),
  );
  t.air(
    'doorFrame',
    (() => {
      const p = new Pixels(20, 20, c('ink', 0));
      p.rect(0, 0, 2, 20, c('gold', 1)).rect(18, 0, 2, 20, c('gold', 1)).rect(0, 0, 20, 2, c('gold', 1));
      return p;
    })(),
  );
  t.air(
    'starSign',
    (() => {
      const p = copy(t.pic('stageWall'));
      const R = (a: number) => [10 + Math.cos(a) * 8, 10 + Math.sin(a) * 8];
      for (let i = 0; i < 5; i++) {
        const [x1, y1] = R((i * 4 * Math.PI) / 5 - Math.PI / 2);
        const [x2, y2] = R(((i + 1) * 4 * Math.PI) / 5 - Math.PI / 2);
        p.line(x1, y1, x2, y2, c('gold', 2));
      }
      return p;
    })(),
  );
  // Under the stage: the trapdoor shaft with the stage lift.
  t.air(
    'under',
    (() => {
      const p = speckle(new Pixels(20, 20), 0, 0, 20, 20, r('wood'), 0, 1, 7, 0.3);
      for (let x = 0; x < 20; x += 10) p.rect(x, 0, 2, 20, c('wood', 2));
      return p;
    })(),
  );
  for (const ph of [0, 1])
    t.air(
      `lift_${ph}`,
      (() => {
        const p = copy(t.pic('under'));
        p.rect(3, 0, 1, 20, c('metal', 3)).rect(16, 0, 1, 20, c('metal', 3));
        for (let y = ph * 5; y < 20; y += 10) p.rect(4, y, 12, 1, c('glow', 2));
        return p;
      })(),
      { grav: GRAV.up, next: `lift_${1 - ph}`, ntime: 3 },
    );

  // The stage: boards, curtains, footlights, spotlights.
  t.wall(
    'stage',
    (() => {
      const p = new Pixels(20, 20, c('wood', 2));
      for (let y = 0; y < 20; y += 5) p.rect(0, y, 20, 1, c('wood', 1));
      p.rect(0, 0, 20, 2, c('wood', 4));
      return p;
    })(),
  );
  t.wall(
    'stageFront',
    (() => {
      const p = new Pixels(20, 20, c('red', 1));
      for (let x = 0; x < 20; x += 5) p.rect(x, 0, 2, 20, c('red', 0));
      p.rect(0, 0, 20, 3, c('gold', 2));
      blob(p, 10, 2, 3, 2, r('glow'), 2, 3);
      return p;
    })(),
  );
  t.air(
    'curtain',
    (() => {
      const p = new Pixels(20, 20, c('red', 1));
      for (let x = 0; x < 20; x += 5) p.rect(x + 2, 0, 2, 20, c('red', 2));
      p.rect(0, 0, 1, 20, c('red', 0));
      return p;
    })(),
  );
  // A spotlight cone, three blocks wide and six high, from the rigging to the stage.
  const cone = new Pixels(60, 120, c('purple', 0));
  for (let y = 0; y < 120; y++) {
    const half = 4 + y * 0.22;
    for (let x = 0; x < 60; x++) {
      const d = Math.abs(x - 30);
      if (d < half && ((x + y) % 2 === 0 || d < half * 0.5)) cone.set(x, y, d < half * 0.5 ? c('glow', 3) : c('glow', 2));
    }
  }
  cut(cone).forEach((row, y) => row.forEach((px, x) => t.air(`cone${x}${y}`, px)));
  t.air('stageBack', new Pixels(20, 20, c('purple', 0)));

  // The klown klub members (two blocks tall, over the midway's tent canvas).
  for (const [name, fig] of Object.entries(KLUB)) {
    // each over the stripe of the column it stands in (honker and twirly on even columns)
    const base = name === 'launcher' ? 'backstage' : name === 'bubbles' ? 'tentOut' : 'tentOut2';
    const top = new Pixels(20, 20);
    top.px.set(t.pic(base).px);
    over(top, fig.crop(0, 0, 20, 20));
    const bot = new Pixels(20, 20);
    bot.px.set(t.pic(base).px);
    over(bot, fig.crop(0, 20, 20, 20));
    t.air(`${name}Top`, top);
    t.air(`${name}Bot`, bot, name === 'bubbles' ? { birthMon: 0, birthTime: 0 } : name === 'launcher' ? { birthMon: 0, birthTime: 0 } : {});
  }
  // Doc Leo on stage in the middle of the right spotlight, without his nose; happy once he has it (the way out).
  const leo = docLeo({ hat: true, tie: true, shoes: true, chicken: true, nose: false });
  const leoHappy = docLeo(FULL, true);
  const half = (fig: Pixels, y: number) => {
    const p = copy(t.pic(y ? 'cone15' : 'cone14'));
    over(p, fig.crop(0, y, 20, 20));
    return p;
  };
  t.air('leoTop', half(leo, 0));
  t.air('leoTopHappy', half(leoHappy, 0));
  t.air('leoBotHappy', half(leoHappy, 20));
  t.wall('leoBot', half(leo, 20), { effect: CTR.props, eamt: -1, touch: 'leoBotHappy', score: 1000 });

  // The root beer stand on the midway: a frosty mug on the counter, fizzing. Doc Leo always
  // asks for root beer; fetch (F) him one, his usual.
  const stand = (mug: boolean, fizz: number) => {
    const p = canvas(2, 2, (bx) => t.pic(bx ? 'tentOut' : 'tentOut2'));
    // the sign on two posts
    p.rect(0, 1, 40, 11, c('wood', 1)).rect(1, 2, 38, 9, c('wood', 3)).rect(1, 2, 38, 1, c('wood', 4));
    micro(p, 3, 4, 'ROOT BEER', c('red', 1));
    p.rect(2, 12, 2, 16, c('wood', 1)).rect(36, 12, 2, 16, c('wood', 1));
    // the tap and the counter
    p.rect(27, 14, 5, 3, c('red', 1)).rect(28, 17, 3, 7, c('metal', 3)).rect(28, 17, 1, 7, c('metal', 4)).rect(29, 24, 1, 2, c('metal', 2));
    p.rect(0, 28, 40, 3, c('red', 3)).rect(0, 31, 40, 9, c('red', 2)).rect(0, 28, 40, 1, c('paint', 3));
    for (let x = 2; x < 40; x += 6) p.rect(x, 32, 3, 8, c('paint', 3));
    if (mug) over(p, rootBeer(fizz).crop(2, 6, 16, 14), 4, 14);
    else p.rect(7, 28, 8, 1, c('wood', 3));
    return cut(p);
  };
  const [top, bot] = stand(true, 0);
  t.air('beerSignL', top[0]);
  t.air('beerSignR', top[1]);
  const fizz = stand(true, 3)[1][0];
  const gone = stand(false, 0)[1][0];
  t.air('beerGone', gone);
  // the mug fizzes: two pictures that take turns (a next/ntime pair, both fetchable)
  t.add('beerMug', bot[0], { obj: true, score: 500, touch: 'beerGone', next: 'beerMug2', ntime: 5, grav: GRAV.down });
  t.add('beerMug2', fizz, { obj: true, score: 500, touch: 'beerGone', next: 'beerMug', ntime: 5, grav: GRAV.down });
  t.air('beerKeg', bot[1]);
  return t;
}
