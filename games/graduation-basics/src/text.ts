// Every word GRADUATION: FIRST STEPS shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|GRADUATION

You have been through The Basics: walking, doors, monsters, coins and walls that break.

Today the helpers who showed you around are in the hall, up on the balcony, and Doc Leo is on the stage with something for you.

Walk up the red carpet. Take your honors from the lectern.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk

That is all. There is nothing to fight and nothing that hurts, and you cannot lose.

Your honors are rolled up on the lectern, on the stage. Walk into them.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|GRADUATION: FIRST STEPS  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

A graduation: it comes after The Basics.
`),
);

export const WON = wrap(`
|HONORS IN FIRST STEPS

Well done.

You can walk, open doors, meet monsters, collect coins and break walls. The helpers are cheering, and Doc Leo is grinning.

The next stage is waiting whenever you are ready.
`);

export const LOST = wrap(`
|OOPS!

Nothing here can hurt you, so this page is only here in case.

Try again: walk up the carpet.
`);
