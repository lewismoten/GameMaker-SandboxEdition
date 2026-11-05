// Every word GUSTS shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|GUSTS

Wind comes and goes.

A small explorer in a teal beanie has two short rooms. In the first, a shaft of air flutters its leaves, and then a gust lifts him up to a ledge. In the second, gusts blow along a tunnel, and windsocks on the hill show them coming.

Watch for the wind. Then go.

Then open this game in Game-Maker and change how long a gust lasts.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

In level 1 the leaves flutter in the shaft, and then a gust blows up and lifts you to the ledge. Stand in the shaft and wait.

In level 2 gusts blow left along the tunnel and push you back. The windsocks tell you when. Wait in a shelter, where there is no wind, and go on when it stops.

Coins add to your score.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|GUSTS  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|MADE IT!

Two rooms, two kinds of wind.

A gust is a block that pulls, and a ring of blocks that change on a timer. The shaft has a calm block, a fluttering block and a gust block that pulls up, each set to turn into the next after a number of ticks (18.2 a second). The windsocks use the same times, so they change on the very same ticks.

Every clock starts when the room loads. A ring has a fixed time, so a gust cannot be random.

Open the game in Game-Maker, pick a gust block in the Blocks tab and look at its Next block and its time. Change a number, then play your change.
`);

export const LOST = wrap(`
|OH NO!

Out of lives. Nothing in this game can cost a life, so this one is hard to do!

Try again: wait for the wind, then go.
`);
