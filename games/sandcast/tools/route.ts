// The normal winning route through Sandcastle Knight, as orders for the bot: the shovel and
// Anthill Keep, the Hosewater Moat, Low Tide Lagoon, the Beetle Burrows and Gwinn's nap on
// the patio. It never goes near Gwinn's dig (the lone dune in the sandbox's northeast
// corner), the BBS hole or Anthill Keep's secret hole.
import { CTR, MON, SEQ } from '../src/rules';
import { BG } from '../src/blocks/bblocks';
import { S } from '../src/game';
import { Bot, SCAN, STEP, type Dir } from './bot';

const expect = (bot: Bot, scene: number, what: string) => {
  if (bot.sim.scene !== scene) throw new Error(`Expected ${what} (scene ${scene}), in scene ${bot.sim.scene}\n${bot.log.slice(-6).join('\n')}`);
};

export async function hub1(bot: Bot): Promise<void> {
  expect(bot, S.hub, 'the sandbox');
  await bot.goto(3, 33, 'the shovel');
  await bot.key(SCAN.p, 2, 6);
  if (bot.sim.meter(CTR.shovel) < 100) throw new Error('No shovel');
  await bot.goto(6, 33, 'a tennis ball');
  await bot.digFrom(8, 26, 'down', 'the dune ring');
  if ((await bot.goto(8, 24, 'Anthill Keep')) !== 'link') throw new Error('No way in');
  expect(bot, S.keep, 'Anthill Keep');
}

const isTower = (n: string) => n.startsWith('tower');

/** Builds the tower ring at (x, y), standing on the given side of it. */
async function tower(bot: Bot, x: number, y: number, side: 'up' | 'down' | 'left' | 'right', label: string): Promise<void> {
  await bot.digFrom(x, y, side, label, isTower);
}

/** Tosses a tennis ball at Gwinn, walking toward her first so the ball flies her way. */
async function toss(bot: Bot, dir: Dir, label: string): Promise<void> {
  const balls = bot.sim.meter(SEQ.fetch);
  if (balls < 1) throw new Error(`${label}: no tennis ball`);
  const gwinn = () => bot.monsters(MON.gwinNap, MON.gwinRoam).length;
  const before = gwinn();
  await bot.face(dir);
  await bot.key(SCAN.f, 2, 12);
  if (bot.sim.meter(SEQ.fetch) !== balls - 1) throw new Error(`${label}: the ball was not thrown`);
  if (gwinn() !== before - 1) throw new Error(`${label}: the ball missed Gwinn`);
  bot.say(label);
}

export async function keep(bot: Bot): Promise<void> {
  expect(bot, S.keep, 'Anthill Keep');
  await bot.goto(18, 20, 'a tennis ball');
  await bot.goto(22, 11, 'sand');
  await bot.goto(31, 15, 'sand');
  await tower(bot, 29, 9, 'down', 'the southeast tower');
  await bot.goto(32, 6, 'sand');
  await tower(bot, 29, 2, 'down', 'the northeast tower');
  await tower(bot, 6, 2, 'down', 'the northwest tower');
  await bot.goto(3, 6, 'sand');
  await tower(bot, 6, 9, 'down', 'the southwest tower');
  if (bot.sim.meter(CTR.flags) !== 5) throw new Error(`Flags: ${bot.sim.meter(CTR.flags) - 1}`);
  await bot.digFrom(17, 9, 'down', 'the gate');
  await bot.goto(17, 6, 'before Gwinn');
  await toss(bot, 'up', 'Gwinn trots off');
  if ((await bot.goto(17, 4, 'the keep door')) !== 'link') throw new Error('No way out');
}

export async function hub2(bot: Bot): Promise<void> {
  expect(bot, S.hub, 'the sandbox');
  if ((await bot.goto(45, 21, 'the Hosewater Moat')) !== 'link') throw new Error('No way in');
}

/** Steps into a current going `dir`, rides it until it lets go, then steps onto (x, y). */
async function ride(bot: Bot, dir: Dir, x: number, y: number, label: string): Promise<void> {
  await bot.push(dir, 4, 0);
  let last = '';
  let still = 0;
  for (let t = 0; t < 150 && still < 3; t++) {
    await bot.wait(1);
    const p = bot.sim.pos;
    const now = `${p.x},${p.y},${p.sx},${p.sy}`;
    still = now === last && !bot.current(p.x, p.y) ? still + 1 : 0;
    last = now;
  }
  if (still < 3) throw new Error(`${label}: the current never let go`);
  // the current leaves Teddy between two blocks: step on to the nearer one, as a player would
  const p = bot.sim.pos;
  const nudge: Dir | undefined = p.sx ? (p.sx >= 10 ? 'right' : 'left') : p.sy ? (p.sy >= 10 ? 'down' : 'up') : undefined;
  if (nudge) {
    bot.sim.press(SCAN[nudge]);
    for (let t = 0; t < 8 && (bot.sim.pos.sx || bot.sim.pos.sy); t++) await bot.wait(1);
    bot.sim.release(SCAN[nudge]);
    await bot.wait(2);
  }
  await bot.goto(x, y, label);
}

