// FLAGS.EXE's help, and its FILE_ID.DIZ and readme in the Sandbox BBS's Warez area. Said as a
// simulation and debugging tool for this pretend PC; no secret game is named anywhere here.
import { warezSignoff } from '../bbs/fileId';
import { ITEMS } from './flagsItems';

export const FLAGS_TITLE = "FLAGS 1.0  See and set the PC's remembered progress";

export const FLAGS_HELP = [
  'FLAGS                     Lists what is remembered; changes nothing.',
  'FLAGS SET <what> [value]  Sets it.    FLAGS CLEAR <what> [value]',
  'FLAGS RESET <what>|ALL    Back to a new visitor.',
  'FLAGS /BACKUP | /RESTORE  Keep or put back it all in C:\\DOS\\FLAGS.BAK.',
  '  SET ACH <id>         earn a badge      CLEAR ACH <id>  take it back',
  '  SET EGGS 3|ALL|NONE  felt eggs found   HEARTS: same, for tin hearts',
  '  SET TROPHY BEST 3    tier 0-5 or name  (TOTAL too); CLEAR goes back',
  '  SET BILL 45          minutes on the hint line;  CLEAR MAIL  RESET BBS',
  `Names: ${ITEMS.filter((i) => i.id !== 'BONUS')
    .map((i) => i.id)
    .join(' ')}`,
  'The first change makes FLAGS.BAK itself, so /RESTORE undoes a session.',
  "Only this browser's pretend PC changes; saved games are never written",
  '(SAVEHACK and BACKUP do those). A testing aid, not a cheat code.',
];

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
