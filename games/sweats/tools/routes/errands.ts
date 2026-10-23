// The OUT AND ABOUT set's routes.
import { SCARS } from '../../src/groups/errands/cashier';
import { GROCERIES } from '../../src/groups/errands/checkout';
import { PLATES } from '../../src/groups/errands/plates';
import type { Bot } from '../bot';
import { carefully, declaim, expect, leave, must, plot, tips, type Route } from '../route';

/** Throws unless the poet stands on row `row` (a solid foe can push him down into the floor). */
function floor(bot: Bot, row: number, what: string): void {
  if (bot.px.y !== row * 20) throw new Error(`${what}: on row ${(bot.px.y / 20).toFixed(2)}, not ${row}`);
}

export const ERRANDS_ROUTES: Record<string, Route> = {
  /** The Self-Checkout: up aisle three's shelves (the bread, the kale), over to the cooler, the milk, the self-checkouts, the milk jug, the eggs in aisle five. */
  checkout: async (bot) => {
    expect(bot, 'checkout');
    await carefully(bot, 'in the door', 0, async () => {
      await must(bot, bot.walk(5, 'the coin by the carts'), 'carts');
      await must(bot, bot.walk(8, 'aisle three'), 'aisle');
      await must(bot, bot.hop('up', 12), 'up through the bottom shelf');
    });
    await carefully(bot, 'aisle three', 0, async () => {
      await declaim(bot, 'the loyalty card');
      await must(bot, bot.walk(9, 'the bread'), 'bread');
      await declaim(bot, 'the loyalty card again');
      await must(bot, bot.walk(10, 'under the top shelf'), 'under');
      await must(bot, bot.hop('up', 12), 'up through the top shelf: the coin');
      await must(bot, bot.walk(13, 'the dollar'), 'dollar');
      await must(bot, bot.walk(16, 'the kale'), 'kale');
      await must(bot, bot.walk(18, 'the end of the shelf'), 'end');
      await must(bot, bot.hop('right', 12, 'right', 21.5), 'over to the cooler top');
      await must(bot, bot.walk(24, 'the dollar on the cooler'), 'cooler dollar');
      await must(bot, bot.walk(26.5, 'down off the cooler'), 'down');
      await must(bot, bot.walk(23, 'the milk'), 'milk');
    });
    await carefully(bot, 'the free sample', 0, async () => {
      await declaim(bot, 'unexpected item');
      await must(bot, bot.walk(26, 'toward the checkouts'), 'toward');
      await declaim(bot, 'unexpected item');
      await must(bot, bot.walk(28, 'the free sample, the coffee'), 'sample');
    });
    await carefully(bot, 'the self-checkouts', 0, async () => {
      await declaim(bot, 'unexpected item');
      await must(bot, bot.walk(30, 'the coin'), 'coin');
      await declaim(bot, 'unexpected item');
      await must(bot, bot.walk(32.5, 'by the slowest employee'), 'clerk');
      await must(bot, bot.hop('right', 12, 'right', 38), 'over the employee, the coin');
      floor(bot, 10, 'over the employee');
      await must(bot, bot.walk(41, 'the coin'), 'coin');
      await declaim(bot, 'the loyalty card');
      await must(bot, bot.walk(43, 'the dollar'), 'dollar');
      await must(bot, bot.walk(48, 'the coin before the boss'), 'coin');
    });
    await carefully(bot, 'the milk jug', 0, async () => {
      for (const s of ['furious', 'too big', 'held mid-air']) await declaim(bot, `the milk jug: ${s}`);
      await must(bot, bot.walk(56, 'past the jug'), 'past');
    });
    await carefully(bot, 'aisle five', 0, async () => {
      await must(bot, bot.walk(60, 'Doc Leo, aisle five'), 'leo');
      await must(bot, bot.hop('up', 12), 'up through the shelf: the coin');
      await must(bot, bot.walk(64, 'the eggs'), 'eggs');
      await must(bot, bot.walk(66, 'the coin'), 'coin');
      await must(bot, bot.walk(68.5, 'down, the coin'), 'down');
      if (plot(bot) < GROCERIES) throw new Error(`only ${plot(bot)} groceries`);
      await leave(bot, bot.walk(70.5, 'the last self-checkout: SCAN, PAY, GO'), 'the gate');
    });
  },

  /** Cart Return Seven: the rogue cart, past the devil, onto a car's roof, over the reversing minivan, up the lot (the receipt, the balloon, the goose, the flip-flop, the wind), the cashier's nod. */
  cashier: async (bot) => {
    expect(bot, 'cashier');
    await carefully(bot, 'the rogue cart', 0, async () => {
      await must(bot, bot.walk(6, 'the rogue cart'), 'cart');
      await declaim(bot, 'the devil on his shoulder');
      await must(bot, bot.walk(9, 'the coin'), 'coin');
      await declaim(bot, 'the devil again');
      await must(bot, bot.walk(13, 'the coin by the lamp'), 'coin');
      await must(bot, bot.walk(14, 'by the parked car'), 'car');
      await must(bot, bot.hop('right', 12, 'right', 16), 'onto the roof: the dollar');
      floor(bot, 9, 'the roof');
    });
    await carefully(bot, 'the gnats and the minivan', 0, async () => {
      await declaim(bot, 'the gnats');
      await must(bot, bot.walk(19, 'down off the roof'), 'roof end');
      await declaim(bot, 'the gnats again');
      await must(bot, bot.walk(21.5, 'up to the minivan'), 'van');
      await must(bot, bot.hop('right', 12, 'right', 27.5), 'over the minivan, the coin');
      floor(bot, 11, 'past the minivan');
    });
    await carefully(bot, 'up the lot', 0, async () => {
      await must(bot, bot.walk(31, 'up a step, the receipt'), 'receipt');
      await declaim(bot, 'the balloon');
      await must(bot, bot.walk(37, 'by the child'), 'child');
      await must(bot, bot.hop('right', 12, 'right', 39), 'onto the car roof: the coin');
      await must(bot, bot.walk(41.5, 'down, the coin'), 'coin');
      await must(bot, bot.walk(43, 'up a step'), 'step');
      await declaim(bot, 'the goose');
      await must(bot, bot.walk(45, 'the coin'), 'coin');
      await declaim(bot, 'the goose again');
      await must(bot, bot.walk(53, 'the flip-flop, the coffee'), 'flip-flop');
    });
    await carefully(bot, 'the top of the lot', 0, async () => {
      await declaim(bot, 'the wind');
      await must(bot, bot.walk(55, 'up the last step'), 'step');
      await declaim(bot, 'the wind');
      await must(bot, bot.walk(58, 'the coin'), 'coin');
      await declaim(bot, 'the wind');
      await must(bot, bot.walk(60, 'the coin, Carl'), 'coin');
    });
    await carefully(bot, 'the cashier, cart return seven', 0, async () => {
      const before = tips(bot);
      await must(bot, bot.walk(66, 'the cashier behind the dumpsters, the dollar'), 'cashier');
      if (tips(bot) < before + 6) throw new Error('no nod from the cashier');
      if (plot(bot) < SCARS) throw new Error(`only ${plot(bot)} scars of honor`);
      await leave(bot, bot.walk(68.5, 'cart return seven'), 'the gate');
    });
  },

  /** Table Seven: the soup bowl off table seven, past the phantoms, the pasta plate, the goat, up the leaning tower for the dessert plate, the entree plate, past the kitchen's whispers, over the busboy, the bus tub. */
  plates: async (bot) => {
    expect(bot, 'plates');
    await carefully(bot, 'table seven', 0, async () => {
      await must(bot, bot.walk(3, 'by table seven'), 'table');
      await must(bot, bot.hop('right', 12, 'right', 5), 'onto table seven');
      floor(bot, 8, 'table seven');
      await must(bot, bot.walk(6, 'the soup bowl'), 'soup');
      await must(bot, bot.walk(8.5, 'down off the table'), 'down');
      await declaim(bot, 'the dining-room phantom');
    });
    await carefully(bot, 'the second table', 0, async () => {
      await must(bot, bot.walk(12, 'by the second table'), 'table');
      await must(bot, bot.hop('right', 12, 'right', 13.2), 'onto it: the coin');
      floor(bot, 8, 'the second table');
      await must(bot, bot.walk(14, 'the pasta plate'), 'pasta');
      await must(bot, bot.walk(16.5, 'down off it'), 'down');
      const before = tips(bot);
      await must(bot, bot.walk(18, 'the goat'), 'goat');
      if (tips(bot) <= before) throw new Error('no hello from the goat');
      await must(bot, bot.walk(17.5, 'out of the chuckle’s way'), 'back');
    });
    await carefully(bot, 'the leaning tower', 0, async () => {
      await declaim(bot, 'the chuckle');
      await must(bot, bot.walk(23, 'past the host stand, the coin'), 'coin');
      await declaim(bot, 'the chuckle, the grease stain');
      await must(bot, bot.walk(26, 'into the tower'), 'tower');
      await must(bot, bot.hop('up', 12), 'up the tower');
      await must(bot, bot.hop('up', 12), 'to the top: the dessert plate');
      floor(bot, 6, 'the top of the tower');
      await declaim(bot, 'from the top');
    });
    await carefully(bot, 'the third table', 0, async () => {
      await must(bot, bot.walk(28, 'down off the tower'), 'down');
      await declaim(bot, 'the grease stain, the phantom');
      await must(bot, bot.walk(29, 'the coin'), 'coin');
      await declaim(bot, 'the phantom');
      await must(bot, bot.walk(33, 'by the third table'), 'table');
      await must(bot, bot.hop('right', 12, 'right', 35), 'onto it: the coin');
      floor(bot, 8, 'the third table');
      await must(bot, bot.walk(37, 'the entree plate, the dollar'), 'plates');
      await must(bot, bot.walk(38.5, 'down off it'), 'down');
    });
    await carefully(bot, 'the kitchen doors, the busboy', 0, async () => {
      await declaim(bot, 'the whispers');
      await must(bot, bot.walk(41, 'toward the kitchen'), 'kitchen');
      await declaim(bot, 'the whispers');
      await must(bot, bot.walk(46, 'past the doors: the coffee'), 'coffee');
      await must(bot, bot.walk(47.5, 'by the busboy'), 'busboy');
      await must(bot, bot.hop('right', 12, 'right', 52.5), 'over the busboy');
      floor(bot, 10, 'over the busboy');
      await must(bot, bot.walk(53, 'the coin'), 'coin');
      if (plot(bot) < PLATES) throw new Error(`only ${plot(bot)} plates`);
      await leave(bot, bot.walk(56.5, 'the bus tub'), 'the gate');
    });
  },
};