export async function moat(bot: Bot): Promise<void> {
  expect(bot, S.moat, 'the Hosewater Moat');
  await bot.goto(23, 22, 'sand');
  await bot.goto(32, 21, 'sand');
  await bot.goto(12, 22, 'sand');
  await bot.digFrom(19, 21, 'down', 'the ford', (n) => n === 'causeway');
  await bot.digFrom(19, 20, 'down', 'the ford', (n) => n === 'causeway');
  await tower(bot, 11, 17, 'down', 'the southwest tower');
  // off the island on the east current, round to the north bank, down the north current
  await bot.goto(28, 12, 'the east current');
  await ride(bot, 'right', 33, 12, 'carried off the island');
  await bot.goto(20, 3, 'above the north current');
  await ride(bot, 'down', 20, 6, 'carried onto the north half');
  await tower(bot, 28, 7, 'down', 'the northeast tower');
  // down the west channel to the gate
  await bot.goto(11, 9, 'above the west channel');
  await ride(bot, 'down', 11, 12, 'carried back to the south half');
  if (bot.sim.meter(CTR.flags2) !== 3) throw new Error(`Flags: ${bot.sim.meter(CTR.flags2) - 1}`);
  await bot.digFrom(19, 15, 'down', 'the gate');
  if ((await bot.goto(19, 9, 'the castle door')) !== 'link') throw new Error('No way out');
}

export async function hub3(bot: Bot): Promise<void> {
  expect(bot, S.hub, 'the sandbox');
  if ((await bot.goto(43, 6, 'Low Tide Lagoon')) !== 'link') throw new Error('No way in');
}

/** Ticks the tidal flat stays dry from now (0 while it is flooded). */
function dryFor(bot: Bot): number {
  const w = bot.sim.w;
  const flat = BG.id('flat');
  const wet = BG.id('flatWet');
  const now = w.blkmap[flat];
  if (now === flat) return w.nxtchg[flat] - w.clock + w.bg[wet].ntime;
  if (now === wet) return w.nxtchg[flat] - w.clock;
  return 0;
}

/** Crosses the tidal flat to (x, y), waiting where Teddy stands until it is dry for long enough. */
async function overFlat(bot: Bot, x: number, y: number, label: string): Promise<void> {
  const p = bot.sim.pos;
  const need = (Math.abs(p.x - x) + Math.abs(p.y - y)) * 4 + 12;
  let waited = 0;
  while (dryFor(bot) < need) {
    await bot.wait(1);
    if (++waited > 400) throw new Error(`${label}: the tide never went out`);
  }
  if (waited) bot.say(`waited ${waited} ticks for the tide`);
  await bot.goto(x, y, label);
}

/**
 * The two crabs in the gully between the pails march six blocks apart, so one of them is
 * nearly always at the gap. Waits until both are at least two blocks and a bit from it.
 */
async function crabGap(bot: Bot): Promise<void> {
  const far = () => bot.monsters(MON.crabH).every((c) => c.y !== 13 || Math.abs(c.x * 20 + c.sx - 16 * 20) >= 45);
  let waited = 0;
  while (!far()) {
    await bot.wait(1);
    if (++waited > 300) throw new Error('The crabs never moved off');
  }
  if (waited) bot.say(`waited ${waited} ticks for the crabs`);
}

export async function lagoon(bot: Bot): Promise<void> {
  expect(bot, S.lagoon, 'Low Tide Lagoon');
  await bot.goto(19, 1, 'the bucket');
  await bot.key(SCAN.p, 2, 6);
  if (bot.sim.meter(CTR.bucket) < 100) throw new Error('No bucket');
  await bot.goto(23, 1, 'a water balloon');
  await bot.goto(18, 3, 'a tennis ball');
  await bot.goto(16, 11, 'before Gwinn');
  await toss(bot, 'down', 'Gwinn trots off');
  await crabGap(bot);
  await bot.goto(16, 16, 'past the crabs');
  await overFlat(bot, 16, 24, 'the first sandbar');
  await bot.goto(16, 25, 'a golden shell');
  await overFlat(bot, 30, 23, 'a golden shell');
  await overFlat(bot, 35, 25, 'a golden shell');
  if (bot.sim.meter(CTR.shells) !== 4) throw new Error(`Shells: ${bot.sim.meter(CTR.shells) - 1}`);
  await overFlat(bot, 35, 16, 'back up the beach');
  await bot.goto(16, 15, 'below the crabs');
  await crabGap(bot);
  await bot.goto(16, 11, 'past the crabs');
  await bot.digFrom(8, 8, 'down', 'the sea gate', (n) => n === 'gateOpen');
  if ((await bot.goto(6, 5, 'the castle door')) !== 'link') throw new Error('No way out');
}

