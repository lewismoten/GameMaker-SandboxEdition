// GUSTS' clock. Game-Maker keeps time in ticks, 18.2 a second (code/GM/PLAYBACK.C changeblks): a
// block can turn into another block after a number of ticks, and every block of one kind changes on
// the same tick. A gust is a ring of three blocks, calm then fluttering (the warning, still calm) then
// a gust, and round again. Every clock starts when the scene loads, and the windsocks use the same
// lengths, so they change on the very same ticks as the wind. Everything below is in ticks.

export const CALM = 100;
export const FLUTTER = 36;
export const GUST = 54;
/** One whole turn of the ring. */
export const ROUND = CALM + FLUTTER + GUST;
