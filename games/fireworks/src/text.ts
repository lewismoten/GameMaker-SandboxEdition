// Every word FIREWORKS shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|FIREWORKS NIGHT

A night of fireworks, drawn with monsters.

A rocket is a monster on a path up. When its path ends it turns into another monster: a burst. A launcher is a block that makes a new rocket every few seconds.

Lami, in a red beanie, has come to watch. Read the signs, press Enter to launch a rocket, then open this game in Game-Maker and change a burst.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|ENTER         launch a rocket

Walk along the field to the door at the end. Look up as you go: the fireworks are the lesson.

Level 1 has two launchers. Level 2 is a big show over a sleeping town. Nothing here can hurt you.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|FIREWORKS NIGHT  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps, music and levels by Claude Opus 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|WHAT A SHOW

Two levels, one trick.

A monster can turn into another when its path ends or its time runs out. A rocket turns into a burst, and a burst into nothing, or back into its rocket.

A big burst is nine monsters in a square, on the same path at the same speeds, so they never come apart.

Open the game in Game-Maker and draw a burst of your own.
`);

export const LOST = wrap(`
|OOPS!

Everyone falls down sometimes.

Try again, and take your time: the show goes on.
`);
