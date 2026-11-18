// Collectible parts, their icons, sockets and shutter pads.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Pal } from '../../kit/starter/palette';
import { tile } from './artTile';
import { cabinet } from './artSurfaces';

type P = Pixels;

/** A star washer: a steel ring with ten little teeth, a glint (10 points). */
export function washer(pal: Pal, bg: P): P {
  const p = tile(bg);
  const s = pal.r('steel');
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    p.disc(10 + Math.cos(a) * 6.2, 10 + Math.sin(a) * 6.2, 1.2, s[1]);
  }
  p.disc(10, 10, 5.6, s[2]).disc(10, 10, 4.4, s[3]).disc(9.5, 9.5, 2.5, bg.get(10, 10));
  p.ring(10, 10, 5.6, s[0]);
  p.set(7, 7, s[4]).set(8, 6, s[4]);
  return p;
}

export type Icon =
  | 'bracket'
  | 'knob'
  | 'foot'
  | 'tube'
  | 'eyepiece'
  | 'finder'
  | 'cap'
  | 'legs'
  | 'lens'
  | 'circle'
  | 'square'
  | 'triangle'
  | 'rattle'
  | 'plate'
  | 'cup'
  | 'mat'
  | 'lantern'
  | 'star'
  | 'bell'
  | 'rollpin'
  | 'whisk'
  | 'scoop'
  | 'cloth';

