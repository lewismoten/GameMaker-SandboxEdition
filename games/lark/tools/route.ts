// The way through, scene by scene, as the bot plays it: the library (the storybook, the
// workbench, the little red door), up the road's first lane, the square (Doc Leo), the tower and
// the belfry (three gears, the hammer, the bell), the square at seven (the rope, the winding key,
// Doc Leo's thank-you, out by the swing gate), and east along the road through the field gate.
import { CTR, SCAN, SCENE } from '../src/ids';
import { HORSE_RISE, fairMonsters, gardenMonsters, homeMonsters, parkMonsters } from '../src/sprites/critters';
import { DOORMATS, LX, PLOW_ROW } from '../src/levels/snow';
import { PAGE_LOOPS } from '../src/levels/hive';
import { ROCK_PLAN } from '../src/levels/garden';
import { HORSES } from '../src/levels/fair';
import { at } from '../src/levels/stamp';
import { STREET_LANES } from '../src/levels/street';
import { Bot } from './bot';
import type { GameSim } from './sim';

type Step = (bot: Bot) => Promise<void>;

/** The timed blocks the route waits for, by number. */
export interface Ids {
  tick: number;
  tock: number;
  toothA: number;
  toothB: number;
  drifts: number[];
}

/** The park's monster numbers (its .MON). */
const MON = parkMonsters;

/** The tower's escapement row (drawing coordinates, levels/clock.ts TOWER_ROWS). */
const ESCAPEMENT_ROW = 9;

const ok = (r: string | undefined, label: string) => {
  if (r) throw new Error(`${label}: ${r}`);
};

/** The library at closing time: the storybook, then the workbench, which leads out to the road. */
const library: Step = async (bot) => {
  await bot.wait(30);
  const book = at(4, 7);
  await bot.take(book.x, book.y, SCENE.talkBook, 'the storybook');
  await bot.pass(SCENE.library, 'back from the storybook');
  const stool = at(17, 5);
  await bot.take(stool.x, stool.y, SCENE.talkBench, 'the workbench');
  await bot.pass(SCENE.road1, 'out of the little red door');
};

/** The road, up the first lane to the clock. */
const toClock: Step = async (bot) => {
  const lane = at(10, 1);
  await bot.take(lane.x, lane.y, SCENE.card1, 'the lane to the clock');
  await bot.pass(SCENE.square, 'chapter one');
};

/** The square at 6:59: Doc Leo, then the tower door. */
const square: Step = async (bot) => {
  const leo = at(6, 6);
  await bot.take(leo.x, leo.y, SCENE.talkLeo, 'Doc Leo');
  await bot.pass(SCENE.square, 'back from Doc Leo');
  const door = at(11, 3);
  await bot.take(door.x, door.y, SCENE.tower, 'the tower door');
};

/** Waits until the bridge at drawing cell (x, y) shows `block` (just turned), up to `max` ticks. */
async function waitFor(bot: Bot, x: number, y: number, block: number, label: string, max = 140): Promise<void> {
  for (let t = 0; t < max; t++) {
    if (bot.showing(x, y) === block) return;
    ok(await bot.tick(), label);
  }
  throw new Error(`${label}: the bridge never came`);
}

/** Up the tower: the floors, the first gear, the escapement (tock, tick, tock), the second gear, the hatch. */
function tower(ids: { tick: number; tock: number }): Step {
  return async (bot) => {
    await bot.wait(10);
    ok(await bot.walk(3, 'under the first floor'), 'tower');
    ok(await bot.hop('right', 8, 'right', 6), 'up to the first floor');
    ok(await bot.walk(7, 'first floor'), 'tower');
    ok(await bot.hop('right', 8, 'right', 9), 'up to the second floor');
    ok(await bot.walk(10, 'second floor'), 'tower');
    ok(await bot.hop('right', 8, 'right', 12), 'up to the gear floor');
    ok(await bot.walk(16, 'the first gear'), 'tower');
    ok(await bot.walk(18, 'gear floor east'), 'tower');
    ok(await bot.hop('right', 8, 'right', 18), 'up to the ledge');
    ok(await bot.hop('right', 8, 'right', 20), 'up to the next ledge');
    ok(await bot.hop('up', 8), 'up to the top ledge');
    // the escapement: from the ledge onto its east end, then west across tick, tock and tick
    ok(await bot.hop('left', 6, 'left', 18), 'onto the escapement');
    for (const [x, id, name] of [
      [16, ids.tick, 'the east tick'],
      [11, ids.tock, 'the tock'],
      [6, ids.tick, 'the west tick'],
    ] as const) {
      await waitFor(bot, x, ESCAPEMENT_ROW, id, name);
      ok(await bot.walk(x - 2, `across ${name}`), name);
    }
    ok(await bot.walk(2, 'the second gear'), 'tower');
    ok(await bot.hop('right', 8, 'right', 3), 'up to the west floor');
    ok(await bot.walk(4, 'west floor'), 'tower');
    ok(await bot.hop('right', 10, 'right', 7), 'up to the middle floor');
    ok(await bot.walk(9, 'middle floor'), 'tower');
    ok(await bot.hop('right', 8, 'right', 12), 'up to the top floor');
    const r = await bot.walk(22, 'the hatch');
    if (r !== 'link' || bot.sim.scene !== SCENE.belfry) throw new Error(`the hatch: ${r ?? 'no link'}`);
  };
}

