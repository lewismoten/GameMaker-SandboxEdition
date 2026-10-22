// The main quest, as the bot plays it: Nowish, the King's writ, the Snooze Barrows, a steel
// sword, the Soggy Vaults, THE CHEZ across the Dawdle Flats, a lamp, the Putoff Mines and
// Deadline Keep. No side quests beyond what the money needs, no egg.
import { Bot } from './bot';

type Step = (b: Bot) => Promise<void>;
const set = (...cells: [number, number][]) => new Set(cells.map(([x, y]) => `${x},${y}`));

export const nowish: Step = async (b) => {
  await b.talk(13, 13, 'Grandma Pim');
  await b.enter(22, 39, 'out of Nowish');
};

export const toKing: Step = async (b) => {
  await b.enter(31, 45, 'Laterburg gate');
  await b.talk(74, 10, 'the King');
  await b.enter(74, 67, 'out of Laterburg');
};

export const barrows: Step = async (b) => {
  await b.enter(40, 24, 'the Snooze Barrows');
  // the writ opens the sealed door
  await b.goto(50, 68, 'the sealed door');
  await b.push('up', 8);
  await b.goto(25, 41, 'the foghorn');
  await b.goto(31, 41, 'a chest');
  await b.push('right', 3);
  await b.push('up', 3);
  await b.goto(76, 41, 'the big chest');
  await b.push('up', 3);
  await bossFight(b, 50, 31, 'Sir Snoozalot');
  await b.talk(50, 26, 'the first piece');
  await b.enter(50, 83, 'the stairs out');
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

export const ROUTE: [string, Step][] = [
  ['Nowish', nowish],
  ['The King', toKing],
  ['The Snooze Barrows', barrows],
];
