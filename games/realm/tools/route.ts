// The main quest, as the bot plays it: Nowish, the King's writ, the Snooze Barrows, a steel
// sword, the Soggy Vaults, THE CHEZ across the Dawdle Flats, a lamp, the Putoff Mines and
// Deadline Keep, where Lord Deadline fights on out of his armor. No side quests beyond what the
// money needs, no egg.
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
    await bossFight(b, 50, 30, 'Sir Snoozalot');
    await b.talk(50, 26, 'the first piece');
    await b.enter(50, 83, 'the stairs out');
  });
};

/** The boss's parts still standing (solid monsters): slot and block. */
function bossParts(b: Bot): { slot: number; x: number; y: number }[] {
  const w = b.sim.w;
  const out: { slot: number; x: number; y: number }[] = [];
  w.mm.forEach((m, i) => {
    if (m.monnum >= 64) return;
    const pic = w.mon[m.monnum]?.pic[Math.max(0, w.mi[i].curPic)]?.[0] ?? 100;
    if (pic < 100 && w.mblk[pic].solid !== 0)
      out.push({ slot: i, x: Math.round(w.mi[i].curx[0] + w.mi[i].curx[1] / 20), y: Math.round(w.mi[i].cury[0] + w.mi[i].cury[1] / 20) });
  });
  return out;
}

/**
 * Beats a boss (four solid parts, two blocks square) the way a player does: stands right under
 * (or, facing down, over) the nearest part he can reach, faces it and swings until it's gone,
 * then steps into the gap for the part behind it and does the other column the same way.
 * Foes that come close get a swing first; the boss's own parts never pull him away.
 */
async function bossFight(b: Bot, x: number, y: number, name: string, face: 'up' | 'down' = 'up'): Promise<void> {
  await b.goto(x, y, name);
  b.say(`fighting ${name}`);
  b.boss = true;
  const dy = face === 'up' ? 1 : -1;
  const key = face === 'up' ? 72 : 80;
  // the square's near edge (its bottom row facing up, its top row facing down)
  const start = bossParts(b).map((q) => q.y);
  let far = 0;
  const edge = face === 'up' ? Math.max(...start) : Math.min(...start);
  for (let k = 0; k < 400; k++) {
    const parts = bossParts(b);
    if (!parts.length) break;
    const r = await b.fight(4);
    if (r) throw new Error(`${name}: ${r}`);
    // a column with a part left, nearest first: stand just outside the boss's square under it
    // (a slash flies on through the gap a beaten part leaves)
    const p = b.sim.pos;
    const open = parts
      .map((q) => ({ ...q, sx: q.x, sy: edge + dy }))
      .filter((q) => !b.sim.solidAt(q.sx, q.sy))
      .sort((m, n) => Math.abs(m.sx - p.x) + Math.abs(m.sy - p.y) - (Math.abs(n.sx - p.x) + Math.abs(n.sy - p.y)) || (n.y - m.y) * dy);
    const t = open[0];
    if (!t) throw new Error(`${name}: no way to reach a part`);
    if (p.x !== t.sx || p.y !== t.sy || p.sx || p.sy) {
      const g = await b.goto(t.sx, t.sy, process.env.BOSS_LOG ? `next to ${t.x},${t.y}` : '');
      if (g) throw new Error(`${name}: ${g}`);
    }
    if (!b.stepTouchesLink(face)) {
      b.sim.press(key);
      await b.wait(1);
      b.sim.release(key);
    }
    b.sim.press(57);
    await b.wait(2);
    b.sim.release(57);
    await b.wait(4);
    b.swings++;
    far = Math.max(far, Math.abs(b.sim.pos.x - x) + Math.abs(b.sim.pos.y - y));
    if (process.env.BOSS_LOG) b.say(`swing ${face} from ${b.sim.pos.x},${b.sim.pos.y} at ${t.x},${t.y}; parts ${parts.map((q) => `${q.x},${q.y}`).join(' ')}`);
    await b.heal();
  }
  if (bossParts(b).length) throw new Error(`${name}: still standing`);
  b.boss = false;
  b.say(`${name} beaten (never more than ${far} blocks from where the fight began)`);
}

/** Lord Deadline on foot (the only monster whose attack has six corners: addDuelist in src/build/dungeons.ts). */
function runnerSlot(b: Bot): number {
  return b.sim.w.mm.findIndex((m) => {
    const mon = m.monnum < 64 ? b.sim.w.mon[m.monnum] : undefined;
    return mon?.activate === 2 && mon.march[1][5]?.pic === 2 && mon.march[1][2]?.pic === 4;
  });
}

/** Lord Deadline's second act: out of his armor and on foot, he runs at Pip; swing till he drops. */
async function onFoot(b: Bot): Promise<void> {
  const runner = () => runnerSlot(b);
  b.say('Lord Deadline, on foot');
  for (let k = 0; k < 600 && runner() >= 0; k++) {
    const r = (await b.fight(4)) ?? (await b.wait(1));
    if (r) throw new Error(`Lord Deadline on foot: ${r}`);
  }
  if (runner() >= 0) throw new Error('Lord Deadline on foot: still running');
  b.say('Lord Deadline caught');
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
    await bossFight(b, 50, 85, 'the Kraken', 'down');
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
    await bossFight(b, 50, 26, 'Tick-Tock');
    await b.talk(50, 22, 'the third piece');
    await b.enter(50, 83, 'the stairs out');
  });
};

export const keep: Step = async (b) => {
  await b.retry(() => b.enter(76, 76, 'Deadline Keep'));
  await b.retry(async () => {
    await b.goto(50, 35, 'through the sockets', set([50, 39], [50, 38], [50, 37]));
    await bossFight(b, 50, 19, 'Lord Deadline');
    await onFoot(b);
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
