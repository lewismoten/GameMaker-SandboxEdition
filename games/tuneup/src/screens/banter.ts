// What Doc Leo and the rubber chicken say before and after each level (cards.ts draws them).
// Sir Reginald III does the repairs: he fits where Doc Leo can't. Partway through The Timing
// Beat he lays an egg, and from then on she is Lady Regina III, formally corrected.
import type { Card } from './cards';

/** Before each level, by level number. */
export const INTRO: Record<number, Card> = {
  1: {
    title: 'LEVEL 1: JUMP START',
    lines: [
      ['leo', "The battery's flat, and Gwinn buried my wrenches."],
      ['reggie', 'Then we improvise, old bean. Find the clamps.'],
      ['leo', 'Red on the shelf, black under the bench?'],
      ['reggie', 'And then crank. Hold Space.'],
    ],
  },
  2: {
    title: 'LEVEL 2: SPARK PLUCKS',
    lines: [
      ['reggie', 'The spark plugs are out of tune. Pluck them.'],
      ['leo', "Spark plugs don't have strings."],
      ['reggie', 'These do now. Climb the wires, and mind the sparks. They frizz.'],
    ],
  },
  3: {
    title: 'LEVEL 3: THE TIMING BEAT',
    lines: [
      ['reggie', 'The distributor has a piano roll in it.'],
      ['leo', 'Since when?'],
      ['reggie', 'Since Gwinn. Boop each key as its note lands, and the timing sets itself.'],
    ],
  },
  4: {
    title: "LEVEL 4: OIL'S WELL",
    lady: true,
    lines: [
      ['regina', 'Five squeaky lines, one oil can. Z, X, C, V and B.'],
      ['leo', "Oil's well that ends well."],
      ['regina', 'I shall pretend you did not say that.'],
    ],
  },
};

/** After each level (or a part of one), by scene file. */
export const OUTRO: Record<string, Card> = {
  jump: {
    lines: [
      ['leo', 'CHARGE! Is it fixed?'],
      ['reggie', 'Fully charged. I tightened the terminals myself.'],
      ['leo', 'With what?'],
      ['reggie', 'My beak, naturally.'],
    ],
  },
  spark: {
    lines: [
      ['leo', 'C, E, G, E. Sounds fixed to me.'],
      ['reggie', 'Nearly. Listen: the timing is off. It ticks sideways.'],
      ['leo', 'Then we try something else.'],
    ],
  },
  beat1: {
    lines: [
      ['reggie', 'Steady. Now the off-beats. One pipe splits in two, another takes the long way round.'],
      ['leo', 'Stand under the fork and I get both keys?'],
      ['reggie', 'You may try.'],
    ],
  },
  beat2: {
    leoPose: 'hurt',
    egg: true,
    lines: [
      ['reggie', 'BAWK!'],
      ['leo', 'Reginald... was that an EGG?'],
      ['reggie', 'So it would appear.'],
      ['stamp', '*CORRECTION: Lady Regina III'],
      ['regina', 'Double time, if you please.'],
    ],
  },
  beat3: {
    lady: true,
    egg: true,
    lines: [
      ['leo', "Your egg's tag says 100% natural rubber."],
      ['regina', 'High tensile strength. Great elasticity. Tear resistant.'],
      ['leo', 'Under the star it says "*felt".'],
      ['regina', 'Fine print. The timing is perfect, by the way.'],
    ],
  },
};
