// Every word SCROLL OR STAY shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|SCROLL OR STAY

Does the picture move, or does it stay?

A small explorer in a teal beanie has two levels to cross. The first is one room that fits the screen exactly, and the picture never moves. The second is a long walk, and the picture slides along after him.

Read the signs. Whether a level scrolls is one switch on its scene, and the size of the level has to agree with it.

Then open this game in Game-Maker and flip the switch.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

Walk to the door at the right of each level. Take the coins on the way.

Nothing here can hurt you. In the first level the picture stays still. In the second it follows you.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|SCROLL OR STAY  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|WELL SEEN!

Two levels, and you know what the camera does.

A scene can scroll or stay. A scene that stays shows the part of the map around the place Kit starts, so the room has to fit one screen, with walls you can see all round it. A scene that scrolls follows Kit, so the level can be as long as you like.

Open the game in Game-Maker, click on the scene in the Scenes tab and find the scrolling choices. Turn them on for the first level, make the room bigger and play it.
`);

export const LOST = wrap(`
|OOPS!

Out of lives. That is not meant to happen here.

Try again: walk right, to the door.
`);
