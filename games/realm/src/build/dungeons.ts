// The dungeons' files and scenes: a block set, a monster block set, monsters and a map each.
// Every foe in a dungeon has the same power as its boss (so they never fight each other), and
// that power says which sword gets through: wood (130) for the Barrows, steel (160) after that.
import { serializeBlocks } from '../../../../web/src/formats/blocks';
import { LASTMON } from '../../../../web/src/formats/monster';
import { SpriteSheet } from '../sprites/sheet';
import { addFx } from '../sprites/fx';
import { foePics } from '../sprites/foes';
import { dungeonFoePics, bossPics, type BossName } from '../sprites/dungeonFoes';
import { MonBook } from '../characters/monbook';
import { addChaser } from './foes';
import { dungeonBook, type Theme } from '../blocks/dungeonSet';
import { barrowsPlan, vaultsPlan, minesPlan, keepPlan, type DungeonPlan } from '../levels/dungeons';
import { buildArea } from './area';
import { cellHash } from '../levels/ground';
import { MON } from '../ids';
import { ALL } from '../blocks/book';
import type { LinkSpec, SceneSpec } from '../game';
import type { Pt } from '../levels/plan';
import type { AreaFile } from './world';

interface Spec {
  theme: Theme;
  desc: string;
  /** The foes' power (under 100: a bite costs them a hit) and the boss's (100 and up). */
  power: number;
  bossPower: number;
  bite: number;
  boss: BossName;
  bossHits: number;
  shot: string;
  foes: { name: string; wander: number; rush: number; hits: number; thru?: number; path?: [number, number, number][] }[];
  plan: (m: MonBook) => DungeonPlan;
  piece: string;
}

const SPECS: Spec[] = [
  {
    theme: 'barrows',
    desc: 'The Snooze Barrows',
    power: 90,
    bossPower: 120,
    bite: -6,
    boss: 'snoozalot',
    bossHits: 3,
    shot: 'zzz',
    foes: [
      { name: 'slime', wander: 1, rush: 1, hits: 2 },
      { name: 'bat', wander: 2, rush: 2, hits: 1 },
      { name: 'wight', wander: 1, rush: 1, hits: 2, thru: 0 },
    ],
    plan: barrowsPlan,
    piece: 'piece1',
  },
  {
    theme: 'vaults',
    desc: 'The Soggy Vaults',
    power: 95,
    bossPower: 140,
    bite: -6,
    boss: 'kraken',
    bossHits: 3,
    shot: 'spark',
    foes: [
      { name: 'crab', wander: 1, rush: 2, hits: 2 },
      {
        name: 'eel',
        wander: 0,
        rush: 0,
        hits: 2,
        thru: 0,
        path: [
          [3, 0, 1],
          [0, 0, 1],
        ],
      },
    ],
    plan: vaultsPlan,
    piece: 'piece2',
  },
  {
    theme: 'mines',
    desc: 'The Putoff Mines',
    power: 97,
    bossPower: 150,
    bite: -8,
    boss: 'ticktock',
    bossHits: 4,
    shot: 'ember',
    foes: [
      { name: 'golem', wander: 1, rush: 1, hits: 3 },
      { name: 'bat', wander: 2, rush: 2, hits: 1 },
    ],
    plan: minesPlan,
    piece: 'piece3',
  },
  {
    theme: 'keep',
    desc: 'Deadline Keep',
    power: 98,
    bossPower: 155,
    bite: -8,
    boss: 'deadline',
    bossHits: 5,
    shot: 'minute',
    foes: [
      { name: 'goblin', wander: 2, rush: 2, hits: 2 },
      { name: 'tick', wander: 3, rush: 3, hits: 1 },
    ],
    plan: keepPlan,
    piece: 'won',
  },
];

/** Where each dungeon's stairs come out, and where you come in from. */
export interface DungeonDoors {
  /** Scene and block the stairs lead back to. */
  out: Record<Theme, { to: string; at: Pt }>;
}

