// The intermissions at The Hive. The first comes in off the avenue (the coins on the sidewalk,
// on the bench and on the newspaper box), takes the tip jar's dollar, buys a coffee, crosses the
// little movie theater (over Teddy, up the rake, the tips on the seats and the booth), goes up
// the stairs and along the seating (the goat says hello) to the stage, and the curtain takes the
// coffee. The others start on the stage, come down for a coffee and go back up.
import { carefully, coffee, declaim, expect, leave, must, tips, type Route } from '../route';
import type { Bot } from '../bot';

/** From the hall (x 51..57, ground floor) to the stage: the stairs, the seating, the curtain. */
async function upToTheStage(bot: Bot): Promise<void> {
  await carefully(bot, 'the front room', 0, async () => {
    await must(bot, bot.walk(66, 'the coin by the window'), 'front room');
    await must(bot, bot.hop('right', 12, 'right', 69.5), 'onto the couch');
    await must(bot, bot.hop('up', 10), 'the coins over the couch');
    await must(bot, bot.walk(70, 'along the couch'), 'couch');
    await must(bot, bot.hop('right', 12, 'right', 73.5), 'off the couch');
    await must(bot, bot.hop('up', 14), 'the dollar by the window');
    await must(bot, bot.hop('right', 12, 'right', 77), 'over Gwinn');
    await must(bot, bot.walk(78, 'the mug by the bookshelf'), 'mug');
  });
  await carefully(bot, 'up the stairs', 0, async () => {
    await must(bot, bot.walk(75.4, 'by Gwinn'), 'gwinn');
    await must(bot, bot.hop('left', 12, 'left', 72.6), 'back over Gwinn');
    await must(bot, bot.walk(65, 'the foot of the stairs'), 'stairs');
    for (let x = 64; x >= 58; x--) await must(bot, bot.hop('left', 10, 'left', x + 0.1), `tread ${x}`);
    await must(bot, bot.walk(56, 'upstairs'), 'upstairs');
  });
  await carefully(bot, 'the seating', 0, async () => {
    await must(bot, bot.hop('up', 12, 'left', 52), 'onto the table');
    await must(bot, bot.hop('up', 8), 'the dollar over the table');
    await must(bot, bot.walk(44, 'past the goat'), 'goat');
    await must(bot, bot.hop('left', 12, 'left', 41.5), 'over the couch arm');
    await must(bot, bot.hop('up', 8), 'the coin over the couch');
    await must(bot, bot.hop('left', 12, 'left', 38), 'over the other arm');
    await must(bot, bot.walk(34, 'by the stage'), 'stage');
  });
  await carefully(bot, 'the stage', 10, async () => {
    await must(bot, bot.hop('left', 12, 'left', 32), 'up onto the stage');
    if (bot.sim.shown(30 + 2, 3 + 2).effect === 3) {
      await must(bot, bot.walk(30, 'under the coin by the drapes'), 'drapes');
      await must(bot, bot.hop('up', 12), 'the coin up by the drapes');
    }
    await must(bot, bot.walk(25, 'past Doc Leo, the mic'), 'mic');
    if (coffee(bot) < 1) throw new Error('no coffee for the curtain');
    await leave(bot, bot.walk(21.5, 'the curtain'), 'through the curtain');
  });
}

/** The first: along the avenue, in through the castle door, a coffee, through the theater, to the hall. */
async function inOffTheAvenue(bot: Bot): Promise<void> {
  await carefully(bot, 'the avenue', 0, async () => {
    await must(bot, bot.walk(8, 'the coin on the sidewalk'), 'sidewalk');
    await must(bot, bot.hop('up', 10, 'right', 9), 'onto the bench');
    await must(bot, bot.walk(12, 'off the bench'), 'bench');
    await must(bot, bot.hop('right', 12, 'right', 14), 'onto the newspaper box');
    await must(bot, bot.walk(21, 'in through the castle door'), 'door');
  });
  await carefully(bot, 'the counter', 0, async () => {
    await must(bot, bot.walk(30, 'the tip jar'), 'jar');
    if (tips(bot) < 5) throw new Error(`only ${tips(bot)} tips for the coffee`);
    await must(bot, bot.walk(31.2, 'the register'), 'register');
    await must(bot, bot.walk(31, 'the cup'), 'cup');
    if (coffee(bot) < 1) throw new Error('no coffee');
    bot.say(`coffee in hand, ${tips(bot)} tips left`);
  });
  await theater(bot, 'right');
}

