// STATION.BBL: decks of orbital stations, derelicts and the Core citadel. Panels and
// windows behind, girders and deck plates to stand on, lifts, conveyors, laser grids
// that blink on a shared clock, airlocks, and the info panels of the training deck.
import { Pixels, rng, dither } from '../../../kit/pixels';
import { Mask, fill, outline, pick, shade, sprite, tileNoise } from '../art/draw';
import { G, SOLID, TOP, SetBuilder, over, tex } from './blockset';
import { ITEM_BASE, MONEY, SHARD_BASE, SHARD_COUNTER } from '../ids';
import { PICKUPS, drawModule, drawPickup, drawShard } from './items';
import { OUTLINE, S, WHITE } from '../art/palette';
import { PICKUP_FX, R } from './surface';

const panel = (seed: number, kind = 0) => {
  const t = R('cave'); // station themes color "cave" as the back wall
  const n = tileNoise(seed, 20, 2);
  return tex((x, y) => {
    if (x === 0 || y === 0) return t[0];
    if (x === 19 || y === 19) return t[3];
    if (kind === 1 && y > 6 && y < 13) return (x + y) % 2 ? t[1] : t[2];
    if (kind === 2 && (x === 10 || y === 10)) return t[0];
    if (kind === 3 && (x - 10) ** 2 + (y - 10) ** 2 < 10) return R('glow')[1];
    return dither(x, y, n(x, y) * 0.5) ? t[2] : t[1];
  });
};

function windowView(seed: number): Pixels {
  const r = rng(seed);
  const sky = R('sky');
  const t = R('tech');
  const p = tex((x, y) => {
    if (x < 2 || y < 2 || x > 17 || y > 17) return x === 0 || y === 0 ? t[1] : t[3];
    return sky[y > 12 ? 1 : 0];
  });
  for (let i = 0; i < 6; i++) p.set(3 + r() * 14, 3 + r() * 14, R('star')[Math.floor(r() * 4)]);
  if (seed % 3 === 0) shade(p, new Mask().ellipse(14, 13, 4, 4).rect(0, 18, 20, 2, false), R('hideB'));
  return p;
}

function deck(seed: number, kind: 'plate' | 'grate' | 'girder'): Pixels {
  const t = R('tech');
  const n = tileNoise(seed, 20, 3);
  return tex((x, y) => {
    if (kind === 'girder') {
      if (y < 3 || y > 16) return y === 0 ? t[6] : t[4];
      const d = (x + y) % 14;
      const e = (x - y + 28) % 14;
      return d < 2 || e < 2 ? t[3] : R('cave')[1];
    }
    if (y === 0) return t[6];
    if (y === 1) return t[5];
    if (kind === 'grate') return x % 4 === 0 || y % 4 === 0 ? t[2] : R('cave')[0];
    if ((x === 3 || x === 16) && (y === 4 || y === 15)) return t[6];
    return pick(t.slice(2, 5), n(x, y));
  });
}

function wall(seed: number, kind: number): Pixels {
  const t = R('soil'); // station themes: "soil" is the hull plating
  const n = tileNoise(seed, 20, 2);
  return tex((x, y) => {
    if (x === 0 || y === 0) return t[5];
    if (x === 19 || y === 19) return t[0];
    if (kind === 1 && y % 6 === 3) return t[1];
    if (kind === 2 && x > 5 && x < 14 && y > 5 && y < 14) return (x + y) % 2 ? R('hazard')[2] : OUTLINE;
    return pick(t.slice(2, 5), n(x, y));
  });
}

function pipe(vertical: boolean, bg: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(bg.px);
  const m = vertical ? new Mask().rect(7, 0, 6, 20) : new Mask().rect(0, 7, 20, 6);
  shade(p, m, R('stem'), { light: vertical ? [-1, 0] : [0, -1] });
  if (vertical) p.rect(6, 8, 8, 2, R('stem')[0]);
  else p.rect(8, 6, 2, 8, R('stem')[0]);
  return p;
}

