// The OUT AND ABOUT set's routes.
import { GROCERIES } from '../../src/groups/errands/checkout';
import type { Bot } from '../bot';
import { carefully, declaim, expect, leave, must, plot, type Route } from '../route';

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
};
