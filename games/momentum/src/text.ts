// Every word SLIDE AND DRIFT shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|SLIDE AND DRIFT

Some things do not stop the moment you let go.

A small explorer in a teal beanie has two short levels to cross. In the first, every step adds to his speed, so he glides on after you lift your finger. In the second, the speed from a good run carries a hop across a gap.

Read the signs. Then open this game in Game-Maker and change how hard each step pushes.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   speed up
|SPACE         hop
|F2            lives, score

Hold a key and Kit gets faster. Let go and he glides on, slowing down. Press the other way to turn him around.

Nothing can hurt you here. A gap is only two blocks deep, and you can hop out.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|SLIDE AND DRIFT  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|WELL GLIDED!

Two levels, and now you know what momentum does.

A step with the Momentum setting on adds to Kit's speed and does not move him. The speed carries him on, and the game takes a sixth of it away each tick once no such step is running. Hold a key and the speed builds up. A hop made at speed goes a long way.

Open the game in Game-Maker and find the setting on the Character tab. Turn it off for Right and watch him stop dead.
`);

export const LOST = wrap(`
|OH NO!

Out of lives. That is not meant to happen here.

Try again: hold Right for a while, let go, and watch him glide.
`);
