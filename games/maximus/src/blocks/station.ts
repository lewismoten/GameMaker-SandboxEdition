// STATION.BBL: decks of orbital stations, derelicts and the Core citadel. Panels and
// windows behind, girders and deck plates to stand on, lifts, conveyors, laser grids
// that blink on a shared clock, airlocks, and the info panels of the training deck.
//
// The pictures are painted in stationArt.ts; this file lists the blocks of the set in order
// (stationExtras.ts fills the last slots).
import { dither } from '../../../kit/pixels';
import { Mask, outline, shade, sprite } from '../art/draw';
import { G, SOLID, SetBuilder, TOP, over, tex } from './blockset';
import { EGG_BLOCK, ITEM_BASE, MONEY, SHARD_BASE, SHARD_COUNTER } from '../ids';
import { PICKUPS, drawEgg, drawModule, drawPickup, drawShard } from './items';
import { OUTLINE, S, SHARED_END, WHITE, buildPalette } from '../art/palette';
import { ROLES, themeFor } from '../art/roles';
import { drawTinHeart } from '../../../kit/tinHeart';
import { drawEasterEgg } from '../../../kit/easterEgg';
import { joeCameo, willCameo } from '../../../kit/cameos';

/** Maxima Station's palette (the training deck's), for recoloring guests by nearest color. */
const PAL = buildPalette(ROLES, themeFor('station', 1995)).pal;
/** Guests take only the colors every Maximus palette shares (not black, kept for the background). */
const SHARED_ONLY = { use: Array.from({ length: SHARED_END - 1 }, (_, i) => i + 1) };
import { PICKUP_FX, R } from './common';
import { airlock, arrowsOn, console_, conveyor, crate, deck, infoPanel, laser, panel, pipe, reactor, shrine, wall, windowView } from './stationArt';
import { stationExtras } from './stationExtras';