/** Draws an icon, about 14x14, centered on (cx, cy): `fill` its main color ramp, or one ink color for an outline. */
export function icon(pal: Pal, p: P, kind: Icon, cx: number, cy: number, how: 'thing' | 'outline'): void {
  const { c, r } = pal;
  const ink = c('ink', 0);
  const o = how === 'outline';
  const st = r('steel');
  const col = (k: number, ramp = st) => (o ? ink : ramp[k]);
  const under = p.get(cx, cy);
  switch (kind) {
    case 'bracket':
      p.rect(cx - 5, cy - 5, 3, 11, col(2)).rect(cx - 5, cy + 3, 11, 3, col(2));
      if (!o)
        p.rect(cx - 5, cy - 5, 1, 11, st[4])
          .set(cx - 4, cy - 2, st[0])
          .set(cx + 2, cy + 4, st[0]);
      break;
    case 'knob':
      p.disc(cx, cy, 5, col(2, r('wood'))).disc(cx, cy, o ? 3.5 : 2.5, o ? under : r('wood')[4]);
      break;
    case 'foot':
      p.rect(cx - 5, cy - 5, 10, 10, col(1, r('wood'))).rect(cx - 3, cy - 3, 6, 6, o ? under : r('wood')[3]);
      break;
    case 'tube':
      for (let k = -6; k <= 6; k += 1) p.rect(cx + k, cy - 3, 1, 6, o ? ink : k % 3 === 0 ? r('blue')[1] : r('blue')[3]);
      if (!o) p.rect(cx - 6, cy - 3, 13, 1, r('blue')[4]);
      break;
    case 'eyepiece':
      p.rect(cx - 2, cy - 6, 5, 9, col(1)).rect(cx - 4, cy + 3, 9, 3, col(2));
      if (!o) p.rect(cx - 1, cy - 6, 1, 9, st[4]).rect(cx - 1, cy - 7, 3, 1, c('glass', 3));
      break;
    case 'finder':
      p.rect(cx - 6, cy - 2, 10, 4, col(2, r('teal'))).rect(cx + 4, cy - 3, 3, 6, col(1));
      if (!o) p.set(cx - 6, cy, c('glass', 3)).rect(cx - 5, cy - 2, 9, 1, c('teal', 4));
      break;
    case 'cap':
      p.disc(cx, cy, 5.5, col(1, r('red'))).disc(cx, cy, 3.5, o ? under : r('red')[3]);
      break;
    case 'legs':
      p.line(cx, cy - 6, cx - 5, cy + 6, col(2, r('wood'))).line(cx, cy - 6, cx + 5, cy + 6, col(2, r('wood')));
      p.line(cx, cy - 6, cx, cy + 6, col(1, r('wood'))).rect(cx - 2, cy - 7, 5, 2, col(2));
      break;
    case 'lens':
      p.disc(cx, cy, 6.5, o ? ink : c('gold', 1))
        .disc(cx, cy, 5.2, o ? ink : c('gold', 3))
        .disc(cx, cy, o ? 4.5 : 4.2, o ? under : c('glass', 1));
      if (!o)
        p.disc(cx, cy, 3, c('glass', 2))
          .line(cx - 2, cy, cx, cy - 2, c('glass', 3))
          .set(cx + 2, cy + 2, c('glass', 3));
      break;
    case 'circle':
      p.ring(cx, cy, 5, col(4, r('gold'))).ring(cx, cy, 4, col(3, r('gold')));
      break;
    case 'square':
      p.frame(cx - 5, cy - 5, 11, 11, col(4, r('gold'))).frame(cx - 4, cy - 4, 9, 9, col(3, r('gold')));
      break;
    case 'triangle':
      p.line(cx, cy - 5, cx - 6, cy + 5, col(4, r('gold')))
        .line(cx, cy - 5, cx + 6, cy + 5, col(4, r('gold')))
        .line(cx - 6, cy + 5, cx + 6, cy + 5, col(4, r('gold')))
        .line(cx, cy - 4, cx - 5, cy + 4, col(3, r('gold')));
      break;
    case 'rattle': {
      // a brass luggage tag with a string hole, and three wavy rattle marks beside it: the colander went this way
      const g = r('gold');
      p.rect(cx - 6, cy - 4, 9, 9, o ? ink : g[1]).rect(cx - 5, cy - 3, 7, 7, o ? under : g[3]);
      p.line(cx + 3, cy - 4, cx + 5, cy, o ? ink : g[1]).line(cx + 3, cy + 4, cx + 5, cy, o ? ink : g[1]);
      p.disc(cx - 2, cy, 1.2, o ? ink : g[0]);
      if (!o) p.rect(cx - 5, cy - 3, 7, 1, g[5]);
      p.line(cx + 7, cy - 5, cx + 8, cy - 3, col(1))
        .line(cx + 7, cy - 1, cx + 9, cy - 1, col(1))
        .line(cx + 7, cy + 3, cx + 8, cy + 5, col(1));
      break;
    }
    case 'plate':
      p.disc(cx, cy, 6, o ? ink : r('white')[1])
        .disc(cx, cy, 4.5, o ? under : r('white')[3])
        .ring(cx, cy, 3, o ? ink : r('white')[1]);
      break;
    case 'cup':
      p.rect(cx - 4, cy - 4, 8, 8, col(2, r('teal'))).rect(cx + 4, cy - 2, 3, 4, col(1, r('teal')));
      if (!o) p.rect(cx - 4, cy - 4, 8, 1, c('teal', 4)).rect(cx + 5, cy - 1, 1, 2, p.get(0, 0));
      break;
    case 'mat':
      p.rect(cx - 6, cy - 4, 13, 8, col(2, r('green')));
      if (!o) for (let x = cx - 5; x < cx + 7; x += 3) p.rect(x, cy - 4, 1, 8, c('green', 4));
      break;
    case 'lantern': {
      // a round paper lantern with ribs and a little cap and tassel
      const rr = r('red');
      p.rect(cx - 1, cy - 7, 3, 2, col(1)).disc(cx, cy, 5.5, o ? ink : rr[2]);
      if (o) p.disc(cx, cy, 4.2, under);
      else p.disc(cx - 1, cy - 1, 3, rr[3]).set(cx - 2, cy - 2, rr[4]);
      for (const y of [-3, 0, 3]) p.rect(cx - 4, cy + y, 9, 1, o ? ink : rr[1]);
      p.rect(cx, cy + 6, 1, 2, col(3, r('gold')));
      break;
    }
    case 'star': {
      // a folded paper star: five points
      const g = r('gold');
      const pts: [number, number][] = [];
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5;
        const rad = k % 2 ? 2.6 : 6.4;
        pts.push([cx + Math.cos(a) * rad, cy + 1 + Math.sin(a) * rad]);
      }
      pts.forEach(([x, y], k) => {
        const [nx, ny] = pts[(k + 1) % 10];
        p.line(Math.round(x), Math.round(y), Math.round(nx), Math.round(ny), col(1, g));
      });
      if (!o) p.disc(cx, cy + 1, 2.6, g[4]).set(cx - 1, cy, g[5]);
      break;
    }
    case 'bell': {
      // a paper bell on a loop of string
      const g = r('gold');
      p.rect(cx, cy - 7, 1, 2, col(1));
      for (let y = -5; y <= 4; y++) {
        const half = Math.round(2 + (y + 5) * 0.45);
        p.rect(cx - half, cy + y, half * 2 + 1, 1, o ? ink : g[y < -2 ? 3 : 2]);
      }
      if (o) for (let y = -3; y <= 3; y++) p.rect(cx - Math.round(2 + (y + 5) * 0.45) + 1, cy + y, Math.round(2 + (y + 5) * 0.45) * 2 - 1, 1, under);
      else p.rect(cx - 6, cy + 4, 13, 1, g[0]).set(cx - 1, cy - 3, g[5]);
      p.rect(cx - 1, cy + 5, 3, 2, col(1));
      break;
    }
    case 'rollpin':
      // a rolling pin lying across, handles at both ends
      p.rect(cx - 5, cy - 2, 11, 5, col(2, r('wood')))
        .rect(cx - 8, cy - 1, 3, 3, col(1, r('wood')))
        .rect(cx + 6, cy - 1, 3, 3, col(1, r('wood')));
      if (!o) p.rect(cx - 5, cy - 2, 11, 1, c('wood', 4));
      break;
    case 'whisk':
      // a balloon whisk: a handle and a bulb of wire loops
      p.rect(cx - 1, cy + 2, 3, 6, col(2, r('red')));
      for (const dx of [-4, -2, 0, 2, 4]) p.line(cx, cy + 2, cx + dx, cy - 6, col(3));
      p.line(cx - 4, cy - 6, cx + 4, cy - 6, col(3));
      break;
    case 'scoop':
      // a flour scoop: a deep cup with a short handle
      p.rect(cx - 5, cy - 3, 8, 7, col(2)).rect(cx + 3, cy - 1, 5, 2, col(1));
      if (!o) p.rect(cx - 5, cy - 3, 8, 2, c('white', 3)).rect(cx - 4, cy + 3, 6, 1, st[0]);
      break;
    case 'cloth':
      // the tablecloth, folded into a square: the blue check
      p.rect(cx - 6, cy - 5, 13, 11, o ? ink : c('white', 3));
      if (o) p.rect(cx - 5, cy - 4, 11, 9, under);
      else {
        for (let x = cx - 6; x <= cx + 6; x += 4) p.rect(x, cy - 5, 2, 11, c('blue', 3));
        for (let y = cy - 5; y <= cy + 5; y += 4) p.rect(cx - 6, y, 13, 2, c('blue', 2));
        p.rect(cx - 6, cy + 5, 13, 1, c('blue', 0));
      }
      break;
  }
}

