// The Dawdle Flats' files and scene: FLATS.BBL, FLATS.MAP, FLATS.MBL, FLATS.MON, driven in CHEZ.CHR.
import { serializeBlocks } from '../../../../web/src/formats/blocks';
import { SpriteSheet } from '../sprites/sheet';
import { addFx } from '../sprites/fx';
import { foePics } from '../sprites/foes';
import { dungeonFoePics } from '../sprites/dungeonFoes';
import { MonBook } from '../characters/monbook';
import { addChaser } from './foes';
import { flatsBook } from '../blocks/flatsSet';
import { flatsPlan } from '../levels/flats';
import { streetBridges, type Pt } from '../levels/plan';
import { buildArea } from './area';
import { cellHash } from '../levels/ground';
import { MON } from '../ids';
import type { SceneSpec } from '../game';
import type { AreaFile } from './world';

export function buildFlats(o: { west: { to: string; at: Pt }; east: { to: string; at: Pt } }): { files: AreaFile[]; scenes: SceneSpec[]; west: Pt; east: Pt } {
  const mb = new SpriteSheet('mbl');
  addFx(mb);
  const d = dungeonFoePics();
  const w = foePics();
  for (const k of ['0', '1', 'Hit']) mb.add(`crab${k}`, d.get(`crab${k}`)!, { hp: -8 });
  for (const k of ['0', '1', 'Hit']) mb.add(`slime${k}`, w.get(`slime${k}`)!, { hp: -5 });
  const mons = new MonBook(mb);
  addChaser(mons, 'crab', {
    pics: [
      ['crab0', 6],
      ['crab1', 6],
    ],
    hurt: [
      ['crabHit', 2],
      ['crab1', 2],
    ],
    power: 90,
    wander: 1,
    rush: 2,
    drop: MON.gem,
    score: 20,
    hits: 1,
  });
  addChaser(mons, 'slime', {
    pics: [
      ['slime0', 8],
      ['slime1', 8],
    ],
    hurt: [
      ['slimeHit', 2],
      ['slime1', 2],
    ],
    power: 90,
    wander: 1,
    rush: 1,
    drop: MON.heart,
    score: 10,
    hits: 1,
  });
  // crabs on patrol: they scuttle back and forth across the causeway on a beat you can read
  // (honk them off the road, or time the gap)
  mons.add(
    'patrol',
    {
      pics: [
        [mb.n('crab0'), 4],
        [mb.n('crab1'), 4],
      ],
      power: 90,
      path: [
        [0, 4, 1],
        [0, 0, 1],
      ],
      upscore: 20,
    },
    MON.gem,
  );
  const fp = flatsPlan(mons);
  const book = flatsBook(streetBridges(fp.plan.cm, 'road'));
  const area = buildArea({
    name: 'flats',
    plan: fp.plan,
    book,
    mons,
    layers: ['water', 'rock', 'road'],
    base: (x, y) => (cellHash(x, y, 5) < 0.12 ? 'mud1' : 'mud'),
    scenes: [
      {
        id: 'flats',
        desc: 'The Dawdle Flats',
        cmf: 'flats.cmf',
        owns: () => true,
        extra: [
          { from: fp.westExit, to: o.west.to, at: o.west.at },
          { from: fp.eastExit, to: o.east.to, at: o.east.at },
        ],
      },
    ],
    mbl: 'flats.mbl',
  });
  area.scenes[0].files.chr = 'chez.chr';
  return { files: [...area.files, { name: 'flats.mbl', bytes: serializeBlocks(mb.blocks) }], scenes: area.scenes, west: fp.west, east: fp.east };
}
