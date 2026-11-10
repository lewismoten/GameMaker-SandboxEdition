// FLAGS.EXE's help, and its FILE_ID.DIZ and readme in the Sandbox BBS's Warez area. Said as a
// simulation and debugging tool for this pretend PC; no secret game is named anywhere here.
import { warezSignoff } from '../bbs/fileId';

export const FLAGS_DIZ = [
  'FLAGS 1.0 - REMEMBERED-STATE DEBUGGER [1/1]',
  'by vesuvian, 1994                   Freeware',
  '---------------------------------------------',
  'List, set, clear and reset what the PC',
  'remembers: badges, eggs, hearts, trophies,',
  'phone bill, mail and caller file. Backs up',
  'to FLAGS.BAK first. Never touches saves.',
  warezSignoff(),
];

export const FLAGS_NFO = [
  'FLAGS 1.0 - a debugging tool for the pretend PC',
  '',
  'Run FLAGS alone to see every remembered thing and its value.',
  'FLAGS /? tells the rest. Try:',
  '',
  '  FLAGS SET HEARTS 3        three tin hearts found, the rest not',
  '  FLAGS SET TROPHY BEST 2   show the bronze trophy',
  '  FLAGS /BACKUP             keep it all in C:\\DOS\\FLAGS.BAK',
  '  FLAGS /RESTORE            put it back as it was',
  '',
  'Why: some parts of this machine only change after hours of play.',
  'FLAGS lets you test them in minutes without losing your own progress.',
  "It changes this browser's pretend PC only. Saved games are SAVEHACK's.",
  '',
  'Freeware. Sandbox Software, 1994. Teddy checked it twice and ate the manual.',
];
