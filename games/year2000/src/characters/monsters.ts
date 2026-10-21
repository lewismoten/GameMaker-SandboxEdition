// Y2K.MON: who mows, chases, honks and hugs. One list for every level.
import { emptyMonster, newMonsterSet, type Monster } from '../../../../web/src/formats/monster';
import type { BlockSet } from '../blocks/book';
import { MON } from '../ids';

/** Orientations: 0 as drawn (facing right), 4 mirrored (left). */
const O = { right: 0, left: 4 };

interface Spec {
  pics: [string, number][];
  power: number;
  thru?: boolean;
  towards?: number;
  end?: number;
  becomes?: number;
  score?: number;
  /** Corners as offsets from the start [x, y, speed, orient]; end a loop with [0, 0, ...]. */
  march?: [number, number, number, number][];
}

/** Random wandering at `speed` (Game-Maker reads speed from towards >> 6). */
const RANDOM = (speed: number) => speed * 64;

export function buildMonsters(mb: BlockSet): Monster[] {
  const set = newMonsterSet();
  const def = (n: number, s: Spec) => {
    const mon = emptyMonster();
    mon.used = 1;
    mon.power = s.power;
    mon.thru = s.thru === false ? 0 : 1;
    s.pics.forEach(([name, t], i) => (mon.pic[i] = [mb.id(name), t]));
    mon.towards = s.towards ?? 0;
    mon.end = s.end ?? 0;
    mon.newmon = s.becomes ?? MON.none;
    mon.upscore = s.score ?? 0;
    s.march?.forEach(([x, y, pic, orient], i) => (mon.march[0][i] = { x, y, pic, orient }));
    set[n] = mon;
  };
  const anim = (name: string, t = 3): [string, number][] => [
    [`${name}0`, t],
    [`${name}1`, t],
  ];
  const back = (dx: number, dy: number, speed: number): [number, number, number, number][] => [
    [dx, dy, speed, dx < 0 ? O.left : O.right],
    [0, 0, speed, dx < 0 ? O.right : O.left],
  ];
  // Zappable robots are tougher than a bump (power 100+) but weaker than a zap (150).
  const ROBOT = 120;
  // Chasers short-circuit when they bump into Dex (power under 100): one hit and done.
  const CHASER = 90;

  def(MON.zap, { pics: anim('zap', 2), power: 150, towards: 9, end: 12, becomes: MON.pop });
  def(MON.pop, { pics: anim('pop', 2), power: 100, end: 6 });

  def(MON.mowerH, { pics: anim('mower', 2), power: ROBOT, becomes: MON.pop, score: 100, march: back(5, 0, 2) });
  def(MON.mowerV, { pics: anim('mower', 2), power: ROBOT, becomes: MON.pop, score: 100, march: back(0, 4, 2) });
  def(MON.mowerBox, {
    pics: anim('mower', 2),
    power: ROBOT,
    becomes: MON.pop,
    score: 100,
    end: 900,
    march: [
      [0, 3, 2, 0],
      [4, 3, 2, 0],
      [4, 0, 2, 0],
      [0, 0, 2, 0],
    ],
  });
  def(MON.dog, { pics: anim('dog', 3), power: CHASER, towards: 2, becomes: MON.pop, score: 150 });
  def(MON.paper, { pics: anim('paper', 2), power: 60, thru: false, end: -1, march: [[0, 9, 5, 0]] });
  def(MON.paperbot, { pics: anim('paperbot', 3), power: ROBOT, becomes: MON.pop, score: 150, march: back(6, 0, 3) });
  def(MON.alien, { pics: anim('alien', 6), power: 50, towards: RANDOM(1), becomes: MON.beam });
  def(MON.alien2, { pics: anim('alien2', 5), power: 50, towards: RANDOM(1), becomes: MON.beam });
  def(MON.beam, { pics: anim('beam', 2), power: 100, end: 16 });

  // Hover cars come out of the tunnels and fly their lane, 30 blocks.
  const lane = (speed: number, dir: 1 | -1): [number, number, number, number][] => [[30 * dir, 0, speed, dir > 0 ? O.right : O.left]];
  def(MON.carR, { pics: anim('carR', 2), power: 250, thru: false, end: -1, march: lane(4, 1) });
  def(MON.carL, { pics: anim('carR', 2), power: 250, thru: false, end: -1, march: lane(4, -1) });
  def(MON.fastR, { pics: anim('carT', 1), power: 250, thru: false, end: -1, march: lane(7, 1) });
  def(MON.fastL, { pics: anim('carT', 1), power: 250, thru: false, end: -1, march: lane(7, -1) });
  def(MON.truckR, { pics: anim('truck', 3), power: 250, thru: false, end: -1, march: lane(3, 1) });
  def(MON.truckL, { pics: anim('truck', 3), power: 250, thru: false, end: -1, march: lane(3, -1) });
  def(MON.faxbot, { pics: anim('faxbot', 2), power: CHASER, towards: RANDOM(2), becomes: MON.pop, score: 150 });

  def(MON.secbot, { pics: anim('secbot', 4), power: CHASER, towards: 2, end: 500, becomes: MON.pop, score: 200 });
  def(MON.secbotPatrol, {
    pics: anim('secbot', 4),
    power: CHASER,
    becomes: MON.pop,
    score: 200,
    march: [
      [5, 0, 2, 0],
      [5, 4, 2, 0],
      [0, 4, 2, 0],
      [0, 0, 2, 0],
    ],
  });
  def(MON.cart, { pics: anim('cart', 2), power: ROBOT, becomes: MON.pop, score: 100, march: back(7, 0, 4) });
  def(MON.cartV, { pics: anim('cart', 2), power: ROBOT, becomes: MON.pop, score: 100, march: back(0, 6, 4) });
  def(MON.shopper, { pics: anim('shopper', 5), power: CHASER, towards: RANDOM(1), becomes: MON.pop, score: 100 });
  def(MON.skater, { pics: anim('skater', 2), power: 250, march: back(8, 0, 5) });
  def(MON.skaterV, { pics: anim('skater', 2), power: 250, march: back(0, 6, 5) });

  def(MON.telemarketer, { pics: anim('tele', 4), power: CHASER, towards: 2, becomes: MON.pop, score: 200 });
  def(MON.static, { pics: anim('static', 1), power: CHASER, towards: RANDOM(2), becomes: MON.pop, score: 150 });
  def(MON.fish, { pics: anim('fish', 4), power: ROBOT, becomes: MON.pop, score: 100, march: back(5, 0, 2) });
  def(MON.fishV, { pics: anim('fish', 4), power: ROBOT, becomes: MON.pop, score: 100, march: back(0, 4, 2) });
  def(MON.dino, { pics: anim('dino', 4), power: 250, march: back(6, 0, 3) });
  def(MON.dinoV, { pics: anim('dino', 4), power: 250, march: back(0, 5, 3) });
  def(MON.grandma, { pics: anim('grandma', 8), power: 50, becomes: MON.beam });

  def(MON.meteor, { pics: anim('meteor', 2), power: 90, thru: false, end: -1, becomes: MON.boom, march: [[-7, 10, 5, O.right]] });
  def(MON.meteorL, { pics: anim('meteor', 2), power: 90, thru: false, end: -1, becomes: MON.boom, march: [[7, 10, 5, O.left]] });
  def(MON.boom, { pics: anim('boom', 3), power: 100, end: 8 });
  def(MON.buggy, { pics: anim('buggy', 2), power: 250, march: back(8, 0, 3) });
  def(MON.buggyV, { pics: anim('buggy', 2), power: 250, march: back(0, 6, 3) });

  def(MON.lava, { pics: anim('lava', 3), power: 60, towards: RANDOM(1), end: 110 });
  // Sparky: three zaps to calm him down, and he drops the cover page.
  def(MON.sparky, { pics: anim('sparky', 2), power: 140, towards: RANDOM(3), becomes: MON.sparky2, score: 500 });
  def(MON.sparky2, { pics: anim('sparkyMad', 2), power: 140, towards: RANDOM(4), becomes: MON.sparky3, score: 750 });
  def(MON.sparky3, { pics: anim('sparkyMad', 1), power: 140, towards: RANDOM(5), becomes: MON.sparkyDizzy, score: 1000 });
  // Dizzy for a moment (no zap can touch him), then he lets go of the cover page.
  def(MON.sparkyDizzy, { pics: anim('dizzy', 3), power: 250, end: 40, becomes: MON.cover });
  // The cover page: tough enough that lava can't hurt it (only a careless zap can).
  def(MON.cover, { pics: [['cover', 50]], power: 99 });
  return set;
}