function console_(seed: number, bg: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(bg.px);
  const r = rng(seed);
  shade(p, new Mask().rect(2, 6, 16, 14), R('tech').slice(1, 6), { light: [-1, -1] });
  p.rect(4, 8, 12, 5, OUTLINE);
  for (let i = 0; i < 8; i++) p.set(5 + r() * 10, 9 + r() * 3, R('glow')[2 + Math.floor(r() * 3)]);
  for (let x = 4; x < 16; x += 3) p.set(x, 16, [S('heart', 3), S('cash', 3), S('gold', 3)][x % 3]);
  return outline(p, OUTLINE);
}

function laser(on: boolean, vertical: boolean, bg: Pixels): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(bg.px);
  const h = R('hazard');
  if (on)
    for (let i = 0; i < 20; i++) {
      const w = i % 3 === 0 ? 2 : 1;
      if (vertical) p.rect(9, i, w + 1, 1, h[3]).set(10, i, WHITE);
      else p.rect(i, 9, 1, w + 1, h[3]).set(i, 10, WHITE);
    }
  else
    for (let i = 0; i < 20; i += 4) {
      if (vertical) p.set(10, i, h[0]);
      else p.set(i, 10, h[0]);
    }
  return p;
}

function arrowsOn(dir: 'up' | 'r' | 'l', frame: number, bg: Pixels, ramp = 'glow'): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(bg.px);
  const g = R(ramp);
  for (let k = 0; k < 2; k++) {
    const o = (k * 10 + frame * 5) % 20;
    for (let i = -4; i <= 4; i++) {
      const [x, y] = dir === 'up' ? [10 + i, o + Math.abs(i)] : dir === 'r' ? [19 - o - Math.abs(i), 10 + i] : [o + Math.abs(i), 10 + i];
      p.set(x, y, g[3]);
    }
  }
  return p;
}

function conveyor(dir: 'r' | 'l', frame: number): Pixels {
  const t = R('tech');
  return tex((x, y) => {
    if (y < 10) return panel(7).get(x, y);
    if (y === 10 || y === 19) return t[1];
    const s = dir === 'r' ? x - frame * 4 : x + frame * 4;
    return ((s % 8) + 8) % 8 < 4 ? (y === 11 ? t[6] : t[3]) : y === 11 ? t[4] : t[2];
  });
}

/** Info panels for the training deck: a key cap and a pictogram. */
function infoPanel(kind: string): Pixels {
  const p = panel(50 + kind.length, 0);
  const t = R('tech');
  shade(p, new Mask().rect(1, 1, 18, 18), [t[0], t[1], t[1], t[2]]);
  const key = (x: number, y: number, w: number, glyph: string[]) => {
    p.rect(x, y, w, 7, t[5])
      .rect(x, y + 6, w, 1, t[2])
      .rect(x, y, w, 1, WHITE);
    glyph.forEach((row, gy) => [...row].forEach((ch, gx) => ch === '#' && p.set(x + 1 + gx, y + 1 + gy, OUTLINE)));
  };
  const g = R('glow')[4];
  switch (kind) {
    case 'walk':
      key(
        2,
        11,
        7,
        ['..#..', '.##..', '#####', '.##..', '..#..'].map((r) => r.slice(0, 5)),
      );
      key(11, 11, 7, ['..#..', '..##.', '#####', '..##.', '..#..']);
      p.line(4, 6, 15, 6, g).line(13, 4, 15, 6, g).line(13, 8, 15, 6, g);
      break;
    case 'hop':
      key(6, 12, 7, ['..#..', '.###.', '#####', '..#..', '..#..']);
      p.line(10, 9, 10, 2, g).line(8, 4, 10, 2, g).line(12, 4, 10, 2, g);
      break;
    case 'fire':
      key(2, 12, 16, ['..............', '.############.', '..............']);
      p.line(4, 6, 16, 6, S('laser', 3)).line(14, 4, 16, 6, S('laser', 3)).line(14, 8, 16, 6, S('laser', 3));
      break;
    case 'pick':
      key(6, 11, 7, ['###..', '#..#.', '###..', '#....', '#....']);
      p.blit(
        drawPickup('gem')
          .crop(4, 3, 12, 14)
          .map((_x, _y, c) => c),
        4,
        -3,
        255,
      );
      break;
    case 'help':
      key(4, 11, 12, ['#####.#....', '#.....#....', '####..#....', '#.....#....', '#.....#....']);
      p.set(10, 4, g).set(9, 3, g).set(11, 3, g).set(11, 5, g).set(10, 7, g);
      break;
    case 'shard':
      p.blit(drawShard(0).crop(4, 0, 12, 20), 4, 0, 255);
      break;
    case 'credit':
      p.blit(drawPickup('credit').crop(3, 2, 14, 16), 3, 2, 255);
      break;
    case 'down':
      key(6, 12, 7, ['..#..', '..#..', '#####', '.###.', '..#..']);
      fill(p, new Mask().ellipse(10, 6, 4, 4), S('suit', 3));
      break;
  }
  return p;
}

