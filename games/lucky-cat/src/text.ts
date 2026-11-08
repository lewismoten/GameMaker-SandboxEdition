// Every word LUCKY CAT shows on a text page (30 columns, 16 lines a page) and on its story cards.
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|LUCKY CAT

Friday the 13th in Fennel Hollow. By seven o'clock a ladder has fallen, an umbrella has opened indoors and the salt is everywhere.

The town needs someone to blame, and a black cat is right there.

She is right there because somebody keeps leaving out saucers of cream.

Midnight has until the clock strikes thirteen to prove she is the luckiest thing in town. And to find out who is pulling the ropes.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|UP, DOWN      climb a ladder
|F2            lives, score

Touch a lucky charm to take it. There are 13.

Cracks, paint and crows are bad luck: each costs a little.

A key opens one lock, once.

Read the Committee's notices. They are wrong about cats. They are right about ladders.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|LUCKY CAT  v${about.version}
|(c) 1994 Sandbox Software

First made by Claude Sonnet 5.5. Redrawn as a woodcut, rewritten and rescored by Claude Opus 5.5. Four more levels by Claude Sonnet 5.5. All three are AI models made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

A Friday the 13th special: it only stops by the BBS for a few days.
`),
);

export const WON = wrap(`
|PAYBACK

Rascal had his reasons. On Friday the 13th the Committee locks every trash can in Fennel Hollow. For luck.

So he gave them bad luck. And to give them someone to blame, he left a saucer of cream at every prank.

Midnight pulled one rope. His machine did the rest.

The Committee has voted black cats lucky, effective at once. Now everyone in town wants to pet her.

She has found the one place nobody will follow: under a ladder.
`);

export const LOST = wrap(`
|BAD LUCK

Out of lives. The town is calling it proof.

Try again: go over ladders, hop the cracks, and let the crows go by first.
`);

/** The story cards that open each level: lines of at most 34 letters at 8x8, shown a few seconds. */
export const CARDS: Record<string, string[][]> = {
  one: [
    ['FRIDAY THE 13TH. 7:06 PM.', 'THE TOWN HAS A SUSPECT:', 'BLACK FUR. GOLD EYES. NO ALIBI.'],
    ['MIDNIGHT HAS AN ALIBI. SHE WAS', "DRINKING SOMEBODY'S FREE CREAM.", 'NOBODY WANTS TO HEAR IT.', 'FINE. 13 LUCKY CHARMS, THEN.'],
  ],
  alley: [
    ['7:31 PM. A BACK LANE BEHIND THE', 'SHOPS. SOMEBODY HAS LEFT A SAUCER', 'OF CREAM EVERY TWENTY STEPS.'],
    ['MIDNIGHT IS SUSPICIOUS.', 'MIDNIGHT IS ALSO A CAT.', 'SHE WILL BE HAVING THE CREAM.'],
  ],
  two: [['THE FUNHOUSE. EVERY MIRROR IN', 'TOWN WAS MOVED HERE "FOR SAFETY."', 'LEFT KEY WALKS RIGHT.', 'RIGHT KEY WALKS LEFT. NO PANIC.']],
  steps: [
    ['8:02 PM. THE OLD GRANARY STAIR.', 'THIRTEEN STEPS UP TO THE BEST VIEW', 'IN TOWN. IT IS A VERY GOOD VIEW.'],
    ['MIDNIGHT COUNTS AS SHE CLIMBS.', 'ONE, TWO, THREE... AT THIRTEEN', 'SHE LOSES COUNT. OF COURSE SHE DOES.'],
  ],
  three: [
    ['TOWN HALL. EMERGENCY MEETING.', 'ITEM ONE: THE CAT.', 'ITEM TWO: WHO OPENED ALL THESE', 'UMBRELLAS INDOORS?'],
    ['NOBODY NOTICES THE SAUCER OF', 'CREAM BY THE DOOR.', 'MIDNIGHT NOTICES.'],
  ],
  shop: [
    ['9:15 PM. THE MIRROR SHOP. "SEVEN', 'YEARS OF LUCK, GUARANTEED."', 'LEFT IS LEFT AGAIN. BE GRATEFUL.'],
    ['TWO HAND MIRRORS, TWO GATES. THE', 'SHOP ASSURES YOU NOBODY HAS EVER', 'BROKEN ANYTHING IN HERE.'],
  ],
  glass: [
    ['9:40 PM. THE SHOP HAS A BACK DOOR.', 'THE BACK DOOR IS A MIRROR.', 'MIDNIGHT WALKS THROUGH IT. CATS DO.'],
    ['THE OTHER SIDE. THE EXIT IS WHERE', 'THE ENTRANCE SHOULD BE, THE LEFT KEY', 'WALKS RIGHT, AND NOBODY IS SORRY.'],
  ],
  rascal: [
    ['EARLIER THAT MORNING...', '6:15 AM. THE COMMITTEE CHAINS', 'EVERY TRASH CAN SHUT. "FOR LUCK."'],
    ['ONE RESIDENT TAKES IT PERSONALLY.', 'TIE OFF THE ROPES. SET OUT THE', 'CREAM. GET THE KEY TO THE BINS.'],
  ],
  still: [
    ['EARLIER STILL. 12:40 PM. THE TOWN', 'HALL IS CLOSED FOR LUNCH, AND', 'A CLOSED HALL IS AN EMPTY HALL.'],
    ['UP TO THE GALLERY. THEN UP TO THE', 'RAFTERS. SOMEWHERE UP THERE IS A', 'KEY, AND A VERY LONG ROPE.'],
  ],
  four: [['BACK TO 7:40 PM. THE FAIR GATE', 'SHUTS ON THE 13TH CHIME. EACH', 'BELL STILL LIT IS A CHIME LEFT.', 'RUN.']],
  tower: [['THE CLOCK TOWER. WHOEVER RIGGED', 'THE BELLS LEFT ROPE ON EVERY', 'FLOOR. GOOD ROPE. NEAT KNOTS.', 'MIDNIGHT IS TAKING NOTES.']],
  five: [['THE ROOFTOPS. THE CROWS WORK', 'FOR THE COMMITTEE: THEY REPORT', 'EVERY BLACK CAT THEY SEE.', 'LET THEM GO BY. KNOCK ON WOOD.']],
  market: [
    ['11:20 PM. THE NIGHT MARKET. ALL', 'THE STALLS CLOSE AT THE 13TH CHIME,', 'AND THEY CLOSE TOGETHER.'],
    ['THREE SHUTTERS. TWO WATCHMEN CROWS.', 'ONE CAT WHO WOULD LIKE TO BE ON', 'THE OTHER SIDE OF ALL OF IT.'],
  ],
  six: [['A ROOF. ROPES, PULLEYS, A CRATE', 'OF SAUCERS, AND A RACCOON WHO', 'HAS NOT SEEN HER.'], ['YET.']],
};

/** The reveal after the last door: Rascal owns up, and Midnight has the last word. */
export const REVEAL: string[][] = [
  ['"OKAY. IT WAS ME," SAYS RASCAL.', '"THE LADDER. THE UMBRELLAS. THE', 'SALT. ROPES AND PULLEYS. ALL ME."'],
  ['"WHY?" ASKS MIDNIGHT.', '"THEY LOCKED THE BINS FOR LUCK.', 'SO I GAVE THEM SOME LUCK."'],
  ['"AND THE CREAM?"', '"YOU KEPT SHOWING UP. YOU WERE', 'THE PERFECT SUSPECT."', '"WERE," SAYS MIDNIGHT.'],
];
