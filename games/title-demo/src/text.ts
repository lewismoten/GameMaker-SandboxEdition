// Every word MAKE A TITLE shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|MAKE A TITLE

Every game starts with a title.

A small explorer in a teal beanie has two short rooms. In the first he looks at the pictures the title scene is made of, above all the one behind the menu you are reading from now. In the second he finds out how a game plays itself while nobody touches the keys.

Walk, read, and look at the pictures that come up.

Then open this game in Game-Maker and make your own title.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

Each level starts with some pictures, which go by themselves (a key turns them sooner). Then walk along the hall and read the signs. The door at the end takes you on.

Leave the menu alone for half a minute and the game plays its demo.

Nothing here hurts you.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|MAKE A TITLE  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|THE END

A title is a few files in the title scene.

The menu graphic is a plain picture with a board left clear, because the game writes its own words on top. The title graphic can be a list. The demo recording is a file of key presses that the game plays back when the menu sits quiet.

A demo holds 1,000 key changes at most, and a press and a release are two.

Open the game in Game-Maker, look at the title scene's slots, and put in pictures of your own.
`);

export const LOST = wrap(`
|OH NO!

Out of lives. Nothing in this game hurts, so this one is hard to do!

Try again: read the signs, then take the door.
`);