/** The belfry: the third gear, the hammer, the bell rope. */
const belfry: Step = async (bot) => {
  await bot.wait(10);
  ok(await bot.walk(6, 'under the west floor'), 'belfry');
  ok(await bot.hop('left', 8, 'left', 4), 'up to the west floor');
  ok(await bot.walk(3, 'the third gear'), 'belfry');
  ok(await bot.walk(8, 'off the floor'), 'belfry');
  const r = await bot.walk(16, 'the bell rope');
  if (r !== 'link' || bot.sim.scene !== SCENE.bell) throw new Error(`the bell rope: ${r ?? 'no link'}`);
  await bot.pass(SCENE.square7, 'seven bells');
};

/** The square at seven: the rope, the key, Doc Leo, out by the swing gate, and down the lane. */
const square7: Step = async (bot) => {
  const rope = at(6, 8);
  ok(await bot.goto(rope.x, rope.y, 'the rope'), 'square7');
  const key = at(7, 6);
  ok(await bot.goto(key.x, key.y, 'the winding key'), 'square7');
  ok(await bot.tap('space'), 'picking up the key');
  const leo = at(6, 6);
  await bot.take(leo.x, leo.y, SCENE.talkLeo7, 'Doc Leo at seven');
  await bot.pass(SCENE.square7, "Doc Leo's thank-you");
  const swing = at(7, 8);
  ok(await bot.goto(swing.x, swing.y, 'the swing gate'), 'square7');
  const exit = at(11, 12);
  await bot.take(exit.x, exit.y, SCENE.road1, 'down the lane');
};

/** Chapter 2: Teddy at the gate, the lawn's valentines, Gwinn, the arch, Teddy's thank-you, out. */
const park: Step = async (bot) => {
  const lane = at(19, 1);
  await bot.take(lane.x, lane.y, SCENE.card2, 'the lane to the park');
  await bot.pass(SCENE.park, 'chapter two');
  const teddy = at(13, 16);
  await bot.take(teddy.x, teddy.y, SCENE.talkTeddy, 'Teddy at the gate');
  await bot.pass(SCENE.park, 'back from Teddy');
  await bot.chase(MON.valentine, 'valentine');
  await bot.chase(MON.gwinn, 'Gwinn');
  const gate = (x: number, y: number) => (cx: number, cy: number) => cx === x && cy === y;
  for (const [x, y, label] of [
    [14, 4, 'the arch'],
    [14, 3, "Teddy's rope"],
    [15, 1, "Teddy's valentine"],
  ] as const) {
    const c = at(x, y);
    ok(await bot.goto(c.x, c.y, label, gate(c.x, c.y)), label);
  }
  ok(await bot.tap('space'), "picking up Teddy's valentine");
  const teddy2 = at(14, 1);
  await bot.take(teddy2.x, teddy2.y, SCENE.talkTeddy2, "Teddy's party");
  await bot.pass(SCENE.park, "Teddy's thank-you");
  const swing = at(15, 3);
  ok(await bot.goto(swing.x, swing.y, 'the swing gate'), 'park');
  const exit = at(15, 19);
  await bot.take(exit.x, exit.y, SCENE.road1, 'out of the park');
};

/** Chapter 3: across the parade for the drumsticks, the drum, the Bard's thank-you, and north to the road. */
const street: Step = async (bot) => {
  const lane = at(27, 1);
  await bot.take(lane.x, lane.y, SCENE.card3, 'the lane to Main Street');
  await bot.pass(SCENE.street, 'chapter three');
  // the parade's lanes are where a bump can happen
  const lanes = new Set(STREET_LANES.map((row) => row + 2));
  const danger = (_x: number, y: number) => lanes.has(y);
  for (const [x, y, label] of [
    [4, 9, 'the first drumstick'],
    [17, 6, 'the second drumstick'],
  ] as const) {
    const c = at(x, y);
    ok(await bot.goto(c.x, c.y, label, undefined, danger), label);
  }
  const gate = (x: number, y: number) => (cx: number, cy: number) => cx === x && cy === y;
  for (const [x, y, label] of [
    [5, 4, 'the bass drum'],
    [5, 3, "the Bard's rope"],
    [6, 1, "the Bard's drumstick"],
  ] as const) {
    const c = at(x, y);
    ok(await bot.goto(c.x, c.y, label, gate(c.x, c.y)), label);
  }
  ok(await bot.tap('space'), "picking up the Bard's drumstick");
  const bardAt = at(5, 1);
  await bot.take(bardAt.x, bardAt.y, SCENE.talkBard, 'the Bard');
  await bot.pass(SCENE.street, "the Bard's thank-you");
  const swing = at(6, 3);
  ok(await bot.goto(swing.x, swing.y, 'the swing gate'), 'street');
  const exit = at(16, 0);
  await bot.take(exit.x, exit.y, SCENE.road1, 'back to the road');
};