/** Through the little movie theater (either way): over Teddy, up the rake, the booth. */
async function theater(bot: Bot, dir: 'right' | 'left'): Promise<void> {
  if (dir === 'right')
    await carefully(bot, 'the theater', 10, async () => {
      await must(bot, bot.walk(36, 'into the theater'), 'theater');
      await declaim(bot, 'hushed the shushers');
      await must(bot, bot.hop('right', 12, 'right', 40), 'over Teddy');
      await must(bot, bot.walk(42, 'the coin by the seats'), 'coin');
      await must(bot, bot.hop('right', 12, 'right', 43.5), 'up the rake');
      await must(bot, bot.walk(45, 'the coin between the rows'), 'coin');
      await must(bot, bot.hop('right', 12, 'right', 46.5), 'up the rake');
      await must(bot, bot.hop('right', 12, 'right', 49), 'onto the booth');
      await must(bot, bot.walk(57, 'down into the hall'), 'hall');
    });
  else
    await carefully(bot, 'the theater', 10, async () => {
      await must(bot, bot.walk(51, 'the hall'), 'hall');
      await must(bot, bot.hop('up', 14, 'left', 50), 'onto the booth');
      await must(bot, bot.walk(48, 'the booth'), 'booth');
      await must(bot, bot.hop('left', 6, 'left', 46.5), 'down the rake');
      await declaim(bot, 'hushed the shushers');
      await must(bot, bot.walk(43, 'down the rake'), 'rake');
      await must(bot, bot.walk(40, 'the front row'), 'front row');
      await must(bot, bot.hop('left', 12, 'left', 36), 'over Teddy');
      await must(bot, bot.walk(33, 'out past the screen'), 'out');
    });
}

/** The later ones: off the stage, down the stairs, back through to the counter, a coffee, and up again. */
async function downForACoffee(bot: Bot): Promise<void> {
  await carefully(bot, 'off the stage', 0, async () => {
    await must(bot, bot.walk(30, 'under the coin by the drapes'), 'drapes');
    await must(bot, bot.hop('up', 12), 'the coin up by the drapes');
    await must(bot, bot.walk(36, 'off the stage'), 'off');
    await must(bot, bot.hop('right', 12, 'right', 41.5), 'over the couch arm');
    await must(bot, bot.hop('right', 12, 'right', 44.5), 'over the other arm');
    await must(bot, bot.walk(57, 'to the stairs'), 'stairs');
    await must(bot, bot.walk(66, 'down the stairs'), 'down');
    await must(bot, bot.walk(58, 'under the stairs'), 'under');
  });
  await theater(bot, 'left');
  await carefully(bot, 'the counter', 0, async () => {
    if (tips(bot) < 5) throw new Error(`only ${tips(bot)} tips for the coffee`);
    await must(bot, bot.walk(31.8, 'the register'), 'register');
    await must(bot, bot.walk(31, 'the cup'), 'cup');
    await must(bot, bot.walk(29, 'the tip jar'), 'jar');
    if (coffee(bot) < 1) throw new Error('no coffee');
  });
  await theater(bot, 'right');
}

export const HIVE_ROUTES: Record<string, Route> = {};
for (let k = 1; k <= 5; k++)
  HIVE_ROUTES[`hive${k}`] = async (bot) => {
    expect(bot, `hive${k}`);
    if (k === 1) await inOffTheAvenue(bot);
    else await downForACoffee(bot);
    await upToTheStage(bot);
  };
