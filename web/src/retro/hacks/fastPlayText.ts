// FASTPLAY.EXE's manual and FILE_ID.DIZ, apart from fastPlay.ts so the BBS file list can show them
// without loading the program, which the PC imports when it is run.
import { warezSignoff } from '../bbs/fileId';

export const FASTPLAY_DOC = [
  'FASTPLAY 1.0 - less setup, more game',
  '',
  'FASTPLAY ON     Bypass first-run video/audio setup by default.',
  'FASTPLAY OFF    Show setup for games without saved settings.',
  'FASTPLAY STATUS Show the current choice (also the default).',
  '',
  'Previously saved per-game settings still apply in either mode.',
  'Run CONFIG.BAT in a game folder to configure that game again.',
  'The web player also has Show setup on first run and Video & audio.',
  'Settings stay in this browser and travel in preferences backups.',
  'No game files, saved games or DOS executables are patched.',
  '',
  'Teddy tested it. He is now configuring a very fast nap.',
  'Freeware. Sandbox Software, 1994.',
];
export const FASTPLAY_DIZ = [
  'FASTPLAY 1.0 - less setup, more game',
  'Skip first-run video/audio setup, or',
  'bring it back. Keeps game files intact.',
  'Teddy-approved. Nap time not included.',
  warezSignoff(),
];
