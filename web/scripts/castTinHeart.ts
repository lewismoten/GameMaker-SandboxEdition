// The tin heart, a small riveted tin heart that ticks (a nod to the Tin Man), as pixel art for
// the cast page: its card picture (castArt.ts) and its two frames on the stage (castSprites.ts).
// Index 0 is see-through; the colors are 6-bit VGA like the games'.

const ART = [
  '..DDD....DDD..',
  '.DLLLD..DLMMD.',
  'DLHLLMDDLMMMSD',
  'DLHLRMMMMMRMSD',
  'DLLMMMMMMMMMSD',
  'DLMMMMMMMMMMSD',
  '.DMRMMMMMMRSD.',
  '..DMMMMMMMSD..',
  '...DMMRMMSD...',
  '....DMMMSD....',
  '.....DMSD.....',
  '......DD......',
];

/** The second frame: the tick, the shine moved and the rivets catching the light. */
const TICK = ART.map((row) => row.replace(/H/g, 'L').replace(/R/g, 'H'));

const KEYS = '.DSMLHR';
export const TIN_HEART_PAL: [number, number, number][] = [
  [0, 0, 0],
  [10, 11, 14], // D outline
  [26, 28, 32], // S shadow
  [42, 44, 47], // M tin
  [53, 55, 57], // L light tin
  [63, 63, 63], // H shine
  [22, 24, 27], // R rivet
];

export const TIN_HEART_W = ART[0].length;
export const TIN_HEART_H = ART.length;

/** Its frames as palette indexes (TIN_HEART_PAL), `blank` where there is no heart. */
export function tinHeartFrames(blank: number): Uint8Array[] {
  return [ART, TICK].map((rows) => Uint8Array.from(rows.join(''), (ch) => (ch === '.' ? blank : KEYS.indexOf(ch))));
}
