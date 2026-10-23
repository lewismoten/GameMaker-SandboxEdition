// The places on the world map, painted as little three-quarter-view models over the ground and
// cut into blocks: Nowish's cottages, Laterburg castle, Someday Harbor and its lighthouse,
// Eventually Falls, Deadline Keep, the causeway post with THE CHEZ, the Barrows' cave mouth.
import { Canvas, type RGB, mix, clamp01 } from '../art/rgb';
import { house, tower, wallRun, shadow, STYLE } from '../art/buildings';
import { grass, rock, cliff, shapeSdf, TL, TR, paintTile, dirt } from '../art/terrain';
import { ALL, type BlockBook } from './book';
import { chezSideOn } from '../sprites/chezCar';

type Painter = (cv: Canvas) => void;

/** A w x h block picture over grass, cut into blocks `${name}:${x},${y}`; `walk` lists walkable blocks (default all). */
function cut(book: BlockBook, name: string, w: number, h: number, paint: Painter, walk?: [number, number][], base?: (x: number, y: number) => RGB): void {
  const cv = new Canvas(w * 20, h * 20).shade(base ?? ((x, y) => grass(x, y)), 2);
  paint(cv);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const solid = walk && !walk.some(([a, b]) => a === x && b === y);
      book.add(`${name}:${x},${y}`, cv.crop(x * 20, y * 20, 20, 20), solid ? { solid: ALL } : {});
    }
}

const path = (cv: Canvas, pts: [number, number][], w = 3) => {
  for (let i = 1; i < pts.length; i++) cv.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], w, (x, y) => dirt(x, y, 3));
};

