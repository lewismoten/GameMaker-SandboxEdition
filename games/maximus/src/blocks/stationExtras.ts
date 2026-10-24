// The rest of a station's furniture for STATION.BBL, so every slot of the set holds
// something: bunks, lockers, chairs and tables, the med bay, robot arms, tanks, catwalks,
// ladders, cables, plants and hazard signs.
import { Pixels } from '../../../kit/pixels';
import { Mask, fill, outline, shade, sprite } from '../art/draw';
import { G, SOLID, SetBuilder, TOP, over, tex } from './blockset';
import { OUTLINE, S, WHITE } from '../art/palette';
import { R } from './common';
import { deck, panel, windowView } from './stationArt';

/** The rest of a station's furniture, so every slot of the set holds something. */
export function stationExtras(s: SetBuilder): void {
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
  // (the chair's slot went to the spent medbay: quarters set a second table instead)
  // The medbay: one treatment (like a surface world's spring), 100 hit points, then its cross
  // goes dark until Max comes back aboard. It mended 1 a tick for as long as he stood there.
  const medbay = (lit: boolean) => {
    const p = sprite();
    shade(p, new Mask().rect(1, 12, 18, 4), [WHITE, S('pearl', 1), S('pearl', 2)]);
    const cross = lit ? S('heart', 2) : t[1];
    p.rect(9, 3, 2, 7, cross).rect(6, 5, 8, 3, cross);
    return outline(p, OUTLINE);
  };
  const bay = panel(201 + s.count);
  s.add('medbay', over(bay, medbay(true)), { chHitPt: 100, touch: 'medbay:spent' });
  s.add('medbay:spent', over(bay, medbay(false)));
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
