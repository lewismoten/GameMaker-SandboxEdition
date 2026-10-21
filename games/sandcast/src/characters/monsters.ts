// sandcast.mon: who walks, chases, scuttles and rolls, and what each becomes when beaten.
import { emptyMonster, newMonsterSet, type March, type Monster } from '../../../../web/src/formats/monster';
import { MB } from '../sprites/sprites';
import { MON } from '../rules';

const m = (name: string) => MB.id(name);

/** Orientations: 0 as drawn (facing right), 4 mirrored (left), 1 turned to face down, 3 up. */
const O = { right: 0, left: 4, down: 1, up: 3 };

/** A path from corners given as offsets from the start; the last corner should be [0, 0]. */
function path(corners: [number, number, number, number][]): March[] {
  return corners.map(([x, y, speed, orient]) => ({ x, y, pic: speed, orient }));
}

interface Spec {
  pics: [string, number][];
  power: number;
  thru?: boolean;
  towards?: number;
  end?: number;
  becomes?: number;
  score?: number;
  march?: [number, number, number, number][];
}

function make(s: Spec): Monster {
  const mon = emptyMonster();
  mon.used = 1;
  mon.power = s.power;
  mon.thru = s.thru === false ? 0 : 1;
  s.pics.forEach(([name, t], i) => (mon.pic[i] = [m(name), t]));
  mon.towards = s.towards ?? 0;
  mon.end = s.end ?? 0;
  mon.newmon = s.becomes ?? MON.none;
  mon.upscore = s.score ?? 0;
  if (s.march) path(s.march).forEach((c, i) => (mon.march[0][i] = c));
  return mon;
}