function airlock(frame: number): Pixels {
  const t = R('tech');
  const g = R('glow');
  return tex((x, y) => {
    if (x < 2 || x > 17) return t[(y % 4 === 0 ? 1 : 4) as number];
    if (y < 2) return t[5];
    const stripe = (x + y + frame * 3) % 8 < 4;
    if (y > 16) return stripe ? R('hazard')[3] : OUTLINE;
    if (Math.abs(x - 10) < 1) return t[0];
    return frame && (x === 5 || x === 14) && y < 6 ? g[4] : stripe ? t[3] : t[2];
  });
}

function reactor(part: number): Pixels {
  const g = R('glow');
  const t = R('tech');
  return tex((x, y) => {
    const cx = part % 2 ? -0.5 : 19.5;
    const cy = part < 2 ? 19.5 : -0.5;
    const d = Math.hypot(x - cx, y - cy);
    if (d < 7) return d < 4 ? WHITE : g[4];
    if (d < 12) return g[2 + (Math.floor(d) % 2)];
    if (d < 15) return t[2 + (Math.floor(Math.atan2(y - cy, x - cx) * 6) & 1) * 2];
    return panel(60 + part).get(x, y);
  });
}

function crate(seed: number): Pixels {
  const c = R('stem');
  return tex((x, y) => {
    if (x === 0 || y === 0 || x === 19 || y === 19) return c[0];
    if (x === y || x === 19 - y) return c[1];
    if (x < 3 || y < 3 || x > 16 || y > 16) return c[3];
    return c[2 + ((x * 3 + y + seed) % 7 === 0 ? 1 : 0)];
  });
}

function shrine(empty: boolean): Pixels {
  const p = panel(70, 3);
  const arch = new Mask().rect(1, 2, 18, 18).minus(new Mask().ellipse(10, 11, 6.5, 8).rect(4, 11, 12, 8));
  shade(p, arch, R('ruin').slice(1));
  shade(p, new Mask().rect(4, 17, 12, 3), R('tech').slice(2));
  if (empty) p.set(10, 12, R('glow')[1]);
  return outline(p, OUTLINE);
}

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
  s.add(
    'zerog',
    panel(12, 2).map((x, y, c) => ((x + y) % 9 === 0 ? R('glow')[1] : c)),
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
  s.add(
    'deck:edge',
    deck(33, 'plate').map((x, y, c) => (x > 15 && y > 1 ? panel(5).get(x, y) : c)),
    { solid: SOLID },
  );
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
  s.add('fan:r', arrowsOn('r', 0, panel(81), 'cloud'), { grav: G.right | G.down, next: 'fan:r2', ntime: 2 });
  s.add('fan:r2', arrowsOn('r', 1, panel(81), 'cloud'), { grav: G.right | G.down, next: 'fan:r', ntime: 2 });
  s.add('fan:l', arrowsOn('l', 0, panel(82), 'cloud'), { grav: G.left | G.down, next: 'fan:l2', ntime: 2 });
  s.add('fan:l2', arrowsOn('l', 1, panel(82), 'cloud'), { grav: G.left | G.down, next: 'fan:l', ntime: 2 });
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
  return s;
}