export function stationSet(): SetBuilder {
  const s = new SetBuilder('STATION', G.down);
  for (let k = 0; k < 4; k++) s.add(`panel:${k}`, panel(k + 1, k));
  s.add(
    'panel:dark',
    panel(9, 0).map((_x, _y, c) => R('cave')[Math.max(0, R('cave').indexOf(c) - 1)] ?? c),
  );
  for (let k = 0; k < 3; k++) s.add(`window:${k}`, windowView(k));
  s.add(
    'void',
    tex((x, y) => (dither(x, y, 0.1) ? R('sky')[1] : R('sky')[0])),
    { grav: G.none },
  );
  for (let k = 0; k < 3; k++) s.add(`wall:${k}`, wall(20 + k, k), { solid: SOLID });
  s.add('hull', wall(23, 1), { solid: SOLID });
  s.add(
    'ceiling',
    tex(() => R('sky')[0]),
    { solid: SOLID },
  );
  s.add('deck:plate', deck(30, 'plate'), { solid: SOLID });
  s.add('deck:grate', deck(31, 'grate'), { solid: TOP });
  s.add('deck:girder', deck(32, 'girder'), { solid: TOP });
  // (slot 17 was a deck plate's edge no deck ever used) Will the playwright, visiting from
  // Shakespeare in Sweatpants: a figure in front of the pod bay's consoles, scenery only.
  s.add('will', over(panel(3, 2), willCameo(PAL, { face: 'front' }, SHARED_ONLY)));
  const bg = panel(1);
  s.add('pipe:v', pipe(true, bg));
  s.add('pipe:h', pipe(false, bg));
  s.add('pipe:wall', pipe(false, wall(24, 0)), { solid: SOLID });
  for (let k = 0; k < 3; k++) s.add(`console:${k}`, console_(40 + k, panel(2 + k)));
  for (let k = 0; k < 2; k++) s.add(`crate:${k}`, crate(k), { solid: SOLID });
  s.add(
    'light',
    over(
      bg,
      (() => {
        const p = sprite();
        shade(p, new Mask().rect(4, 0, 12, 4), R('tech').slice(2));
        for (let y = 4; y < 20; y++) for (let x = 6 - (y - 4) / 3; x < 14 + (y - 4) / 3; x++) if ((x + y) % 3 === 0) p.set(x, y, R('glow')[1]);
        return p;
      })(),
    ),
  );
  for (let k = 0; k < 4; k++) s.add(`reactor:${k}`, reactor(k), { chHitPt: k === 0 ? -1 : 0 });
  s.add(
    'vent',
    over(
      bg,
      (() => {
        const p = sprite();
        p.rect(3, 6, 14, 8, OUTLINE);
        for (let x = 4; x < 16; x += 2) p.rect(x, 7, 1, 6, R('tech')[2]);
        return p;
      })(),
    ),
  );
  s.add(
    'plant',
    over(
      bg,
      (() => {
        const p = sprite();
        shade(p, new Mask().rect(6, 13, 8, 7), R('stem'));
        for (let i = 0; i < 7; i++) p.line(10, 13, 4 + i * 2, 4 + (i % 3) * 2, R('plant')[2 + (i % 3)]);
        return outline(p, OUTLINE);
      })(),
    ),
  );
  // movers
  s.add('lift', arrowsOn('up', 0, panel(80)), { grav: G.up, next: 'lift2', ntime: 2 });
  s.add('lift2', arrowsOn('up', 1, panel(80)), { grav: G.up, next: 'lift', ntime: 2 });
  s.add('belt:r', conveyor('r', 0), { solid: TOP, grav: G.down | G.right, next: 'belt:r2', ntime: 2 });
  s.add('belt:r2', conveyor('r', 1), { solid: TOP, grav: G.down | G.right, next: 'belt:r', ntime: 2 });
  s.add('belt:l', conveyor('l', 0), { solid: TOP, grav: G.down | G.left, next: 'belt:l2', ntime: 2 });
  s.add('belt:l2', conveyor('l', 1), { solid: TOP, grav: G.down | G.left, next: 'belt:l', ntime: 2 });
  // (slots 39..42 were wind fans no deck ever used) Keepsakes for the training deck: a tin heart
  // behind you at the start, by the potted plant (a glint crosses it now and then), and a
  // painted Easter egg up on the catwalk by the practice range, each a few points and gone when
  // touched (the panel behind is the touch block), with no sound of their own; and Mystery
  // Robot Joe, visiting from Keep It Brief!, keeping count at the practice range (scenery).
  // All four use only the colors every Maximus palette shares.
  const tin = { ink: OUTLINE, tin: [S('metal', 3), S('metal', 4), S('metal', 5)], white: WHITE, dark: S('metal', 1) };
  s.add('tinHeart', drawTinHeart(panel(1, 0), tin, 0), { scorePts: 100, next: 'tinHeart:1', ntime: 50, touch: 'panel:0' });
  s.add('tinHeart:1', drawTinHeart(panel(1, 0), tin, 2), { scorePts: 100, next: 'tinHeart', ntime: 2, touch: 'panel:0' });
  const egg = { ink: OUTLINE, shell: [S('jade', 0), S('jade', 1), S('jade', 2)], paint: [S('rose', 1), S('rose', 2)], accent: S('gold', 4), white: WHITE };
  s.add('easterEgg', drawEasterEgg(panel(1, 0), egg, 'bands', 0), { scorePts: 50, touch: 'panel:0' });
  s.add('joe', over(panel(1, 0), joeCameo(PAL, 'down', 0, SHARED_ONLY)));
  // timed hazards, all on the deck's one clock
  s.add('laser:v', laser(true, true, bg), { chHitPt: -3, next: 'laser:v0', ntime: 20 });
  s.add('laser:v0', laser(false, true, bg), { next: 'laser:v', ntime: 25 });
  s.add('laser:h', laser(true, false, bg), { chHitPt: -3, next: 'laser:h0', ntime: 16 });
  s.add('laser:h0', laser(false, false, bg), { next: 'laser:h', ntime: 30 });
  s.add(
    'zap',
    over(
      deck(34, 'plate'),
      (() => {
        const p = sprite();
        for (let x = 0; x < 20; x += 3) p.line(x, 0, x + 2, 3, R('hazard')[4]).line(x + 2, 3, x + 1, 5, R('hazard')[3]);
        return p;
      })(),
    ),
    { solid: SOLID, chHitPt: -2, next: 'zap0', ntime: 10 },
  );
  s.add(
    'zap0',
    deck(35, 'plate').map((x, y, c) => (y < 2 && x % 4 === 0 ? R('hazard')[1] : c)),
    { solid: SOLID, next: 'zap', ntime: 30 },
  );
  s.add('plat:on', deck(36, 'grate'), { solid: TOP, next: 'plat:off', ntime: 40 });
  s.add(
    'plat:off',
    panel(83).map((x, y, c) => (y === 0 && x % 3 === 0 ? R('glow')[1] : c)),
    { next: 'plat:on', ntime: 30 },
  );
  s.add(
    'spikes',
    over(
      bg,
      (() => {
        const p = sprite();
        for (let i = 0; i < 4; i++)
          shade(
            p,
            new Mask().poly([
              [i * 5, 20],
              [i * 5 + 5, 20],
              [i * 5 + 2.5, 8],
            ]),
            R('hazard'),
            { light: [-1, 0] },
          );
        return p;
      })(),
    ),
    { solid: SOLID, chHitPt: -3 },
  );
  s.add(
    'acid',
    tex((x, y) => {
      const l = R('liquid');
      if (y < 5) return bg.get(x, y);
      if (y === 5) return l[6];
      return (x * 3 + y * 7) % 11 === 0 ? l[5] : l[2 + ((x + y) % 2)];
    }),
    { chHitPt: -2 },
  );
  s.add(
    'acid:deep',
    tex((x, y) => R('liquid')[(x * 3 + y * 7) % 11 === 0 ? 4 : 1 + ((x + y) % 2)]),
    { chHitPt: -2 },
  );
  // doors
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
  s.add(
    'door:open',
    panel(84, 0).map((x, _y, c) => (x < 2 || x > 17 ? R('tech')[1] : c)),
  );
  s.add(
    'field:on',
    tex((x, y) => ((x + y * 3) % 5 === 0 ? WHITE : (x * 7 + y) % 3 ? R('glow')[3] : R('glow')[4])),
    { solid: SOLID, chHitPt: -3, next: 'field:off', ntime: 24 },
  );
  s.add(
    'field:off',
    panel(85).map((x, y, c) => (y % 6 === 0 && x % 4 === 0 ? R('glow')[0] : c)),
    { next: 'field:on', ntime: 30 },
  );
  s.add(
    'glass',
    tex((x, y) => ((x * 3 + y) % 9 === 0 ? WHITE : (x + y) % 5 === 0 ? R('crystal')[4] : R('crystal')[2])),
    { solid: SOLID, scorePts: 50, touch: 'glass:broken' },
  );
  s.add(
    'glass:broken',
    panel(86).map((x, y, c) => (y > 16 && (x * 7) % 5 === 0 ? R('crystal')[3] : c)),
  );
  s.add('fake', wall(25, 0));
  for (let k = 0; k < 4; k++)
    s.add(
      `nest:${k}`,
      over(
        wall(26 + k, 0),
        (() => {
          const p = sprite();
          p.rect(4, 4, 12, 12, OUTLINE);
          p.rect(5, 5, 10, 10, R(['hideA', 'hideB', 'hideC', 'hideD'][k])[1]);
          for (let y = 6; y < 15; y += 3) p.line(5, y, 14, y, OUTLINE);
          p.set(10, 2, R('glow')[4]);
          return p;
        })(),
      ),
      { solid: SOLID },
    );
  // airlock (the way out), teleporter, info panels
  s.add('airlock', airlock(0), { next: 'airlock2', ntime: 8 });
  s.add('airlock2', airlock(1), { next: 'airlock', ntime: 8 });
  s.add(
    'teleport',
    over(
      bg,
      (() => {
        const p = sprite();
        shade(p, new Mask().ellipse(10, 17, 8, 3), R('tech').slice(2));
        for (let y = 2; y < 16; y++) if (y % 3) p.line(4, y, 16, y, R('glow')[(y % 4) + 1]);
        return p;
      })(),
    ),
  );
  for (const k of ['walk', 'hop', 'fire', 'pick', 'help', 'shard', 'credit', 'down']) s.add(`info:${k}`, infoPanel(k));
  // pickups
  for (const id of PICKUPS) s.add(`p:${id}`, over(panel(90), drawPickup(id)), { ...PICKUP_FX[id], touch: 'panel:0' });
  stationExtras(s);
  s.add('shrine', shrine(true));
  for (let i = 0; i < 10; i++)
    s.add(`shard:${i}`, over(shrine(false), drawShard(i)), { effect: SHARD_COUNTER + i, eamt: 1, scorePts: 5000, touch: 'shrine' }, SHARD_BASE + i);
  for (let i = 0; i < 10; i++) s.add(`module:${i}`, over(shrine(false), drawModule(i)), { obj: 1, scorePts: 1000, touch: 'shrine' }, ITEM_BASE + i);
  s.add('egg', over(shrine(false), drawEgg()), { obj: 1, touch: 'shrine' }, EGG_BLOCK);
  return s;
}
