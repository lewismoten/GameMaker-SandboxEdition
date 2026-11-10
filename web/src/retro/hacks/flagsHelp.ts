// FLAGS command help loads with the program; the BBS's release text needs no flag handlers.
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
  '  SET PLAYED STARTERS 5 [DONE]  games played (and finished); SANDBOX, BIZARRE',
  `Names: ${ITEMS.filter((i) => i.id !== 'BONUS')
    .map((i) => i.id)
    .join(' ')}`,
  'The first change makes FLAGS.BAK itself, so /RESTORE undoes a session.',
  "Only this browser's pretend PC changes; saved games are never written",
  '(SAVEHACK and BACKUP do those). A testing aid, not a cheat code.',
];