/** The rest of a station's furniture, so every slot of the set holds something. */
function stationExtras(s: SetBuilder): void {
  const bg = panel(200);
  const D = (name: string, sp: Pixels, props = {}) => s.add(name, over(panel(201 + s.count), sp), props);
  const t = R('tech');
  const g = R('glow');
  // more wall panels
  s.add(
    'panel:grille',
    panel(202).map((x, y, c) => (y > 4 && y < 15 && x > 3 && x < 16 && y % 2 ? OUTLINE : c)),
  );
  s.add(
    'panel:stripe',
    panel(203).map((x, y, c) => (y > 14 ? ((x + y) % 8 < 4 ? R('hazard')[3] : OUTLINE) : c)),
  );
  s.add(
    'panel:emblem',
    over(
      panel(204),
      (() => {
        const p = sprite();
        const m = new Mask().ellipse(10, 10, 7, 7).minus(new Mask().ellipse(10, 10, 5, 5));
        fill(p, m, R('accent')[3]);
        p.line(5, 15, 10, 5, R('accent')[4]).line(15, 15, 10, 5, R('accent')[4]).line(7, 11, 13, 11, R('accent')[4]);
        return p;
      })(),
    ),
  );
  s.add(
    'panel:cables',
    panel(205).map((x, y, c) => (Math.abs(x - 6 - Math.sin(y * 0.4) * 2) < 1 || Math.abs(x - 13 - Math.cos(y * 0.3) * 2) < 1 ? R('stem')[2] : c)),
  );
  const monitor = (f: number) => {
    const p = sprite();
    shade(p, new Mask().rect(2, 3, 16, 12), t.slice(1, 5));
    p.rect(4, 5, 12, 8, OUTLINE);
    for (let y = 0; y < 4; y++) p.rect(5, 6 + y * 2, 3 + ((y * 5 + f * 3) % 9), 1, g[2 + (y % 2)]);
    p.rect(8, 15, 4, 3, t[1]);
    return outline(p, OUTLINE);
  };
  D('monitor:0', monitor(0), { next: 'monitor:1', ntime: 9 });
  D('monitor:1', monitor(1), { next: 'monitor:0', ntime: 9 });
  const rack = (f: number) => {
    const p = sprite();
    shade(p, new Mask().rect(3, 0, 14, 20), t.slice(0, 3));
    for (let y = 2; y < 20; y += 3) {
      p.rect(4, y, 12, 1, OUTLINE);
      p.set(14, y + 1, (y + f) % 2 ? S('cash', 3) : S('heart', 2));
      p.set(12, y + 1, (y * 3 + f) % 3 ? g[3] : g[0]);
    }
    return p;
  };
  D('rack:0', rack(0), { next: 'rack:1', ntime: 7 });
  D('rack:1', rack(1), { next: 'rack:0', ntime: 7 });
  D(
    'bunk',
    (() => {
      const p = sprite();
      shade(p, new Mask().rect(1, 6, 18, 3).rect(1, 15, 18, 3), R('stem'));
      p.rect(2, 4, 6, 2, S('pearl', 1)).rect(2, 13, 6, 2, S('pearl', 1));
      p.rect(1, 4, 1, 16, t[2]).rect(18, 4, 1, 16, t[2]);
      return outline(p, OUTLINE);
    })(),
  );
  D(
    'locker',
    (() => {
      const p = sprite();
      shade(p, new Mask().rect(4, 1, 12, 19), t.slice(1, 6), { light: [-1, 0] });
      p.line(10, 1, 10, 19, OUTLINE).rect(6, 4, 3, 1, OUTLINE).rect(11, 4, 3, 1, OUTLINE);
      return p;
    })(),
  );
  D(
    'table',
    (() => {
      const p = sprite();
      shade(p, new Mask().rect(1, 10, 18, 3), t.slice(2));
      p.rect(3, 13, 2, 7, t[1]).rect(15, 13, 2, 7, t[1]);
      shade(p, new Mask().ellipse(6, 8, 2, 2), [S('trim', 2), S('trim', 3)]);
      return outline(p, OUTLINE);
    })(),
  );
  D(
    'chair',
    (() => {
      const p = sprite();
      shade(p, new Mask().rect(6, 4, 3, 12).rect(6, 12, 9, 3), R('accent').slice(0, 4));
      p.rect(13, 15, 2, 5, t[1]).rect(6, 15, 2, 5, t[1]);
      return outline(p, OUTLINE);
    })(),
  );
  D(
    'medbay',
    (() => {
      const p = sprite();
      shade(p, new Mask().rect(1, 12, 18, 4), [WHITE, S('pearl', 1), S('pearl', 2)]);
      p.rect(9, 3, 2, 7, S('heart', 2)).rect(6, 5, 8, 3, S('heart', 2));
      return outline(p, OUTLINE);
    })(),
    { chHitPt: 1 },
  );
  D(
    'robotarm',
    (() => {
      const p = sprite();
      const m = new Mask().line(3, 0, 8, 8, 3).line(8, 8, 15, 6, 3);
      shade(p, m, R('accent'));
      p.line(15, 6, 18, 3, t[4]).line(15, 6, 18, 9, t[4]);
      return outline(p, OUTLINE);
    })(),
  );
  D(
    'cables',
    (() => {
      const p = sprite();
      for (let k = 0; k < 3; k++) for (let x = 0; x < 20; x++) p.set(x, 2 + k * 2 + Math.round(Math.sin((x / 19) * Math.PI) * (5 + k * 2)), R('stem')[1 + k]);
      return p;
    })(),
  );
  const corner = (k: number) => {
    const p = new Pixels(20, 20);
    p.px.set(bg.px);
    const m = new Mask();
    if (k === 0) m.rect(7, 7, 13, 6).rect(7, 7, 6, 13);
    if (k === 1) m.rect(0, 7, 13, 6).rect(7, 7, 6, 13);
    if (k === 2) m.rect(7, 0, 6, 13).rect(7, 7, 13, 6);
    if (k === 3) m.rect(7, 0, 6, 13).rect(0, 7, 13, 6);
    shade(p, m, R('stem'));
    return p;
  };
  for (let k = 0; k < 4; k++) s.add(`pipe:c${k}`, corner(k));
  s.add(
    'deck:stripe',
    deck(206, 'plate').map((x, y, c) => (y > 1 && y < 5 ? ((x + y) % 8 < 4 ? R('hazard')[3] : OUTLINE) : c)),
    { solid: SOLID },
  );
  s.add(
    'deck:lamp',
    deck(207, 'plate').map((x, y, c) => (y > 2 && y < 6 && x > 7 && x < 13 ? g[4] : c)),
    { solid: SOLID },
  );
  s.add(
    'ladder',
    over(
      panel(208),
      (() => {
        const p = sprite();
        p.rect(5, 0, 2, 20, t[4]).rect(13, 0, 2, 20, t[4]);
        for (let y = 2; y < 20; y += 5) p.rect(5, y, 10, 2, t[3]);
        return p;
      })(),
    ),
    { grav: G.up },
  );
  s.add(
    'ladder:top',
    over(
      panel(209),
      (() => {
        const p = sprite();
        p.rect(5, 6, 2, 14, t[4]).rect(13, 6, 2, 14, t[4]);
        for (let y = 8; y < 20; y += 5) p.rect(5, y, 10, 2, t[3]);
        p.rect(3, 4, 14, 2, R('hazard')[3]);
        return p;
      })(),
    ),
    { grav: G.up },
  );
  const holo = (f: number) => {
    const p = sprite();
    shade(p, new Mask().ellipse(10, 18, 6, 2), t.slice(2));
    for (let y = 2; y < 16; y += 2)
      for (let x = 0; x < 20; x++) if (Math.hypot(x - 10, (y - 9) * 1.2) < 6 && (x + y + f) % 3 !== 0) p.set(x, y, g[(y >> 2) % 2 ? 3 : 2]);
    return p;
  };
  D('holo:0', holo(0), { next: 'holo:1', ntime: 4 });
  D('holo:1', holo(1), { next: 'holo:0', ntime: 4 });
  const signp = (k: 'exit' | 'arrow') => {
    const p = sprite();
    p.rect(2, 6, 16, 8, k === 'exit' ? S('cash', 1) : R('accent')[1]).frame(2, 6, 16, 8, OUTLINE);
    if (k === 'exit') p.line(5, 10, 14, 10, WHITE).line(11, 8, 14, 10, WHITE).line(11, 12, 14, 10, WHITE).rect(4, 8, 1, 5, WHITE);
    else p.line(10, 8, 10, 12, WHITE).line(8, 10, 10, 8, WHITE).line(12, 10, 10, 8, WHITE);
    return p;
  };
  D('sign:exit', signp('exit'));
  D('sign:up', signp('arrow'));
  s.add(
    'window:wide0',
    windowView(3).map((x, _y, c) => (x < 2 || x > 17 ? R('tech')[3] : c)),
  );
  s.add(
    'window:wide1',
    windowView(6).map((x, _y, c) => (x < 2 || x > 17 ? R('tech')[3] : c)),
  );
  s.add(
    'girder:v',
    tex((x, y) => (x < 3 || x > 16 ? t[x === 0 || x === 19 ? 1 : 4] : (x + y) % 12 < 2 || (x - y + 24) % 12 < 2 ? t[3] : R('cave')[1])),
    { solid: SOLID },
  );
  for (let k = 0; k < 2; k++)
    s.add(
      `barrel:${k}`,
      over(
        bg,
        (() => {
          const p = sprite();
          shade(p, new Mask().rect(4, 3, 12, 17).ellipse(10, 3, 6, 1.5), k ? R('hazard') : R('hideB'));
          p.rect(4, 8, 12, 1, OUTLINE).rect(4, 14, 12, 1, OUTLINE);
          if (k) p.set(9, 11, OUTLINE).set(10, 10, OUTLINE).set(11, 11, OUTLINE);
          return outline(p, OUTLINE);
        })(),
      ),
      { solid: SOLID },
    );
  D(
    'plant:2',
    (() => {
      const p = sprite();
      shade(p, new Mask().rect(5, 14, 10, 6), R('ruin'));
      for (let i = 0; i < 5; i++) shade(p, new Mask().ellipse(5 + i * 2.5, 8 + (i % 2) * 3, 3, 4), R('plant'));
      return outline(p, OUTLINE);
    })(),
  );
  const fan = (f: number) => {
    const p = sprite();
    fill(p, new Mask().ellipse(10, 10, 8, 8), OUTLINE);
    for (let a = 0; a < 3; a++) {
      const ang = a * 2.09 + f * 0.6;
      fill(p, new Mask().line(10, 10, 10 + Math.cos(ang) * 7, 10 + Math.sin(ang) * 7, 3), t[3]);
    }
    p.set(10, 10, t[6]);
    return p;
  };
  D('fan:0', fan(0), { next: 'fan:1', ntime: 1 });
  D('fan:1', fan(1), { next: 'fan:0', ntime: 1 });
  const conduit = (f: number) => tex((x, y) => (x > 6 && x < 13 ? ((y + f * 5) % 10 < 3 ? WHITE : g[3 + ((y >> 1) % 2)]) : bg.get(x, y)));
  s.add('conduit:0', conduit(0), { next: 'conduit:1', ntime: 2 });
  s.add('conduit:1', conduit(1), { next: 'conduit:0', ntime: 2 });
  s.add(
    'catwalk',
    tex((x, y) => (y < 3 ? (y === 0 ? t[6] : x % 3 === 0 ? t[2] : t[4]) : y < 6 && x % 5 === 0 ? t[2] : bg.get(x, y))),
    { solid: TOP },
  );
  const tank = (full: boolean) => {
    const p = sprite();
    shade(p, new Mask().rect(4, 1, 12, 18), [R('liquid')[1], R('liquid')[2], R('liquid')[3]]);
    p.rect(3, 0, 14, 2, t[3]).rect(3, 18, 14, 2, t[3]);
    if (full) shade(p, new Mask().ellipse(10, 10, 4, 5), R('hideC'));
    for (let y = 3; y < 18; y += 4) p.set(6 + (y % 3), y, WHITE);
    return outline(p, OUTLINE);
  };
  D('tank', tank(false));
  D('tank:full', tank(true));
  const alert = (f: number) => {
    const p = sprite();
    shade(p, new Mask().rect(3, 4, 14, 10), t.slice(1, 4));
    p.rect(5, 6, 10, 6, f ? S('heart', 3) : S('heart', 0));
    p.rect(9, 7, 2, 3, WHITE).rect(9, 11, 2, 1, WHITE);
    return outline(p, OUTLINE);
  };
  D('alert:0', alert(0), { next: 'alert:1', ntime: 6 });
  D('alert:1', alert(1), { next: 'alert:0', ntime: 6 });
}
