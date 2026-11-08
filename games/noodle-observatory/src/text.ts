// Every word THE NOODLE OBSERVATORY shows on a text page (30 columns, 16 lines a page) and on its story pages (lines
// of at most 34 letters at 8x8, four to a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|THE NOODLE
|OBSERVATORY

It is Monkey Day in town, and Nell's tin monkey is wound up tight.

At dusk it rolls a loose lens along the kitchen counter, straight into the old telescope. Then the giant pasta ring Nell painted for the noodle fair rolls UP the wall and stops in the window, around a moon.

A round, yellow, cheese-colored moon. Very close. Very low.

Nell has questions. To answer them, she will need a proper observatory.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|UP, DOWN      climb a ladder
|F2            lives, score

Touch a part to take it. Walk into the socket with its shape and the part goes in.

In the pasta ring, LEFT and RIGHT steer. The ring rolls up by itself.

Shelves wobble before they tip. A fall only lands you on the floor.

Some scenes are stories: watch them happen.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|THE NOODLE OBSERVATORY
|v${about.version}
|(c) 1994 Sandbox Software

Story, pixels, beeps, songs and levels by Claude Sonnet 5.5, an AI model made by Anthropic, from a level plan written with OpenAI Codex.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

A special for Monkey Day: it only stops by for a few days.
`),
);

export const WON = wrap(`
|AN EXCELLENT VIEW
|OF NEXT DOOR

The moon has a windowsill. It is the round window of the bakery next door, where a lamp burns late.

Nell's theory did not hold up. Her investigation did. It is all in her notebook, with diagrams.

The pasta ring rolled off with the tablecloth. Supper kept its place.

Next clear night: the real moon. Probably.
`);

export const LOST = wrap(`
|TRY AGAIN

Try that route again. Every shelf has a ladder, and every fall lands on the floor.
`);

/** The story pages before a level, by its file name: pages of up to four lines. */
export const CARDS: Record<string, string[][]> = {
  lensroll: [["IT IS MONKEY DAY, AND NELL'S", 'TIN MONKEY IS ALL WOUND UP.', 'WATCH THE KITCHEN COUNTER.']],
  hinges: [['THAT MOON NEEDS A CLOSER LOOK.', 'NELL WILL BUILD A TELESCOPE.', 'FIRST, THREE BRACKETS FROM', 'THE WOBBLY CUPBOARD SHELVES.']],
  drawers: [['NEXT: A ROUND KNOB, A SQUARE', 'FOOT AND A STRIPED TUBE.', 'EACH SOCKET TAKES ONE SHAPE.']],
  scope: [['SIX PARTS MAKE A TELESCOPE.', 'SIX SOCKETS BY THE DOOR.', 'NELL HAS A DIAGRAM. MOSTLY.']],
  roundway: [
    ['A TELESCOPE! MOSTLY CUPBOARDS.', 'BUT THE KITCHEN WINDOW IS LOW.', 'THE BEST VIEW IS AT THE TOP', 'OF THE PANTRY.'],
    ['THE PASTA RING ROLLS UPHILL.', 'NOBODY KNOWS WHY.', 'NELL CLIMBS IN.'],
  ],
  narrow: [['THE MOON IS STILL THERE.', 'IT HAS NOT MOVED ONE BIT.', 'MOONS USUALLY DO.']],
  uphill: [['ONE MORE SHAFT TO THE', 'TOP SHELF. UPHILL. OF COURSE.']],
  softstep: [
    ['FROM THE TOP SHELF, THE MOON', 'HAS A VERY STRAIGHT EDGE.', 'A BETTER LENS WILL HELP.'],
    ['THE LENSES ARE LOOSE IN THE', 'LENS ROOM. CARRY THEM ONE', 'AT A TIME, AND GENTLY.'],
  ],
  lensrise: [['EVERY LENS MAKES THE MOON', 'LOOK A LITTLE LESS', 'LIKE A MOON.']],
  rimwalk: [['THREE MORE LENSES.', 'THEN THE SCOPE IS SHARP', 'ENOUGH FOR THE LOFT.']],
  slitone: [['SHARPER. STRANGER.', 'UP IN THE LOFT, NINE SHUTTERS', 'LET THE NIGHT SKY IN.', 'NINE PADS TURN THEM.']],
  slittwo: [['THREE SHUTTERS SET.', 'SIX TO GO.']],
  slitend: [['SIX SHUTTERS SET.', 'THE LAST THREE ARE TRIANGLES.']],
  starview: [['NINE SHUTTERS, ALL SET.', 'TIME TO LOOK UP.']],
  rattle: [['CLANG! THE COLANDER FELL', 'OFF ITS HOOK AND ROLLED', 'OUT ONTO THE ROOF GARDEN.', 'NELL FOLLOWS THE RATTLE.']],
  garden: [['IT IS A CLEAR WINTER NIGHT.', 'THE COLANDER IS STILL', 'ROLLING. SO IS NELL.']],
  roofrim: [['FROM THE ROOF, THE MOON', 'LOOKS VERY... SQUARE', 'AT THE BOTTOM.']],
  setwest: [['THE COLANDER STOPPED BY', 'THE SUPPER CART. AN IDEA:', 'SUPPER ON THE ROOF, RIGHT', 'WHERE THE VIEW IS BEST.']],
  seteast: [['PLATES: SET.', 'NOW THE CUPS.']],
  moonmeal: [['CUPS: SET.', 'LAST, THE MATS. THEN ONE', 'MORE LOOK AT THE MOON.']],
  bakery: [['SUPPER IS SET.', 'THE SCOPE IS READY.', 'ONE LAST LOOK...']],
};