/** The road east, through the first leg's field gate to the shore road. */
const toShore: Step = async (bot) => {
  const gate = at(33, 12);
  const end = at(34, 12);
  const r = await bot.goto(end.x, end.y, 'the shore road', (x, y) => x === gate.x && y === gate.y);
  if (r !== 'link' || bot.sim.scene !== SCENE.road2) throw new Error(`the shore road: ${r ?? 'no link'}`);
};

/** Into a friend's corner (gate cells walked into in turn), the keepsake, the talk, and out by the swing gate. */
async function corner(
  bot: Bot,
  o: { gates: [number, number, string][]; keepsake: [number, number, string]; friend: [number, number]; talk: number; back: number; swing: [number, number] },
): Promise<void> {
  const gate = (x: number, y: number) => (cx: number, cy: number) => cx === x && cy === y;
  for (const [x, y, label] of [...o.gates, o.keepsake]) {
    const c = at(x, y);
    ok(await bot.goto(c.x, c.y, label, gate(c.x, c.y)), label);
  }
  ok(await bot.tap('space'), `picking up ${o.keepsake[2]}`);
  const f = at(...o.friend);
  await bot.take(f.x, f.y, o.talk, 'the thank-you');
  await bot.pass(o.back, 'back from the thank-you');
  const sw = at(...o.swing);
  ok(await bot.goto(sw.x, sw.y, 'the swing gate'), 'the swing gate');
}

/** Waits until monster `monnum` (the scene's lift) stands at drawing row `row`. */
async function liftAt(bot: Bot, monnum: number, row: number, label: string, max = 400): Promise<void> {
  for (let t = 0; t < max; t++) {
    const m = bot.monsters(monnum)[0];
    if (m && m.y === row + 2 && bot.sim.w.mi[bot.sim.w.mm.findIndex((x) => x.monnum === monnum)].cury[1] === 0) return;
    ok(await bot.tick(), label);
  }
  throw new Error(`${label}: the lift never came`);
}

/** Chapter 4: the goat, into the music box (the comb, the lift, the notes, the socket), and her thank-you. */
const musicBox =
  (ids: { toothA: number; toothB: number }): Step =>
  async (bot) => {
    const lane = at(10, 1);
    await bot.take(lane.x, lane.y, SCENE.card4, 'the lane to the toy shop');
    await bot.pass(SCENE.shop, 'chapter four');
    const g = at(6, 8);
    await bot.take(g.x, g.y, SCENE.talkGoat, 'the goat');
    await bot.pass(SCENE.shop, 'back from the goat');
    const key = at(12, 4);
    await bot.take(key.x, key.y, SCENE.inbox, 'the keyhole');
    // inside the box, from the side
    await bot.wait(10);
    ok(await bot.walk(7, 'by the comb'), 'inbox');
    for (const [x, id, name] of [
      [9, ids.toothA, 'the first teeth'],
      [11, ids.toothB, 'the middle teeth'],
      [13, ids.toothA, 'the last teeth'],
    ] as const) {
      await waitFor(bot, x, 17, id, name);
      ok(await bot.walk(x, `onto ${name}`), name);
    }
    ok(await bot.walk(21, 'by the lift'), 'inbox');
    await liftAt(bot, 0, 17, 'the lift down');
    ok(await bot.until('right', () => bot.px.x >= 22 * 20, 'onto the lift', 30), 'inbox');
    await liftAt(bot, 0, 11, 'the lift up');
    ok(await bot.walk(4, 'along the middle floor'), 'inbox');
    ok(await bot.hop('right', 8, 'right', 6), 'up to the first pin');
    ok(await bot.hop('left', 8, 'left', 3), 'up to the second pin');
    ok(await bot.hop('up', 9), 'up to the top floor');
    ok(await bot.walk(2, 'a note'), 'inbox');
    ok(await bot.walk(9, 'the gap'), 'inbox');
    ok(await bot.hop('right', 12, 'right', 12), 'over the gap');
    const r = await bot.walk(18, 'the socket and the keyhole');
    if (r !== 'link' || bot.sim.scene !== SCENE.shop7) throw new Error(`out of the music box: ${r ?? 'no link'}`);
    await corner(bot, {
      gates: [[16, 4, "the goat's rope"]],
      keepsake: [17, 2, 'the little dancer'],
      friend: [16, 2],
      talk: SCENE.talkGoat2,
      back: SCENE.shop7,
      swing: [17, 4],
    });
    const exit = at(10, 13);
    await bot.take(exit.x, exit.y, SCENE.card5, 'on along the shore');
  };