/**
 * Gwinn on the loose: from `stand`, Teddy goes after her a block at a time (keeping clear of
 * her, as a player would), and when she is in line two to four blocks off he
 * steps toward her (so the ball flies her way) and tosses it. When she comes too close from
 * the side, he steps out of her way.
 */
async function ambush(bot: Bot, stand: { x: number; y: number }, label: string): Promise<void> {
  await bot.goto(stand.x, stand.y, 'waiting for Gwinn');
  const dirs: Dir[] = ['left', 'right', 'up', 'down'];
  for (let t = 0; t < 3000; t++) {
    const g = bot.monsters(MON.gwinRoam)[0];
    if (!g) {
      bot.say(label);
      return;
    }
    const p = bot.sim.pos;
    const gx = g.x * 20 + g.sx - p.x * 20;
    const gy = g.y * 20 + g.sy - p.y * 20;
    for (const d of dirs) {
      const ahead = gx * STEP[d].x + gy * STEP[d].y;
      const across = Math.abs(gx * STEP[d].y + gy * STEP[d].x);
      const nx = p.x + STEP[d].x;
      const ny = p.y + STEP[d].y;
      if (across >= 8 || ahead < 45 || ahead > 85 || bot.sim.solidAt(nx, ny) || bot.current(nx, ny)) continue;
      const balls = bot.sim.meter(SEQ.fetch);
      if (balls < 1) throw new Error(`${label}: no tennis ball`);
      await bot.goto(nx, ny);
      await bot.key(SCAN.f, 2, 16);
      if (!bot.monsters(MON.gwinRoam).length) {
        bot.say(label);
        return;
      }
      bot.say('missed Gwinn');
      if (bot.sim.meter(SEQ.fetch) < 1) throw new Error(`${label}: missed, and no balls left`);
      await bot.goto(stand.x, stand.y);
      break;
    }
    if (Math.abs(gx) < 30 && Math.abs(gy) < 30) {
      // too close: step to the free neighbour farthest from her
      const away = dirs
        .map((d) => ({ d, x: p.x + STEP[d].x, y: p.y + STEP[d].y }))
        .filter((c) => !bot.sim.solidAt(c.x, c.y) && !bot.current(c.x, c.y))
        .sort(
          (a, b) => Math.hypot(b.x * 20 - g.x * 20 - g.sx, b.y * 20 - g.y * 20 - g.sy) - Math.hypot(a.x * 20 - g.x * 20 - g.sx, a.y * 20 - g.y * 20 - g.sy),
        )[0];
      if (away) await bot.goto(away.x, away.y);
      continue;
    }
    // go after her a block at a time: toward a spot three blocks off in line with her
    const bx = Math.round(g.x + g.sx / 20);
    const by = Math.round(g.y + g.sy / 20);
    const spots: { x: number; y: number }[] = [];
    for (const d of dirs) {
      const x = bx - STEP[d].x * 3;
      const y = by - STEP[d].y * 3;
      let clear = true;
      for (let k = 1; k <= 4 && clear; k++) clear = !bot.sim.solidAt(bx - STEP[d].x * k, by - STEP[d].y * k);
      if (clear && !bot.current(x, y)) spots.push({ x, y });
    }
    bot.avoid.clear();
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) bot.avoid.set(`${bx + dx},${by + dy}`, 30);
    const route = spots
      .map((c) => bot.path(c.x, c.y))
      .filter((r): r is { x: number; y: number }[] => !!r && r.length > 0)
      .sort((a, b) => a.length - b.length)[0];
    bot.avoid.clear();
    if (route) await bot.goto(route[0].x, route[0].y);
    else await bot.wait(1);
  }
  throw new Error(`${label}: Gwinn never came by`);
}

export async function hub4(bot: Bot): Promise<void> {
  expect(bot, S.hub, 'the sandbox');
  if ((await bot.goto(4, 4, 'the old burrow')) !== 'link') throw new Error('No way in');
}

