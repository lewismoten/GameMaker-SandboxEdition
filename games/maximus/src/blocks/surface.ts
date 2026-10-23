// SURFACE.BBL: the block set of every walkable planet. Drawn entirely in role colors, so
// each planet's palette turns it into grassland, dunes, glaciers, basalt and lava...
// Air near the ground is the uniform "horizon" color so decorations can sit anywhere on
// it; the sky above fades through eight bands to starry space.
//
// The pictures are painted in surfaceArt.ts; this file lists the blocks of the set in order.
import { Pixels, rng } from '../../../kit/pixels';
import { CLEAR, Mask, fill, outline, shade, sprite } from '../art/draw';
import { G, SOLID, SetBuilder, TOP, over, tex } from './blockset';
import { EGG_BLOCK, ITEM_BASE, MONEY, SHARD_BASE, SHARD_COUNTER } from '../ids';
import { PICKUPS, drawEgg, drawModule, drawPickup, drawShard, type PickupId } from './items';
import { OUTLINE, WHITE } from '../art/palette';
import { PICKUP_FX, R } from './common';
import {
  arrows,
  beacon,
  bones,
  boulder,
  bush,
  caveWall,
  cloud,
  crystals,
  door,
  farHills,
  forceField,
  grassTuft,
  horizon,
  liquidTex,
  mushroom,
  nest,
  pillar,
  rockTex,
  shrine,
  sign,
  skyBand,
  soilTex,
  spikes,
  stalactite,
  timedPlatform,
  topTex,
  tree,
  waterfall,
} from './surfaceArt';

// ------------------------------------------------------------------ the set

/** Pickups that also come on open air (the rest only in caves and ruins). */
export const OPEN_AIR_PICKUPS: PickupId[] = ['credit', 'gem', 'heart', 'oneup'];

