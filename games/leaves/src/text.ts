// Every word LEAVES IN THE WIND shows: the signs, the cards before each room, and the text pages (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

import { type MicroPlaqueText } from '../../kit/starter/microPlaque';

/** The approved plaques; omitted old sign rows are intentionally dropped. */
export const SIGNS = {
  tumble: {
    stiff: { lines: ['1 FRAME', 'STIFF'] },
    spin: { lines: ['8 FRAMES', 'STIFF'] },
    float: { lines: ['ZIGZAG', 'FLOATS'] },
    next: { lines: ['NEXT', '→'] },
  },
  gust: {
    gust: { lines: ['SAME', 'TIME'] },
    model: { lines: ['FAR,', 'FAST'] },
    next: { lines: ['ALL', 'DONE'] },
  },
} satisfies Record<string, Record<string, MicroPlaqueText>>;

/** The card before each room: its name and a line. */
export const CARDS = {
  tumble: ['The Tumble', 'Three leaves. Only one floats.'],
  gust: ['The Gust', 'Every tree, all at once.'],
} as const;

export const STORY = wrap(`
|LEAVES IN THE WIND

Mia takes a walk under the autumn trees on a breezy day.

A leaf in a game is a monster: a few pictures that turn it and a path that carries it down. A tree drops one on a timer. A gust is one clock that every tree keeps.

Watch the leaves. Then walk on.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|ARROWS        walk
|SPACE         jump

Walk into a door to go to the next room. Read the signs.

Nothing here can hurt Mia.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|LEAVES IN THE WIND  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Opus 5.5, an AI model made by Anthropic.

Held-rise jump and bot timing by OpenAI Codex (GPT-6.1 Sol).

Raised-start camera review by OpenAI Codex (GPT-6.1 Sol), directed by Lewis Moten.

Micro plaques by Hermes Agent using OpenAI Codex (GPT-6.1 Sol), directed by Lewis Moten.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|THAT IS THE LOT

A leaf is a monster. Its frames turn it over and over, and its path swoops it from side to side, slow at the turns, so it floats down instead of dropping.

A branch is a block that gives birth to a leaf every so many ticks. A gust is one loop of blocks that every tree keeps, so they all bend at once.

Open the game in Game-Maker and change a path.
`);

export const LOST = wrap(`
|OOPS!

That was not meant to happen.

Try again: this time, just walk and jump. Nothing here hurts.
`);