/** Chapter 5: Doc Leo, the three breakers through the lot's gates, the charger, his thank-you. */
const lot: Step = async (bot) => {
  await bot.pass(SCENE.lot, 'chapter five');
  const d = at(4, 14);
  await bot.take(d.x, d.y, SCENE.talkLot, 'Doc Leo');
  await bot.pass(SCENE.lot, 'back from Doc Leo');
  const gates = new Set(
    [
      [11, 3],
      [5, 6],
      [17, 6],
      [11, 8],
      [8, 11],
      [20, 11],
    ].map(([x, y]) => `${x + 2},${y + 2}`),
  );
  for (const [x, y, label] of [
    [10, 13, 'the first breaker'],
    [3, 8, 'the second breaker'],
    [19, 8, 'the third breaker'],
    [17, 1, 'the charger'],
  ] as const) {
    const c = at(x, y);
    const r = await bot.goto(c.x, c.y, label, (cx, cy) => gates.has(`${cx},${cy}`) || (cx === c.x && cy === c.y));
    if (label === 'the charger') {
      if (r !== 'link' || bot.sim.scene !== SCENE.lot7) throw new Error(`the charger: ${r ?? 'no link'}`);
    } else ok(r, label);
  }
  await corner(bot, {
    gates: [[20, 3, "Doc Leo's rope"]],
    keepsake: [21, 1, 'the spare fuse'],
    friend: [20, 1],
    talk: SCENE.talkLot2,
    back: SCENE.lot7,
    swing: [21, 3],
  });
  const exit = at(11, 15);
  const r = await bot.goto(exit.x, exit.y, 'on to the cove', (cx, cy) => gates.has(`${cx},${cy}`));
  if (r !== 'link' || bot.sim.scene !== SCENE.card6) throw new Error(`on to the cove: ${r ?? 'no link'}`);
};

/** Chapter 6: across the dark cove, up the lighthouse by its lift and landings, the lamp, and Carl's thank-you. */
const lighthouse: Step = async (bot) => {
  await bot.pass(SCENE.cove, 'chapter six');
  const door = at(21, 3);
  await bot.take(door.x, door.y, SCENE.lighthouse, 'the lighthouse door');
  await bot.wait(10);
  ok(await bot.walk(10, 'by the lift'), 'lighthouse');
  await liftAt(bot, 0, 20, 'the lift down');
  ok(await bot.until('right', () => bot.px.x >= 11 * 20, 'onto the lift', 30), 'lighthouse');
  await liftAt(bot, 0, 13, 'the lift up');
  ok(await bot.walk(7, 'the first landing'), 'lighthouse');
  for (const [dir, to] of [
    ['left', 5],
    ['right', 7],
    ['left', 5],
    ['right', 7],
  ] as const) {
    ok(await bot.hop(dir, 8, dir, to), `up to the next landing (${dir})`);
    ok(await bot.walk(dir === 'left' ? 6 : 7, 'a landing'), 'lighthouse');
  }
  // up into the lamp room: the lamp lights the moment Joe touches it
  let r = await bot.hop('left', 8, 'left', 6);
  if (!r) r = await bot.walk(6, 'the lamp');
  if (r !== 'link' || bot.sim.scene !== SCENE.coveLit) throw new Error(`the lamp: ${r ?? 'no link'}`);
  await corner(bot, {
    gates: [[23, 3, "Carl's rope"]],
    keepsake: [24, 1, 'the lamp lens'],
    friend: [23, 1],
    talk: SCENE.talkCarl,
    back: SCENE.coveLit,
    swing: [24, 3],
  });
  const exit = at(2, 15);
  await bot.take(exit.x, exit.y, SCENE.over, 'on over the hill');
  await bot.pass(SCENE.road3, 'over the hill');
};

/** Walks to drawing cell (x, y), shoveling through any drift in the way (walking into one carrying the shovel clears it). */
async function shovelTo(bot: Bot, x: number, y: number, label: string, drifts: number[], danger?: (x: number, y: number) => boolean): Promise<void> {
  const goal = at(x, y);
  const drift = (cx: number, cy: number) => drifts.includes(bot.sim.blockAt(cx, cy));
  for (let guard = 0; guard < 60; guard++) {
    const r = await bot.goto(goal.x, goal.y, label, drift, danger);
    if (!r) return;
    // a step into a drift shovels it but stays put: go on from here
    if (!/could not step/.test(r)) throw new Error(`${label}: ${r}`);
  }
  throw new Error(`${label}: too many drifts`);
}

