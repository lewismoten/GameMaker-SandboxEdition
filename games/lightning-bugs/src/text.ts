// Every word LIGHTNING BUGS shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|LIGHTNING BUGS

Fireflies over a meadow at dusk, each one blinking by itself.

A firefly here is a monster: a picture that is mostly clear, so the sky shows round its glow, a list of frames with the time each stays up, and a path that loops.

But copies of one monster blink and fly in step. So a meadow that feels alive is made of many kinds, each with its own times and its own path.

Read the signs. Then open this game in Game-Maker and make a firefly of your own.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump

Walk along the meadow to the door at the end. Stop now and then and watch the fireflies: they are the lesson.

Level 1 shows six fireflies that blink together, then six that do not. Level 2 is a meadow full of them.

Nothing here can hurt you.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|LIGHTNING BUGS  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, music and levels by Claude Opus 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|GOOD NIGHT

Two levels, one meadow.

Every monster on a map starts at the same tick, at its first frame and its first corner. So six copies of one firefly blink and fly as one, for as long as you watch.

The fix is more kinds: each with its own dark, its own flash and its own loop, and never two of a kind side by side.

Open the game in Game-Maker and change a firefly's times.
`);

export const LOST = wrap(`
|OOPS!

Everyone falls down sometimes.

Try again: read the signs, and take your time.
`);
