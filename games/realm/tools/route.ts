// The main quest, as the bot plays it: Nowish, the King's writ, the Snooze Barrows, a steel
// sword, the Soggy Vaults, THE CHEZ across the Dawdle Flats, a lamp, the Putoff Mines and
// Deadline Keep. No side quests beyond what the money needs, no egg.
import { Bot } from './bot';

type Step = (b: Bot) => Promise<void>;
const set = (...cells: [number, number][]) => new Set(cells.map(([x, y]) => `${x},${y}`));

export const nowish: Step = async (b) => {
  await b.talk(13, 13, 'Grandma Pim');
  await b.retry(() => b.enter(22, 39, 'out of Nowish'));
};

export const toKing: Step = async (b) => {
  await b.retry(() => b.enter(31, 45, 'Laterburg gate'));
  await b.talk(74, 10, 'the King');
  await b.retry(() => b.enter(74, 67, 'out of Laterburg'));
};

export const barrows: Step = async (b) => {
  await b.retry(() => b.enter(40, 24, 'the Snooze Barrows'));
  await b.retry(async () => {
    // the writ opens the sealed door
    await b.goto(50, 64, 'through the sealed door', set([50, 67]));
    await b.goto(25, 41, 'the foghorn');
    await b.goto(31, 41, 'a chest');
    await b.push('right', 3);
    await b.push('up', 3);
    await b.goto(76, 41, 'the big chest');
    await b.push('up', 3);
    await bossFight(b, 50, 31, 'Sir Snoozalot');
    await b.talk(50, 26, 'the first piece');
    await b.enter(50, 83, 'the stairs out');
  });
};

/** Any solid monster (a boss part) still standing. */
function bossAlive(b: Bot): boolean {
  const w = b.sim.w;
  return w.mm.some((m, i) => {
    if (m.monnum >= 64) return false;
    const pic = w.mon[m.monnum]?.pic[Math.max(0, w.mi[i].curPic)]?.[0] ?? 100;
    return pic < 100 && w.mblk[pic].solid !== 0;
  });
}

/** Walks up under a boss and swings until the way through is clear. */
async function bossFight(b: Bot, x: number, y: number, name: string): Promise<void> {
  await b.goto(x, y, name);
  b.reach = 3;
  for (let k = 0; k < 400; k++) {
    const r = await b.fight(4);
    if (r) throw new Error(`${name}: ${r}`);
    if (process.env.BOSS_LOG && k % 10 === 0) {
      const w = b.sim.w;
      const parts = w.mm.map((m, i) => [m.monnum, i] as const).filter(([m, i]) => m < 64 && w.mon[m].power >= 100 && w.mon[m].power < 200 && w.mi[i].fromchar === 0);
      b.say(`boss parts ${parts.map(([m, i]) => `${m}@${w.mi[i].curx[0]},${w.mi[i].cury[0]}`).join(' ')} pip ${w.chr.x}/${w.chr.y} steel ${b.sim.meter(13)}`);
    }
    if (bossAlive(b)) {
      // still blocked: swing straight up at the boss
      b.sim.press(72);
      await b.wait(1);
      b.sim.release(72);
      b.sim.press(57);
      await b.wait(2);
      b.sim.release(57);
      await b.wait(4);
      b.swings++;
      await b.heal();
      continue;
    }
    break;
  }
  b.reach = 2.2;
  b.say(`${name} beaten`);
}

export const steel: Step = async (b) => {
  await b.retry(() => b.enter(31, 45, 'Laterburg gate'));
  // Brokk's sword counter: walk in to pay, again to take it
  await b.goto(66, 33, 'the sword counter');
  await b.push('up', 6);
  // tonics from Mother Tansy
  await b.goto(81, 33, 'the tonics');
  await b.push('up', 6);
  await b.goto(82, 33, 'the tonics');
  await b.push('up', 6);
  await b.retry(() => b.enter(74, 67, 'out of Laterburg'));
};

export const vaults: Step = async (b) => {
  await b.retry(() => b.enter(14, 47, 'Someday Harbor'));
  // the foghorn clears the fog bank as Pip walks into it
  await b.retry(() => b.enter(16, 49, 'the Soggy Vaults', set([16, 48])));
  await b.retry(async () => {
    await bossFight(b, 50, 84, 'the Kraken');
    await b.talk(50, 90, 'the second piece');
    await b.enter(50, 17, 'the stairs up to the pier');
  });
};

export const flats: Step = async (b) => {
  // the second piece crackles: the garage gate opens for THE CHEZ
  await b.retry(() => b.enter(31, 10, 'THE CHEZ', set([31, 11])));
  b.pacifist = true;
  await b.retry(() => b.enter(92, 44, 'across the Dawdle Flats'));
  b.pacifist = false;
};

export const lamp: Step = async (b) => {
  await b.retry(() => b.enter(80, 61, 'Eventually Falls'));
  await b.goto(62, 29, "Hattie's lamp");
  await b.push('up', 6);
  await b.retry(() => b.enter(71, 64, 'out of Eventually Falls'));
};

export const mines: Step = async (b) => {
  await b.retry(() => b.enter(78, 38, 'the Putoff Mines'));
  await b.retry(async () => {
    await b.goto(50, 66, 'through the lamp door', set([50, 70]));
    await bossFight(b, 50, 27, 'Tick-Tock');
    await b.talk(50, 22, 'the third piece');
    await b.enter(50, 83, 'the stairs out');
  });
};

export const keep: Step = async (b) => {
  await b.retry(() => b.enter(76, 76, 'Deadline Keep'));
  await b.retry(async () => {
    await b.goto(50, 35, 'through the sockets', set([50, 39], [50, 38], [50, 37]));
    await bossFight(b, 50, 20, 'Lord Deadline');
    await b.goto(50, 15, 'the Round Tuit');
  });
};

export const ROUTE: [string, Step][] = [
  ['Nowish', nowish],
  ['The King', toKing],
  ['The Snooze Barrows', barrows],
  ['A steel sword', steel],
  ['The Soggy Vaults', vaults],
  ['The Dawdle Flats', flats],
  ['A lamp', lamp],
  ['The Putoff Mines', mines],
  ['Deadline Keep', keep],
];
