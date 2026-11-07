// Every word LUCKY CAT shows on a text page (30 columns, 16 lines a page) and on its story cards.
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|LUCKY CAT

It is Friday the 13th, and in the little town of Fennel Hollow everything is going wrong.

A ladder falls over. An umbrella pops open indoors. The salt spills.

Everyone blames Midnight, the black cat.

Midnight has had enough. She will spend the whole day proving she is lucky: thirteen lucky charms, all before the clock tower strikes thirteen.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|UP, DOWN      climb a ladder
|F2            lives, score

Touch a lucky charm to take it. There are 13 in all.

Cracks and paint drips are bad luck: they cost a little, once.

A key opens a locked door. It is used up.

Watch the signs: some things in town are not what they seem.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|LUCKY CAT  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps, songs and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

A Friday the 13th special: it only stops by the BBS for a few days.
`),
);

export const WON = wrap(`
|THE LUCKIEST CAT IN TOWN

All thirteen charms, and the clock has not struck yet.

Rascal the raccoon says sorry. He built a machine of ropes and pulleys to play pranks on Friday the 13th, and the pranks got out of hand.

Fennel Hollow cheers. Midnight is made the town's official lucky mascot, with a ribbon, a bell and a seat of honor at the fair.

Black cats are lucky after all.
`);

export const LOST = wrap(`
|OH NO!

Out of lives. Bad luck adds up.

Try again: mind the cracks, go around the ladders and keep an eye on the clock.
`);

/** The story cards that open each level: lines of at most 34 letters at 8x8, shown a few seconds. */
export const CARDS: Record<string, string[][]> = {
  one: [
    ['FRIDAY THE 13TH IN FENNEL HOLLOW.', 'THE LADDER FELL. THE SALT SPILLED.', 'AND WHO GETS THE BLAME?', 'MIDNIGHT, THE BLACK CAT.'],
    ['"NOT A CHANCE," SAYS MIDNIGHT.', 'SHE WILL FIND 13 LUCKY CHARMS', 'AND PROVE SHE IS THE LUCKIEST', 'CAT IN TOWN.'],
  ],
  two: [['THE FUNHOUSE MIRRORS SWAP', 'LEFT AND RIGHT. DO NOT PANIC.', 'LEFT KEY WALKS RIGHT.', 'RIGHT KEY WALKS LEFT.']],
  three: [['TOWN HALL. SOMEONE OPENED EVERY', 'UMBRELLA INDOORS AND SPILLED', 'THE SALT. TOSS A PINCH OVER', 'YOUR SHOULDER TO FIX IT.']],
  four: [['THE FAIR OPENS WHEN THE CLOCK', 'STRIKES 13. THE GATE SHUTS', 'AT THE LAST CHIME. RUN!']],
  five: [['A CROW KEEPS KNOCKING ON WOOD.', 'KNOCK BACK TO OPEN THE BOXES.', 'MIND THE CROWS.']],
  six: [['WHO IS PULLING THE ROPES?', 'THE PRANKS ALL TRACE BACK TO', 'ONE WORKSHOP ON THE ROOF.']],
};
