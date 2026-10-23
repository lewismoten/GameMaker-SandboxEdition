// The HOME SWEET HOME set's routes. Each ends by checking that nothing worth picking up was
// left behind in the scene (tips, mugs, the plot).
import { buildPalette } from '../../src/art/pal';
import { BlockBook } from '../../src/common/blocks';
import { ORIGIN } from '../../src/common/maps';
import { MON } from '../../src/ids';
import { home } from '../../src/groups/home';
import { SOULS } from '../../src/groups/home/blanket';
import { SOCKS } from '../../src/groups/home/socks';
import { PIZZA_MON, SOCKS_MON } from '../../src/groups/home/ids';
import { PLOYS } from '../../src/groups/home/pizza';
import type { Bot } from '../bot';
import { carefully as carefully0, declaim, expect, leave, must, plot, type Route } from '../route';

// DEBUG
const carefully: typeof carefully0 = (bot, label, max, f) => (process.env.HOME_RAW ? f() : carefully0(bot, label, max, f));

let names: Map<number, string> | undefined;
/** The home set's block names by number. */
function blockNames(): Map<number, string> {
  if (!names) {
    const book = new BlockBook();
    home.blocks(book, buildPalette(home.ramps));
    names = new Map([...book.index].map(([k, v]) => [v, k]));
  }
  return names;
}

/** Throws if a tip, a mug or a thing of the plot is still lying in the scene (w x h blocks). */
function nothingLeft(bot: Bot, w: number, h: number): void {
  const n = blockNames();
  const left: string[] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const name = n.get(bot.sim.blockAt(x + ORIGIN, y + ORIGIN)) ?? '';
      if (/^(coin|bill|mug)@/.test(name) || /^(soul|sock|ploy|kit|like)/.test(name)) left.push(`${name} at ${x},${y}`);
    }
  const friends: number[] = [MON.carl, MON.goat, MON.leo];
  for (const m of bot.sim.w.mm) if (friends.includes(m.monnum)) left.push(`friend ${m.monnum} at ${m.curx - ORIGIN},${m.cury - ORIGIN}`);
  if (left.length) throw new Error(`left behind: ${left.join(', ')}`);
}

/** Throws unless the friend `id` has had its hello (a retry waits for a better moment). */
function greeted(bot: Bot, id: number, who: string): void {
  if (bot.sim.w.mm.some((m) => m.monnum === id)) throw new Error(`missed ${who}`);
  bot.say(`hello, ${who}`);
}

/** The foes `ids` on the poet's row, by how far they are (blocks; + to his right). */
function foesOnRow(bot: Bot, ids: number[]): number[] {
  const w = bot.sim.w;
  const me = bot.px;
  const out: number[] = [];
  w.mm.forEach((m, i) => {
    if (!ids.includes(m.monnum)) return;
    const x = (w.mi[i].curx[0] - ORIGIN) * 20 + w.mi[i].curx[1];
    const y = (w.mi[i].cury[0] - ORIGIN) * 20 + w.mi[i].cury[1];
    if (Math.abs(y - me.y) < 14) out.push((x - me.x) / 20);
  });
  return out;
}

/** Waits (up to `max` ticks) for one of the foes `ids` to come within `reach` blocks on his row, and declaims. */
async function waitAndDeclaim(bot: Bot, ids: number[], what: string, reach = 4, max = 400): Promise<void> {
  for (let t = 0; t < max; t++) {
    if (foesOnRow(bot, ids).some((d) => Math.abs(d) <= reach)) return declaim(bot, what);
    await must(bot, bot.wait(1), what);
  }
  throw new Error(`${what}: never came`);
}

