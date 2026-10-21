// Level 5: The Klown Klub, showtime. Earn three tickets from Doc Leo's friends with
// tricks (a high five for Honker, a sit for Bubbles, a spin for Twirly), get through the
// turnstile, roll a fluff ball into the bowling pins under the bleachers, play dead under
// Professor Pratfall's practice pies, spin through the stage door, dig under the stage
// and ride the stage lift up. Gwin is in the spotlight with the red nose in her mouth:
// sit pretty and she sits too, and drops it. Then give it to Doc Leo. Ta-daaa!
import { Pixels, rng } from '../../../kit/pixels';
import { blob, micro, over, speckle, sprite } from '../art/draw';
import { CTR, POWER } from '../ids';
import { GRAV, LevelMap, Tiles, newBestiary, type Level } from './level';
import { askBubble, hand } from '../sprites/folks';
import { CK, propSprite } from '../sprites/klown';
import { KLUB, bubble, gwinSits, pie, pinStack, pinsDown } from '../sprites/klubfolk';
import { GWIN } from '../sprites/gwin';
import { FULL, docLeo } from '../sprites/people';
import { bandOf } from './level1Tiles';
import { revolvingDoor } from './level4Beasts';
import { c, copy, cut, dirt, r, sky } from '../blocks/tiles';

const G = 40;

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
      const p = canvasStripes(0);
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
    const base = name === 'pratfall' ? 'backstage' : 'tentOut';
    const top = new Pixels(20, 20);
    top.px.set(t.pic(base).px);
    over(top, fig.crop(0, 0, 20, 20));
    const bot = new Pixels(20, 20);
    bot.px.set(t.pic(base).px);
    over(bot, fig.crop(0, 20, 20, 20));
    t.air(`${name}Top`, top);
    t.air(`${name}Bot`, bot, name === 'bubbles' ? { birthMon: 0, birthTime: 0 } : name === 'pratfall' ? { birthMon: 0, birthTime: 0 } : {});
  }
  // Doc Leo on stage, without his nose; happy once he has it (the way out).
  const leo = docLeo({ hat: true, tie: true, shoes: true, horn: true, nose: false });
  const leoHappy = docLeo(FULL, true);
  const half = (fig: Pixels, y: number) => {
    const p = copy(t.pic('stageBack'));
    over(p, fig.crop(0, y, 20, 20));
    return p;
  };
  t.air('leoTop', half(leo, 0));
  t.air('leoTopHappy', half(leoHappy, 0));
  t.air('leoBotHappy', half(leoHappy, 20));
  t.wall('leoBot', half(leo, 20), { effect: CTR.props, eamt: -1, touch: 'leoBotHappy', score: 1000 });
  return t;
}

export function klubBeasts() {
  const b = newBestiary();
  revolvingDoor(b);
  b.pic('hand', hand());
  b.pic('askSit1', askBubble('SIT?', propSprite('nose'), 0)).pic('askSit2', askBubble('SIT?', propSprite('nose'), 1));
  const ticketIcon = sprite(['oooooooooo', 'ovvvvvvvvo', 'ovGGGGGGvo', 'ovvvvvvvvo', 'oooooooooo'], { ...CK, v: P_('purple', 2), G: P_('gold', 2) }, 5, 13);
  b.pic('askTix1', askBubble('SIT?', ticketIcon, 0)).pic('askTix2', askBubble('SIT?', ticketIcon, 1));
  b.pic('askSpin1', askBubble('SPIN', ticketIcon, 0)).pic('askSpin2', askBubble('SPIN', ticketIcon, 1));
  b.pic('pins', pinStack(), { solid: 15 });
  b.pic('pinsDown', pinsDown());
  b.pic('pie1', pie(0), { hp: -8 }).pic('pie2', pie(1), { hp: -8 });
  b.pic('bubble1', bubble(0)).pic('bubble2', bubble(1));
  // Gwin with the nose in her mouth, then sitting nicely with it at her feet.
  const gn = (pose: string) => {
    const p = new Pixels(20, 20, 255);
    p.blit(GWIN[pose], 0, 0, 255);
    p.blit(sprite(['.oo.', 'oRRo', 'oRRo', '.oo.'], CK, 17, 5), 0, 0, 255);
    return p;
  };
  b.pic('gwinNose1', gn('gwin1')).pic('gwinNose2', gn('gwin3'));
  b.pic('gwinSitNose', gwinSits(true, 0), { effect: CTR.props, eamt: 1, score: 500 });
  b.pic('gwinSit1', gwinSits(false, 0)).pic('gwinSit2', gwinSits(false, 1));

  b.add('hand', { pics: [['hand', 50]], power: POWER.balloon, becomes: 'ticketFall', upscore: 50 });
  b.add('askTix', {
    pics: [
      ['askTix1', 10],
      ['askTix2', 10],
    ],
    power: POWER.sitAsk,
    becomes: 'ticketFall2',
    upscore: 50,
  });
  b.add('ticketFall2', { pics: [['ticket1', 2]], power: POWER.pickup, path: [[0, 2, 3]], end: -1, becomes: 'ticket' });
  b.add('askSpin', {
    pics: [
      ['askSpin1', 10],
      ['askSpin2', 10],
    ],
    power: POWER.spinAsk,
    becomes: 'ticket',
    upscore: 50,
  });
  b.add('pins', { pics: [['pins', 50]], power: POWER.stack, becomes: 'pinsDown', upscore: 100 });
  b.add('pinsDown', { pics: [['pinsDown', 50]], power: POWER.friend + 10, end: -2 });
  b.add('pie', {
    pics: [
      ['pie1', 3],
      ['pie2', 3],
    ],
    power: POWER.projectile,
    path: [[-13, 0, 5]],
    end: -1,
  });
  b.add('bubble', {
    pics: [
      ['bubble1', 4],
      ['bubble2', 4],
    ],
    power: 0,
    path: [
      [1, -2, 1],
      [0, -4, 1],
      [1, -6, 1],
    ],
    end: -1,
  });
  // Gwin will not give back the nose... until Teddy sits pretty, and she sits too.
  b.add('gwinNose', {
    pics: [
      ['gwinNose1', 6],
      ['gwinNose2', 6],
    ],
    power: POWER.sitAsk - 1,
    becomes: 'gwinSitNose',
    upscore: 200,
  });
  b.add('gwinSitNose', { pics: [['gwinSitNose', 50]], power: 2, becomes: 'gwinGood' });
  b.add('gwinGood', {
    pics: [
      ['gwinSit1', 5],
      ['gwinSit2', 5],
    ],
    power: POWER.friend + 10,
    end: -2,
  });
  return b;
}