/** Chapter 7: Lewie's shovel from the box, the drifts on five front walks and their doormats, his porch, his thank-you, and on. */
const snowDay =
  (ids: { drifts: number[] }): Step =>
  async (bot) => {
    const lane = at(10, 1);
    await bot.take(lane.x, lane.y, SCENE.card7, 'the lane to the snow');
    await bot.pass(SCENE.talkLewie, 'chapter seven');
    await bot.pass(SCENE.snow, 'Teenage Lewie');
    const drifts = ids.drifts;
    // the plow's lane, and the tops of the walks where snow comes off the roofs
    const eaves = new Set(DOORMATS.map((x) => `${x + 2},${5 + 2}`));
    const danger = (x: number, y: number) => y === PLOW_ROW + 2 || eaves.has(`${x},${y}`);
    const box = at(23, 14);
    ok(await bot.goto(box.x, box.y, "Lewie's box", (cx, cy) => cx === box.x && cy === box.y), "Lewie's box");
    ok(await bot.tap('space'), 'picking up the shovel');
    await shovelTo(bot, 20, 8, 'across the street', drifts, danger);
    for (const x of DOORMATS) {
      await shovelTo(bot, x, 4, `the doormat at ${x}`, drifts, danger);
      await shovelTo(bot, x, 8, 'back down the walk', drifts, danger);
    }
    await shovelTo(bot, LX, 8, 'by the porch steps', drifts, danger);
    const gate = (x: number, y: number) => (cx: number, cy: number) => cx === x && cy === y;
    for (const [x, y, label] of [
      [LX, 7, "Lewie's porch steps"],
      [LX, 6, "Lewie's rope"],
      [LX, 5, 'on the porch'],
    ] as const) {
      const c = at(x, y);
      ok(await bot.goto(c.x, c.y, label, gate(c.x, c.y)), label);
    }
    const lewie = at(LX + 1, 4);
    await bot.take(lewie.x, lewie.y, SCENE.talkLewie2, 'Lewie at the hearth');
    await bot.pass(SCENE.snow, "Lewie's thank-you");
    const back = at(LX - 1, 4);
    await bot.take(back.x, back.y, SCENE.card8, "on to the Hive, by Lewie's back garden");
  };

/** Chapter 8: Will, his pages round the floor, the turret on the warm air and the fan's draft, the lit stage and his thank-you. */
const openMic: Step = async (bot) => {
  await bot.pass(SCENE.hive, 'chapter eight');
  const will = at(13, 4);
  await bot.take(will.x, will.y, SCENE.talkWill, 'Will');
  await bot.pass(SCENE.hive, 'back from Will');
  for (let k = 0; k < PAGE_LOOPS.length; k++) await bot.chase(k, `the page under fan ${k + 1}`);
  const door = at(25, 6);
  await bot.take(door.x, door.y, SCENE.loft, 'the turret stair');
  // up the turret, from the side
  await bot.wait(10);
  ok(await bot.walk(4, 'into the warm air'), 'loft');
  ok(await bot.wait(40), 'rising');
  ok(await bot.walk(13, 'the page on the ledge'), 'loft');
  ok(await bot.hop('up', 12), 'up into the draft');
  ok(await bot.until(undefined, () => bot.sim.pos.y - 2 <= 1 && bot.sim.ci.gravy === 0, 'blown across and up', 120), 'loft');
  ok(await bot.walk(7, 'the page on the top floor'), 'loft');
  const r = await bot.walk(13, 'the back stair');
  if (r !== 'link' || bot.sim.scene !== SCENE.hive7) throw new Error(`the back stair: ${r ?? 'no link'}`);
  await corner(bot, {
    gates: [
      [19, 4, "Will's stage steps"],
      [19, 3, "Will's rope"],
    ],
    keepsake: [20, 1, "Will's umbrella"],
    friend: [19, 1],
    talk: SCENE.talkWill2,
    back: SCENE.hive7,
    swing: [20, 3],
  });
  const exit = at(13, 15);
  await bot.take(exit.x, exit.y, SCENE.card9, 'on, out of the winter');
};

/** Into the painted rocks: Loaf #13 calling from the cubby. */
const toRocks: Step = async (bot) => {
  await bot.pass(SCENE.talkLoaf, 'chapter nine');
  await bot.pass(SCENE.garden, 'Loaf #13');
};

/** Waits (up to `max` ticks) until no monster of type `monnum` is left. */
async function gone(bot: Bot, monnum: number, label: string, max = 300): Promise<void> {
  for (let t = 0; t < max; t++) {
    if (!bot.monsters(monnum).length) return bot.say(label);
    ok(await bot.tick(), label);
  }
  throw new Error(`${label}: still there after ${max} ticks`);
}

