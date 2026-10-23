// The HOME SWEET HOME set's routes. Each ends by checking that nothing worth picking up was
// left behind in the scene (tips, mugs, the plot).
import { buildPalette } from '../../src/art/pal';
import { BlockBook } from '../../src/common/blocks';
import { ORIGIN } from '../../src/common/maps';
import { MON } from '../../src/ids';
import { home } from '../../src/groups/home';
import { SOULS } from '../../src/groups/home/blanket';
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
};
