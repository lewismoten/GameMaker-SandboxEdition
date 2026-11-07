// PASS THE PIE's clock. Game-Maker keeps time in ticks, 18.2 a second (code/GM/PLAYBACK.C changeblks): a block can
// turn into another after some ticks, and that is the only clock the editor gives you. Everything here is in ticks.

/** Ticks one roll of the bar stays lit (about seven seconds); five of them make the dash. */
export const SEG_TICKS = 150;
/** How long a segment shows pale (cooling) before it goes out. */
export const SEG_WARN = 18;
/** Ticks until the town hall's doors shut: the whole bar. */
export const HALL_OPEN = 5 * SEG_TICKS;
/** The row the bar sits on (the camera never scrolls up or down), and where each stamp of it starts. */
export const BAR_ROW = 4;
export const BAR_X = [2, 10, 18, 26, 34, 42, 50, 58, 64] as const;
