// The INTO THE WILD set's routes.
import { SCRAPS } from '../../src/groups/outside/outside';
import { carefully, declaim, expect, leave, must, plot, tips, type Route } from '../route';

export const OUTSIDE_ROUTES: Record<string, Route> = {
  /** This Is Why I Don't Go Outside: the lamp, Doc Leo, a pedestrian scared off, over the minivans and the cart, the granny, the gusts, the tree, the jogger, the bush. */
  outside: async (bot) => {
    expect(bot, 'outside');
    bot.say(`tips ${tips(bot)}`);
    await carefully(bot, 'the spotlight, the lamp', 0, async () => {
      await must(bot, bot.walk(10, 'under the lamp'), 'lamp');
      await must(bot, bot.hop('up', 12), 'up onto the lamp head');
      await must(bot, bot.walk(15, 'off the lamp, Doc Leo'), 'Leo');
    });
    await carefully(bot, 'the pedestrian', 0, async () => {
      await must(bot, bot.walk(17, 'the coin'), 'coin');
      await declaim(bot, 'IT\'S MY RECEIPT!');
      await must(bot, bot.walk(25, 'to the first minivan'), 'van');
      await must(bot, bot.hop('right', 12, 'right', 27), 'onto the first minivan');
      await must(bot, bot.walk(28, 'the coin on its roof'), 'roof');
    });
    await carefully(bot, 'the cart, the second minivan', 0, async () => {
      await must(bot, bot.hop('right', 12, 'right', 35), 'over the cart');
      await must(bot, bot.walk(36, 'onto the second minivan'), 'van');
      await must(bot, bot.walk(37, 'the coin on its roof'), 'roof');
      await must(bot, bot.hop('up', 12), 'the scrap above it');
      await must(bot, bot.walk(39, 'down off the roof'), 'down');
    });
    await carefully(bot, 'the granny, the gusts', 0, async () => {
      await must(bot, bot.walk(39.6, 'before the granny'), 'granny');
      await must(bot, bot.hop('right', 12, 'right', 43), 'over the granny');
      await must(bot, bot.walk(45, 'into the gusts'), 'gusts');
      await must(bot, bot.hop('up', 12), 'the scrap in the gusts');
      await must(bot, bot.walk(50, 'the coffee'), 'mug');
    });
    await carefully(bot, 'the tree', 0, async () => {
      await must(bot, bot.walk(51, 'onto the bin'), 'bin');
      await must(bot, bot.hop('right', 12, 'right', 52.3), 'up onto the tree');
      await must(bot, bot.walk(53.4, 'the coin and the scrap on the crown'), 'crown');
    });
    await carefully(bot, 'the jogger, the last pedestrian', 0, async () => {
      await must(bot, bot.walk(60, 'the jogger, the dollar'), 'jogger');
      await declaim(bot, 'IT\'S MY RECEIPT!');
      await must(bot, bot.walk(64, 'the coin'), 'coin');
      if (plot(bot) < SCRAPS) throw new Error(`only ${plot(bot)} scraps`);
      bot.say(`tips ${tips(bot)}`);
      await leave(bot, bot.walk(67, 'the bush'), 'the bush');
    });
  },
};
