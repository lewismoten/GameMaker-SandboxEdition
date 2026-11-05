// Every word TAKE THE WHEEL shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|TAKE THE WHEEL

A small explorer in a teal beanie finds a little blue kart parked at the end of the road.

Hop in, and he is a different driver: quicker, with a horn, and no jump at all.

Read the signs. Then open this game in Game-Maker and make your own.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk, drive
|SPACE         jump, or honk
|F2            lives, score

On foot, Space jumps. In the kart it honks. Walk into the kart at the end of the first level to change.

In a kart a bird in the road stops you. Honk, and it flies off.

Nothing here hurts you.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|TAKE THE WHEEL  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|NICE DRIVING!

Two levels, and now you know how a game changes who you are.

Each scene lists a character file. Level 1 names HERO.CHR, so Kit walks and jumps. Level 2 names KART.CHR, so the same Kit drives fast, cannot jump and honks.

A character cannot change inside a scene. To switch, a link carries you to another scene, which names the other file. Open the game and draw a boat.
`);

export const LOST = wrap(`
|OOPS!

The road is long.

Try again: jump the bird on foot, then drive.
`);
