// The words the CD's XFERPLAY.EXE (cd/gm/xferplay.exe, Game-Maker 3.00's stand-alone player)
// shows a player, where each one sits in the file, for The Ultimate Owner's Guide's
// "Customizing the player's own words" (chaptersShareware.ts). Each is a NUL-terminated string;
// where it shows is from PLAYGAME.C (built with TRANSFER as XFERPLAY) and HISCOREL.C.
// playerWords.test.ts reads the .EXE and checks every row.
interface PlayerWord {
  /** File offset of the first letter. */
  offset: number;
  /** Bytes before the 0 that ends it. */
  length: number;
  text: string;
  where: string;
  /** A printf format: only the words before its % code may change; the code stays exactly. */
  format?: boolean;
}

/** The CD's XFERPLAY.EXE these offsets belong to: its size and SHA-256. */
export const PLAYER_EXE = { bytes: 160_598, sha256: '404be3612012488e5e8ed5ce1dc2e183cf4b53bd4a6cc9b4d8a1d14e980bca5c' };

export const PLAYER_WORDS: PlayerWord[] = [
  { offset: 0x25700, length: 30, text: 'No game-specific instructions.', where: 'Read Instructions, when the game has none' },
  { offset: 0x2571f, length: 27, text: 'No game-specific storyline.', where: 'Read Storyline, when it has none' },
  { offset: 0x2573b, length: 31, text: 'No game-specific credits given.', where: 'See Credits, when it has none' },
  { offset: 0x2575b, length: 4, text: 'Play', where: 'Menu' },
  { offset: 0x25760, length: 17, text: 'Read Instructions', where: 'Menu' },
  { offset: 0x25772, length: 14, text: 'Read Storyline', where: 'Menu' },
  { offset: 0x25781, length: 11, text: 'See Credits', where: 'Menu' },
  { offset: 0x2578d, length: 18, text: 'See Highest Scores', where: 'Menu' },
  { offset: 0x257a0, length: 4, text: 'Quit', where: 'Menu' },
  { offset: 0x25821, length: 9, text: 'Load Game', where: 'F6, heading (no load picture)' },
  { offset: 0x2582e, length: 29, text: 'This game has not been saved!', where: 'F6, an empty slot' },
  { offset: 0x2584c, length: 16, text: 'Old Game Loaded!', where: 'F6' },
  { offset: 0x2585f, length: 9, text: 'Save Game', where: 'F5, heading (no save picture)' },
  { offset: 0x2586e, length: 24, text: 'I cannot save your game!', where: 'F5, when the file can’t be written' },
  { offset: 0x25887, length: 11, text: 'Game Saved!', where: 'F5' },
  { offset: 0x25b1c, length: 31, text: 'No game-specific help included.', where: 'F1, when the game has no help' },
  { offset: 0x25b3c, length: 14, text: 'Score:     %ld', where: 'F2 status', format: true },
  { offset: 0x25b4b, length: 13, text: 'Money:     %d', where: 'F2 status', format: true },
  { offset: 0x25b59, length: 13, text: 'Hitpoints: %d', where: 'F2 status', format: true },
  { offset: 0x25b67, length: 13, text: 'Lives:     %d', where: 'F2 status', format: true },
  { offset: 0x25b75, length: 37, text: 'Elapsed Time: %02ld:%02ld:%02ld.%02ld', where: 'F2 status', format: true },
  { offset: 0x25bd8, length: 7, text: 'MORE...', where: 'A text page longer than the screen' },
  { offset: 0x25d7f, length: 21, text: 'Choose object to drop', where: 'Dropping something carried' },
  { offset: 0x25d95, length: 25, text: 'Use arrow keys to select,', where: 'Dropping' },
  { offset: 0x25daf, length: 25, text: '<Enter> to accept, <ESC> ', where: 'Dropping' },
  { offset: 0x25dc9, length: 25, text: 'to quit without dropping.', where: 'Dropping' },
  { offset: 0x268cb, length: 14, text: 'Top Ten Scores', where: 'High scores, heading' },
  { offset: 0x268fb, length: 11, text: 'Hit any key', where: 'High scores, foot' },
  { offset: 0x2690f, length: 16, text: 'Congratulations!', where: 'A new high score' },
  { offset: 0x26946, length: 16, text: 'Enter Your Name:', where: 'A new high score' },
];