export function surfaceSet(): SetBuilder {
  const s = new SetBuilder('SURFACE', G.down);
  const hz = horizon();
  // air
  s.add('air', hz);
  for (let k = 0; k < 8; k++) s.add(`sky:${k}`, skyBand(k, k < 3 ? 6 - k * 2 : 0));
  s.add('ceiling', skyBand(0, 2), { solid: SOLID }); // the solid top of the sky (map rows wrap)
  for (const part of ['l', 'm', 'r', 'puff'] as const) s.add(`cloud:${part}`, cloud(part));
  for (const part of ['peak', 'l', 'r'] as const) s.add(`far:${part}`, farHills(part));
  // the right half of a tree's trunk, in the slot the far hills' fill had (never placed), so
  // every other block keeps its number
  s.add('tree:trunk:r', over(hz, tree('trunk:r')));
  for (let k = 0; k < 3; k++) s.add(`cave:${k}`, caveWall(50 + k));
  s.add(
    'cave:roots',
    over(
      caveWall(55),
      (() => {
        const p = sprite();
        const r = rng(9);
        for (let i = 0; i < 4; i++) {
          let x = 3 + i * 4 + r() * 2;
          for (let y = 0; y < 12 + r() * 6; y++) {
            x += (r() - 0.5) * 1.2;
            p.set(x, y, R('stem')[1 + (y & 1)]);
          }
        }
        return p;
      })(),
    ),
  );
  s.add('cave:glint', over(caveWall(56), crystals(3).crop(0, 6, 20, 14), 0, 0));
  // solid ground
  for (let k = 0; k < 3; k++) s.add(`top:${k}`, topTex(60 + k, 'mid'), { solid: SOLID });
  s.add('top:left', topTex(64, 'left'), { solid: SOLID });
  s.add('top:right', topTex(65, 'right'), { solid: SOLID });
  s.add('top:cave', topTex(66, 'cave'), { solid: SOLID });
  for (let k = 0; k < 3; k++) s.add(`soil:${k}`, soilTex(70 + k), { solid: SOLID });
  for (let k = 0; k < 3; k++) s.add(`rock:${k}`, rockTex(80 + k), { solid: SOLID });
  for (let k = 0; k < 2; k++) s.add(`deep:${k}`, rockTex(90 + k, 'deep'), { solid: SOLID });
  s.add(
    'bedrock',
    tex((x, y) => R('deep')[(x * 7 + y * 3) % 5 === 0 ? 2 : (x + y) % 4 === 0 ? 1 : 0]),
    { solid: SOLID },
  );
  s.add('ore:0', over(rockTex(83), crystals(5).crop(0, 4, 20, 16), 0, 4), { solid: SOLID });
  s.add('ore:1', bones(84), { solid: SOLID });
  // cave ceiling and floor
  s.add('ceil:0', over(rockTex(86), stalactite(false, 1).crop(0, 0, 20, 20)), { solid: SOLID });
  s.add('stal:down', over(caveWall(57), stalactite(false, 2)));
  s.add('stal:up', over(caveWall(58), stalactite(true, 3)));
  // platforms (stand on top, jump through from below)
  const ledge = (kind: 'l' | 'm' | 'r', bgPic: Pixels) =>
    tex((x, y) => {
      const t = R('top');
      const rk = R('rock');
      const inset = kind === 'l' ? Math.max(0, 3 - x) : kind === 'r' ? Math.max(0, x - 16) : 0;
      if (y > 8 - inset || y < 0) return bgPic.get(x, y);
      if (y === 0) return t[5];
      if (y === 1) return t[3];
      return rk[((x * 5 + y * 3) % 4) + 1];
    });
  s.add('ledge:l', ledge('l', hz), { solid: TOP });
  s.add('ledge:m', ledge('m', hz), { solid: TOP });
  s.add('ledge:r', ledge('r', hz), { solid: TOP });
  s.add('ledge:cave', ledge('m', caveWall(59)), { solid: TOP });
  s.add(
    'island:under',
    tex((x, y) => {
      const rk = R('rock');
      const w = 10 - y * 0.45;
      return Math.abs(x - 9.5) < w ? rk[1 + ((x * 3 + y) % 4)] : hz.get(x, y);
    }),
    { solid: SOLID },
  );
  s.add(
    'bridge',
    tex((x, y) => {
      const st = R('stem');
      if (y < 6 || y > 10) return y > 10 && y < 14 && x % 10 === 2 ? st[0] : hz.get(x, y);
      return y === 6 ? st[4] : x % 5 === 0 ? st[0] : st[2 + (y & 1)];
    }),
    { solid: TOP },
  );
  // decorations on the horizon
  const D = (name: string, sp: Pixels, bg = hz) => s.add(name, over(bg, sp));
  D('bush:0', bush(1, false));
  D('bush:1', bush(2, true));
  D('grass:0', grassTuft(3));
  D('grass:1', grassTuft(4));
  D('boulder', boulder(5));
  D('crystals', crystals(6));
  D(
    'sapling',
    (() => {
      const p = sprite();
      p.line(10, 19, 10, 9, R('stem')[2]);
      shade(p, new Mask().ellipse(10, 8, 5, 4).ellipse(7, 10, 3, 2.5).ellipse(13, 10, 3, 2.5), R('plant').slice(1, 7));
      return outline(p, OUTLINE);
    })(),
  );
  D(
    'cactus',
    (() => {
      const p = sprite();
      const m = new Mask().rect(8, 4, 4, 16).ellipse(10, 4, 2, 2).rect(3, 9, 2, 6).rect(3, 13, 6, 2).rect(15, 6, 2, 6).rect(11, 10, 6, 2);
      shade(p, m, R('plant').slice(1, 7), { light: [-1, 0] });
      for (let y = 6; y < 19; y += 3) p.set(9, y, R('bloom')[4]);
      return outline(p, OUTLINE);
    })(),
  );
  D(
    'flowers',
    (() => {
      const p = sprite();
      const r = rng(33);
      for (let i = 0; i < 6; i++) {
        const x = 2 + i * 3 + r() * 2;
        const hh = 5 + r() * 6;
        p.line(x, 19, x, 19 - hh, R('plant')[3]);
        fill(p, new Mask().ellipse(x, 19 - hh, 1.6, 1.6), R('bloom')[2 + (i % 3)]);
        p.set(x, 19 - hh, R('accent')[4]);
      }
      return p;
    })(),
  );
  D(
    'stump',
    (() => {
      const p = sprite();
      shade(p, new Mask().rect(5, 11, 10, 9).ellipse(10, 11, 5, 2), R('stem'));
      fill(p, new Mask().ellipse(10, 11, 3.5, 1.2), R('stem')[4]);
      p.line(3, 19, 6, 16, R('stem')[1]).line(17, 19, 14, 16, R('stem')[1]);
      return outline(p, OUTLINE);
    })(),
  );
  D(
    'skulls',
    (() => {
      const p = sprite();
      shade(p, new Mask().ellipse(7, 15, 4, 3.5).ellipse(14, 16, 3.5, 3), R('ruin').slice(2));
      p.set(6, 14, OUTLINE).set(8, 14, OUTLINE).set(13, 15, OUTLINE).set(15, 15, OUTLINE);
      p.line(2, 19, 18, 18, R('ruin')[5]);
      return outline(p, OUTLINE);
    })(),
  );
  D('mushroom', mushroom(7, false));
  D(
    'totem',
    (() => {
      const p = sprite();
      shade(p, new Mask().rect(6, 2, 8, 18), R('ruin').slice(1), { light: [-1, 0] });
      for (const y of [5, 11, 17]) {
        p.set(8, y, R('glow')[4]).set(11, y, R('glow')[4]);
        p.line(8, y + 2, 11, y + 2, OUTLINE);
      }
      return outline(p, OUTLINE);
    })(),
  );
  D('mushroom:cave', mushroom(8, true), caveWall(60));
  D('crystals:cave', crystals(9), caveWall(61));
  for (const part of ['tl', 'tr', 'bl', 'br', 'trunk'] as const) D(`tree:${part}`, tree(part));
  D('pillar:top', pillar('top'));
  D('pillar:mid', pillar('mid'));
  D('pillar:base', pillar('base'));
  s.add(
    'ruin:wall',
    over(
      rockTex(87, 'ruin'),
      (() => {
        const p = sprite();
        p.rect(6, 6, 8, 8, R('glow')[1]).rect(8, 8, 4, 4, R('glow')[3]);
        return p;
      })(),
    ),
    { solid: SOLID },
  );
  s.add('ruin:block', rockTex(88, 'ruin'), { solid: SOLID });
  D('sign:right', sign('right'));
  D('sign:up', sign('up'));
  // hazards
  s.add('spikes', spikes(hz), { solid: SOLID, chHitPt: -3 });
  s.add('spikes:cave', spikes(caveWall(64)), { solid: SOLID, chHitPt: -3 });
  s.add('spikes:down', spikes(caveWall(65), true), { solid: SOLID, chHitPt: -3 });
  s.add(
    'thorns',
    over(
      hz,
      bush(10, false).map((_x, _y, c) => (c !== CLEAR && c !== OUTLINE && (_x + _y) % 3 === 0 ? R('hazard')[3] : c)),
    ),
    { chHitPt: -1 },
  );
  // liquid (hurts: acid, lava, brine...)
  s.add('liquid:top', liquidTex(0, true), { chHitPt: -2, next: 'liquid:top2', ntime: 5 });
  s.add('liquid:top2', liquidTex(1, true), { chHitPt: -2, next: 'liquid:top', ntime: 5 });
  s.add('liquid', liquidTex(0, false), { chHitPt: -2, next: 'liquid2', ntime: 6 });
  s.add('liquid2', liquidTex(1, false), { chHitPt: -2, next: 'liquid', ntime: 6 });
  s.add('fall:0', waterfall(0), { next: 'fall:1', ntime: 2 });
  s.add('fall:1', waterfall(1), { next: 'fall:2', ntime: 2 });
  s.add('fall:2', waterfall(2), { next: 'fall:0', ntime: 2 });
  // currents: lifts, winds
  s.add('lift', arrows('up', 0, hz), { grav: G.up, next: 'lift2', ntime: 2 });
  s.add('lift2', arrows('up', 1, hz), { grav: G.up, next: 'lift', ntime: 2 });
  s.add('lift:cave', arrows('up', 0, caveWall(66)), { grav: G.up, next: 'lift:cave2', ntime: 2 });
  s.add('lift:cave2', arrows('up', 1, caveWall(66)), { grav: G.up, next: 'lift:cave', ntime: 2 });
  s.add('wind:r', arrows('right', 0, hz), { grav: G.right | G.down, next: 'wind:r2', ntime: 2 });
  s.add('wind:r2', arrows('right', 1, hz), { grav: G.right | G.down, next: 'wind:r', ntime: 2 });
  s.add('wind:l', arrows('left', 0, hz), { grav: G.left | G.down, next: 'wind:l2', ntime: 2 });
  s.add('wind:l2', arrows('left', 1, hz), { grav: G.left | G.down, next: 'wind:l', ntime: 2 });
  s.add(
    'float',
    arrows('down', 0, caveWall(67)).map((x, y, c) => ((x + y) % 7 ? c : R('glow')[0])),
    { grav: G.none },
  ); // zero-g pocket
  // timed things (every copy switches together: Game-Maker animates block types)
  s.add('field:on', forceField(true, 0), { solid: SOLID, chHitPt: -3, next: 'field:on2', ntime: 12 });
  s.add('field:on2', forceField(true, 1), { solid: SOLID, chHitPt: -3, next: 'field:off', ntime: 12 });
  s.add('field:off', forceField(false), { next: 'field:on', ntime: 30 });
  s.add('plat:on', timedPlatform(true), { solid: TOP, next: 'plat:off', ntime: 45 });
  s.add('plat:off', timedPlatform(false), { next: 'plat:on', ntime: 35 });
  // touch-to-change blocks
  s.add(
    'glass',
    over(caveWall(68), crystals(11).crop(0, 0, 20, 20)).map((x, y, c) => ((x * y) % 5 === 1 ? R('crystal')[5] : c)),
    { solid: SOLID, scorePts: 50, touch: 'glass:broken' },
  );
  s.add('glass:broken', over(caveWall(69), stalactite(true, 12).crop(0, 10, 20, 10), 0, 10));
  s.add('fake', rockTex(81), {}); // looks like rock, isn't: secret passages
  s.add('door', door(false), { solid: SOLID, effect: MONEY, eamt: -10, touch: 'door:open' });
  s.add('door:open', door(true));
  for (let k = 0; k < 4; k++) s.add(`nest:${k}`, nest(k), { solid: SOLID }); // birthMon set per planet by the map code
  s.add(
    'heal',
    over(
      caveWall(70),
      (() => {
        const p = sprite();
        shade(p, new Mask().ellipse(10, 15, 8, 4), R('glow'));
        for (let i = 0; i < 5; i++) p.set(4 + i * 3, 6 + (i % 2) * 3, WHITE);
        return p;
      })(),
    ),
    { chHitPt: 1 },
  );
  // landing beacon (the uplink to orbit) and where Max lands
  s.add('uplink', over(hz, beacon(0)), { next: 'uplink2', ntime: 8 });
  s.add('uplink2', over(hz, beacon(1)), { next: 'uplink', ntime: 8 });
  s.add(
    'pad',
    tex((x, y) => {
      // a landing plate flush with the ground: lit stripe on top, soil below
      const t = R('tech');
      if (y === 0) return t[6];
      if (y < 5) return y === 2 && x % 4 === 1 ? R('glow')[4] : t[3 + (y & 1)];
      if (y === 5) return t[1];
      return soilTex(74).get(x, y);
    }),
    { solid: SOLID },
  );
  // pickups: one on open air, one in caves
  const cw = caveWall(72);
  for (const id of PICKUPS) {
    if (OPEN_AIR_PICKUPS.includes(id)) s.add(`p:${id}`, over(hz, drawPickup(id)), { ...PICKUP_FX[id], touch: 'air' });
    s.add(`pc:${id}`, over(cw, drawPickup(id)), { ...PICKUP_FX[id], touch: 'cave:0' });
  }
  s.add('shrine', shrine(true));
  // shared slots: star-shards (counters 20..29) and the ten courier modules
  for (let i = 0; i < 10; i++)
    s.add(`shard:${i}`, over(shrine(false), drawShard(i)), { effect: SHARD_COUNTER + i, eamt: 1, scorePts: 5000, touch: 'shrine' }, SHARD_BASE + i);
  for (let i = 0; i < 10; i++) s.add(`module:${i}`, over(shrine(false), drawModule(i)), { obj: 1, scorePts: 1000, touch: 'shrine' }, ITEM_BASE + i);
  s.add('egg', over(shrine(false), drawEgg()), { obj: 1, touch: 'shrine' }, EGG_BLOCK);
  return s;
}

export { ITEM_BASE };