/** Chapter 9: each painted rock sent rolling home and patted, Loaf's cubby, his thank-you, and the gate on. */
const rocks =
  (next: number): Step =>
  async (bot) => {
    for (const [k, plan] of ROCK_PLAN.entries()) {
      const p = at(...plan.push);
      ok(await bot.goto(p.x, p.y, `behind rock ${k + 1}`), 'garden');
      await gone(bot, gardenMonsters(k).rock, `rock ${k + 1} rolled home`);
    }
    for (const [k, plan] of ROCK_PLAN.entries()) {
      const p = at(...plan.pat);
      ok(await bot.goto(p.x, p.y, `by rock ${k + 1}`), 'garden');
      await bot.chase(gardenMonsters(k).pat, `rock ${k + 1}, patted`);
    }
    const gate = (x: number, y: number) => (cx: number, cy: number) => cx === x && cy === y;
    for (const [x, y, label] of [
      [7, 4, "the cubby's door"],
      [7, 3, 'in the cubby'],
      [8, 2, 'the heart stone'],
    ] as const) {
      const c = at(x, y);
      ok(await bot.goto(c.x, c.y, label, gate(c.x, c.y)), label);
    }
    ok(await bot.tap('space'), 'picking up the heart stone');
    const l = at(7, 2);
    await bot.take(l.x, l.y, SCENE.talkLoaf2, 'Loaf #13');
    for (let i = 0; i < 4 && bot.sim.scene === SCENE.talkLoaf2 && !bot.sim.ended; i++) await bot.tick();
    if (next === SCENE.end ? bot.sim.ended !== 'won' : bot.sim.scene !== next) throw new Error(`after Loaf: scene ${bot.sim.scene}`);
    bot.say("Loaf's thank-you, and on");
  };

/** Where horse `k` of the fair is (level pixels of its block's top left). */
function horseAt(bot: Bot, k: number): { x: number; y: number } {
  const h = HORSES[k];
  const w = bot.sim.w;
  const i = w.mm.findIndex((m, j) => m.monnum === fairMonsters[`horse${h.kind}`] && w.mi[j].curx[0] - 2 === h.x);
  if (i < 0) throw new Error(`no horse ${k}`);
  return { x: (w.mi[i].curx[0] - 2) * 20 + w.mi[i].curx[1], y: (w.mi[i].cury[0] - 2) * 20 + w.mi[i].cury[1] };
}

/** Joe standing on horse k's saddle (his feet on its top). */
const onHorse = (bot: Bot, k: number) => {
  const h = horseAt(bot, k);
  return Math.abs(bot.px.y + 20 - h.y) <= 2 && bot.px.x + 10 >= h.x && bot.px.x + 10 <= h.x + 40;
};

/** Waits until horse k is at the top (or bottom) of its stroke. */
async function horseStroke(bot: Bot, k: number, end: 'top' | 'bottom', label: string): Promise<void> {
  const h = HORSES[k];
  const top = (h.kind === 'A' ? h.row - HORSE_RISE : h.row) * 20;
  const want = end === 'top' ? top : top + HORSE_RISE * 20;
  ok(await bot.until(undefined, () => Math.abs(horseAt(bot, k).y - want) <= 1, label, 400), label);
}

/** A hop to the right onto horse k (as it reaches the bottom of its stroke): E, steer over the saddle, and ride. */
async function ontoHorse(bot: Bot, k: number): Promise<void> {
  const h = HORSES[k];
  const bottom = (h.kind === 'A' ? h.row : h.row + HORSE_RISE) * 20;
  // to the near edge (of the saddle Joe is on, or of the ground) first
  const edge = (h.x - (k ? 2 : 1)) * 20;
  if (bot.px.x < edge) ok(await bot.until('right', () => bot.px.x >= edge, 'at the edge', 40), 'fair');
  ok(await bot.until(undefined, () => Math.abs(horseAt(bot, k).y - bottom) <= 1, `horse ${k + 1} at the bottom`, 400), 'fair');
  bot.sim.press(SCAN.e);
  ok(await bot.wait(7), 'fair');
  bot.sim.release(SCAN.e);
  bot.sim.press(SCAN.right);
  ok(await bot.until(undefined, () => bot.px.x >= h.x * 20 + 8, `over horse ${k + 1}`, 40), 'fair');
  bot.sim.release(SCAN.right);
  let held = 0;
  ok(await bot.until(undefined, () => (held = onHorse(bot, k) ? held + 1 : 0) >= 4, `on horse ${k + 1}`, 60), 'fair');
}