export const HOME_ROUTES: Record<string, Route> = {
  /** She Took the Blanket: the armchair and the shelf over it, the bookcase and the shelf past it, the kitchen, the nightstand, the new blanket, the bed. */
  blanket: async (bot) => {
    expect(bot, 'blanket');
    await carefully(bot, 'the armchair, the shelf', 0, async () => {
      await must(bot, bot.walk(5, 'by the armchair'), 'chair');
      await must(bot, bot.hop('right', 12, 'right', 6.5), 'onto the armchair');
      await must(bot, bot.hop('right', 12, 'right', 8.5), 'up onto the shelf');
      await must(bot, bot.walk(10, 'the dollar on the shelf'), 'shelf');
    });
    await carefully(bot, 'the draft', 0, async () => {
      await must(bot, bot.walk(11, 'down, a piece of his soul'), 'down');
      await declaim(bot, 'the chill');
      await must(bot, bot.walk(16, 'the coin, under the drafty window'), 'window');
      await declaim(bot, 'the chill');
      await must(bot, bot.walk(17, 'the bookcase'), 'bookcase');
    });
    await carefully(bot, 'up the bookcase', 0, async () => {
      await must(bot, bot.hop('right', 12, 'right', 18), 'onto the cabinet');
      await must(bot, bot.hop('up', 12), 'up through the middle shelf');
      await must(bot, bot.hop('up', 12), 'up through the top shelf');
      await must(bot, bot.walk(19, 'his soul and a coin on top'), 'top');
      await must(bot, bot.hop('right', 12, 'right', 21.5), 'over to the wall shelf');
      await must(bot, bot.walk(23, 'the coin on the shelf'), 'shelf');
    });
    await carefully(bot, 'the allen keys', 0, async () => {
      await must(bot, bot.walk(24.5, 'off the shelf'), 'off');
      await declaim(bot, 'the allen keys');
      await must(bot, bot.walk(26, 'the coin'), 'coin');
      await declaim(bot, 'the allen keys');
      await must(bot, bot.walk(28, 'the coin'), 'coin');
    });
    await carefully(bot, 'the kitchen nook', 0, async () => {
      await must(bot, bot.walk(32, 'his soul, by the dish towel; Carl'), 'towel');
      greeted(bot, MON.carl, 'Carl');
      await must(bot, bot.walk(36, 'over the radiator, the dollar'), 'radiator');
      await must(bot, bot.walk(36, 'by Teddy'), 'teddy');
      await must(bot, bot.hop('right', 12, 'right', 38.5), 'over Teddy');
      await must(bot, bot.walk(41, 'the mug'), 'mug');
    });
    await carefully(bot, 'the nightstand, the shelf', 0, async () => {
      await must(bot, bot.walk(42, 'onto the nightstand, his soul'), 'nightstand');
      await must(bot, bot.hop('right', 12, 'right', 44.5), 'up onto the shelf');
      await must(bot, bot.walk(45, 'the coin on the shelf'), 'shelf');
      await must(bot, bot.walk(46.5, 'off the shelf'), 'off');
    });
    await carefully(bot, 'the new blanket', 0, async () => {
      for (const x of [47, 48, 49, 50]) {
        await declaim(bot, 'the new blanket');
        await must(bot, bot.walk(x, 'on'), 'on');
      }
      await declaim(bot, 'the new blanket');
      await must(bot, bot.walk(55, 'his soul, the coin'), 'soul');
      if (plot(bot) < SOULS) throw new Error(`only ${plot(bot)} pieces of his soul`);
      nothingLeft(bot, 64, 12);
      await leave(bot, bot.walk(56.5, 'the colder side of the bed'), 'the bed');
    });
  },
  /** Wore All the Weird Socks: the basket and the shelf, the matched pair, up the washer and dryer, along the clothesline, the ironing board, Doc Leo, the front door. */
  socks: async (bot) => {
    expect(bot, 'socks');
    await carefully(bot, 'the basket, the galaxy', 0, async () => {
      await must(bot, bot.walk(7, 'the carnival tent sock, the basket'), 'basket');
      await must(bot, bot.hop('right', 12, 'right', 8), 'onto the basket');
      await must(bot, bot.hop('right', 12, 'right', 9.5), 'up onto the shelf');
      await must(bot, bot.walk(11, 'the galaxy sock, the coin'), 'shelf');
      await must(bot, bot.walk(13, 'down, the coin'), 'down');
    });
    await carefully(bot, 'the matched pair', 0, async () => {
      await declaim(bot, 'the whispers, the pair');
      await must(bot, bot.walk(15, 'on'), 'on');
      await declaim(bot, 'the pair');
      await must(bot, bot.walk(20, 'the plain stubborn blue'), 'blue');
    });
    await carefully(bot, 'up the washer and dryer', 0, async () => {
      await must(bot, bot.hop('right', 12, 'right', 21), 'onto the basket');
      await must(bot, bot.hop('right', 12, 'right', 22.5), 'up onto the dryer');
      await declaim(bot, 'the lint');
    });
    await carefully(bot, 'the clothesline', 0, async () => {
      await waitAndDeclaim(bot, [SOCKS_MON.lint], 'the lint');
      await must(bot, bot.walk(31, 'along the clothesline'), 'line');
      await waitAndDeclaim(bot, [SOCKS_MON.lint], 'the lint out of the vent');
      await must(bot, bot.hop('up', 12), 'the coin over the line');
      await must(bot, bot.walk(34, 'down, the dollar'), 'down');
    });
    await carefully(bot, 'the second pair, the ironing board', 0, async () => {
      await declaim(bot, 'the pair');
      await must(bot, bot.walk(40, 'the floral swirl'), 'floral');
      await declaim(bot, 'the whispers');
      await must(bot, bot.walk(43, 'the ironing board'), 'board');
      await must(bot, bot.hop('right', 12, 'right', 44.5), 'onto the ironing board');
      await must(bot, bot.walk(46, 'the argyle'), 'argyle');
      await must(bot, bot.walk(53, 'down, the mug, the coin'), 'mug');
    });
    await carefully(bot, 'Doc Leo, the door', 0, async () => {
      await must(bot, bot.walk(57, 'Doc Leo: is it fashion?'), 'leo');
      greeted(bot, MON.leo, 'Doc Leo');
      if (plot(bot) < SOCKS) throw new Error(`only ${plot(bot)} socks`);
      nothingLeft(bot, 62, 12);
      await leave(bot, bot.walk(58.5, 'the front door'), 'the door');
    });
  },
  /** How the Cat Won the Pizza War: the smoke alarm's beep, up on the table past the napkin, the fork, Aunt Marge's question, over the cat, the cactus on the shelf, the pizza cutter, the spatula, the goat, the box. */
  pizza: async (bot) => {
    expect(bot, 'pizza');
    await carefully(bot, 'the smoke alarm', 0, async () => {
      await must(bot, bot.walk(5, 'the coin'), 'coin');
      await waitAndDeclaim(bot, [PIZZA_MON.beep], 'the beep');
      await must(bot, bot.walk(10, 'the table'), 'table');
    });
    await carefully(bot, 'up on the table', 0, async () => {
      await must(bot, bot.hop('right', 12, 'right', 12), 'onto the table');
      await must(bot, bot.walk(13, 'the glasses: the slow reach'), 'glasses');
      await declaim(bot, 'the sticky napkin');
      await must(bot, bot.walk(18, 'the coin'), 'coin');
      await declaim(bot, 'the fork');
      await must(bot, bot.walk(23, 'past Kevin, the tissues: the sneeze ploy'), 'tissues');
    });
    await carefully(bot, 'Aunt Marge', 0, async () => {
      await waitAndDeclaim(bot, [PIZZA_MON.dip], 'who sneezed on the dip?');
      await must(bot, bot.walk(26, 'the dollar'), 'dollar');
      await must(bot, bot.walk(29.5, 'up to the cat'), 'cat');
      await must(bot, bot.hop('right', 12, 'right', 32.5), 'over the cat');
      await must(bot, bot.walk(34, 'the cheesecake'), 'cheesecake');
    });
    await carefully(bot, 'the cactus, the pizza cutter', 0, async () => {
      await must(bot, bot.hop('right', 12, 'right', 35.5), 'up onto the shelf');
      await must(bot, bot.walk(37, 'the cactus, the coin'), 'cactus');
      await must(bot, bot.walk(40, 'down off the table'), 'down');
      await declaim(bot, 'the pizza cutter');
      await must(bot, bot.walk(48, 'the dollar, the spatula, the mug'), 'spatula');
    });
    await carefully(bot, 'the goat, the box', 0, async () => {
      await must(bot, bot.hop('right', 12, 'right', 51.5), 'over the armchair');
      await must(bot, bot.walk(55, 'the goat, the coin'), 'goat');
      greeted(bot, MON.goat, 'the goat');
      if (plot(bot) < PLOYS) throw new Error(`only ${plot(bot)} ploys`);
      nothingLeft(bot, 60, 12);
      await leave(bot, bot.walk(57.5, 'the box: make your move'), 'the box');
    });
  },
};
