// BLOCK BRAINS' clock. Game-Maker keeps time in ticks, 18.2 a second (code/GM/PLAYBACK.C
// changeblks): a block can turn into another block after a number of ticks. A "brain" is a
// ring of blocks, each turning into the next, with one state that is open and the rest shut.
// Every ring starts when the room loads, and the map decides where in its ring each cell begins.

/** Level 1: how long each of the three turns lasts, about two seconds. A whole round is three of these. */
export const TURN = 36;
/** Level 2: how long the sun, then the moon, has the turn, about two and a half seconds. */
export const SPELL = 45;
