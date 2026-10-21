// OCEAN.BBL: the sea worlds. Water has no gravity (the diving bell drifts and coasts),
// the air above has gravity (leap out and splash back). Currents push, bubble columns
// lift, anemones sting, and the uplink is a buoy bobbing on the surface.
//
// The pictures are painted in oceanArt.ts; this file lists the blocks of the set in order
// (oceanExtras.ts fills the last slots).
import { Pixels } from '../../../kit/pixels';
import { CLEAR, Mask, fill, outline, shade, sprite } from '../art/draw';
import { G, SOLID, SetBuilder, TOP, over, tex } from './blockset';
import { ITEM_BASE, MONEY, SHARD_BASE, SHARD_COUNTER } from '../ids';
import { PICKUPS, drawModule, drawPickup, drawShard } from './items';
import { OUTLINE, WHITE } from '../art/palette';
import { PICKUP_FX, R } from './common';
import { airBg, anemone, bubbles, buoy, clam, coral, current, deepWater, kelp, reefRock, sandTex, shrine, surfaceWave, water, wreck } from './oceanArt';
import { oceanExtras } from './oceanExtras';

export function oceanSet(): SetBuilder {
  const s = new SetBuilder('OCEAN', G.none);
  // air above the sea (gravity), the waves, the water column
  s.add('air', airBg(), { grav: G.down });
  s.add(
    'air:cloud',
    over(
      airBg(),
      (() => {
        const p = sprite();
        shade(p, new Mask().ellipse(10, 10, 8, 4).ellipse(7, 8, 4, 3).ellipse(13, 8, 4, 3), [R('cloud')[2], R('cloud')[3], WHITE]);
        return p;
      })(),
    ),
    { grav: G.down },
  );
  s.add('ceiling', airBg(), { solid: SOLID });
  s.add('surf:0', surfaceWave(0), { next: 'surf:1', ntime: 5 });
  s.add('surf:1', surfaceWave(1), { next: 'surf:0', ntime: 5 });
  for (let k = 0; k < 8; k++) s.add(`water:${k}`, water(k, k + 3));
  s.add(
    'water:dark',
    deepWater(40).map((x, y, c) => ((x * 7 + y * 3) % 11 === 0 ? R('sky')[1] : c)),
  );
  // the sea floor
  for (let k = 0; k < 3; k++) s.add(`sand:top${k}`, sandTex(10 + k, true, water(6, 11 + k)), { solid: SOLID });
  for (let k = 0; k < 3; k++) s.add(`sand:${k}`, sandTex(20 + k, false), { solid: SOLID });
  for (let k = 0; k < 3; k++) s.add(`reef:${k}`, reefRock(30 + k), { solid: SOLID });
  for (let k = 0; k < 2; k++) s.add(`abyss:${k}`, reefRock(40 + k, 'deep'), { solid: SOLID });
  s.add(
    'bedrock',
    tex((x, y) => R('deep')[(x * 7 + y * 3) % 5 === 0 ? 1 : 0]),
    { solid: SOLID },
  );
  s.add(
    'reef:ledge',
    tex((x, y) => (y < 7 ? (y === 0 ? R('rock')[6] : R('rock')[2 + ((x + y) % 3)]) : water(4, 50).get(x, y))),
    { solid: TOP },
  );
  s.add(
    'crystal:wall',
    over(
      reefRock(44, 'deep'),
      (() => {
        const p = sprite();
        for (let i = 0; i < 3; i++)
          shade(
            p,
            new Mask().poly([
              [4 + i * 6, 18],
              [8 + i * 6, 18],
              [6 + i * 6, 4 + i * 3],
            ]),
            R('crystal'),
          );
        return p;
      })(),
    ),
    { solid: SOLID },
  );
  // decorations in the water
  const D = (name: string, sp: Pixels, depth = 5, props = {}) => s.add(name, over(water(depth, 60 + s.count), sp), props);
  for (let k = 0; k < 4; k++) D(`coral:${k}`, coral(70 + k, k));
  D('coral:deep', coral(74, 1), 7);
  D('kelp:top', kelp('top', 0));
  D('kelp:mid', kelp('mid', 0));
  D('kelp:top2', kelp('top', 1), 6);
  D('kelp:mid2', kelp('mid', 1), 6);
  D(
    'shell',
    (() => {
      const p = sprite();
      shade(p, new Mask().ellipse(10, 16, 5, 3.5), R('bloom'));
      for (let a = 0; a < 5; a++) p.line(10, 19, 6 + a * 2, 13, R('bloom')[1]);
      return outline(p, OUTLINE);
    })(),
  );
  D(
    'rocks',
    (() => {
      const p = sprite();
      shade(p, new Mask().ellipse(6, 16, 5, 4).ellipse(14, 17, 4, 3), R('rock'));
      return outline(p, OUTLINE);
    })(),
  );
  D('clam', clam(false), 6);
  D(
    'pillar',
    (() => {
      const p = sprite();
      shade(p, new Mask().rect(5, 0, 10, 20), R('ruin').slice(1), { light: [-1, 0] });
      for (let y = 2; y < 20; y += 6) p.line(7, y, 7, y + 3, R('ruin')[1]);
      return outline(p, OUTLINE);
    })(),
    6,
  );
  D(
    'pillar:top',
    (() => {
      const p = sprite();
      shade(p, new Mask().rect(5, 4, 10, 16).rect(2, 2, 16, 4), R('ruin').slice(1), { light: [-1, 0] });
      return outline(p, OUTLINE);
    })(),
    6,
  );
  D(
    'statue',
    (() => {
      const p = sprite();
      shade(p, new Mask().ellipse(10, 6, 4, 4.5).rect(6, 10, 8, 9).ellipse(10, 11, 6, 2.5), R('ruin').slice(2));
      p.set(8, 6, R('glow')[4]).set(12, 6, R('glow')[4]);
      return outline(p, OUTLINE);
    })(),
    7,
  );
  D(
    'bones',
    (() => {
      const p = sprite();
      const b = R('ruin');
      p.line(2, 16, 18, 14, b[6]).line(2, 17, 18, 15, b[4]);
      for (let x = 4; x < 17; x += 3) p.line(x, 15, x + 1, 9, b[5]);
      return outline(p, OUTLINE);
    })(),
    7,
  );
  // wrecks (solid hull, open portholes and bow)
  for (let k = 0; k < 5; k++) s.add(`wreck:${k}`, wreck(k), { solid: k >= 3 ? 0 : SOLID });
  // hazards and currents
  s.add('anemone', over(water(6, 80), anemone(0)), { chHitPt: -2, next: 'anemone2', ntime: 7 });
  s.add('anemone2', over(water(6, 80), anemone(1)), { chHitPt: -2, next: 'anemone', ntime: 7 });
  s.add(
    'urchins',
    over(
      water(6, 81),
      (() => {
        const p = sprite();
        for (const cx of [5, 14])
          for (let a = 0; a < 10; a++) p.line(cx, 16, cx + Math.cos(a * 0.63) * 5, 16 + Math.sin(a * 0.63) * 4, R('hazard')[2 + (a % 3)]);
        return p;
      })(),
    ),
    { solid: SOLID, chHitPt: -3 },
  );
  s.add(
    'vent',
    over(
      reefRock(45),
      (() => {
        const p = sprite();
        fill(p, new Mask().ellipse(10, 4, 4, 2.5), OUTLINE);
        p.set(9, 3, R('hazard')[4]).set(11, 4, R('hazard')[3]);
        return p;
      })(),
    ),
    { solid: SOLID },
  );
  s.add(
    'hotwater',
    bubbles(0, water(7, 82), true).map((x, y, c) => ((x + y) % 5 === 0 ? R('hazard')[2] : c)),
    { chHitPt: -1, grav: G.up, next: 'hotwater2', ntime: 2 },
  );
  s.add(
    'hotwater2',
    bubbles(1, water(7, 82), true).map((x, y, c) => ((x * 2 + y) % 5 === 0 ? R('hazard')[2] : c)),
    { chHitPt: -1, grav: G.up, next: 'hotwater', ntime: 2 },
  );
  s.add('bubbles', bubbles(0, water(5, 83), false), { grav: G.up, next: 'bubbles2', ntime: 2 });
  s.add('bubbles2', bubbles(1, water(5, 83), false), { grav: G.up, next: 'bubbles', ntime: 2 });
  for (const d of ['r', 'l', 'd'] as const) {
    const grav = d === 'r' ? G.right : d === 'l' ? G.left : G.down;
    s.add(`current:${d}`, current(d, 0, water(4, 84)), { grav, next: `current:${d}2`, ntime: 2 });
    s.add(`current:${d}2`, current(d, 1, water(4, 84)), { grav, next: `current:${d}`, ntime: 2 });
  }
  // touch-to-change
  s.add(
    'glass',
    over(deepWater(85), coral(86, 2)).map((x, y, c) => ((x * y) % 7 === 3 ? R('crystal')[4] : c)),
    { solid: SOLID, scorePts: 50, touch: 'glass:broken' },
  );
  s.add(
    'glass:broken',
    over(
      deepWater(87),
      (() => {
        const p = sprite();
        for (let i = 0; i < 6; i++) p.set(3 + i * 3, 17 + (i % 2), R('crystal')[3]);
        return p;
      })(),
    ),
  );
  s.add('fake', reefRock(31));
  s.add(
    'door',
    tex((x, y) => {
      const t = R('tech');
      if (x < 2 || x > 17) return t[1];
      if (y > 7 && y < 12 && x > 6 && x < 13) return x === 9 || x === 10 ? t[0] : R('accent')[4];
      return y % 5 === 0 ? t[1] : t[3 + ((x >> 2) & 1)];
    }),
    { solid: SOLID, effect: MONEY, eamt: -10, touch: 'door:open' },
  );
  s.add('door:open', deepWater(88));
  s.add(
    'field:on',
    tex((x, y) => ((x + y * 3) % 5 === 0 ? WHITE : (x * 7 + y) % 3 ? R('glow')[3] : R('glow')[4])),
    { solid: SOLID, chHitPt: -3, next: 'field:off', ntime: 24 },
  );
  s.add(
    'field:off',
    deepWater(89).map((x, y, c) => (y % 6 === 0 && x % 4 === 0 ? R('glow')[0] : c)),
    { next: 'field:on', ntime: 30 },
  );
  for (let k = 0; k < 4; k++)
    s.add(
      `nest:${k}`,
      over(
        reefRock(90 + k),
        k === 0
          ? clam(true)
          : k === 1
            ? coral(95, 2)
            : k === 2
              ? (() => {
                  const p = sprite();
                  for (const [x, y] of [
                    [6, 14],
                    [14, 14],
                    [10, 9],
                  ])
                    shade(p, new Mask().ellipse(x, y, 3.5, 3.5), R('hideD'));
                  return outline(p, OUTLINE);
                })()
              : (() => {
                  const p = sprite();
                  fill(p, new Mask().ellipse(10, 10, 5, 5), OUTLINE);
                  p.set(10, 10, R('eye')[3]);
                  return p;
                })(),
      ),
      { solid: SOLID },
    );
  // the uplink buoy (on the surface) and the dock where Max splashes down
  s.add('uplink', buoy(0), { next: 'uplink2', ntime: 8 });
  s.add('uplink2', buoy(1), { next: 'uplink', ntime: 8 });
  s.add(
    'raft',
    tex((x, y) => (y < 12 ? airBg().get(x, y) : y < 16 ? R('stem')[2 + ((x >> 2) & 1)] : surfaceWave(0).get(x, y))),
    { solid: TOP },
  );
  s.add('island', sandTex(97, true, airBg()), { solid: SOLID });
  s.add(
    'palm',
    over(
      airBg(),
      (() => {
        const p = sprite();
        p.line(10, 19, 11, 6, R('stem')[2]).line(11, 19, 12, 6, R('stem')[3]);
        for (let a = 0; a < 5; a++) p.line(11, 6, 11 + Math.cos(-0.2 - a * 0.68) * 9, 6 + Math.sin(-0.2 - a * 0.68) * 5 + 4, R('plant')[3 + (a % 2)]);
        return outline(p, OUTLINE);
      })(),
    ),
    { grav: G.down },
  );
  // pickups in water
  for (const id of PICKUPS) s.add(`p:${id}`, over(water(5, 99), drawPickup(id)), { ...PICKUP_FX[id], touch: 'water:5' });
  s.add('pearl', over(water(6, 100), clam(true)), { scorePts: 500, touch: 'clam' });
  oceanExtras(s);
  s.add('shrine', shrine(true));
  for (let i = 0; i < 10; i++)
    s.add(`shard:${i}`, over(shrine(false), drawShard(i)), { effect: SHARD_COUNTER + i, eamt: 1, scorePts: 5000, touch: 'shrine' }, SHARD_BASE + i);
  for (let i = 0; i < 10; i++) s.add(`module:${i}`, over(shrine(false), drawModule(i)), { obj: 1, scorePts: 1000, touch: 'shrine' }, ITEM_BASE + i);
  return s;
}

export { CLEAR };
