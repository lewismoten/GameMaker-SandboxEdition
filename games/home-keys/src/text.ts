// Every word HOME KEYS shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|HOME KEYS

Which keys does a game really need?

Many laptops have no number pad, and most players rest one hand on the arrow keys or on W A S D. Space and Enter do most of the work: jump and throw. Keys far from the hands, or that need a stretch, get skipped.

Three short levels. In the first, the arrows, Space and Enter do everything. In the second, a gap looks as if it needs a diagonal, and does not. In the third, Q and E give leaps up to some extra coins, which you can skip.

Read the signs. Each key gets one the first time you need it.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk (A, D too)
|SPACE         jump
|ENTER         throw a star
|Q, E          leap (level 3)
|F2            lives, score

Every key the game uses is on this list, and the page before it shows where they are.

You never need Q or E to finish. They only reach the extra coins.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|HOME KEYS  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|KEYS DONE!

Three levels, and the door was always reachable with the arrows, Space and Enter.

A game should say every key it uses, put a sign where a key is first needed, keep extra keys few and near the hands, and let a level be finished without a diagonal. Where a diagonal helps, use Q and E, and leave it as an extra.

The old number pad's 7 and 9 did that job on keyboards that had one. This game does not use them.

Open it in Game-Maker and look at the Character tab.
`);

export const LOST = wrap(`
|OH NO!

Out of lives. That is not meant to happen here.

Try again: walk with the arrows, jump with Space and throw with Enter.
`);
