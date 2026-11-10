// Assembly poses in millimeters, using the kit builders' actual nominal cut shapes (zero kerf).
// Part.sheet adds a 2 mm layout pad; it is removed here, never used as material.
import { makeParts as plowedParts } from '../../../../games/snowbound/laser/plowedParts';
import { addArt } from '../../../../games/snowbound/laser/plowedArt';
import * as P from '../../../../games/snowbound/laser/plowedDims';
import { makeParts as cryptexParts } from '../../../../games/year2000/laser/cryptexParts';
import * as C from '../../../../games/year2000/laser/cryptexDims';
import type { Part } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';

export type V3 = [number, number, number];
export interface AssemblyPart {
  id: string;
  name: string;
  caption: string;
  cut: number[][][];
  art: number[][][];
  origin: V3;
  right: V3;
  down: V3;
  normal: V3;
  explode: V3;
}
export interface AssemblyModel {
  parts: AssemblyPart[];
  thickness: number;
}

/** Each physical slice, disc and panel gets exactly one step. */
export function assemblyModel(kind: 'plowed-street' | 'cryptex'): AssemblyModel {
  const parts: AssemblyPart[] = [];
  const stock = kind === 'plowed-street' ? plowedParts(0) : cryptexParts(0);
  if (kind === 'plowed-street') addArt(stock);
  const add = (name: string, origin: V3, caption: string, plane: 'flat' | 'front' | 'side' = 'flat', explode: V3 = [0, 0, 65]) => {
    const p: Part = stock[name].part;
    const loops = (op: 'cut' | 'engrave') =>
      p.sheet.items
        .filter((i) => i.op === op)
        .map((i) => {
          if (i.k === 'poly') return i.pts.map(([x, y]) => [x - 2, y - 2]);
          const r = i.k === 'ring' ? i.r1 : i.r;
          return Array.from({ length: 120 }, (_, j) => [i.cx - 2 + r * Math.cos((j * Math.PI) / 60), i.cy - 2 + r * Math.sin((j * Math.PI) / 60)]);
        });
    parts.push({
      id: `${name}-${parts.filter((p) => p.name === name).length + 1}`,
      name,
      caption,
      cut: loops('cut'),
      art: loops('engrave'),
      origin,
      right: plane === 'side' ? [0, 1, 0] : [1, 0, 0],
      down: plane === 'flat' ? [0, 1, 0] : [0, 0, -1],
      normal: plane === 'flat' ? [0, 0, 1] : plane === 'front' ? [0, 1, 0] : [1, 0, 0],
      explode,
    });
  };
  if (kind === 'cryptex') {
    const center = C.BASE / 2;
    const disc = (name: string, z: number, caption: string) => {
      const p = stock[name].part;
      add(name, [center - p.w / 2, center - p.h / 2, z], caption, 'flat', [0, 0, 35 + parts.length * 3]);
    };
    add('BASE', [0, 0, 0], 'Glue the four PK plates on BASE, one on another, their ridge slots lined up and on the side of the marker (right).');
    for (let i = 0; i < 4; i++)
      disc('PK', 3 + i * 3, 'Glue the four PK plates on BASE, one on another, their ridge slots lined up and on the side of the marker (right).');
    for (let i = 0; i < 12; i++)
      disc(
        i === 0 ? 'CORE0' : i < 3 ? 'CORER' : 'COREC',
        3 + i * 3,
        'Glue 12 slices: the closed one at the bottom, then the two ridge slices (ridges lined up), then nine round ones. No glue in the hole.',
      );
    for (let k = 3; k >= 0; k--) {
      const z = 15 + (3 - k) * 6;
      for (const [j, side] of ['B', 'T'].entries())
        disc(
          `R${k + 1}${side}`,
          z + j * 3,
          'Glue each ring: the T slice (digits) over its plain B slice, the holes lined up. Ring 1 is the smallest. No glue on the washers.',
        );
      for (let j = 0; j < 2; j++)
        disc(
          'WASH',
          z + j * 3,
          'Glue the eight washers in pairs: four, each 6 mm thick. Keep glue out of the bore and the notch. They stay loose in the rings.',
        );
      // Ring 1's digit 2 points to the marker with all notches aligned to the core's ridge.
      if (k === 0)
        for (const p of parts.slice(-4, -2)) {
          const a = (-C.COMBO[k] * C.STEP * Math.PI) / 180;
          const turn = ([x, y]: number[]) => [
            center + (x - center) * Math.cos(a) - (y - center) * Math.sin(a),
            center + (x - center) * Math.sin(a) + (y - center) * Math.cos(a),
          ];
          const o = turn(p.origin);
          p.origin = [o[0], o[1], p.origin[2]];
          p.right = [Math.cos(a), Math.sin(a), 0];
          p.down = [-Math.sin(a), Math.cos(a), 0];
        }
    }
    disc('HEAD', 39, 'Glue the head on the core, on top of the rings.');
    for (let i = 0; i < 2; i++) disc('LIDP', 36 + i * 3, 'Glue two plugs under the lid. Roll a note and slip it in the core; press the lid in.');
    disc('LID', 42, 'Glue two plugs under the lid. Roll a note and slip it in the core; press the lid in.');
  } else {
    const box = 'Glue P, K, L, R to B (finger joints). Leave the lid off. P is the front, with the drawer opening; T goes on last.';
    add('B', [0, 0, -3], box);
    add('K', [0, 0, P.Ho - 3], box, 'front', [0, -60, 0]);
    add('L', [0, 0, P.Ho - 3], box, 'side', [-65, 0, 0]);
    // R is drawn from outside: its sheet's x runs front to back.
    add('R', [P.Wo, P.Do, P.Ho - 3], box, 'side', [65, 0, 0]);
    Object.assign(parts.at(-1)!, { right: [0, -1, 0], normal: [-1, 0, 0] });
    add('P', [0, P.Do - 3, P.Ho - 3], box, 'front', [0, 65, 0]);
    add('F', [0, 3, P.zShelf[0]], 'Drop F into the wall slots (no glue yet).');
    const px = 3 + P.cellX(0) - P.plate.q1[0];
    const py = 3 + P.cellY(0) - P.plate.q1[1];
    add('PL', [px, py, P.zShelf[1]], 'PL rests loose on F: never glue it. The channel in PL faces the front.');
    for (const q of [P.plate.q1, P.plate.q2])
      for (let j = 0; j < 2; j++)
        add('STEM', [px + q[0] - 2.5, py + q[1] - 2.5, 32 + j * 3], 'Glue two STEM discs on each dot on PL, one on top of the other.');
    for (const x of [11, 119]) add('RAIL', [x, 40, 0], 'Glue the two RAILs on the base under the sides.');
    const d = P.drawer;
    const x = 3 + d.x0,
      y = P.Do - d.len,
      z = d.z0;
    const cap = 'Glue the five panels. DK, the one with the tab on top, goes at the back, tab up.';
    add('DB', [x, y, z], cap, 'flat', [0, 110, 10]);
    add('DK', [x, y, P.lug.top], cap, 'front', [0, 100, 20]);
    add('DL', [x, y, z + d.h], cap, 'side', [-40, 100, 0]);
    add('DR', [x + d.w - 3, y, z + d.h], cap, 'side', [40, 100, 0]);
    add(
      'DF',
      [x, P.Do - 3, z + d.h],
      'Slide the drawer in. The tab must pass through F’s slot and stand inside PL’s bay. Pull it out and in; it should move freely.',
      'front',
      [0, 140, 0],
    );
    add('T', [0, 0, P.Hi], 'Set T on, with both stems in their streets.');
    for (const q of [P.plate.q1, P.plate.q2])
      add('CAP', [px + q[0] - 7, py + q[1] - 7, 38], 'Glue CAPs on the stems above T. Then glue T. Slide the plow to HOME, then to LaVale Mall.');
  }
  return { parts, thickness: 3 };
}

/** A step only moves its own part; completed parts stay seated and later ones stay exploded. */
export function offsetAt(part: AssemblyPart, index: number, step: number): V3 {
  const progress = Math.max(0, Math.min(1, step - index));
  return part.explode.map((v) => v * (1 - progress)) as V3;
}
