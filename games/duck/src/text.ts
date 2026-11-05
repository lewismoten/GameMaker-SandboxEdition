// Every word KIT DUCKS shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|KIT DUCKS

How do you dodge something that is not at your feet?

A small explorer in a teal beanie has two short levels to cross. Friendly bluebirds fly back and forth at the height of his head, and beach balls roll back and forth along the ground.

Read the signs. Kit is two blocks tall, a head block over a body block. When he ducks, his top block is empty. A bird flying through the row of his head touches nothing, and a ball still finds his feet.

Then open this game in Game-Maker and look at the duck.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         hop
|DOWN          duck (held)
|S             duck, too
|F2            lives, score

Walk to the door in each level. Take the coins on the way.

Hold Down as a bird comes at your head, and let go when it has flown over. A ball on the ground needs a hop instead.

A touch costs a few hit points. Never a life, if you are careful.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|KIT DUCKS  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|WELL DUCKED!

Two levels, and now you know how to dodge without moving out of the way.

Kit's duck is a sequence in the character file whose frames have a picture in the bottom block only. The top block is empty, so a bird in the row of his head has nothing to touch. The same duck does not help against a ball, which rolls through the row of his feet.

Open the game in Game-Maker and find the Down key on the Character tab. Give the duck a top picture and watch the birds hit him.
`);

export const LOST = wrap(`
|OH NO!

Out of lives. That is not meant to happen here.

Try again: hold Down as a bird comes, and hop over a ball with Space.
`);
