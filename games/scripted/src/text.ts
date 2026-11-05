// Every word THE SHOW shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|THE SHOW

A little stage stands in a meadow, with a red curtain on each side.

Two friends wait behind the curtains. When the level starts, their play starts: they peek out, walk in, say hello to each other, and walk off.

A small explorer in a teal beanie wants to watch.

The play does not wait for anyone. Be there when the curtain moves, or use the encore door.

Then open this game in Game-Maker and change the acts.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

Walk to the stage and stand in front of it. The play starts when the level does, so don't dawdle.

The actors are not in your way: you walk right through them. Nothing here hurts.

Coins add to your score. If you miss the play, the encore door near the end loads the level again, and the play starts again.

The door at the end takes you on.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|THE SHOW  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|ENCORE!

Two levels, and every play was seen.

An actor is a monster, and a play is a chain of them. Each act has a path or a lifetime, and when it runs out the actor BECOMES the next act, right where it stands. The last act just ends and the actor is gone.

Nothing starts a play but the level starting, and nothing makes it wait for you.

Open the game in Game-Maker and find the monsters on the Monsters tab. Change who becomes whom.
`);

export const LOST = wrap(`
|OUCH

Nothing in this game should hurt you, but here you are.

Try again, and watch the play from the front.
`);