export function buildMonsters(): Monster[] {
  const set = newMonsterSet();
  const def = (n: number, s: Spec) => (set[n] = make(s));

  // Teddy's throws: they fly the way he last walked.
  def(MON.clod, {
    pics: [
      ['clod0', 2],
      ['clod1', 2],
    ],
    power: 60,
    towards: 9,
    end: 11,
    becomes: MON.puff,
  });
  def(MON.splash, {
    pics: [
      ['splash0', 2],
      ['splash1', 2],
    ],
    power: 150,
    towards: 8,
    end: 13,
  });
  def(MON.puff, {
    pics: [
      ['puff0', 2],
      ['puff1', 2],
      ['puff2', 3],
    ],
    power: 60,
    end: 7,
  });

  // Ants: born from anthills, they hurry toward you; marching columns patrol.
  def(MON.ant, {
    pics: [
      ['ant0', 3],
      ['ant1', 3],
    ],
    power: 10,
    towards: 1,
    end: 270,
    becomes: MON.puff,
    score: 25,
  });
  def(MON.antRow, {
    pics: [
      ['ant0', 2],
      ['ant1', 2],
    ],
    power: 10,
    becomes: MON.puff,
    score: 25,
    march: [
      [6, 0, 1, O.right],
      [0, 0, 1, O.left],
    ],
  });
  def(MON.antRowV, {
    pics: [
      ['ant0', 2],
      ['ant1', 2],
    ],
    power: 10,
    becomes: MON.puff,
    score: 25,
    march: [
      [0, 5, 1, O.down],
      [0, 0, 1, O.up],
    ],
  });

  // Beetles: armored enough to shrug off ants, not a good clod of sand.
  const beetle = {
    pics: [
      ['beetle0', 3],
      ['beetle1', 3],
    ] as [string, number][],
    power: 40,
    becomes: MON.beetleFlip,
    score: 50,
  };
  def(MON.beetleH, {
    ...beetle,
    march: [
      [5, 0, 2, O.right],
      [0, 0, 2, O.left],
    ],
  });
  def(MON.beetleV, {
    ...beetle,
    march: [
      [0, 5, 2, O.down],
      [0, 0, 2, O.up],
    ],
  });
  def(MON.beetleLoop, {
    ...beetle,
    march: [
      [4, 0, 2, O.right],
      [4, 4, 2, O.down],
      [0, 4, 2, O.left],
      [0, 0, 2, O.up],
    ],
  });
  def(MON.beetleChase, { ...beetle, towards: 1, end: 330 });
  def(MON.beetleFlip, { pics: [['beetleFlip', 40]], power: 60, end: 30 });

  // Crabs: only a splash of water flips them.
  const crab = {
    pics: [
      ['crab0', 3],
      ['crab1', 3],
    ] as [string, number][],
    power: 105,
    becomes: MON.crabFlip,
    score: 150,
  };
  def(MON.crabH, {
    ...crab,
    march: [
      [6, 0, 2, 0],
      [0, 0, 2, 0],
    ],
  });
  def(MON.crabV, {
    ...crab,
    march: [
      [0, 5, 2, 0],
      [0, 0, 2, 0],
    ],
  });
  def(MON.crabBox, {
    ...crab,
    march: [
      [5, 0, 2, 0],
      [5, 3, 2, 0],
      [0, 3, 2, 0],
      [0, 0, 2, 0],
    ],
  });
  def(MON.crabFlip, { pics: [['crabFlip', 50]], power: 150, end: 45 });

  // Gwin's patio: slobbery tennis balls roll out of her mouth as she snores, and
  // rope toys fly out of her toy box.
  def(MON.slobber, {
    pics: [
      ['slobber0', 4],
      ['slobber1', 4],
    ],
    power: 30,
    towards: 1,
    end: 200,
    becomes: MON.puff,
    score: 30,
  });
  def(MON.rope, {
    pics: [
      ['rope0', 3],
      ['rope1', 3],
    ],
    power: 120,
    towards: 128,
    end: 320,
    becomes: MON.puff,
    score: 60,
  });
  const paw = (side: 'L' | 'R') => {
    def(side === 'L' ? MON.pawL : MON.pawR, {
      pics: [
        [`paw${side}0`, 9],
        [`paw${side}1`, 9],
      ],
      power: 110,
      thru: false,
      becomes: side === 'L' ? MON.pawLAngry : MON.pawRAngry,
      score: 500,
    });
    def(side === 'L' ? MON.pawLAngry : MON.pawRAngry, {
      pics: [
        [`paw${side}Angry0`, 3],
        [`paw${side}Angry1`, 3],
      ],
      power: 110,
      thru: false,
      becomes: side === 'L' ? MON.pawLRetreat : MON.pawRRetreat,
      score: 1000,
    });
    def(side === 'L' ? MON.pawLRetreat : MON.pawRRetreat, {
      pics: [['pawWet', 4]],
      power: 250,
      thru: false,
      end: -1,
      march: [[0, -4, 1, 0]],
    });
  };
  paw('L');
  paw('R');
  def(MON.tail, {
    pics: [
      ['tail0', 4],
      ['tail1', 4],
    ],
    power: 250,
    thru: false,
    end: -2,
    march: [
      [5, 0, 2, 0],
      [0, 0, 2, 4],
    ],
  });

  // Teddy's tennis ball: strong enough to flip anything, and Gwin can never resist one.
  def(MON.ball, {
    pics: [
      ['ball0', 2],
      ['ball1', 2],
    ],
    power: 200,
    towards: 9,
    end: 16,
  });
  // The spin's whirl of sand stays where Teddy spun, for a moment.
  def(MON.whirl, {
    pics: [
      ['whirl0', 2],
      ['whirl1', 2],
    ],
    power: 45,
    end: 12,
  });

  // Gwin: too big to bowl over with sand or water, but a tennis ball... she has to have it.
  // Then she trots off, ball in mouth, to bury it somewhere.
  def(MON.gwinRoam, {
    pics: [
      ['gwin0', 6],
      ['gwin1', 6],
    ],
    power: 180,
    towards: 64,
    becomes: MON.gwinHappy,
    score: 100,
  });
  def(MON.gwinNap, {
    pics: [
      ['gwinNap0', 18],
      ['gwinNap1', 18],
    ],
    power: 180,
    thru: false,
    becomes: MON.gwinHappy,
    score: 100,
  });
  def(MON.gwinHappy, {
    pics: [
      ['gwinHappy0', 3],
      ['gwinHappy1', 3],
    ],
    power: 250,
    end: 54,
  });

  // Hose droplets fly from the nozzle and splash on whatever they hit.
  def(MON.droplet, { pics: [['droplet', 3]], power: 20, end: -1, march: [[9, 0, 4, 0]] });

  // Line noise from a dropped carrier, loose in the BBS.
  def(MON.gremlin, {
    pics: [
      ['gremlin0', 2],
      ['gremlin1', 2],
      ['gremlin2', 2],
    ],
    power: 40,
    towards: 64,
    becomes: MON.puff,
    score: 100,
  });
  return set;
}
