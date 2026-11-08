// Final Curtain's Stage Box: the engraving. Everything said here is already in games/sleuth (about.json: the title, the
// opening-night blurb, "one night, five parts, five suspects", the tagline, the ghost light at 2 AM; the Paragon and Port
// Ellery; the playbill in Victor's office, THE RAVEN'S BRIDE with a raven, a rose and a moon in a row, src/blocks/backstage.ts).
// No people are drawn, so there is nobody to dress. Engraving is convex shapes only and stays clear of every cut.
import type { Pt } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';
import type { Dims } from './stageBoxDims';
import { axis, type Parts } from './stageBoxParts';

type Rc = [number, number, number, number];
const quad = ([x0, y0, x1, y1]: Rc): Pt[] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];
/** A hollow frame of four strips, `w` wide, around the rectangle. */
const frame = (x0: number, y0: number, x1: number, y1: number, w: number): Pt[][] => [
  quad([x0, y0, x1, y0 + w]),
  quad([x0, y1 - w, x1, y1]),
  quad([x0, y0 + w, x0 + w, y1 - w]),
  quad([x1 - w, y0 + w, x1, y1 - w]),
];

export function addArt(parts: Parts, d: Dims) {
  const { t, Ho } = d;
  const P = (n: string) => parts[n].part;
  const fy = (zP: number) => Ho - zP;

  // front: the proscenium arch (a band round the window), the apron's plaque, footlights, a fluted pillar, the dagger's label
  const w = d.window;
  const rad = (w.x1 - w.x0) ** 2 / 4 / (w.crown - w.z1) / 2 + (w.crown - w.z1) / 2;
  const cz = w.crown - rad;
  const phi = Math.asin((w.z1 - cz) / rad);
  const xc = t + (w.x0 + w.x1) / 2;
  const band: Pt[][] = [];
  const sideTop = d.zP(w.z1);
  band.push(quad([t + w.x0 - 5, fy(sideTop), t + w.x0 - 2, fy(d.zP(w.z0) + 20)]), quad([t + w.x1 + 2, fy(sideTop), t + w.x1 + 5, fy(d.zP(w.z0) + 20)]));
  for (let i = 0; i < 16; i++) {
    const a = Math.PI - phi - ((Math.PI - 2 * phi) * i) / 16;
    const b = Math.PI - phi - ((Math.PI - 2 * phi) * (i + 1)) / 16;
    const at = (th: number, r: number): Pt => [xc + r * Math.cos(th), fy(d.zP(cz + r * Math.sin(th)))];
    band.push([at(a, rad + 2), at(a, rad + 5), at(b, rad + 5), at(b, rad + 2)]);
  }
  P('P').engrave('arch band', band);
  const cx = t + 51;
  P('P').text("THE RAVEN'S BRIDE", 'pc', cx, fy(d.zP(24)), 0.36);
  P('P').text('OPENING NIGHT', 'pc', cx, fy(d.zP(19.5)), 0.36);
  P('P').text('PORT ELLERY 1936', 'pc', cx, fy(d.zP(15)), 0.36);
  P('P').engrave(
    'footlights',
    Array.from({ length: 5 }, (_, i) => quad([36 + 8 * i, fy(d.zP(6)) - 1.2, 41 + 8 * i, fy(d.zP(6)) + 1.2])),
  );
  P('P').engrave(
    'pillar flutes',
    [9, 15, 21, 27].map((x) => quad([x - 1.2, fy(d.zP(70)), x + 1.2, fy(d.zP(8))])),
  );
  P('P').text('RAVEN', 'pc', t + d.lever.x + 4, fy(d.zP(d.lever.z + 22)), 0.36);

  // back: the theatre and its night, in a frame
  const K = P('K');
  K.engrave('frame', frame(20, fy(d.zP(70)), 106, fy(d.zP(20)), 2));
  K.text('THE PARAGON THEATRE', 'pc', 63, fy(d.zP(60)), 0.5);
  K.text('PORT ELLERY', 'pc', 63, fy(d.zP(50)), 0.5);
  K.text('HALLOWEEN NIGHT 1936', 'pc', 63, fy(d.zP(40)), 0.36);
  K.text('STAGE DOOR', 'pc', 63, fy(d.zP(30)), 0.36);

  // left: the playbill, a raven, a rose and a moon in a row, left to right
  const L = P('L');
  L.engrave('frame', frame(5, 12, 62, 60, 2));
  L.text('PLAYBILL', 'pc', 34, 20, 0.5);
  L.text("THE RAVEN'S BRIDE", 'pc', 34, 28, 0.36);
  L.text('PARAGON THEATRE', 'pc', 34, 34, 0.36);
  L.engrave('raven', [
    [
      [17, 38],
      [22, 47],
      [12, 47],
    ],
  ]);
  L.engrave('rose', [
    [
      [36, 38],
      [40, 43],
      [36, 48],
      [32, 43],
    ],
  ]);
  L.engraveRound('moon', 51, 43, 4);
  for (const [s, x] of [
    ['RAVEN', 17],
    ['ROSE', 36],
    ['MOON', 51],
  ] as const)
    L.text(s, 'pc', x, 53, 0.36);

  // right: the night in numbers
  const R = P('R');
  R.engrave('frame', frame(34, 10, 91, 60, 2));
  R.text('ONE NIGHT', 'pc', 62.5, 20, 0.4);
  R.text('FIVE PARTS', 'pc', 62.5, 30, 0.4);
  R.text('FIVE SUSPECTS', 'pc', 62.5, 40, 0.4);

  // lid: which pull is which (the playbill's order: the dagger is I)
  P('T').text('II ROSE', 'pc', 104, d.yD1 + t, 0.36);
  P('T').text('III MOON', 'pc', 104, d.yD2 + t, 0.36);

  // base: the game
  const B = P('B');
  B.text('FINAL CURTAIN', 'pc', 63, 30, 0.6);
  B.text('STAGE BOX', 'pc', 63, 44, 0.5);
  B.text('SANDBOX SOFTWARE', 'pc', 63, 56, 0.36);
  B.text('1994', 'pc', 63, 64, 0.36);

  // the curtains and the backdrop, as seen from the front
  const top = d.pull.top;
  P('D1').engrave(
    'folds',
    Array.from({ length: 12 }, (_, k) => quad([4 + 4.4 * k, top - 76, 6.2 + 4.4 * k, top - 32])),
  );
  const dia: Pt[][] = [];
  for (let r = 0; r < 5; r++)
    for (let c = 0; c < 6; c++) {
      const x = 7 + 8 * c + (r % 2 ? 4 : 0);
      if (x + 3.4 > 56) continue;
      const y = top - (38 + 8 * r);
      dia.push([
        [x, y - 3.4],
        [x + 3.4, y],
        [x, y + 3.4],
        [x - 3.4, y],
      ]);
    }
  P('D2').engrave('diamonds', dia);
  const W = P('W');
  const wy = (z: number) => d.ceilZ - z;
  const gx = t + 75;
  W.engrave('ghost light', [quad([gx - 3, wy(34.5), gx + 3, wy(32.5)]), quad([gx - 1.1, wy(47.5), gx + 1.1, wy(34.5)])]);
  W.engraveRound('lamp', gx, wy(55), 4);
  W.text('2 AM', 'pc', gx, wy(64), 0.36);

  // the lever
  const { u, v } = axis(d.lever.half);
  const rot = (a0: number, a1: number, b0: number, b1: number, o: Pt): Pt[] =>
    [
      [a0, b0],
      [a1, b0],
      [a1, b1],
      [a0, b1],
    ].map(([a, b]) => [o[0] + a * u[0] + b * v[0], o[1] + a * u[1] + b * v[1]] as Pt);
  const o = parts.DAGGER.frame!;
  P('DAGGER').engrave('grip', [rot(7.5, 9, -1.6, 1.6, o), rot(10.5, 12, -1.6, 1.6, o)]);
  P('DAGGER').engrave('fuller', [rot(21, 32, -0.8, 0.8, o)]);

  // the drawer
  const dr = d.drawer;
  P('DK').text('TRAP ROOM', 'pc', 36, 9, 0.36);
  P('DB').text('THE DAGGER WAS REAL.', 'pc', dr.w / 2, 20, 0.5);
  P('DB').text('THE KILLER IS STILL', 'pc', dr.w / 2, 34, 0.5);
  P('DB').text('IN THE THEATER.', 'pc', dr.w / 2, 42, 0.5);
}