export async function burrows(bot: Bot): Promise<void> {
  expect(bot, S.burrows, 'the Beetle Burrows');
  await bot.goto(1, 5, 'sand');
  await bot.goto(17, 4, 'an acorn');
  await bot.goto(27, 5, 'sand');
  await bot.digFrom(28, 7, 'up', 'a root door');
  await bot.digFrom(15, 12, 'right', 'the ford', (n) => n === 'causeway');
  await bot.digFrom(14, 12, 'right', 'the ford', (n) => n === 'causeway');
  await bot.goto(1, 12, 'an acorn');
  await bot.digFrom(2, 15, 'up', 'a root door');
  await bot.goto(1, 20, 'sand');
  // plug the beetle nests first (they keep sending beetles); if Gwinn is galumphing in the
  // way, send her off and then plug them
  const nests = async () => {
    await bot.digFrom(12, 21, 'up', 'a beetle nest', (n) => n.startsWith('plugged'));
    await bot.digFrom(12, 17, 'down', 'a beetle nest', (n) => n.startsWith('plugged'));
  };
  try {
    await nests();
  } catch (e) {
    if (!String(e).includes('No path')) throw e;
    bot.say('Gwinn is in the way');
  }
  await ambush(bot, { x: 8, y: 19 }, 'Gwinn trots off');
  if (bot.name(12, 21) === 'nest' || bot.name(12, 17) === 'nest') await nests();
  await bot.goto(23, 19, 'an acorn');
  await bot.digFrom(40, 22, 'up', 'a root door');
  if ((await bot.goto(40, 27, 'the ladder up')) !== 'link') throw new Error('No way out');
}

/** Ticks before Gwinn's next snore gust blows down the path beside her (0 while it blows). */
function calmFor(bot: Bot): number {
  const w = bot.sim.w;
  const calm = BG.id('snore');
  const tell = BG.id('snoreTell');
  const now = w.blkmap[calm];
  if (now === calm) return w.nxtchg[calm] - w.clock + w.bg[tell].ntime;
  if (now === tell) return w.nxtchg[calm] - w.clock;
  return 0;
}

/** Splashes the paw ahead (Teddy faces the way he last walked) until it is out of `kinds`. */
async function splashPaw(bot: Bot, kinds: number[], label: string): Promise<void> {
  for (let k = 0; k < 8 && bot.monsters(...kinds).length; k++) {
    if (bot.sim.meter(SEQ.splash) < 1) throw new Error(`${label}: out of water`);
    await bot.key(SCAN.b, 2, 14);
  }
  if (bot.monsters(...kinds).length) throw new Error(`${label}: the paw is still there`);
  bot.say(label);
}

export async function patio(bot: Bot): Promise<void> {
  expect(bot, S.patio, "Gwinn's nap");
  // fill up at her water bowl (it never runs dry): four splashes for her two paws
  await bot.goto(15, 18, 'a water bowl');
  for (let k = 0; k < 4 && bot.sim.meter(SEQ.splash) < 6; k++) await bot.push('up', 2, 2);
  if (bot.sim.meter(SEQ.splash) < 5) throw new Error(`Only ${bot.sim.meter(SEQ.splash) - 1} splashes`);
  bot.say('a full bucket');
  // 1. the left paw guards the path up her west side: splash it twice and she tucks it in
  await bot.goto(12, 10, 'below her left paw');
  await bot.goto(12, 9, 'below her left paw');
  await splashPaw(bot, [MON.pawL, MON.pawLAngry], 'Gwinn tucks in her left paw');
  let waited = 0;
  while (bot.monsters(MON.pawLRetreat).length) {
    await bot.wait(1);
    if (++waited > 300) throw new Error('The paw never went');
  }
  // 2. her snores blow down the path: wait at its foot for a gust to pass, then walk up
  await bot.goto(12, 7, 'the foot of the path');
  waited = 0;
  while (calmFor(bot) < 40) {
    await bot.wait(1);
    if (++waited > 300) throw new Error('Gwinn never stopped snoring');
  }
  if (waited) bot.say(`waited ${waited} ticks for a snore to pass`);
  await bot.goto(12, 2, 'up the path');
  // 3. the right paw lies across the crown's nook: splash it (it starts swiping), then again
  await bot.goto(12, 1, 'the crown nook');
  await bot.goto(13, 1, 'facing her right paw');
  await splashPaw(bot, [MON.pawR, MON.pawRAngry], 'Gwinn tucks in her right paw');
  waited = 0;
  while (bot.monsters(MON.pawRRetreat).length) {
    await bot.wait(1);
    if (++waited > 300) throw new Error('The right paw never went');
  }
  if ((await bot.goto(19, 1, 'the Crown of the Sandbox')) !== 'end') throw new Error('No crown');
}

export async function playAll(bot: Bot): Promise<void> {
  await hub1(bot);
  await keep(bot);
  await hub2(bot);
  await moat(bot);
  await hub3(bot);
  await lagoon(bot);
  await hub4(bot);
  await burrows(bot);
  await patio(bot);
}
