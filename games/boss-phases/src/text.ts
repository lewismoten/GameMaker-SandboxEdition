// Every word THREE PHASES' shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|THREE PHASES

Some bosses change halfway through a fight.

A small explorer in a teal beanie has a pocketful of gold stars. Two short levels, and Big Bug paces a long tunnel in each.

Read the signs. Hit it twice and it turns quicker. In the second level the last hit brings a tiny new face.

Then open this game in Game-Maker and change when.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|ENTER         throw a star
|F2            lives, score

Stand a few steps from the tunnel and press Enter when Big Bug walks close. A star that misses is gone, so wait and throw again.

Walking into it only stings a little and does not count as a hit.

Coins add to your score. The door at the end of the level takes you on.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|THREE PHASES  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|ALL THREE FACES!

Two levels, two bugs, nine stars that found their mark.

Big Bug is a chain of monsters. A star kills the one in front and it becomes the next, in the same spot. Each link has its own picture and its own path, so the bug can be calm, then hurried, then tiny.

Open the game in Game-Maker and find the monsters on the Monsters tab. Change a link's picture or its path and the phase changes with it.
`);

export const LOST = wrap(`
|OOPS!

Big Bug stings a little every moment you lean on it, and the stings add up.

Try again: stand back, face the tunnel and throw when it comes close.
`);
