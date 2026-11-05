// Every word NEAR AND FAR shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|NEAR AND FAR

A level can have two planes: a near one, big and clear, and a far one, small and pale. A trail takes you from one to the other.

A small explorer in a teal beanie steps into the distance, walks about in the far plane, and comes back. Then a cliff blocks his way, and the far plane has no cliff.

Read the signs. Then open this game in Game-Maker and change where a trail lands.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

Walk into a trail (a gap in a hedge) to go through it. Near things are big and bright. Far things are small and pale.

Coins add to your score. The door at the end of a level takes you on.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|NEAR AND FAR  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|FAR AND AWAY!

Two planes, two levels.

A near scene and a far scene are two scenes. The far one has smaller pictures and loads a paler palette, and a trail is a link that lands on the same kind of ground in the other plane. Only one is on screen at a time, and nothing is blurred: the pale and the small are drawn.

Open the game in Game-Maker, find a scene's links and change where a trail lands.
`);

export const LOST = wrap(`
|OOPS!

Some things only get past in the distance.

Try again: step into the trail.
`);