/** Chapter 10: up the carousel's horses to the canopy, Reggie caught, the turnstile, the heart balloon, Doc Leo. */
const fair =
  (next: number): Step =>
  async (bot) => {
    await bot.pass(SCENE.talkFair, 'chapter ten');
    await bot.pass(SCENE.fair, 'Doc Leo at the fair');
    await bot.wait(10);
    ok(await bot.walk(HORSES[0].x - 1, 'by the carousel'), 'fair');
    for (let k = 0; k < HORSES.length; k++) await ontoHorse(bot, k);
    await horseStroke(bot, HORSES.length - 1, 'top', 'up at the canopy');
    // on the canopy: wait for Reggie to float by
    const task = bot.sim.meter(CTR.task);
    ok(await bot.until(undefined, () => bot.sim.meter(CTR.task) > task, 'Reggie caught', 300), 'fair');
    ok(await bot.walk(17, 'off the canopy'), 'fair');
    ok(await bot.walk(30, 'through the turnstile'), 'fair');
    ok(await bot.hold('down', 3), 'picking up the heart balloon');
    ok(await bot.wait(8), 'fair');
    const r = await bot.walk(33, 'Doc Leo');
    if (r !== 'link') throw new Error(`Doc Leo: ${r ?? 'no link'}`);
    for (let i = 0; i < 4 && bot.sim.scene === SCENE.talkFair2 && !bot.sim.ended; i++) await bot.tick();
    if (next === SCENE.end ? bot.sim.ended !== 'won' : bot.sim.scene !== next) throw new Error(`after Doc Leo: scene ${bot.sim.scene}`);
    bot.say("Doc Leo's thank-you, and on");
  };

/** Waits until the leaf at drawing cell (x, y) has just opened (it was folded a moment ago). */
async function leafOpens(bot: Bot, x: number, y: number, label: string): Promise<void> {
  const c = at(x, y);
  let wasOpen = bot.sim.solidAt(c.x, c.y);
  for (let t = 0; t < 300; t++) {
    const open = bot.sim.solidAt(c.x, c.y);
    if (open && !wasOpen) return bot.say(`${label} opens`);
    wasOpen = open;
    ok(await bot.tick(), label);
  }
  throw new Error(`${label}: never opened`);
}

/** Chapter 11: up the plant's leaves, the heart balloon up the bare stretch, the star, the seed. */
const plant =
  (next: number): Step =>
  async (bot) => {
    await bot.pass(SCENE.talkSeed, 'chapter eleven');
    await bot.pass(SCENE.plant, 'the mustard seed');
    await bot.wait(10);
    ok(await bot.hop('up', 12), 'up onto the first leaf');
    // leaf by leaf: [direction, the leaf's row and its near column, whether it is on a clock]
    const climb = async (dir: 'left' | 'right', row: number, x: number, timed: boolean, label: string) => {
      if (timed) await leafOpens(bot, x, row, label);
      ok(await bot.hop(dir, 10, dir, dir === 'right' ? x + 0.4 : x - 0.4), label);
      if (Math.round(bot.px.y / 20) !== row - 1) throw new Error(`${label}: landed on row ${(bot.px.y / 20).toFixed(2)}`);
    };
    ok(await bot.walk(6, 'the first leaf, east end'), 'plant');
    await climb('right', 32, 8, true, 'the second leaf');
    ok(await bot.walk(8, 'its west end'), 'plant');
    await climb('left', 30, 6, true, 'the third leaf');
    ok(await bot.walk(6, 'its east end'), 'plant');
    await climb('right', 28, 8, true, 'the fourth leaf');
    ok(await bot.walk(8, 'its west end'), 'plant');
    await climb('left', 26, 6, false, 'the fifth leaf');
    ok(await bot.walk(5, 'under the puffs'), 'plant');
    // the heart balloon, up the bare stretch, through the puffs, to the broad leaf
    ok(await bot.until('enter', () => bot.px.y <= 12 * 20, 'up on the heart balloon', 120), 'plant');
    let still = 0;
    ok(
      await bot.until(undefined, () => (still = bot.px.y === 13 * 20 && bot.sim.ci.gravy === 0 ? still + 1 : 0) >= 3, 'down onto the broad leaf', 120),
      'plant',
    );
    ok(await bot.walk(7, 'the broad leaf, east end'), 'plant');
    await climb('right', 12, 8, true, 'the sixth leaf');
    ok(await bot.walk(8, 'its west end'), 'plant');
    await climb('left', 10, 6, true, 'the seventh leaf');
    ok(await bot.walk(6, 'its east end'), 'plant');
    await climb('right', 8, 8, false, 'the eighth leaf');
    ok(await bot.hop('up', 12), 'up to the star leaf');
    ok(await bot.walk(12, 'the star'), 'plant');
    ok(await bot.walk(8, 'back along the star leaf'), 'plant');
    await climb('left', 4, 6, false, 'the top leaf');
    const r = await bot.walk(2, 'the seed');
    if (r !== 'link') throw new Error(`the seed: ${r ?? 'no link'}`);
    for (let i = 0; i < 4 && bot.sim.scene === SCENE.talkSeed2 && !bot.sim.ended; i++) await bot.tick();
    if (next === SCENE.end ? bot.sim.ended !== 'won' : bot.sim.scene !== next) throw new Error(`after the seed: scene ${bot.sim.scene}`);
    bot.say("the seed's thank-you, and on");
  };

