// The solution, as orders for the bot: both acts, the green room in both rounds (every
// question, every card on the board), and the accusation, with or without a wrong guess
// first. check.ts runs it against the built disk; demo.ts records the start of it.
import { Bot } from './bot';
import { SCAN, CTR } from '../src/ids';
import { at } from '../src/levels/theatre';
import { buildParlorBlocks, buildParlorMap, center, LINEUP, ROOM, SUSPECTS } from '../src/levels/parlor';

const PL = buildParlorMap(buildParlorBlocks()).links;

const expectScene = (bot: Bot, scene: number, what: string) => {
  if (bot.sim.scene !== scene) throw new Error(`Expected to be in ${what} (scene ${scene}), but in scene ${bot.sim.scene}`);
};

/** Act One, up to the green room door. `demo` stops after the lens and the prop table. */
export async function act1(bot: Bot, demo = false): Promise<void> {
  const g = (x: number, y: number, label: string) => bot.goto(at(x, y).x, at(x, y).y, label);
  // the box office: the office key and the seating chart
  await g(4, 44, 'box office door');
  await g(6, 40, 'the key');
  if (bot.sim.meter(CTR.keys) !== 2) throw new Error('No key');
  await g(2, 43, 'the seating chart');
  await bot.pickup('seating chart');
  // through the house and the pass door to the wings
  await g(5, 21, 'the pass door');
  await g(4, 9, 'up to the corridor');
  await g(32, 6, 'props room');
  await g(33, 3, 'the lens');
  await bot.pickup('the lens');
  await bot.key(SCAN.z, 2, 16);
  await g(45, 9, 'to the stage-right wing');
  await g(44, 13, 'under the prop table');
  if (bot.sim.blockAt(at(44, 13).x, at(44, 13).y) === bot.sim.blockAt(at(43, 13).x, at(43, 13).y)) throw new Error('The stub did not show');
  await bot.pickup('the ticket stub');
  await g(47, 13, 'the checklist');
  await bot.pickup('the checklist');
  if (demo) return;
  await g(40, 7, "outside Crane's office");
  await bot.push('up', 2, 6);
  await g(42, 4, 'the policy');
  await bot.pickup('the insurance policy');
  await g(27, 7, 'the green room door');
  const evidence = bot.sim.meter(CTR.evidence) - 1;
  if (evidence !== 4) throw new Error(`Act One evidence ${evidence}`);
  await bot.through('up');
}

/** The green room: every card on the board, every question for every suspect, then out. */
export async function greenRoom(bot: Bot, round: 1 | 2, ix: { hub: number; ivs: number[][]; evs: number[] }, everything = true): Promise<void> {
  const key = round === 1 ? 'gr1' : 'gr2';
  if (everything) {
    for (const [i, pin] of PL.pins[key].entries()) {
      const r = await bot.goto(pin.x, pin.y, `board card ${i}`);
      if (r !== 'link') throw new Error('Board card did not link');
      expectScene(bot, ix.evs[i], `board card ${i}`);
    }
    for (const [i] of SUSPECTS.entries()) {
      const t = PL.talk[key][i];
      if ((await bot.goto(t.x, t.y, `sit with ${SUSPECTS[i]}`)) !== 'link') throw new Error('No talk');
      expectScene(bot, ix.ivs[i][0], `${SUSPECTS[i]} hello`);
      const cards = PL.cards[round === 1 ? 'r1' : 'r2'][i];
      for (let q = 0; q < 3; q++) {
        const cell = cards[q][q === 2 ? 1 : 0];
        if ((await bot.goto(cell.x, cell.y, `ask ${SUSPECTS[i]} ${q + 1}`)) !== 'link') throw new Error('No question');
        expectScene(bot, ix.ivs[i][q + 1], `${SUSPECTS[i]} answer ${q + 1}`);
        const c = center(ROOM[round === 1 ? 'r1' : 'r2'](i));
        if (bot.sim.pos.x !== c.x || bot.sim.pos.y !== c.y) throw new Error('Not back in the middle of the room');
      }
      const ex = PL.ivExit[round === 1 ? 'r1' : 'r2'][i];
      if ((await bot.goto(ex.x, ex.y, 'end the talk')) !== 'link') throw new Error('No exit');
      expectScene(bot, ix.hub, 'the green room');
    }
  }
  const out = PL.grExit[key];
  if ((await bot.goto(out.x, out.y, 'leave the green room')) !== 'link') throw new Error('No way out');
}

/** At 2 AM, the green room's sofa: push on it with the lens in hand, then step into the seat. */
export async function findEgg(bot: Bot, eggScene: number): Promise<void> {
  const lens = bot.sim.meter(CTR.lens);
  const egg = bot.sim.meter(CTR.egg);
  await bot.goto(PL.sofa.x - 1, PL.sofa.y, 'beside the sofa');
  for (let t = 0; t < 6 && bot.sim.scene !== eggScene; t++) await bot.push('right', 2, 4);
  expectScene(bot, eggScene, 'the sofa');
  if (bot.sim.meter(CTR.lens) !== lens - 1) throw new Error('The sofa did not take a lens charge');
  if (bot.sim.meter(CTR.egg) !== egg + 1) throw new Error(`Egg counter ${bot.sim.meter(CTR.egg)}`);
  bot.say('found the felt egg between the sofa cushions');
}

