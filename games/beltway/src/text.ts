// Every word ROUND AND ROUND shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|ROUND AND ROUND

A road that goes by, and a track that goes round.

A small explorer in a teal beanie rides the bed of a truck while the hills, the trees and a rail slide past. Then a little car drives a loop in the sky, upside down at the top, and counts its laps in lamps.

Read the signs. Then open this game in Game-Maker and change how fast things go.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

Nothing in this game hurts. The car passes right through you.

Walk to the door on the right. In the second room the door stays barred until the car has gone round three times.

Each room is one picture that never scrolls.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|ROUND AND ROUND  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|WELL DRIVEN!

Two rooms, and now you know how a game goes round.

The truck never moved. The hills, the trees and the rail are rings of blocks: each block turns into the next after a few ticks, and the last turns back into the first. The near ones turn faster, so they slide faster.

The car is a monster whose path ends where it began, so it goes round forever. Each corner says how the picture is turned, a quarter at a time, so its wheels stay on the track. The lamps count laps on the clock; a block cannot see a car.

Open the game in Game-Maker and find the Blocks and Monsters tabs. Change the ticks on a strip, or the speed of the car.
`);

export const LOST = wrap(`
|OOPS!

That was not meant to happen.

Try again: this time, just walk. Nothing here hurts.
`);
