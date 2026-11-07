// Every word THE THANK-YOU PARADE shows: the signs in each level ([text, blocks wide, blocks high]) and the text pages
// (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

type Defs = Record<string, [string, number, number]>;
const EXIT: [string, number, number] = ['EXIT →', 3, 1];

export const LEVEL1_SIGNS: Defs = {
  start: ['THE WIND SCATTERED THE BAND! FIND WHAT EACH ONE LOST.', 4, 3],
  piles: ['LEAF PILES HIDE THINGS', 3, 2],
  gates: ['BAND KIDS WAIT. FIND WHAT EACH LOST.', 4, 3],
  tree: ['CLIMB UP FOR THE DRUM STICKS', 4, 2],
  pond: ['FLUTE ON A LILY PAD. HOP!', 4, 2],
  exit: EXIT,
};

export const LEVEL2_SIGNS: Defs = {
  start: ['CARDS ARE BLOWING AWAY! CATCH FOUR.', 4, 3],
  retry: ['OUT OF TIME? GO BACK TO THE START DOOR.', 4, 3],
  meter: ['WATCH THE GUST. CARDS BLOW AWAY AS IT FADES.', 4, 3],
  exit: EXIT,
};

export const LEVEL3_SIGNS: Defs = {
  start: ['THE FIRE HALL CREW IS BUILDING THE FLOAT.', 4, 3],
  gold: ['A GOLD KEY OPENS A GOLD GATE.', 4, 3],
  silver: ['A SILVER KEY OPENS A SILVER GATE.', 4, 3],
  climb: ['CLIMB UP FOR MORE.', 3, 2],
  parts: ['THREE PARTS BUILD THE FLOAT.', 4, 3],
  exit: EXIT,
};

export const LEVEL4_SIGNS: Defs = {
  start: ['KEEP IN STEP! THE PUDDLES SQUIRT ON BEAT FOUR.', 4, 3],
  beat: ['WATCH THE RED DRUM. WAIT, THEN GO.', 4, 3],
  second: ['THESE SQUIRT ON BEAT TWO.', 4, 2],
  both: ['STEP, STEP, STEP, WAIT.', 4, 3],
  exit: EXIT,
};

export const LEVEL5_SIGNS: Defs = {
  start: ['TAKE THE CARDS. HAND ONE TO EACH NEIGHBOR.', 4, 3],
  dog: ['A DOG LIKES CARDS. KEEP A FEW SPARE.', 4, 3],
  geese: ['GEESE CROSSING. WAIT FOR A GAP.', 4, 3],
  wave: ['WAVE BACK!', 3, 2],
  exit: EXIT,
};

export const LEVEL6_SIGNS: Defs = {
  start: ['THE WHOLE TOWN CAME OUT!', 4, 3],
  stage: ['UP THE STAGE STEPS!', 4, 2],
  exit: EXIT,
};

export const STORY = wrap(`
|THE THANK-YOU PARADE

It is the morning of the town's Thank-You Parade, and Penny, the drum major, is up at dawn.

Then the wind came along.

It scattered the band across town: a mouthpiece in a leaf pile, drumsticks up a tree, a flute in the duck pond. It blew the class's thank-you cards all down Main Street.

The parade starts in a few hours. Somebody has to put it all back. Somebody tall, in a hat with a plume.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|UP, DOWN      climb a ladder
|F2            lives, score

Band members, gates and boxes ask for something: bring it and walk into them.

Cards are for neighbors on lawn chairs. Walk up to one with a card in hand.

A squirting puddle costs a little. Geese are in the way. A dog may take a card.

Watch the meters, the lamps and the clocks.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|THE THANK-YOU PARADE  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

A Special: a game that only comes around for a short while. Keep your copy.

Thank you to everyone who waves from the curb.
`),
);

export const WON = wrap(`
|THE PARADE

The band is back together. The cards are in the neighbors' hands. The float rolls, the puddles squirt only where they should, and a crop duster flies over towing a banner that says THANK YOU.

The whole town waves.

Penny tips her hat with the plume, and the wave comes right back.

Thank you for helping.
`);

export const LOST = wrap(`
|OH NO!

Out of lives. Geese, puddles and the wind add up.

Try again: wait for the gap, watch the beat, and keep a card or two spare.
`);

/** What each level card says. */
export const CARD_NOTES = [
  'The wind took the band apart.',
  'Cards are blowing down Main Street.',
  'The fire hall crew builds a float.',
  'Keep in step. Watch the drums.',
  'Hand a card to every neighbor.',
  'Up the steps. The whole town waves.',
];