export function buildDungeons(doors: DungeonDoors): { files: AreaFile[]; scenes: SceneSpec[]; starts: Record<Theme, Pt> } {
  const files: AreaFile[] = [];
  const scenes: SceneSpec[] = [];
  const starts = {} as Record<Theme, Pt>;
  const small = { ...foePics(), ...{} };
  void small;
  const world = foePics();
  const dfoes = dungeonFoePics();
  for (const s of SPECS) {
    const mb = new SpriteSheet('mbl');
    addFx(mb);
    for (const f of s.foes)
      for (const k of ['0', '1', 'Hit']) mb.add(`${f.name}${k}`, (dfoes.get(`${f.name}${k}`) ?? world.get(`${f.name}${k}`))!, { hp: s.bite });
    mb.add(s.shot, dfoes.get(s.shot)!, { hp: -6 });
    for (const [n, pic] of bossPics(s.boss)) mb.add(n, pic, { hp: -1, solid: ALL });
    const mons = new MonBook(mb);
    for (const f of s.foes) {
      if (f.path) {
        // a path walker (eels leaping across their pool)
        const p = (l: [string, number][]) => l.map(([b, t]) => [mb.n(b), t] as [number, number]);
        let next: number = MON.gem;
        for (let k = f.hits - 1; k >= 1; k--)
          next = mons.add(
            `${f.name}${k}`,
            {
              pics: p([
                [`${f.name}Hit`, 2],
                [`${f.name}1`, 2],
              ]),
              power: s.power,
              thru: f.thru ?? 1,
              path: f.path,
            },
            next,
          );
        mons.add(
          f.name,
          {
            pics: p([
              [`${f.name}0`, 6],
              [`${f.name}1`, 6],
            ]),
            power: s.power,
            thru: f.thru ?? 1,
            path: f.path,
            upscore: 25,
          },
          next,
        );
      } else {
        const id = addChaser(mons, f.name, {
          pics: [
            [`${f.name}0`, 6],
            [`${f.name}1`, 6],
          ],
          hurt: [
            [`${f.name}Hit`, 2],
            [`${f.name}1`, 2],
          ],
          power: s.power,
          wander: f.wander,
          rush: f.rush,
          drop: f.hits > 1 ? MON.bigGem : MON.gem,
          score: 25,
          hits: f.hits,
        });
        if (f.thru !== undefined) for (let k = 0; k < f.hits; k++) mons.mons[k === 0 ? id : mons.n(`${f.name}${k}`)].thru = f.thru;
      }
    }
    const shot = mons.add(s.shot, { pics: [[mb.n(s.shot), 99]], power: s.power, towards: 2, end: 70 });
    // the boss: four parts, each a chain of hits ending in nothing
    for (const q of ['TL', 'TR', 'BL', 'BR']) {
      let next: number = LASTMON;
      const base = `${s.boss}${q}`;
      for (let k = s.bossHits - 1; k >= 1; k--)
        next = mons.add(
          `${base}${k}`,
          {
            pics: [
              [mb.n(`${base}Hit`), 2],
              [mb.n(base), 3],
            ],
            power: s.bossPower,
            upscore: 100,
          },
          next,
        );
      mons.add(base, { pics: [[mb.n(base), 99]], power: s.bossPower, upscore: 100 }, next);
    }
    const dp = s.plan(mons);
    const book = dungeonBook(s.theme);
    book.setAttrs('vent', { birthMon: shot, birthTime: 80 });
    const out = doors.out[s.theme];
    if (s.piece === 'won') dp.plan.link(dp.piece, 'won', [0, 0]);
    else dp.plan.link(dp.piece, s.piece, dp.start);
    const extra: LinkSpec[] = dp.exits.map((e) => ({ from: e, to: out.to, at: out.at }));
    const area = buildArea({
      name: s.theme,
      plan: dp.plan,
      book,
      mons,
      layers: ['wall', 'pool'],
      base: (x, y) => {
        const h = cellHash(x, y, 9);
        return h < 0.4 ? 'floor1' : 'floor';
      },
      scenes: [{ id: s.theme, desc: s.desc, owns: () => true, extra, cmf: s.theme === 'keep' ? 'keep.cmf' : 'dungeon.cmf' }],
      mbl: `${s.theme}.mbl`,
    });
    files.push(...area.files, { name: `${s.theme}.mbl`, bytes: serializeBlocks(mb.blocks) });
    scenes.push(...area.scenes);
    starts[s.theme] = dp.start;
  }
  return { files, scenes, starts };
}
