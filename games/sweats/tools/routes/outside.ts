// The INTO THE WILD set's routes.
import { SUPPLIES } from '../../src/groups/outside/ants';
import { PROPS } from '../../src/groups/outside/cardbrd';
import { MENDS } from '../../src/groups/outside/umbrella';
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
      await must(bot, bot.walk(68, 'the bush'), 'the bush');
      await leave(bot, bot.walk(69.5, 'the walk-off'), 'the walk-off');
    });
  },
  /** The Ants Have Spoken: the dust of 1978, the trenches (ants scattered, sandbags hopped), the counter (towels, bleach), over the picket line (gloves), the fridge (sponge), the bug disco and its king, the cupboard. */
  ants: async (bot) => {
    expect(bot, 'ants');
    await carefully(bot, 'the dust of 1978', 0, async () => {
      await must(bot, bot.walk(5, 'the spotlight, a coin'), 'coin');
      await declaim(bot, 'the dust bunnies');
      await must(bot, bot.walk(10, 'past the vent'), 'vent');
    });
    await carefully(bot, 'the trenches', 0, async () => {
      await declaim(bot, 'the first patrol');
      await must(bot, bot.walk(12, 'onto the first sandbags'), 'bags');
      await must(bot, bot.walk(15, 'down the far side'), 'down');
      await declaim(bot, 'the second patrol');
      await must(bot, bot.walk(18, 'onto the second sandbags'), 'bags');
      await must(bot, bot.walk(22, 'the coin'), 'coin');
      await must(bot, bot.walk(24, 'over the last sandbags'), 'bags');
    });
    await carefully(bot, 'the counter', 0, async () => {
      await must(bot, bot.walk(30, 'under the counter'), 'counter');
      await must(bot, bot.hop('up', 12), 'up onto the counter: the paper towels');
      await must(bot, bot.walk(33, 'the bleach'), 'bleach');
      await must(bot, bot.walk(36.4, 'down, the dollar'), 'dollar');
    });
    await carefully(bot, 'the picket line', 0, async () => {
      const had = plot(bot);
      await must(bot, bot.hop('right', 12, 'right', 41.5), 'over the picket line, the gloves');
      if (plot(bot) === had) throw new Error('missed the gloves');
    });
    await carefully(bot, 'the fridge', 0, async () => {
      await must(bot, bot.walk(43, 'onto the fridge: the sponge'), 'fridge');
      await must(bot, bot.walk(45.5, 'the coffee'), 'mug');
    });
    await carefully(bot, 'the bug disco', 0, async () => {
      await declaim(bot, 'opera');
      await must(bot, bot.walk(53, 'the coin, the prayer candle'), 'candle');
      await declaim(bot, 'opera');
      await must(bot, bot.walk(58, 'the coin'), 'coin');
      await declaim(bot, 'the king\'s hat');
      await declaim(bot, 'the king');
      if (plot(bot) < SUPPLIES) throw new Error(`only ${plot(bot)} supplies`);
      await must(bot, bot.walk(64, 'the cupboard'), 'the cupboard');
      await leave(bot, bot.walk(76.5, 'the walk-off'), 'the walk-off');
    });
  },
  /** The Day I Fought Cardboard: Doc Leo, Lily, the fog machine, the zombie (its axe), the witch (her broom, her hat on the beam), the werewolf mask, the webs, Lily's pat, the gift shop's sword, the clown wig, the exit. */
  cardbrd: async (bot) => {
    expect(bot, 'cardbrd');
    await carefully(bot, 'the way in', 0, async () => {
      await must(bot, bot.walk(12, 'Doc Leo, Lily, a coin'), 'in');
    });
    await carefully(bot, 'the fog, the zombie', 0, async () => {
      await declaim(bot, 'the fog');
      await must(bot, bot.walk(15, 'past the fog machine'), 'fogger');
      await declaim(bot, 'the zombie');
      await must(bot, bot.walk(23, 'the plastic axe'), 'axe');
    });
    await carefully(bot, 'GET DOWN!', 0, async () => {
      await declaim(bot, 'the broomstick');
      await declaim(bot, 'the witch');
      await must(bot, bot.walk(31, 'the coin under the beam'), 'coin');
      await must(bot, bot.walk(29, 'back under the beam'), 'beam');
      await must(bot, bot.hop('up', 12), 'up onto the beam');
      await must(bot, bot.walk(30, 'the witch\'s hat'), 'hat');
      await must(bot, bot.walk(34, 'down, the broomstick'), 'broom');
    });
    await carefully(bot, 'the werewolf mask', 0, async () => {
      await declaim(bot, 'the werewolf');
      await must(bot, bot.walk(37, 'on'), 'on');
      await declaim(bot, 'the werewolf');
    });
    await carefully(bot, 'the spiderwebs, Lily', 3, async () => {
      await must(bot, bot.walk(49, 'through the webs, Lily\'s pat, the coffee'), 'webs');
    });
    await carefully(bot, 'the gift shop', 0, async () => {
      await must(bot, bot.walk(54, 'under the gift shelf'), 'shelf');
      await must(bot, bot.hop('up', 12), 'up onto the shelf');
      await must(bot, bot.walk(55, 'the souvenir sword'), 'sword');
      await must(bot, bot.walk(57, 'down, the dollar'), 'dollar');
      await declaim(bot, 'the clown wig');
      if (plot(bot) < PROPS) throw new Error(`only ${plot(bot)} props`);
      await must(bot, bot.walk(64, 'Lily, the emergency exit'), 'the exit');
      await leave(bot, bot.walk(76.5, 'the walk-off'), 'the walk-off');
    });
  },
  /** Shelter Me Gently, You Wounded Beast: under the storm cloud, the patch on the lamp, the gusts, the store's two aisles (wrench, screwdriver, tape; the price tags, Teddy and Gwinn), the checkout, the goat, the storm again, the wounded beast. */
  umbrella: async (bot) => {
    expect(bot, 'umbrella');
    await carefully(bot, 'under the storm cloud', 0, async () => {
      await must(bot, bot.walk(9, 'the spotlight, a coin, under the cloud, to the lamp'), 'lamp');
    });
    await carefully(bot, 'the lamp, the gusts, into the store', 0, async () => {
      await must(bot, bot.hop('up', 12), 'up onto the lamp: the patch');
      await must(bot, bot.walk(20, 'through the gusts into the store'), 'store');
    });
    await carefully(bot, 'aisle one', 0, async () => {
      await must(bot, bot.hop('up', 12), 'up onto the tool shelf');
      await declaim(bot, 'the price tag on the shelf');
      await must(bot, bot.walk(21.5, 'the coin'), 'coin');
      await must(bot, bot.hop('up', 12), 'up onto the paint shelf');
      await must(bot, bot.walk(22, 'the wrench'), 'wrench');
      await must(bot, bot.walk(23.4, 'along the paint shelf'), 'paint');
    });
    await carefully(bot, 'down the aisle, Teddy', 0, async () => {
      await must(bot, bot.walk(24.5, 'down onto the tool shelf'), 'down');
      await declaim(bot, 'the price tag on the floor');
      await must(bot, bot.walk(26, 'down to the floor'), 'floor');
      await declaim(bot, 'the price tag on the floor');
      await must(bot, bot.hop('right', 12, 'right', 30), 'over Teddy, the dollar');
    });
    await carefully(bot, 'aisle two', 0, async () => {
      await declaim(bot, 'the price tag');
      await must(bot, bot.walk(31.2, 'under the tape shelf'), 'shelf');
      await must(bot, bot.hop('up', 12), 'up onto the tape shelf');
      await must(bot, bot.walk(32.5, 'the coin'), 'coin');
      await must(bot, bot.hop('up', 12), 'up onto the top shelf');
      await must(bot, bot.walk(33, 'the screwdriver'), 'screwdriver');
      await must(bot, bot.walk(35, 'down to the tape'), 'tape');
      await must(bot, bot.walk(36, 'down to the floor'), 'floor');
    });
    await carefully(bot, 'Gwinn, the checkout', 0, async () => {
      await must(bot, bot.hop('right', 12, 'right', 39), 'over Gwinn, a coin');
      await declaim(bot, 'paper or plastic?');
      await must(bot, bot.hop('right', 12, 'right', 43), 'over the checkout');
    });
    await carefully(bot, 'out the door', 0, async () => {
      await must(bot, bot.walk(48, 'the coffee, the goat'), 'goat');
    });
    await carefully(bot, 'the storm', 0, async () => {
      await must(bot, bot.walk(57, 'through the gusts, a coin, the coffee'), 'gusts');
    });
    await carefully(bot, 'the last stand', 0, async () => {
      await must(bot, bot.walk(65, 'under the storm clouds, a coin, a dollar'), 'clouds');
      if (plot(bot) < MENDS) throw new Error(`only ${plot(bot)} mends`);
      await must(bot, bot.walk(68, 'the wounded beast'), 'the beast');
      await leave(bot, bot.walk(89.5, 'the walk-off'), 'the walk-off');
    });
  },
};
