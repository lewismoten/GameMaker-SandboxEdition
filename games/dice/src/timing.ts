// ROLL THE DICE's clock. Game-Maker keeps time in ticks, 18.2 a second (code/GM/PLAYBACK.C
// changeblks): a block can turn into another block after a number of ticks. The die is six
// blocks in a ring, face 1 turns into face 2 after FACE ticks, and so on round to 1 again. The
// clock starts when the room loads and the game has no random number: where the ring is when
// Kit touches it depends only on the tick, so the same walk gives the same roll every time.

/** How long each face shows: about half a second. A whole turn of the ring is six of these. */
export const FACE = 10;