export function worldFeatures(book: BlockBook): void {
  // Nowish: three cottages, a well and a path down to the road
  cut(
    book,
    'nowish',
    2,
    2,
    (cv) => {
      path(cv, [
        [20, 40],
        [20, 30],
        [12, 24],
      ]);
      path(cv, [
        [20, 30],
        [29, 25],
      ]);
      house(cv, 2, 4, 14, 14, STYLE.thatch, 1);
      house(cv, 23, 2, 14, 13, STYLE.thatch, 2);
      house(cv, 24, 22, 13, 12, STYLE.greenTile, 3);
      cv.disc(10, 31, 3.4, [70, 70, 76]);
      cv.disc(10, 31, 2.2, [24, 40, 70]);
      cv.line(7, 27, 13, 27, 0.9, [96, 62, 34]);
    },
    [
      [0, 1],
      [1, 1],
    ],
  );
  // Laterburg castle: a curtain wall, four towers, the keep and its blue roofs, a gate
  cut(
    book,
    'laterburg',
    3,
    3,
    (cv) => {
      const stone: RGB[] = [
        [92, 88, 96],
        [150, 146, 150],
        [204, 200, 198],
      ];
      const blue: RGB[] = [
        [30, 44, 96],
        [52, 78, 150],
        [110, 146, 210],
      ];
      shadow(cv, 6, 10, 48, 44, 0.4);
      cv.rect(8, 12, 44, 40, (_x, y) => mix([120, 160, 80], [150, 186, 98], clamp01((y - 12) / 40)));
      wallRun(cv, 8, 10, 44, 6, stone, 1);
      wallRun(cv, 6, 12, 5, 40, stone, 2);
      wallRun(cv, 49, 12, 5, 40, stone, 3);
      // the keep
      cv.rect(20, 14, 20, 20, (x, y) => mix(stone[1], stone[2], clamp01(1 - (x - 20) / 30 - (y - 14) / 60)));
      house(cv, 19, 8, 22, 22, { ...STYLE.blueSlate, roof: blue, wall: stone, windows: 2 }, 5);
      tower(cv, 30, 7, 4, 9, stone, blue, 4); // the spire's tip whole inside the picture
      // the front wall and its gate
      wallRun(cv, 6, 44, 48, 9, stone, 6);
      cv.rect(25, 46, 10, 9, [40, 30, 26]);
      cv.rrect(26, 45, 8, 10, 3, [28, 20, 18]);
      for (let k = 27; k < 34; k += 1.6) cv.line(k, 46, k, 54, 0.5, [120, 110, 100]);
      for (const [x, y] of [
        [7, 8],
        [53, 8],
        [7, 42],
        [53, 42],
      ])
        tower(cv, x, y, 5, 13, stone, blue, x + y);
      // pennants
      for (const x of [22, 38]) {
        cv.line(x, 44, x, 39, 0.6, [60, 50, 40]);
        cv.poly(
          [
            [x, 39],
            [x + 4, 40],
            [x, 41.5],
          ],
          [210, 50, 40],
        );
      }
      path(cv, [
        [30, 55],
        [30, 60],
      ], 7);
    },
    [[1, 2]],
  );
  // Someday Harbor: a lighthouse, red roofs, a jetty
  cut(
    book,
    'harbor',
    3,
    2,
    (cv) => {
      path(cv, [
        [30, 40],
        [30, 26],
        [18, 22],
      ]);
      house(cv, 22, 2, 16, 14, STYLE.redTile, 7);
      house(cv, 42, 4, 15, 13, STYLE.redTile, 8);
      house(cv, 36, 22, 14, 12, STYLE.blueSlate, 9);
      // the lighthouse: white with red bands and a lamp room
      const w: RGB[] = [
        [150, 150, 160],
        [220, 220, 226],
        [255, 255, 255],
      ];
      tower(cv, 9, 8, 4.5, 22, w, [[120, 30, 26], [180, 50, 40], [230, 100, 80]], 11);
      for (const y of [16, 24]) cv.rect(4.5, y, 9, 2.4, [190, 50, 40]);
      cv.rect(6, 11, 6, 3, [255, 236, 140]);
      // nets drying on poles
      cv.line(48, 26, 48, 34, 0.8, [100, 70, 40]);
      cv.line(56, 26, 56, 34, 0.8, [100, 70, 40]);
      for (let k = 0; k < 4; k++) cv.line(48, 27 + k * 2, 56, 27 + k * 2, 0.4, [70, 60, 50]);
    },
    [
      [1, 1],
      [0, 1],
      [2, 1],
    ],
  );
  // Eventually Falls: houses round a waterwheel
  cut(
    book,
    'falls',
    2,
    2,
    (cv) => {
      path(cv, [
        [20, 40],
        [20, 26],
      ]);
      house(cv, 2, 3, 15, 13, STYLE.greenTile, 12);
      house(cv, 22, 6, 15, 12, STYLE.thatch, 13);
      house(cv, 3, 22, 12, 11, STYLE.redTile, 14);
      // the waterwheel
      cv.disc(30, 29, 6, [96, 62, 34]);
      cv.disc(30, 29, 4.4, [60, 120, 150]);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        cv.line(30, 29, 30 + Math.cos(a) * 6, 29 + Math.sin(a) * 6, 0.9, [140, 96, 54]);
      }
      cv.disc(30, 29, 1.2, [60, 40, 24]);
    },
    [
      [0, 1],
      [1, 1],
    ],
  );
  // Deadline Keep: black stone, red windows, every clock in it stopped
  cut(
    book,
    'keep',
    3,
    3,
    (cv) => {
      cv.shade((x, y) => mix(grass(x, y), [30, 34, 30], 0.55), 1);
      const st: RGB[] = [
        [30, 26, 40],
        [62, 56, 78],
        [104, 96, 124],
      ];
      const roof: RGB[] = [
        [40, 14, 30],
        [80, 24, 50],
        [130, 50, 80],
      ];
      wallRun(cv, 8, 20, 44, 32, st, 21);
      tower(cv, 30, 12, 7, 20, st, roof, 22); // the spire's tip whole inside the picture
      tower(cv, 10, 10, 5, 26, st, roof, 23);
      tower(cv, 50, 10, 5, 26, st, roof, 24);
      for (const [x, y] of [
        [17, 32],
        [41, 32],
        [29, 22],
        [31, 22],
      ])
        cv.rect(x, y, 2, 3, [236, 60, 40]);
      // the clock face over the gate, stopped at a minute to midnight
      cv.disc(30, 36, 4.2, [200, 190, 160]);
      cv.disc(30, 36, 3.4, [236, 228, 200]);
      cv.line(30, 36, 30, 33, 0.7, [20, 20, 20]);
      cv.line(30, 36, 29.4, 33.4, 0.5, [20, 20, 20]);
      cv.rrect(25, 44, 10, 10, 3, [14, 10, 16]);
      path(cv, [
        [30, 54],
        [30, 60],
      ], 6);
    },
    [[1, 2]],
  );
  // The east end of the causeway: a signpost and THE CHEZ, parked and plugged in
  cut(
    book,
    'post',
    2,
    1,
    (cv) => {
      cv.line(6, 19, 6, 6, 1.2, [90, 60, 34]);
      cv.rect(1, 5, 13, 4, [176, 136, 80]);
      cv.rect(1, 9.5, 13, 3, [156, 116, 66]);
      chez(cv, 22, 4);
    },
    [
      [0, 0],
      [1, 0],
    ],
  );
  // The Snooze Barrows' mouth, cut into the cliff of the northern hills
  cut(
    book,
    'cave',
    1,
    1,
    (cv) => {
      cv.fillSdf(
        (x, y) => Math.max(Math.hypot((x - 10) / 6, (y - 13) / 7) - 1, -(y - 7)) * 6,
        (_x, y) => mix([10, 8, 12], [40, 32, 30], clamp01((y - 7) / 14)),
      );
      cv.line(3.5, 19, 4.5, 8, 1.4, [96, 64, 40]);
      cv.line(16.5, 19, 15.5, 8, 1.4, [96, 64, 40]);
      cv.line(3, 7.5, 17, 7.5, 1.6, [120, 80, 50]);
    },
    [[0, 0]],
    (x, y) => cliff(x, y, shapeSdf(TL | TR, x, y), 0, 1),
  );
  // The Putoff Mines' adit: timbers and a lantern hook in Mount Putoff's cliff
  cut(
    book,
    'mine',
    1,
    1,
    (cv) => {
      cv.rect(4, 7, 12, 13, [12, 10, 12]);
      cv.rect(3, 6, 2, 14, [120, 80, 46]).rect(15, 6, 2, 14, [120, 80, 46]);
      cv.rect(2, 5, 16, 2.4, [140, 96, 56]);
      cv.line(7, 19, 8.5, 12, 0.7, [80, 80, 90]).line(13, 19, 11.5, 12, 0.7, [80, 80, 90]);
      cv.disc(16, 9, 1.2, [255, 200, 80]);
    },
    [[0, 0]],
    (x, y) => cliff(x, y, shapeSdf(TL | TR, x, y), 0, 1),
  );
  void [rock, paintTile];
}

/** THE CHEZ: a 1976 1/2 CitiCar, the shared side view (games/kit/chez.ts) 18 wide, nose to the
 * left so the passenger side shows, plugged in at its charge port. */
export function chez(cv: Canvas, x: number, y: number, s = 1): void {
  cv.ellipse(x + 9 * s, y + 14.5 * s, 9 * s, 2.2 * s, [30, 36, 26]);
  const k = 0.45 * s;
  const port = chezSideOn(cv, x, y + 14.5 * s - 20 * k, 'left', k);
  // the charge cord from its port, rear passenger side
  cv.line(port.portX + 0.5, port.portY + 0.5, x + 19.5 * s, y + 12 * s, 0.7, [30, 30, 30]);
}
