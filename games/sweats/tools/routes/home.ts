// The HOME SWEET HOME set's routes. Each ends by checking that nothing worth picking up was
// left behind in the scene (tips, mugs, the plot).
import { buildPalette } from '../../src/art/pal';
import { BlockBook } from '../../src/common/blocks';
import { ORIGIN } from '../../src/common/maps';
import { MON } from '../../src/ids';
import { home } from '../../src/groups/home';
import { SOULS } from '../../src/groups/home/blanket';
import { SOCKS } from '../../src/groups/home/socks';
import { DBLTAP_MON, ITCH_MON, PIZZA_MON, SOCKS_MON } from '../../src/groups/home/ids';
import { PLOYS } from '../../src/groups/home/pizza';
import { KIT } from '../../src/groups/home/itch';
import { CAUSES } from '../../src/groups/home/dbltap';
import type { Bot } from '../bot';
import { carefully, declaim, expect, leave, must, plot, type Route } from '../route';

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
      if (/^(coin|bill|mug)@/.test(name) || /^(soul@|sock\d|ploy\d|kit\d|like\d)/.test(name)) left.push(`${name} at ${x},${y}`);
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
async function waitAndDeclaim(bot: Bot, ids: number[], what: string, reach = 4, max = 200): Promise<void> {
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
  /** Janet, This Is Not About You: up on Janet's table past the itch and her TSKs for the napkin, out the door, over the toddler, the keys, the eyebrow hair, the glasses, the itch's ghosts, up the dumpster for the sanitizer, Carl, the HONKs, the car. */
  itch: async (bot) => {
    expect(bot, 'itch');
    await carefully(bot, "Janet's table", 0, async () => {
      await must(bot, bot.walk(5, 'the table'), 'table');
      await must(bot, bot.hop('right', 12, 'right', 6.5), 'onto the table');
      await waitAndDeclaim(bot, [ITCH_MON.ghost], 'the itch');
      await waitAndDeclaim(bot, [ITCH_MON.tsk], 'TSK');
      await must(bot, bot.walk(13, 'the napkin'), 'napkin');
      await must(bot, bot.walk(19, 'the mug, out the door'), 'door');
    });
    await carefully(bot, 'the toddler, the keys, the eyebrow hair', 0, async () => {
      await must(bot, bot.walk(21.5, 'the coin, the toddler'), 'toddler');
      await must(bot, bot.hop('right', 12, 'right', 24.5), 'over the toddler');
      await must(bot, bot.walk(28, 'the keys, the dollar'), 'keys');
      await declaim(bot, 'the eyebrow hair');
      await must(bot, bot.walk(30, 'on'), 'on');
      await declaim(bot, 'the eyebrow hair');
      await must(bot, bot.walk(37, 'the tinted glasses'), 'glasses');
    });
    await carefully(bot, 'the itch, the dumpster', 0, async () => {
      await waitAndDeclaim(bot, [ITCH_MON.ghost], 'the itch');
      await must(bot, bot.walk(42.5, 'the coin, the dumpster'), 'dumpster');
      await must(bot, bot.hop('right', 12, 'right', 44.5), 'onto the dumpster');
      await must(bot, bot.walk(45, 'the sanitizer'), 'sanitizer');
      await must(bot, bot.walk(49, 'down, the mug, Carl'), 'mug');
      greeted(bot, MON.carl, 'Carl');
    });
    await carefully(bot, 'the last itch, the HONKs, the car', 0, async () => {
      await waitAndDeclaim(bot, [ITCH_MON.ghost, ITCH_MON.honk], 'the itch, HONK');
      await must(bot, bot.walk(51, 'the coin'), 'coin');
      await waitAndDeclaim(bot, [ITCH_MON.ghost, ITCH_MON.honk], 'the itch, HONK');
      await must(bot, bot.walk(54, 'on'), 'on');
      await waitAndDeclaim(bot, [ITCH_MON.honk], 'HONK');
      if (plot(bot) < KIT) throw new Error(`only ${plot(bot)} of the kit`);
      nothingLeft(bot, 64, 12);
      await leave(bot, bot.walk(57.5, 'the car behind the bank'), 'the car');
    });
  },
  /** Double Tap for Justice: over the couch and Teddy, in through the phone, up the posts to page six, the petitions, the trending tags, the newsletters, the outlier, Doc Leo, the turtles, POST. */
  dbltap: async (bot) => {
    expect(bot, 'dbltap');
    await carefully(bot, 'the couch, the phone', 0, async () => {
      await must(bot, bot.walk(3, 'the coin, the couch'), 'couch');
      await must(bot, bot.hop('right', 12, 'right', 6.2), 'over the couch');
      await must(bot, bot.walk(7.5, 'the bowl of cereal'), 'cereal');
      await must(bot, bot.hop('right', 12, 'right', 10.5), 'over Teddy');
      await must(bot, bot.walk(15, 'in through the phone'), 'phone');
    });
    await carefully(bot, 'up to page six', 0, async () => {
      await must(bot, bot.hop('right', 12, 'right', 16.5), 'onto a post');
      await must(bot, bot.walk(18, 'the coin'), 'coin');
      await must(bot, bot.hop('right', 12, 'right', 20.5), 'up to the next post');
      await must(bot, bot.walk(21, 'a like'), 'like');
      await must(bot, bot.walk(23.5, 'down off the posts'), 'down');
    });
    await carefully(bot, 'the petitions, the trends', 0, async () => {
      await declaim(bot, 'the petition');
      await must(bot, bot.walk(25, 'the dollar'), 'dollar');
      await waitAndDeclaim(bot, [DBLTAP_MON.trend, DBLTAP_MON.petition], 'the trend, the petition');
      await must(bot, bot.walk(27, 'on'), 'on');
      await waitAndDeclaim(bot, [DBLTAP_MON.trend, DBLTAP_MON.petition], 'the trend, the petition');
      await must(bot, bot.walk(32, 'the papaya'), 'papaya');
      await declaim(bot, 'the newsletter');
    });
    await carefully(bot, 'the outlier on the post', 0, async () => {
      await must(bot, bot.walk(33.5, 'by the post'), 'post');
      await must(bot, bot.hop('right', 12, 'right', 35), 'onto the post');
      await waitAndDeclaim(bot, [DBLTAP_MON.shroom], 'the outlier');
      await must(bot, bot.walk(38, 'the pomelo, the coin'), 'pomelo');
      await must(bot, bot.hop('right', 12, 'right', 41), 'up to the high post');
      await must(bot, bot.walk(43, 'the mug'), 'mug');
      await must(bot, bot.walk(44.5, 'down'), 'down');
    });
    await carefully(bot, 'Doc Leo, the turtles, POST', 0, async () => {
      await must(bot, bot.walk(47, 'Doc Leo, the mushroom pin'), 'pin');
      greeted(bot, MON.leo, 'Doc Leo');
      await waitAndDeclaim(bot, [DBLTAP_MON.shroom], 'the outlier');
      await must(bot, bot.walk(52.5, 'the coin'), 'coin');
      await must(bot, bot.hop('right', 12, 'right', 56.5), 'over the turtle');
      if (plot(bot) < CAUSES) throw new Error(`only ${plot(bot)} causes`);
      nothingLeft(bot, 64, 12);
      await leave(bot, bot.walk(58.5, 'POST'), 'POST');
    });
  },
};