/** A part to pick up: the icon over the backdrop. */
export function thing(pal: Pal, bg: P, kind: Icon): P {
  const p = tile(bg);
  icon(pal, p, kind, 10, 10, 'thing');
  return p;
}

/**
 * A socket: a padded little door with the outline of the part it takes (solid until it gets one). The outline's
 * shape tells the parts apart as well as the color does.
 */
export function socket(pal: Pal, kind: Icon): P {
  const p = cabinet(pal);
  const k = pal.r('cab');
  p.rect(3, 3, 14, 14, pal.c('parch', 3));
  icon(pal, p, kind, 10, 10, 'outline');
  p.frame(3, 3, 14, 14, k[0]);
  return p;
}

/** The socket once it took its part: an open frame with the part fitted at the top (walk through). */
export function fitted(pal: Pal, bg: P, kind: Icon): P {
  const p = tile(bg);
  const k = pal.r('cab');
  p.rect(0, 0, 3, 20, k[2]).rect(17, 0, 3, 20, k[2]).rect(0, 0, 20, 3, k[2]);
  p.rect(0, 0, 1, 20, k[3]).rect(19, 0, 1, 20, k[1]);
  icon(pal, p, kind, 10, 9, 'thing');
  return p;
}

/** A pad on the floor marked with a shape: step on it to set a shutter (a stamp shows it took). */
export function pad(pal: Pal, bg: P, kind: Icon, set: boolean): P {
  const p = tile(bg);
  const k = pal.r('cab');
  p.rect(2, 14, 16, 6, set ? pal.c('gold', 2) : k[3]).rect(2, 14, 16, 1, set ? pal.c('gold', 4) : k[4]);
  icon(pal, p, kind, 10, 7, set ? 'thing' : 'outline');
  if (set) p.rect(9, 0, 2, 2, pal.c('warm', 3));
  return p;
}
