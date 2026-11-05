// Every word THE GIANT shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|THE GIANT

Some doors are guarded by something so big it takes four monsters to make it.

A small explorer in a teal beanie has a pocketful of gold stars. Rocky, a big grumpy fellow made of stone, stands in the narrow way to the door. Then Beep, a tin robot, does the same thing and stings back.

Read the signs. Pop the parts, one at a time.

Then open this game in Game-Maker and look at the four.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|ENTER         throw a star
|F2            lives, score

A star flies level with Kit's hand: from the ground it reaches the bottom of a giant. Stand on the step to reach its head.

In level 2 a hit part blinks red and a star goes right through it. Wait for it to stop.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|THE GIANT  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|THE WAY IS OPEN!

Two giants, eight parts and sixteen stars that found their mark.

Rocky is not one monster but four, side by side. Each pops on its own, and the door is behind the last. Beep takes two hits a part: after the first it blinks red for a moment, and a star goes right through it.

Open the game in Game-Maker and find the monsters on the Monsters tab.
`);

export const LOST = wrap(`
|OOPS!

A giant stings a little every moment you lean on it, and the stings add up.

Try again: stand back, face it and press Enter. Remember the step.
`);
