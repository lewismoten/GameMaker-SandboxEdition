// DEPTH.MON: how every monster moves and fights, and what touching its picture does.
//
// Game-Maker's rules: of two monsters that touch, the one with more power kills the other
// (equal powers ignore each other). A monster under power 100 dies when it touches Ray, after
// its picture's effects land; 100 and up stays (and hurts again every tick it touches). So
// the henchmen are all under 100: a wireframe that rolls into you costs light once and is
// rendered by the bump. Only Count Polygon (140) stays. A monster that dies is reborn as its newmon:
// a wireframe your ray hits becomes a crystal worth points, and Count Polygon loses faces.
// 'end' is a lifetime in ticks (-1: die at the end of the march, -2: never); 'towards' chases
// (1..63), flees (negative) or wanders (64 and up).
import { emptyMonster, newMonsterSet, type March, type Monster } from '../../../../web/src/formats/monster';
import type { Block } from '../../../../web/src/formats/blocks';
import { CROWN, MON } from '../ids';
import type { SpriteSet } from '../sprites/sprites';

const corner = (x: number, y: number, speed: number, orient = 0): March => ({ x, y, pic: speed, orient });

function mon(pics: [number, number][], o: Partial<Monster>, path: March[] = [], attack: March[] = []): Monster {
  const m = emptyMonster();
  m.used = 1;
  pics.forEach((p, i) => (m.pic[i] = p));
  Object.assign(m, o);
  path.forEach((c, i) => (m.march[0][i] = c));
  attack.forEach((c, i) => (m.march[1][i] = c));
  return m;
}

/** Power of Ray's shot: it renders wireframes (110), jaggies and bats, and hurts the Count. */
export const SHOT_POWER = 150;

/** A patrol back and forth: `run` blocks one way, then back. */
const patrol = (dx: number, dy: number, speed: number) => [corner(dx, dy, speed), corner(-dx, -dy, speed)];
/** A square walk (a friend strolling). */
const square = (w: number, h: number, speed: number) => [corner(w, 0, speed), corner(0, h, speed), corner(-w, 0, speed), corner(0, -h, speed)];

export function buildMonsters(sp: SpriteSet): Monster[] {
  const set = newMonsterSet();
  const m = sp.m;
  const anim = (name: string, n: number, t = 3): [number, number][] => Array.from({ length: n }, (_, f) => [m(`${name}${f}`), t]);
  set[MON.shot] = mon(anim('shot', 1, 4), { power: SHOT_POWER, thru: 1, towards: 9, end: 16, newmon: MON.pop });
  set[MON.pop] = mon(anim('pop', 3, 2), { power: 100, thru: 0, end: 6 });
  set[MON.wire] = mon(anim('wire', 4, 3), { power: 90, thru: 1, newmon: MON.crystal, upscore: 50 }, patrol(3, 0, 1));
  set[MON.wireH] = mon(anim('wire', 4, 3), { power: 90, thru: 1, newmon: MON.crystal, upscore: 50 }, patrol(6, 0, 2));
  set[MON.wireV] = mon(anim('wire', 4, 3), { power: 90, thru: 1, newmon: MON.crystal, upscore: 50 }, patrol(0, 3, 1));
  set[MON.crystal] = mon(anim('crystal', 2, 6), { power: 20, thru: 0, end: -2 });
  set[MON.jaggy] = mon(anim('jaggy', 2, 3), { power: 95, thru: 1, newmon: MON.pop, upscore: 75 }, patrol(4, 0, 2));
  set[MON.jaggyV] = mon(anim('jaggy', 2, 3), { power: 95, thru: 1, newmon: MON.pop, upscore: 75 }, patrol(0, 4, 2));
  set[MON.steam] = mon(anim('steam', 3, 5), { power: 60, thru: 1, towards: 2, end: 70, newmon: MON.pop });
  // the dark double: wanders until you come near, then rolls straight at you
  set[MON.mirror] = mon(
    anim('double', 4, 2),
    { power: 98, thru: 1, towards: 64 + 64, activate: 2, newmon: MON.pop, upscore: 150 },
    [],
    [corner(0, 0, 2), corner(0, 0, 2), corner(0, 0, 2)],
  );
  // friends: power 200, so shots and henchmen bounce off them; touching them helps
  set[MON.teddy] = mon(
    [
      [m('teddy0'), 4],
      [m('teddy1'), 4],
      [m('teddy0'), 4],
      [m('teddy1'), 4],
      [m('teddy2'), 10],
      [m('teddy3'), 6],
    ],
    { power: 200, thru: 1 },
    square(4, 2, 1),
  );
  set[MON.gwinn] = mon(
    [
      [m('gwinn0'), 5],
      [m('gwinn1'), 5],
      [m('gwinn2'), 12],
      [m('gwinn3'), 6],
    ],
    { power: 200, thru: 1 },
    square(3, 3, 1),
  );
  set[MON.leo] = mon(anim('leo', 2, 6), { power: 200, thru: 1 }, patrol(4, 0, 1));
  set[MON.bat] = mon(anim('bat', 2, 2), { power: 85, thru: 0, towards: 2, end: 120, newmon: MON.pop, upscore: 40 });
  // Count Polygon: each stage is killed by a shot and reborn with fewer faces
  const stages = [MON.count1, MON.count2, MON.count3, MON.count4, MON.count5];
  stages.forEach((id, s) => {
    const next = s < 4 ? stages[s + 1] : MON.crown;
    // he waits at the vanishing point until you come within reach, then glides at you
    const speed = s < 2 ? 1 : 2;
    set[id] = mon(
      anim(`count${s}_`, 2, 5),
      { power: 140, thru: 1, activate: 2, newmon: next, upscore: 500 + s * 250 },
      [corner(0, 0, 1)],
      [corner(0, 0, speed), corner(0, 0, speed), corner(0, 0, speed)],
    );
  });
  // the crown matches the shot's power, so a stray shot can't destroy it; it stays where it
  // fell, and touching it counts it (again and again: the gate only needs one)
  set[MON.crown] = mon(anim('crown', 2, 6), { power: SHOT_POWER, thru: 0, end: -2 });
  set[MON.shard] = mon(anim('shard', 2, 2), { power: 100, thru: 1, towards: 3, end: 60 });
  return set;
}

/** What touching each monster's picture does (on DEPTH.MBL's blocks). */
export function monsterTouches(sp: SpriteSet, mbl: Block[]): void {
  const each = (prefix: string, n: number, o: Partial<Block>) => {
    for (let f = 0; f < n; f++) Object.assign(mbl[sp.m(`${prefix}${f}`)], o);
  };
  each('wire', 4, { chHitPt: -15 });
  each('crystal', 2, { scorePts: 100 });
  each('jaggy', 2, { chHitPt: -20 });
  each('steam', 3, { chHitPt: -15 });
  each('double', 4, { chHitPt: -25 });
  each('teddy', 4, { chHitPt: 1 });
  each('gwinn', 4, { chHitPt: 1 });
  each('leo', 2, { chHitPt: 1 });
  each('bat', 2, { chHitPt: -15 });
  for (let s = 0; s < 5; s++) each(`count${s}_`, 2, { chHitPt: -6 });
  each('crown', 2, { effect: CROWN, eamt: 1 });
  each('shard', 2, { chHitPt: -15 });
}