/** Act Two, up to the green room door. */
export async function act2(bot: Bot): Promise<void> {
  const g = (x: number, y: number, label: string) => bot.goto(at(x, y).x, at(x, y).y, label);
  // keep to the north lane of the corridor; the watchman walks the south one
  for (let x = 1; x < 49; x++) bot.avoid.set(`${at(x, 8).x},${at(x, 8).y}`, 6);
  await g(46, 7, 'watch room door');
  await g(47, 3, 'the lantern');
  await bot.pickup('the lantern');
  // the safe: raven, rose, moon
  await g(40, 7, 'office door');
  for (const [x, turns] of [
    [40, 1],
    [41, 2],
    [42, 3],
  ] as const) {
    await g(x, 2, `dial at ${x}`);
    for (let t = 0; t < turns; t++) await bot.push('up', 1, 3);
  }
  if (bot.sim.meter(CTR.dials) !== 4) throw new Error(`Dials read ${bot.sim.meter(CTR.dials) - 1} right`);
  await g(43, 2, 'the safe');
  await bot.push('up', 2, 4);
  await g(43, 1, 'into the safe');
  await bot.pickup('the manuscript');
  // down to the lobby: the cloakroom and the booth
  await g(4, 9, 'stage-left wing');
  await g(5, 21, 'the pass door');
  await g(40, 42, 'cloakroom door');
  await g(46, 42, 'the ledger');
  await bot.pickup('the cloakroom ledger');
  await g(40, 46, 'booth door');
  await g(47, 46, 'the cue sheet');
  await bot.pickup('the cue sheet');
  // the history wall: the lens reads the Courier's misprint right, and the plaque pays 1776
  await readHistoryWall(bot);
  // through the pit gate and the pit door, into the dark under the stage
  await g(37, 24, 'the pit gate');
  await g(39, 23, 'the pit door');
  await g(51, 23, 'under the stage');
  await g(81, 21, 'the umbrella in the prop vault');
  await bot.pickup('the umbrella');
  await g(51, 18, 'the trap stairs');
  await g(48, 18, 'the stage-right wing');
  await g(45, 9, 'the corridor');
  await g(27, 7, 'the green room door');
  const evidence = bot.sim.meter(CTR.evidence) - 1;
  if (evidence !== 8) throw new Error(`Act Two evidence ${evidence}`);
  await bot.through('up');
  bot.avoid.clear();
}

/** The lobby's history wall: both smudged words of the clipping under the lens, then the plaque. */
async function readHistoryWall(bot: Bot): Promise<void> {
  const g = (x: number, y: number, label: string) => bot.goto(at(x, y).x, at(x, y).y, label);
  const block = (x: number) => bot.sim.blockAt(at(x, 39).x, at(x, 39).y);
  for (const x of [26, 28]) {
    const before = block(x);
    const lens = bot.sim.meter(CTR.lens);
    await g(x, 40, `the clipping at ${x}`);
    await bot.push('up', 2, 4);
    if (block(x) === before || bot.sim.meter(CTR.lens) !== lens - 1) throw new Error(`The lens did not read the clipping at ${x}`);
  }
  const score = bot.sim.ci.score;
  await g(23, 40, 'the plaque');
  await bot.push('up', 2, 4);
  if (bot.sim.ci.score !== score + 1776) throw new Error(`The plaque paid ${bot.sim.ci.score - score}`);
  await bot.push('up', 2, 4);
  if (bot.sim.ci.score !== score + 1776) throw new Error('The plaque paid twice');
  bot.say('read the history wall: RAVEN BRIDE, and 1776 points');
}

/** Dawn: name the killer, how and why. `wrong` first tries the given wrong suspect. */
export async function accuse(bot: Bot, ix: { how: number; why: number; wrong: number; acc: number }, wrong?: string): Promise<void> {
  const spot = (who: string) => PL.spots[LINEUP.indexOf(who as (typeof LINEUP)[number])];
  if (wrong) {
    const s = spot(wrong);
    await bot.goto(s.x, s.y, `accuse ${wrong}`);
    // the curtain cell forwards at once to the Commissioner, who strikes
    for (let t = 0; t < 400 && bot.sim.scene !== ix.wrong; t++) await bot.wait(1);
    const lives = bot.sim.ci.lives;
    let died = false;
    for (let t = 0; t < 200 && !died; t++) died = (await bot.wait(1)) === 'dead';
    if (!died) throw new Error('No strike');
    if (bot.sim.ci.lives !== lives - 1) throw new Error('The strike did not cost a chance');
    bot.say('struck once; walking back');
    // the second time in the room there is no strike pending
    if ((await bot.wait(60)) === 'dead') throw new Error('Struck twice for one wrong answer');
    await bot.goto(PL.wrongExit.x, PL.wrongExit.y, 'back to the stage');
    expectScene(bot, ix.acc, 'the stage');
  }
  const p = spot('pike');
  if ((await bot.goto(p.x, p.y, 'accuse Pike')) !== 'link') throw new Error('No link');
  expectScene(bot, ix.how, 'how');
  if ((await bot.goto(PL.how[0][0].x, PL.how[0][0].y, 'the swap')) !== 'link') throw new Error('No link');
  expectScene(bot, ix.why, 'why');
  await bot.goto(PL.why[2][1].x, PL.why[2][1].y, 'the stolen play');
  for (let t = 0; t < 200 && !bot.sim.ended; t++) await bot.wait(1);
  if (bot.sim.ended !== 'won') throw new Error('Not won');
  bot.say('CASE CLOSED');
}
