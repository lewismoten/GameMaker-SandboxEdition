// Every word FLASH SAFE shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|FLASH SAFE

Some players can get sick from fast flashing, and some people have seizures from flashing light.

You can make a game that stays easy on the eyes. A small explorer in a teal beanie has three short rooms that show how.

Show a hit without a flash. Blink slowly and small. Hold a storm instead of strobing it.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

In level 1 a burr takes 5 hit points. Touch one and look and listen.

In level 2 two lamps glow. Read the signs by them.

In level 3 the sky lifts a little and holds. Nothing here flashes.

Coins add to your score.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|FLASH SAFE  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|ALL CLEAR!

Three rooms, and not one flash.

The simple rules: no more than 3 flashes in any one second. Avoid big flashes of red. Keep anything that flashes small. And never let a flash be the only sign of something: add a sound, a shape or a number.

Level 1 showed a hit with a beep, an ouch face, a number and fewer hit points. Level 2 blinked a small lamp once a second and pulsed another in soft steps. Level 3 lifted a dark sky a little, held it, and let it settle.

To check your own game, play it in the editor's preview and count flashes in a second. Fewer than 3, and small.
`);

export const LOST = wrap(`
|OH NO!

Out of hit points. Ten burrs would do it, and there are only three!

Try again: touch a burr once and look, then go.
`);
