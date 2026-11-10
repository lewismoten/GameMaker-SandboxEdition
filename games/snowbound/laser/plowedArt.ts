// Snowbound's Plowed Street box: the engraving. Every word is already in games/snowbound (about.json: the title, the blurb,
// the tagline, the $89, LaVale Mall; the street names Jamie, Gale and Bowden). No people are drawn. Shapes are convex,
// and nothing touches a cut or another element (the build checks).
import type { Pt } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';
import { Do, T, Wo, cellX, cellY, maze, MALL, START, plate } from './plowedDims';
import type { Parts } from './plowedParts';

const diamond = (cx: number, cy: number, r: number): Pt[] => [
  [cx, cy - r],
  [cx + r * 0.7, cy],
  [cx, cy + r],
  [cx - r * 0.7, cy],
];
const quad = (x0: number, y0: number, x1: number, y1: number): Pt[] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];
const octagon = (cx: number, cy: number, r: number): Pt[] =>
  Array.from({ length: 8 }, (_, i) => [cx + r * Math.cos(Math.PI / 8 + (i * Math.PI) / 4), cy + r * Math.sin(Math.PI / 8 + (i * Math.PI) / 4)] as Pt);

/** A plow truck facing left (24 x 11 mm): body, cab, a slanted blade and two wheels, one element. */
const plow = (x: number, y: number): Pt[][] => [
  quad(x + 6, y + 4, x + 24, y + 8.5),
  quad(x + 15, y, x + 23, y + 4),
  [
    [x, y + 1.5],
    [x + 3.5, y + 3],
    [x + 3.5, y + 9],
    [x, y + 9],
  ],
  octagon(x + 10, y + 9, 2),
  octagon(x + 20, y + 9, 2),
];

export function addArt(parts: Parts) {
  const P = (n: string) => parts[n].part;
  // --- the lid: two street maps, the title between them, the tagline below. Interior (X, Y) lands on the sheet at (X + T, Y + T).
  const lid = P('T');
  const at = (x: number, y: number): [number, number] => [x + T, y + T];
  for (const dy of [0, maze.dyTwin]) {
    const [hx, hy] = at(cellX(START[0]) - 24, cellY(START[1]) + dy);
    lid.text('HOME', 'pc', hx, hy, 0.36);
    const [mx, my] = at(cellX(MALL[0]) + 17, cellY(MALL[1]) + dy);
    lid.text('MALL', 'pc', mx, my, 0.36);
  }
  lid.text('SNOWBOUND', 'pc', ...at(68, 40.5), 0.62);
  lid.text('THE $89 SHOVEL', 'pc', ...at(68, 46), 0.36);
  lid.text('FORT ASHBY WV  DECEMBER 1992', 'pc', ...at(68, 82), 0.36);
  lid.text('EVERY DRIVEWAY IS A DOLLAR', 'pc', ...at(68, 87.5), 0.36);
  const [px, py] = at(8, 37);
  lid.engrave('plow truck', plow(px, py));
  lid.engrave(
    'snowflakes',
    [
      [112, 40],
      [121, 44],
      [116, 48.5],
    ].map(([x, y]) => diamond(...at(x, y), 2.6)),
  );

  // --- the walls, seen from outside: the three streets of the game
  const P1 = P('P');
  P1.text('THE $89 SHOVEL', 'pc', T + 38, 8, 0.36);
  P1.text('FORT ASHBY WV', 'pc', T + 102.5, 8, 0.36);
  P('K').text('GALE STREET', 'pc', Wo / 2, 24, 0.62);
  P('L').text('JAMIE STREET', 'pc', Do / 2, 24, 0.62);
  P('R').text('BOWDEN DRIVE', 'pc', Do / 2, 24, 0.62);

  // --- inside the drawer (the face that lies up on the sheet): the prize's note
  const db = P('DB');
  db.text('YOU MADE IT TO LAVALE MALL', 'pc', 60, 18, 0.5);
  db.text('GAME-MAKER IS $89', 'pc', 60, 30, 0.5);
  db.text('BUT ONLY UNTIL JANUARY', 'pc', 60, 42, 0.5);
  // --- the plate: a dot at each stem's spot
  const pl = P('PL');
  pl.engraveRound('stem spots', plate.q1[0], plate.q1[1], 0.8);
  pl.engraveRound('stem spots 2', plate.q2[0], plate.q2[1], 0.8);
}
