// Every page of text: the storyline, the instructions, the credits, the ending, the lost
// page and README.TXT. 30 columns, 16 lines a page (page() checks).
import { CREDIT_NOTICE, withCreditPage } from '../../../kit/license';
import { page } from './pages';

export const STORY = page([
  `Every Fourth of July, Doc Leo's root beer stand pours the Baker Family Root Beer, from a recipe handed down for nine generations.

Doc Leo is a Baker on his mother's side. He does not talk about it. Nobody in the family talks about it. That is sort of the point.`,
  `The story goes that in 1776, Corporal Ebenezer Baker crept into a Redcoat supply tent for a loaf of bread and came out with a recipe card instead.

The British never recovered.

Historians say it was the French, the weather and General Washington. Historians were not there.`,
  `This year, Gwinn ate the card.

(Gwinn has two n's. The card had twelve ingredients. She got all twelve, and the corner.)

There is one other copy: the kitchen itself.`,
  `Ebenezer kept every ingredient in the old family kitchen under the bakery, and he built it to keep out Redcoats: false walls, doors that swing one way, floors that slide, walls on timers.

It still works. It works much too well.`,
  `Take the rubber chicken. Teddy will show you the stairs.

Find all twelve ingredients before the parade.

And whatever you find in the Vault, do not tell the British.`,
]);

export const HELP = page([
  `WALKING
Arrows, W A S D or the number pad: one step at a time. Hold to keep going.

SPACE: squawk the rubber chicken. Mice run. Toy Redcoats run faster.

ENTER: pick up what you are standing on.`,
  `WHAT TO FIND
Every room keeps one ingredient on a little rug. Take it and the dumbwaiter takes you up to the next room.

F2 shows what you carry. "Money" is ingredients. Ebenezer paid his debts in sassafras.`,
  `THE KITCHEN
Wooden spoons open spoon latches. Swing doors only push one way. Belts and greased boards slide you. Panels rise and fall in turn. Dough rises. Ice thaws. Burners get hot.

Some walls are not walls.`,
  `KEEP HEALTHY
Root beer floats: hit points.
Pie: a life.
Bottle caps: 50 points.

Mousetraps bite. Rolling pins keep rolling. Lean on the walls, not the stove.

F5 saves. F6 loads.`,
]);

export const CREDITS = withCreditPage(
  page([
    `BAKER'S DOZEN
The Thirteenth Ingredient

A Sandbox Software game, 1996

Game design, rooms, art, music and every block: Claude Opus 5.5

Recipe: the Baker family, est. 1776 (allegedly)`,
    `STARRING
Doc Leo, PhD (Comedic Science), as himself
Teddy, a corgi who knows left from right
Gwinn (two n's), as the dog who ate the card
THE CHEZ, a 1976 CitiCar, as the getaway car`,
    `...and a great many mice, toy Redcoats, rolling pins, and one 250-year-old yeast named Gerald.

No Redcoats were harmed. Several were startled.

${CREDIT_NOTICE.join(' ')}`,
  ]),
);

export const WON = page([
  `The Vault's lock counts twelve ingredients, gives them back, and swings open.

Inside, on a nail, is the other half of the recipe card.

It says:`,
  `13. Stir counterclockwise, keep it under your hat, and do not tell the British.

That is the whole secret. It always was.`,
  `Doc Leo makes the root beer in time for the parade. THE CHEZ pulls the stand, at its usual four miles an hour. Teddy rings the bell. Gwinn is not allowed near the card.

It is the best batch in 250 years.`,
  `Twelve is a dozen. A baker's dozen is thirteen.

You found twelve of something to get here.

Count them again.`,
]);

export const LOST = page([
  `Doc Leo plays dead. It is his best trick, and this time it is not a trick.

The recipe stays in the kitchen for another year.

Somewhere, a Redcoat is very pleased with himself.`,
]);

export function readme(): string {
  return [
    "BAKER'S DOZEN: The Thirteenth Ingredient",
    'Sandbox Software, 1996',
    '',
    'Type BAKERS and press Enter. You need a VGA display.',
    'A Sound Blaster plays the music; without one the PC',
    'speaker squawks for you.',
    '',
    'Arrows (or W A S D) walk. Space squawks the rubber',
    'chicken. Enter picks things up. F1 help, F2 status,',
    'F5 save, F6 load, Esc quits.',
    '',
    'This disk is not for sale. If you have it, you found it.',
    'Please do not tell the British.',
    '',
  ].join('\n');
}
