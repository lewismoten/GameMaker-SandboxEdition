// The NINE TO FIVE set's routes.
import { MON } from '../../src/ids';
import { NOTES } from '../../src/groups/work/meeting';
import { COFFEE_THINGS } from '../../src/groups/work/cgoat';
import { REPAIRS } from '../../src/groups/work/chair';
import { STAGED } from '../../src/groups/work/ficus';
import { carefully, declaim, expect, leave, must, plot, tips, type Route } from '../route';

export const WORK_ROUTES: Record<string, Route> = {
  /** A Totally Normal Meeting: under the table for his notes (past the footprints), up on it through the buzzwords, the supply closet's shelves, the whiteboard, the door. */
  meeting: async (bot) => {
    expect(bot, 'meeting');
    await carefully(bot, 'into the spotlight, the coffee', 0, async () => {
      await must(bot, bot.walk(5, 'the mug of coffee'), 'mug');
    });
    await carefully(bot, 'under the table', 0, async () => {
      await must(bot, bot.walk(10, 'under the table'), 'table');
      await declaim(bot, 'the first footprint');
      await must(bot, bot.walk(17, 'the notes and a coin'), 'under');
      await declaim(bot, 'the second footprint');
      await must(bot, bot.walk(32, 'the notes, the dollar, out the far end'), 'out');
    });
    await carefully(bot, 'up on the table', 12, async () => {
      await must(bot, bot.hop('left', 12, 'left', 31), 'onto the table');
      await declaim(bot, 'the buzzwords');
      await must(bot, bot.walk(26, 'the coin on the table'), 'coin');
      await declaim(bot, 'the buzzwords');
      await must(bot, bot.walk(20, 'the notes on the table'), 'notes');
      await declaim(bot, 'the buzzwords');
      await must(bot, bot.walk(31, 'back along the table'), 'back');
      await must(bot, bot.walk(34, 'down, the coin'), 'down');
    });
    await carefully(bot, 'the supply closet', 0, async () => {
      await must(bot, bot.walk(36.5, 'the closet door'), 'closet');
      await declaim(bot, 'the backup pen');
      await must(bot, bot.walk(39, 'under the pen shelf'), 'under');
      await must(bot, bot.hop('up', 12), 'up through the pen shelf');
      await must(bot, bot.walk(40, 'along the pen shelf'), 'along');
      await must(bot, bot.hop('right', 12, 'right', 42), 'up to the top shelf');
      await must(bot, bot.walk(43, 'the notes on the top shelf'), 'notes');
      await must(bot, bot.walk(46, 'down off the shelves'), 'down');
    });
    await carefully(bot, 'the whiteboard, the door', 0, async () => {
      await must(bot, bot.walk(49, 'under the whiteboard'), 'board');
      await must(bot, bot.hop('up', 12), 'up onto the whiteboard tray');
      if (plot(bot) < NOTES) throw new Error(`only ${plot(bot)} pages of notes`);
      await must(bot, bot.hop('right', 12, 'right', 53.5), 'over the water cooler');
      await must(bot, bot.walk(58, 'the door: MEETING ENDS'), 'the door');
      await leave(bot, bot.walk(74.5, 'the walk-off'), 'the walk-off');
    });
    void MON;
  },
  /** The Coffee Goat: up on the counter past the static (the mug, the cabinets, the pot, the sugar), the fridge and its empty creamer, the closet's top shelf, over the fizzing cup, the goats, the boss's door. */
  cgoat: async (bot) => {
    expect(bot, 'cgoat');
    await carefully(bot, 'into the spotlight, a coffee', 0, async () => {
      await must(bot, bot.walk(4, 'the mug of coffee'), 'mug');
    });
    await carefully(bot, 'the counter', 0, async () => {
      await must(bot, bot.walk(6, 'up on the counter'), 'counter');
      await declaim(bot, 'the static');
      await must(bot, bot.walk(7, "the boss's mug"), 'mug');
      await must(bot, bot.hop('up', 12), 'up through the cabinets');
      await must(bot, bot.walk(7, 'the coin on the cabinets'), 'coin');
      await must(bot, bot.walk(10.5, 'off the cabinets'), 'off');
      await must(bot, bot.walk(11, 'the pot'), 'pot');
      await must(bot, bot.hop('right', 12, 'right', 13), 'up onto the right cabinets');
      await must(bot, bot.walk(14, 'the sugar'), 'sugar');
      await must(bot, bot.walk(16, 'down off the counter'), 'down');
    });
    await carefully(bot, 'the fridge', 0, async () => {
      await must(bot, bot.walk(17, 'into the fridge'), 'fridge');
      await must(bot, bot.hop('up', 12), 'up onto the fridge');
      await must(bot, bot.walk(18, 'the coin on the fridge'), 'coin');
      await must(bot, bot.walk(20, 'down past the door'), 'down');
      await declaim(bot, 'the empty creamer');
      await must(bot, bot.walk(23, 'the coin by the soda machine'), 'coin');
    });
    await carefully(bot, 'the supply closet', 0, async () => {
      await must(bot, bot.walk(25, 'the closet door'), 'closet');
      await declaim(bot, 'the static');
      await must(bot, bot.walk(29, 'the coin on the floor'), 'coin');
      await must(bot, bot.walk(28, 'under the pen shelf'), 'under');
      await must(bot, bot.hop('up', 12), 'up through the pen shelf');
      await must(bot, bot.walk(29, 'along the pen shelf'), 'along');
      await must(bot, bot.hop('right', 12, 'right', 31), 'up to the top shelf');
      await must(bot, bot.walk(32, 'the powdered creamer'), 'creamer');
      await must(bot, bot.walk(36, 'down off the shelves, the mug'), 'down');
    });
    await carefully(bot, 'the fizz', 0, async () => {
      await must(bot, bot.walk(37, 'up to the fizzing cup'), 'cup');
      await must(bot, bot.hop('right', 12, 'right', 42), 'over the fizzing cup');
    });
    await carefully(bot, 'the goats', 0, async () => {
      await declaim(bot, 'a goat');
      await must(bot, bot.walk(48, 'the coin'), 'coin');
      await declaim(bot, 'another goat');
      await must(bot, bot.walk(52, 'the dollar'), 'bill');
      await must(bot, bot.walk(55, 'the third goat from the left'), 'goat');
    });
    if (plot(bot) < COFFEE_THINGS) throw new Error(`only ${plot(bot)} of the coffee things`);
    await must(bot, bot.walk(62, "the boss's door"), 'the door');
    await leave(bot, bot.walk(67.5, 'the walk-off'), 'the walk-off');
  },
  /** The Office Chair: the cubicle maze (the screws, the loose screw on a desk), the paper tower (the tape), the janitor (the wrench), over the intern, the memo pile (the gum), the creaks, the chair. */
  chair: async (bot) => {
    expect(bot, 'chair');
    await carefully(bot, 'into the spotlight, his cubicle', 0, async () => {
      await must(bot, bot.walk(5, 'his desk'), 'desk');
    });
    await carefully(bot, 'the first cubicle', 0, async () => {
      await must(bot, bot.walk(6, 'the partition'), 'partition');
      await declaim(bot, 'the loose screw');
      await must(bot, bot.walk(11, 'over the partition, the coin'), 'coin');
      await must(bot, bot.walk(12, 'the desk'), 'desk');
      await must(bot, bot.hop('up', 12), 'up on the desk: the loose screw');
      await must(bot, bot.walk(15, 'over the next partition'), 'over');
    });
    await carefully(bot, 'the printer paper', 0, async () => {
      await must(bot, bot.walk(20, 'up the paper: the tape'), 'tape');
      await must(bot, bot.walk(21, 'down'), 'down');
      await declaim(bot, 'another screw');
      await must(bot, bot.walk(25, 'over the partition, the coin'), 'coin');
      await must(bot, bot.walk(32, 'past the desk, over the partition: the janitor'), 'janitor');
      await must(bot, bot.walk(37, 'the wrench, the coffee'), 'wrench');
    });
    await carefully(bot, 'the intern', 0, async () => {
      await must(bot, bot.walk(38, 'up to the intern'), 'intern');
      await must(bot, bot.hop('right', 12, 'right', 47), 'over the intern, the dollar');
    });
    await carefully(bot, 'the memo pile', 0, async () => {
      await must(bot, bot.walk(49, 'into the memos'), 'memos');
      await must(bot, bot.hop('up', 12), 'up onto the memos');
      await must(bot, bot.walk(50, 'the gum'), 'gum');
      await must(bot, bot.walk(52, 'down'), 'down');
    });
    await carefully(bot, 'the creaks', 0, async () => {
      await declaim(bot, 'the creak');
      await must(bot, bot.walk(56, 'the coin'), 'coin');
      await declaim(bot, 'the creak');
    });
    if (plot(bot) < REPAIRS) throw new Error(`only ${plot(bot)} repairs`);
    await carefully(bot, 'the chair', 0, async () => {
      await declaim(bot, 'the creak');
      await must(bot, bot.walk(61, 'the chair'), 'the chair');
      await must(bot, bot.walk(66, 'the walk-off'), 'the walk-off');
    });
    await leave(bot, bot.walk(67.5, 'the end of the aisle'), 'the walk-off');
  },
  /** Gerald the Ficus: past the gnats and the falling leaves, out into the night (Carl), over the runaway cart, Peggy's plants, back in to stage it, the boss home. */
  ficus: async (bot) => {
    expect(bot, 'ficus');
    await carefully(bot, 'into the spotlight, a coffee', 0, async () => {
      await must(bot, bot.walk(4, 'the mug of coffee'), 'mug');
      await must(bot, bot.walk(6, 'up to Gerald'), 'Gerald');
      await declaim(bot, 'the gnats');
    });
    await carefully(bot, 'the shelf of the dead', 0, async () => {
      await must(bot, bot.walk(12, 'the coin past Gerald'), 'coin');
      await must(bot, bot.walk(18, 'under the falling leaves'), 'leaves');
    });
    const before = tips(bot);
    await carefully(bot, 'out into the night', 0, async () => {
      await must(bot, bot.walk(24, 'the coin by the sofa'), 'coin');
      await must(bot, bot.walk(33, 'out the back door, Carl'), 'out');
      if (tips(bot) < before + 2) throw new Error('missed Carl');
    });
    await carefully(bot, 'the runaway cart', 0, async () => {
      await must(bot, bot.hop('right', 12, 'right', 39), 'over the cart');
      await must(bot, bot.walk(45, "Peggy's plants, Peggy, Randy"), 'Peggy');
    });
    if (plot(bot) < STAGED - 1) throw new Error(`only ${plot(bot)} plants`);
    await carefully(bot, 'the staging', 0, async () => {
      await must(bot, bot.walk(60, 'back in: the dollar, the sticky note, the coin'), 'staging');
    });
    if (plot(bot) < STAGED) throw new Error(`only ${plot(bot)} of the staging`);
    await must(bot, bot.walk(63, 'the boss home'), 'the front door');
    await leave(bot, bot.walk(68.5, 'the walk-off'), 'the walk-off');
  },
};
