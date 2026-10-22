// More of the sea floor for OCEAN.BBL, so every one of the 150 slots holds something: more
// coral, plankton, sand and reef variations, vent chimneys, anchors, cannons, chests, big
// shells, sea mines, skull rocks, obelisks, lamps, fish schools and other ruins.
import { Pixels, rng } from '../../../kit/pixels';
import { CLEAR, Mask, fill, outline, shade, sprite } from '../art/draw';
import { SOLID, SetBuilder, TOP, over, tex } from './blockset';
import { OUTLINE, WHITE } from '../art/palette';
import { R } from './common';
import { bubbles, coral, kelp, reefRock, sandTex, water } from './oceanArt';

/** More of the sea floor: every one of the 150 slots holds something. */
export function oceanExtras(s: SetBuilder): void {
  const W5 = (seed: number) => water(5, seed);
  const D = (name: string, sp: Pixels, depth = 5, props = {}) => s.add(name, over(water(depth, 120 + s.count), sp), props);
  for (let k = 0; k < 6; k++) D(`coral:${4 + k}`, coral(130 + k, k % 4), 4 + (k % 4));
  D(
    'kelp:top3',
    kelp('top', 2).map((_x, _y, c) => (c === CLEAR ? c : R('bloom')[Math.min(4, 1 + ((_x + _y) % 4))])),
    5,
  );
  D(
    'kelp:mid3',
    kelp('mid', 2).map((_x, _y, c) => (c === CLEAR ? c : R('bloom')[Math.min(4, 1 + ((_x + _y) % 4))])),
    5,
  );
  D(
    'anchor',
    (() => {
      const p = sprite();
      const m = R('tech');
      p.line(10, 2, 10, 17, m[3]).line(11, 2, 11, 17, m[2]);
      p.line(4, 5, 16, 5, m[3]);
      fill(p, new Mask().ellipse(10.5, 2, 2, 2).minus(new Mask().ellipse(10.5, 2, 1, 1)), m[4]);
      p.line(3, 13, 10, 18, m[3]).line(17, 13, 11, 18, m[3]);
      return outline(p, OUTLINE);
    })(),
    6,
  );
  const chest = (open: boolean) => {
    const p = sprite();
    shade(p, new Mask().rect(3, 9, 14, 9), R('stem'));
    if (!open) shade(p, new Mask().ellipse(10, 9, 7, 3).rect(3, 9, 14, 1), R('stem'));
    else {
      shade(p, new Mask().rect(3, 3, 14, 4), R('stem'));
      fill(p, new Mask().rect(4, 8, 12, 2), R('accent')[4]);
    }
    p.rect(3, 12, 14, 1, R('accent')[3]).rect(9, 11, 2, 3, R('accent')[4]);
    return outline(p, OUTLINE);
  };
  D('chest:open', chest(true), 6);
  D('chest', chest(false), 6, { scorePts: 300, effect: 3, eamt: 15, touch: 'chest:open' });
  D(
    'cannon',
    (() => {
      const p = sprite();
      shade(p, new Mask().rect(2, 9, 14, 5).ellipse(16, 11.5, 2, 3), R('tech').slice(0, 4));
      shade(p, new Mask().ellipse(7, 16, 3, 3), R('stem'));
      return outline(p, OUTLINE);
    })(),
    6,
  );
  const arch = (part: 'l' | 'm' | 'r') => {
    const p = sprite();
    const m = new Mask().rect(0, 0, 20, 6);
    if (part === 'l') m.rect(0, 0, 7, 20);
    if (part === 'r') m.rect(13, 0, 7, 20);
    if (part === 'm') m.minus(new Mask().ellipse(10, 8, 9, 4));
    shade(p, m, R('ruin').slice(1));
    for (let x = 1; x < 20; x += 5) p.set(x, 2, R('glow')[2]);
    return outline(p, OUTLINE);
  };
  D('arch:l', arch('l'), 7);
  D('arch:m', arch('m'), 7);
  D('arch:r', arch('r'), 7);
  s.add(
    'ruin:wall',
    tex((x, y) => (y % 5 === 0 || (x + (Math.floor(y / 5) % 2) * 5) % 10 === 0 ? R('ruin')[1] : R('ruin')[3 + ((x * y) % 2)])),
    { solid: SOLID },
  );
  s.add(
    'pipe:h',
    over(
      W5(140),
      (() => {
        const p = sprite();
        shade(p, new Mask().rect(0, 6, 20, 8), R('tech'), { light: [0, -1] });
        p.rect(4, 5, 2, 10, R('tech')[0]).rect(14, 5, 2, 10, R('tech')[0]);
        return p;
      })(),
    ),
    { solid: SOLID },
  );
  s.add(
    'pipe:v',
    over(
      W5(141),
      (() => {
        const p = sprite();
        shade(p, new Mask().rect(6, 0, 8, 20), R('tech'), { light: [-1, 0] });
        p.rect(5, 4, 10, 2, R('tech')[0]);
        return p;
      })(),
    ),
    { solid: SOLID },
  );
  const plankton = (f: number) => {
    const p = water(6, 142);
    const r = rng(7 + f);
    for (let i = 0; i < 14; i++) p.set(r() * 20, r() * 20, R('glow')[1 + Math.floor(r() * 4)]);
    return p;
  };
  s.add('plankton:0', plankton(0), { next: 'plankton:1', ntime: 6 });
  s.add('plankton:1', plankton(1), { next: 'plankton:0', ntime: 6 });
  s.add('sand:3', sandTex(150, false), { solid: SOLID });
  s.add('sand:top3', sandTex(151, true, water(6, 152)), { solid: SOLID });
  s.add('reef:3', reefRock(153), { solid: SOLID });
  s.add('reef:4', reefRock(154, 'soil'), { solid: SOLID });
  D(
    'skullrock',
    (() => {
      const p = sprite();
      shade(p, new Mask().ellipse(10, 12, 8, 7).rect(5, 15, 10, 5), R('rock'));
      fill(p, new Mask().ellipse(7, 11, 2, 2.4).ellipse(13, 11, 2, 2.4), OUTLINE);
      for (let x = 6; x < 15; x += 2) p.set(x, 17, OUTLINE);
      return outline(p, OUTLINE);
    })(),
    7,
  );
  D(
    'bigshell',
    (() => {
      const p = sprite();
      shade(
        p,
        new Mask().poly([
          [2, 18],
          [18, 18],
          [10, 4],
        ]),
        R('bloom'),
      );
      for (let i = 0; i < 6; i++) p.line(10, 4, 3 + i * 3, 18, R('bloom')[1]);
      return outline(p, OUTLINE);
    })(),
    6,
  );
  for (let k = 0; k < 2; k++)
    D(
      `weed:${k}`,
      (() => {
        const p = sprite();
        const r = rng(160 + k);
        for (let i = 0; i < 7; i++) {
          let x = 3 + r() * 14;
          for (let y = 19; y > 10 + r() * 6; y--) {
            x += Math.sin(y + i) * 0.4;
            p.set(x, y, R('plant')[2 + (i % 3)]);
          }
        }
        return p;
      })(),
      4 + k,
    );
  for (let k = 0; k < 2; k++)
    D(
      `glowstone:${k}`,
      (() => {
        const p = sprite();
        for (let i = 0; i < 3; i++)
          shade(
            p,
            new Mask().poly([
              [3 + i * 5 + k, 19],
              [7 + i * 5, 19],
              [5 + i * 5, 8 + ((i + k) % 3) * 3],
            ]),
            R('crystal'),
          );
        return outline(p, OUTLINE);
      })(),
      7,
    );
  const chimney = (f: number) => {
    const p = sprite();
    shade(p, new Mask().rect(6, 8, 8, 12).ellipse(10, 8, 4, 2), R('rock'));
    for (let i = 0; i < 4; i++) p.set(9 + ((i + f) % 3), 6 - i * 2 + f, R('cloud')[2]);
    return outline(p, OUTLINE);
  };
  s.add('chimney:0', over(water(7, 170), chimney(0)), { next: 'chimney:1', ntime: 5 });
  s.add('chimney:1', over(water(7, 170), chimney(1)), { next: 'chimney:0', ntime: 5 });
  D(
    'seamine',
    (() => {
      const p = sprite();
      shade(p, new Mask().ellipse(10, 9, 5.5, 5.5), R('tech').slice(0, 4));
      for (let a = 0; a < 8; a++) p.line(10, 9, 10 + Math.cos(a * 0.785) * 8, 9 + Math.sin(a * 0.785) * 8, R('tech')[1]);
      p.line(10, 15, 10, 19, R('tech')[0]);
      return outline(p, OUTLINE);
    })(),
    5,
    { chHitPt: -10, touch: 'water:5' },
  );
  D(
    'lamp',
    (() => {
      const p = sprite();
      p.line(10, 6, 10, 19, R('tech')[2]);
      fill(p, new Mask().ellipse(10, 5, 3, 3), R('glow')[3]);
      p.set(10, 4, WHITE);
      return outline(p, OUTLINE);
    })(),
    6,
  );
  D(
    'obelisk',
    (() => {
      const p = sprite();
      shade(
        p,
        new Mask().poly([
          [6, 19],
          [14, 19],
          [12, 2],
          [8, 2],
        ]),
        R('ruin').slice(1),
        { light: [-1, 0] },
      );
      for (let y = 5; y < 18; y += 3) p.set(10, y, R('glow')[3]);
      return outline(p, OUTLINE);
    })(),
    7,
  );
  D(
    'fishschool',
    (() => {
      const p = sprite();
      const r = rng(171);
      for (let i = 0; i < 9; i++) {
        const x = 2 + r() * 15;
        const y = 3 + r() * 14;
        p.set(x, y, R('hideB')[4])
          .set(x + 1, y, R('hideB')[3])
          .set(x - 1, y - 1, R('hideB')[2])
          .set(x - 1, y + 1, R('hideB')[2]);
      }
      return p;
    })(),
    3,
  );
  D('bubble', bubbles(2, water(3, 172), false).crop(0, 0, 20, 20), 3);
  s.add(
    'grate',
    tex((x, y) => (y < 4 ? (x % 4 === 0 || y === 0 ? R('tech')[4] : R('tech')[1]) : water(5, 173).get(x, y))),
    { solid: TOP },
  );
  D(
    'statue:2',
    (() => {
      const p = sprite();
      shade(
        p,
        new Mask()
          .ellipse(10, 5, 3, 3.5)
          .rect(7, 8, 6, 7)
          .poly([
            [7, 15],
            [13, 15],
            [16, 19],
            [4, 19],
          ]),
        R('crystal').slice(1),
      );
      return outline(p, OUTLINE);
    })(),
    7,
  );
}