/** Waits until a monster of type `monnum` is within `range` blocks ahead (east) of Joe on his row, then throws HELLO. */
async function hello(bot: Bot, monnum: number, label: string, range = 4): Promise<void> {
  const ahead = () =>
    bot.monsters(monnum).some((m) => {
      const dx = m.x - 2 - bot.px.x / 20;
      return dx >= 0.5 && dx <= range && Math.abs(m.y - 2 - bot.px.y / 20) < 0.6;
    });
  ok(await bot.until(undefined, ahead, `${label} in range`, 400), label);
  ok(await bot.tap('x'), `HELLO, ${label}`);
}

/** The finale: the Smart Home's gadgets cheered up, up and over on the balloon and the spring hop, the Big Grumble, Watt, the gold, and out. */
const smartHome: Step = async (bot) => {
  await bot.pass(SCENE.home, 'the Smart Home');
  await bot.wait(10);
  const M = homeMonsters;
  // a step east (so HELLO goes that way), and the toaster
  ok(await bot.walk(2, 'facing east'), 'home');
  await hello(bot, M.toaster, 'the toaster');
  await gone(bot, M.toaster, 'the toaster, cheered up', 60);
  // the air vent, and up over the tall chip on the heart balloon
  ok(await bot.walk(10, 'the air vent'), 'home');
  ok(await bot.until('enter', () => bot.px.y <= 1 * 20, 'up on the heart balloon', 120), 'home');
  ok(await bot.until('right', () => bot.px.x >= 12 * 20, 'over the tall chip', 60), 'home');
  ok(await bot.land(), 'down into the next board');
  await hello(bot, M.vacuum, 'the vacuum', 5);
  await gone(bot, M.vacuum, 'the vacuum, cheered up', 60);
  // the wall of chips: the winding key's spring hop, steering east over it
  ok(await bot.walk(21, 'by the wall of chips'), 'home');
  bot.sim.press(SCAN.space);
  ok(await bot.tick(), 'the spring hop');
  bot.sim.release(SCAN.space);
  ok(await bot.until('right', () => bot.px.x >= 23 * 20, 'over the wall of chips', 60), 'home');
  ok(await bot.land(), 'down by the Big Grumble');
  ok(await bot.walk(26, 'facing the Big Grumble'), 'home');
  for (let k = 1; k <= 3; k++) {
    await hello(bot, M.grumble(k), `the Big Grumble, stage ${k}`, 5);
    await gone(bot, M.grumble(k), `the Big Grumble lets off steam`, 30);
  }
  await gone(bot, M.steam(3), 'the Big Grumble, all smiles', 200);
  ok(await bot.walk(30, 'a pat for the Big Grumble'), 'home');
  await gone(bot, M.happy, 'patted', 30);
  const r = await bot.walk(35, 'Watt');
  if (r !== 'link' || (bot.sim.scene as number) !== SCENE.talkWatt) throw new Error(`Watt: ${r ?? 'no link'}`);
  await bot.pass(SCENE.homeGold, 'Watt, and the gold');
  await bot.wait(20);
  const out = await bot.walk(1, 'out of the front door, past everybody');
  if (out !== 'link' || (bot.sim.scene as number) !== SCENE.epilogue) throw new Error(`the front door: ${out ?? 'no link'}`);
  for (let i = 0; i < 4 && !bot.sim.ended; i++) await bot.tick();
  if (bot.sim.ended !== 'won') throw new Error('opening time: the game did not end');
};

/** Plays it all; `keepTo` (kit/walkPaths.ts keepToPaths) keeps the bot to the roads and walks. */
export async function playThrough(sim: GameSim, ids: Ids, keepTo?: Bot['keepTo']): Promise<Bot> {
  const bot = new Bot(sim);
  bot.keepTo = keepTo;
  try {
    for (const step of [
      library,
      toClock,
      square,
      tower(ids),
      belfry,
      square7,
      park,
      street,
      toShore,
      musicBox(ids),
      lot,
      lighthouse,
      snowDay(ids),
      openMic,
      toRocks,
      rocks(SCENE.card10),
      fair(SCENE.card11),
      plant(SCENE.card12),
      smartHome,
    ])
      await step(bot);
  } catch (e) {
    console.error((process.env.BOT_LOG ? bot.log : bot.log.slice(-30)).join('\n'));
    throw e;
  }
  return bot;
}
