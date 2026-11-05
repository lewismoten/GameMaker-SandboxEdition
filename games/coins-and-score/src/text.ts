// Every word COINS AND SCORE shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|COINS AND SCORE

Gold does not do much on its own. In Game-Maker, it adds up.

A small explorer in a blue beanie is out collecting. Touch a coin and the score goes up. Gems pay more, rocks take points away, and a heart gives something a score cannot: a life.

Read the signs, and press F2 to see how you are doing.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|UP, DOWN      climb a ladder
|F2            score, lives

Touch a coin, a gem or a heart and it is yours. A rock takes points away.

The score is not drawn on the play screen. Press F2 to look at it, then press a key to carry on.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|COINS AND SCORE  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|WELL COUNTED!

Three levels, and a score that went up, up and a little down.

Every pickup is a block with a number on it: how many points it gives. A coin is ten, a gem fifty and a rock is minus twenty. A heart has no points, but adds one to the lives counter.

Game-Maker does not give a life at a certain score. Only a block can do that.

Open the game in Game-Maker, pick a gem and change its points, then play your change.
`);

export const LOST = wrap(`
|OOPS!

Points do not pick themselves up.

Try again: take the coins, then the gems, and mind the rock.
`);
