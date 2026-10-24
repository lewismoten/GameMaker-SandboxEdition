// Plays the built game headlessly and reports problems:
//   cd web && npx vite-node ../games/maximus/tools/check.ts [scene name...]
// - every world: land, wait three seconds (nothing should kill you at the landing site),
//   and the uplink back to orbit is reachable;
// - rover worlds: the rover can drive all the way around the planet;
// - the training deck can be crossed by "hold right, hop when stuck";
// - every multi-block object (trees, planets, the core...) is put together right (--align: only this).
import { ITEM_BASE, MON, MONEY, SCAN, SEAL_COUNTER, SEQ, SHARD_BASE, SHARD_COUNTER } from '../src/ids';
import { fightEye } from './heartFight';
import { newCharInfo } from '../../../web/src/engine/world';
import { reachable } from '../src/levels/mapkit';
import { buildGame } from '../src/game';
import { autoWalk, navigate, simFor, standStill } from './verify';
import { misaligned } from './align';

const only = process.argv.slice(2);
const b = buildGame();
const report: string[] = [];
for (const [name, list] of misaligned(b)) report.push(`${name}: ${list.length} misplaced block parts (${list.slice(0, 3).join('; ')})`);
if (only.includes('--align')) {
  for (const line of report) console.log(line);
  console.log(`alignment: ${b.scenes.length} maps, ${report.length} with misplaced parts`);
  process.exit(report.length ? 1 : 0);
}
let checked = 0;
for (const info of b.scenes) {
  if (only.length && !only.includes(info.name) && !only.includes(info.file)) continue;
  checked++;
  // landing safety (three random seeds)
  for (const seed of [1, 2, 3]) {
    const sim = simFor(b, info, seed);
    const r = await standStill(sim, 55);
    if (r.dead || r.hp < 70) report.push(`${info.name}: standing at the landing site for 3s leaves ${r.hp} HP${r.dead ? ' (dead)' : ''} [seed ${seed}]`);
  }
  if (info.kind === 'rover') {
    const sim = simFor(b, info, 1);
    await sim.run(5);
    const startX = sim.pos.x;
    let travelled = 0;
    let last = startX;
    sim.press(SCAN.right);
    let stuck = 0;
    for (let t = 0; t < 2400 && travelled < 2000 && !sim.dead; t++) {
      if (t % 16 === 0) sim.press(SCAN.space);
      if (t % 16 === 1) sim.release(SCAN.space);
      await sim.tick();
      let dx = sim.pos.x - last;
      if (dx < -1000) dx += 2000;
      travelled += Math.max(0, dx);
      stuck = dx === 0 ? stuck + 1 : 0;
      last = sim.pos.x;
      if (stuck > 60) break;
      sim.link = -1; // drive past the uplink
    }
    if (travelled < 2000)
      report.push(
        `${info.name}: rover got ${Math.round(travelled / 20)} blocks around the planet (stuck at ${sim.pos.bx},${sim.pos.by}${sim.dead ? ', dead' : ''})`,
      );
  }
  if (info.kind === 'home') {
    const sim = simFor(b, info, 1);
    await sim.run(5);
    const r = await autoWalk(sim, 'right', 1500);
    if (r.link !== 0) report.push(`${info.name}: the training deck bot did not reach the airlock (x ${r.x})`);
  }
}
// the galaxy: which warps can the pod reach with which shards?
if (!only.length) {
  const gal = b.scenes.find((s) => s.file === 'galaxy')!;
  const space = b.sets.space;
  const links = b.game.scenes[gal.scene].links;
  const gateOf = (blk: number) => (blk >= SHARD_BASE && blk < SHARD_BASE + 10 ? blk - SHARD_BASE : -1);
  const reach = (have: number[]) => reachable(gal.map, space.blocks, gal.arrive.x, gal.arrive.y, { tall: false, pass: (blk) => have.includes(gateOf(blk)) });
  const can = (have: number[], link: number) => {
    const seen = reach(have);
    const f = links[link].from;
    return (
      seen[f.y * 100 + f.x] === 1 ||
      [
        [1, 0],
        [0, 1],
        [1, 1],
      ].some(([dx, dy]) => seen[(f.y + dy) * 100 + f.x + dx] === 1)
    );
  };
  const expect = (have: number[], link: number, want: boolean, what: string) => {
    if (can(have, link) !== want) report.push(`galaxy: ${what} should ${want ? '' : 'not '}be reachable with shards [${have.join(',')}]`);
  };
  expect([], 1, true, 'sector 1');
  expect([], 2, false, 'sector 2');
  expect([0, 1], 2, true, 'sector 2');
  expect([0, 1], 3, false, 'sector 3');
  expect([0, 1, 2, 3], 3, true, 'sector 3');
  expect([0, 1, 2, 3, 4, 5], 4, true, 'sector 4');
  expect([0, 1, 2, 3, 4, 5, 6, 7], 5, true, 'sector 5');
  expect([0, 1, 2, 3, 4, 5, 6, 7, 8], 6, false, 'the Core');
  expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 6, true, 'the Core');
  expect([], 0, true, 'home');
  // and the engine agrees: a pod carrying shard 0 and 1 opens sector 2's gates
  const sim = simFor(b, gal, 1);
  sim.w.ci.meter[SHARD_COUNTER] = 1;
  sim.w.ci.meter[SHARD_COUNTER + 1] = 1;
  const before = [...sim.w.map].filter((c) => gateOf(c) === 0 || gateOf(c) === 1).length;
  // drop the pod beside a gate cell and thrust into it from each side
  const gi = [...sim.w.map].findIndex((c) => gateOf(c) === 0);
  for (const [dx, dy, k] of [
    [-1, 0, SCAN.right],
    [1, 0, SCAN.left],
    [0, -1, SCAN.down],
    [0, 1, SCAN.up],
  ] as const) {
    const gx = (gi % 100) + dx;
    const gy = Math.floor(gi / 100) + dy;
    if (!space.blocks[sim.w.map[gy * 100 + gx]] || space.blocks[sim.w.map[gy * 100 + gx]].solid) continue;
    sim.w.chr.x[0] = gx;
    sim.w.chr.y[0] = gy;
    sim.w.chr.x[1] = sim.w.chr.y[1] = 0;
    // (the engine only changes blocks that are on screen: bring the view along)
    sim.w.mx = (gx - 8 + 100) % 100;
    sim.w.my = (gy - 5 + 100) % 100;
    sim.press(k);
    await sim.run(12);
    sim.release(k);
    break;
  }
  const after = [...sim.w.map].filter((c) => gateOf(c) === 0 || gateOf(c) === 1).length;
  if (after >= before) report.push(`galaxy: a pod carrying the Ruby shard did not open a Ruby gate (${before} -> ${after})`);
}
// the Heart: the seal holds until the Heart Eye is broken, and a courier with the Plasma
// Lance who fights the eye from the foot of the Guardian gets through it to the exit
if (!only.length || only.includes('heart')) {
  const heart = b.scenes.find((s) => s.file === 'heart')!;
  const start = (seed: number, x: number, charge: number) => {
    const ci = newCharInfo();
    ci.inv.fill(150);
    ci.inv[0] = ITEM_BASE; // the Plasma Lance
    const sim = simFor(b, heart, seed, ci);
    const w = sim.w;
    w.chr.x[0] = x;
    w.chr.y[0] = 55;
    w.chr.x[1] = w.chr.y[1] = 0;
    w.mx = x - 8;
    w.my = 50;
    return { sim, charge };
  };
  const push = async (sim: ReturnType<typeof simFor>) => {
    // through the Guardian at floor height: shoulder the plates, lance them now and then
    sim.press(SCAN.right);
    for (let t = 0; t < 600 && !sim.dead && sim.link < 0 && sim.pos.bx < 79; t++) {
      await sim.tick();
      if (sim.w.ci.hitpts < 40) sim.w.ci.hitpts = 100; // a player would use med kits and pickups
      if (t % 20 === 10) {
        sim.press(SCAN.z);
        await sim.tick();
        sim.release(SCAN.z);
      }
    }
    sim.release(SCAN.right);
    return sim.pos.bx;
  };
  // without the Core Light's charge the seal stays shut
  {
    const { sim } = start(1, 74, 0);
    await sim.run(3);
    sim.w.ci.meter[SEAL_COUNTER] = 1;
    sim.w.ci.hitpts = 2000;
    for (let i = 0; i < 64; i++) sim.w.mm[i].monnum = 64; // nothing in the way but the plates and the seal
    if ((await push(sim)) >= 78) report.push('heart: the seal let an uncharged courier through');
  }
  let won = 0;
  let worst = 0;
  for (const seed of [1, 2, 3, 4]) {
    const { sim } = start(seed, 64, 0);
    sim.w.ci.meter[SEQ.plasma] = 30;
    await sim.run(3);
    sim.w.ci.meter[SEAL_COUNTER] = 1;
    sim.w.ci.hitpts = 1000;
    const charged = await fightEye(sim, b.monsters.heart);
    worst = Math.max(worst, 1000 - sim.w.ci.hitpts);
    if (!charged) {
      report.push(`heart: seed ${seed}: the eye bot did not break the Heart Eye`);
      continue;
    }
    await push(sim);
    for (let t = 0; t < 400 && !sim.dead && sim.link < 0; t++) {
      sim.press(SCAN.right);
      await sim.tick();
    }
    if (sim.link === 0) won++;
    else report.push(`heart: seed ${seed}: through the seal but not to the exit (at ${sim.pos.bx},${sim.pos.by})`);
  }
  console.log(`heart: ${won} of 4 seeds won; the eye fight cost up to ${worst} HP`);
}
// sector charts: fly the pod from the warp to a few planets and see what it costs
if (!only.length || only.includes('sectors')) {
  for (const info of b.scenes.filter((s) => s.kind === 'space' && s.sector !== undefined)) {
    const links = b.game.scenes[info.scene].links.filter((l) => l.toScene !== 0xffff && l.toScene >= 12);
    let worst = 0;
    for (const li of [0, Math.floor(links.length / 2), links.length - 1]) {
      const sim = simFor(b, info, li);
      sim.scene.links = undefined; // fly through other planets without landing
      await sim.run(3);
      const r = await navigate(sim, links[li].from, 4000);
      worst = Math.max(worst, r.damage);
      if (!r.arrived) report.push(`${info.name}: the pod could not reach planet link ${li}`);
    }
    if (worst > 150) report.push(`${info.name}: flying to a planet cost up to ${worst} HP`);
  }
}
// mechanics: pick up a module and fire it; take a shard; pay a credit door; buy at a post
if (!only.length || only.includes('mechanics')) {
  const put = (sim: ReturnType<typeof simFor>, x: number, y: number) => {
    sim.w.chr.x[0] = x;
    sim.w.chr.y[0] = y;
    sim.w.chr.x[1] = sim.w.chr.y[1] = 0;
    sim.w.mx = (x - 8 + 100) % 100;
    sim.w.my = (y - 5 + 100) % 100;
  };
  // module: Little Hollow holds the Plasma Lance
  {
    const info = b.scenes.find((s) => s.module === 0)!;
    const sim = simFor(b, info, 1);
    await sim.run(2);
    put(sim, info.vault!.x, info.vault!.y);
    await sim.run(4);
    sim.press(SCAN.p);
    await sim.run(8);
    sim.release(SCAN.p);
    await sim.run(4);
    if (!sim.w.ci.inv.includes(ITEM_BASE)) report.push(`module: picking up the Plasma Lance failed (inventory ${sim.w.ci.inv.join(',')})`);
    if (!sim.w.ci.seqon[SEQ.plasma]) report.push('module: the lance key is not enabled after pickup');
    const before = sim.w.mm.filter((m) => m.monnum === MON.plasma).length;
    sim.press(SCAN.z);
    await sim.run(3);
    sim.release(SCAN.z);
    const after = sim.w.mm.filter((m) => m.monnum === MON.plasma).length;
    console.log(`mechanics: inventory ${sim.w.ci.inv.join(',')}, plasma bolts ${before} -> ${after}`);
    if (after <= before) report.push('module: Z did not fire a plasma bolt');
  }
  // shard: Ambermoor holds the Ruby
  {
    const info = b.scenes.find((s) => s.shard === 0)!;
    const sim = simFor(b, info, 1);
    await sim.run(2);
    put(sim, info.vault!.x - 1, info.vault!.y);
    sim.press(SCAN.right);
    await sim.run(6);
    sim.release(SCAN.right);
    console.log(`mechanics: Ruby counter ${sim.w.ci.meter[SHARD_COUNTER]}`);
    if (sim.w.ci.meter[SHARD_COUNTER] !== 1) report.push(`shard: touching the Ruby left counter 20 at ${sim.w.ci.meter[SHARD_COUNTER]}`);
  }
  // credit door: walk into a vault door with 15 credits
  {
    const info = b.scenes.find((s) => s.name === 'Verdance')!;
    const sim = simFor(b, info, 1);
    await sim.run(2);
    sim.w.ci.meter[MONEY] = 16;
    put(sim, info.vault!.x - 8, info.vault!.y);
    sim.press(SCAN.right);
    await sim.run(25);
    sim.release(SCAN.right);
    console.log(`mechanics: door left ${sim.w.ci.meter[MONEY] - 1} of 15 credits`);
    if (sim.w.ci.meter[MONEY] !== 6) report.push(`door: 15 credits became ${sim.w.ci.meter[MONEY] - 1} after the credit door (expected 5)`);
  }
  // a held fire key, then released: the courier must walk again afterwards
  {
    const home = b.scenes.find((s) => s.file === 'home')!;
    const sim = simFor(b, home, 1);
    await sim.run(3);
    sim.press(SCAN.space);
    await sim.run(20);
    sim.release(SCAN.space);
    await sim.run(6);
    const x0 = sim.pos.x;
    sim.press(SCAN.right);
    await sim.run(10);
    sim.release(SCAN.right);
    if (sim.pos.x <= x0) report.push('controls: after holding fire, the courier would not walk');
    for (const k of [SCAN.z, SCAN.x, SCAN.c, SCAN.v, SCAN.h, SCAN.w, SCAN.t, SCAN.p, SCAN.up]) {
      sim.press(k);
      await sim.run(12);
      sim.release(k);
      await sim.run(10);
    }
    const x1 = sim.pos.x;
    sim.press(SCAN.left);
    await sim.run(10);
    sim.release(SCAN.left);
    if (sim.pos.x >= x1) report.push('controls: after the module keys, the courier would not walk');
  }
  // trading post: nudge the 1-Up pad with 120 credits
  {
    const info = b.scenes.find((s) => s.name === 'The Cradle')!;
    const sim = simFor(b, info, 1);
    sim.scene.links = undefined;
    await sim.run(2);
    sim.w.ci.meter[MONEY] = 121;
    const lives = sim.w.ci.lives;
    const pad = [...sim.w.map].findIndex((c) => c === b.sets.space.id('buy:oneup'));
    put(sim, pad % 100, Math.floor(pad / 100) + 1);
    sim.press(SCAN.up);
    await sim.run(10);
    sim.release(SCAN.up);
    console.log(`mechanics: shop lives ${lives} -> ${sim.w.ci.lives}, credits 120 -> ${sim.w.ci.meter[MONEY] - 1}`);
    if (sim.w.ci.lives !== lives + 1 || sim.w.ci.meter[MONEY] !== 21)
      report.push(`shop: buying a 1-Up gave lives ${lives} -> ${sim.w.ci.lives}, credits 120 -> ${sim.w.ci.meter[MONEY] - 1}`);
  }
}
console.log(`checked ${checked} scenes`);
for (const line of [...b.problems, ...report]) console.log(line);