const P_ = (n: string, k: number) => c(n, k);

export function klub(): Level {
  const bs = klubTiles();
  const beasts = klubBeasts();
  bs.def('bubblesBot').birthMon = beasts.id('bubble');
  bs.def('bubblesBot').birthTime = 30;
  bs.def('pratfallBot').birthMon = beasts.id('pie');
  bs.def('pratfallBot').birthTime = 40;
  const m = new LevelMap(bs, beasts, 'sky0');
  const pick = (() => {
    const R = rng(23);
    return (...names: string[]) => names[Math.floor(R() * names.length)];
  })();
  m.rect(0, 0, 100, G, (x, y) => `${(x * 7 + y * 13) % 5 === 0 ? 'star' : 'sky'}${bandOf(y)}`);
  m.rect(0, G, 100, 1, 'midway');
  m.rect(0, G + 1, 100, 100 - G - 1, 'deep');
  // the map's ends are tent canvas (the map wraps)
  m.rect(0, 20, 3, 20, 'canvas');
  m.rect(86, 20, 14, 20, 'canvas');

  // The midway in front of the big top: string lights, the three klub members.
  const door = 22;
  m.rect(3, 30, door - 3, 10, (x) => (x % 2 ? 'tentOut' : 'tentOut2'));
  m.rect(3, 29, door - 3, 1, 'tentEave');
  m.rect(3, 33, door - 3, 1, (x) => `lights_${x % 2}`);
  m.set(8, 38, 'honkerTop').set(8, 39, 'honkerBot');
  m.mon(9, 38, 'hand');
  m.set(13, 38, 'bubblesTop').set(13, 39, 'bubblesBot');
  m.mon(14, 37, 'askTix');
  m.set(18, 38, 'twirlyTop').set(18, 39, 'twirlyBot');
  m.mon(19, 39, 'askSpin');

  // The big top's door and its turnstile.
  m.rect(door, 20, 1, 19, 'canvas');
  m.set(door, 38, 'doorTop').set(door, 39, 'turnstile');

  // Inside: bleachers with a tunnel under them (bowling pins, then pies), a trampoline up to
  // the tightrope, the backstage wall.
  const in0 = door + 1;
  const back = 44;
  m.rect(in0, 20, back - in0, 20, 'inside');
  m.rect(in0, 20, back - in0, 3, 'rigging');
  m.rect(in0, G, back - in0 + 20, 1, 'sawdust');
  // trampoline at the start, a perch, the tightrope over to a perch with goodies
  m.set(in0 + 2, 39, 'tramp_0');
  for (let y = 33; y < 39; y++) m.set(in0 + 2, y, 'boing_0');
  m.rect(in0 + 3, 33, 2, 1, 'perch');
  m.rect(in0 + 5, 33, 9, 1, 'rope');
  m.rect(in0 + 14, 33, 2, 1, 'perch');
  // the bleachers: solid, with a one-block-high tunnel under them
  const b0 = in0 + 6;
  m.rect(b0, 34, back - b0, 5, (x, y) => ((x + y) % 2 ? 'bleachers' : 'bleachers2'));
  m.rect(b0, 39, back - b0, 1, 'tunnel');
  m.mon(b0 + 2, 39, 'pins');
  // the backstage wall: the tunnel leads straight through it
  m.rect(back, 20, 1, 19, 'stageWall');
  m.set(back, 39, 'tunnel');

  // Backstage: Professor Pratfall practicing pie throws into the tunnel; the stage door.
  const sd = 54;
  m.rect(back + 1, 20, sd - back - 1, 20, 'backstage');
  m.set(back + 2, 36, 'mirror')
    .set(back + 4, 36, 'mirror')
    .set(back + 6, 36, 'rack');
  m.set(back + 3, 38, 'pratfallTop').set(back + 3, 39, 'pratfallBot');
  m.set(back + 7, 39, 'trunk')
    .set(back + 8, 39, 'trunk')
    .set(back + 8, 38, 'trunk');
  m.rect(sd, 20, 1, 19, 'stageWall');
  m.set(sd, 39, 'doorFrame');
  m.mon(sd, 39, 'revolve');

  // Under the stage: dig through the sawdust, crawl to the lift, ride it up.
  const st0 = 58;
  const st1 = 82;
  m.rect(sd + 1, 20, st0 - sd - 1, 20, 'backstage');
  m.rect(sd + 1, G + 1, 12, 1, 'under');
  m.rect(sd + 2, G, 2, 1, 'under');
  m.mon(sd + 2, G, 'plug');
  m.mon(sd + 3, G, 'plug');
  // the stage: four blocks high, curtains and spotlights above it
  m.rect(st0, 36, st1 - st0 + 1, 4, 'stageFront');
  m.rect(st0, 36, st1 - st0 + 1, 1, 'stage');
  m.rect(st0, 20, st1 - st0 + 1, 16, 'stageBack');
  m.rect(st0, 20, 2, 16, 'curtain');
  m.rect(st1 - 1, 20, 2, 16, 'curtain');
  for (const sx of [71, 77]) for (let y = 0; y < 6; y++) for (let x = 0; x < 3; x++) m.set(sx + x, 29 + y, `cone${x}${y}`);
  m.set(st0 + 9, 26, 'starSign')
    .set(st0 + 18, 25, 'starSign')
    .set(st0 + 21, 31, 'starSign');
  // the lift shaft from the tunnel up through the stage floor
  const lift = sd + 12;
  m.rect(lift, 36, 1, 6, 'lift_0');
  m.rect(sd + 1, G, lift - sd - 1, 1, (x) => (x === sd + 2 || x === sd + 3 ? 'under' : 'sawdust'));
  m.set(lift, G, 'lift_0').set(lift, G + 1, 'lift_0');
  m.rect(lift + 1, G + 1, 1, 1, 'under');
  m.rect(st1 + 1, 20, 86 - st1 - 1, 20, 'canvas');
  // Gwin in the spotlight with the nose; Doc Leo waiting.
  m.mon(72, 35, 'gwinNose');
  const leoX = 78;
  m.set(leoX, 34, 'leoTop').set(leoX, 35, 'leoBot');

  const treats: [number, number][] = [
    [5, 39],
    [6, 39],
    [11, 39],
    [16, 39],
    [21, 39],
    [in0 + 3, 32],
    [in0 + 4, 32],
    [in0 + 6, 32],
    [in0 + 8, 32],
    [in0 + 10, 32],
    [in0 + 12, 32],
    [in0 + 14, 32],
    [in0 + 15, 32],
    [in0 + 4, 39],
    [b0 + 5, 39],
    [b0 + 8, 39],
    [b0 + 11, 39],
    [back + 2, 39],
    [back + 5, 39],
    [sd + 6, G + 1],
    [sd + 8, G + 1],
    [sd + 10, G + 1],
    [64, 35],
    [66, 35],
    [68, 35],
  ];
  for (const [x, y] of treats) m.treat(x, y);
  // Doc Leo's balloon dogs, floated loose from the suitcase: up high, worth a detour.
  for (const [x, y] of [
    [in0 + 15, 32],
    [b0 + 11, 39],
    [68, 35],
  ])
    m.mon(x, y, 'poodle');
  m.treat(in0 + 13, 32, 'bone');
  m.mark('start', 4, 39);
  m.mark('exit', leoX, 35);
  void pick;
  void cut;
  return {
    file: 'klub',
    title: 'The Klown Klub',
    time: 'show',
    bs,
    beasts,
    map: m,
    start: m.at('start'),
    exit: m.at('exit'),
    view: [5, 35],
    pose: [16, 39, 'back'],
  };
}
