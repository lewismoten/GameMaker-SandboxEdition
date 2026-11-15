// FLAGS command help loads with the program; the BBS's release text needs no flag handlers.
import { ITEMS } from './flagsItems';

export const FLAGS_TITLE = "FLAGS 1.0  See and set the PC's remembered progress";

/** The names, wrapped to fit 79 columns. */
function names(): string[] {
  const out: string[] = [];
  let line = 'Names:';
  for (const id of ITEMS.filter((i) => i.id !== 'BONUS').map((i) => i.id)) {
    if (line.length + id.length + 1 > 78) {
      out.push(line);
      line = '      ';
    }
    line += ` ${id}`;
  }
  return [...out, line];
}

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
  '  SET GRADES 1 3 [B]   stage 1 or ALL: first 3 Starters graded (A or B...)',
  "  SET COURIER MAIL 1   letters in Scoot's mail; SET BUDDY QUIET|CHATTY",
  '  SET CHICKEN LADY|SIR; SET TOUR 2026-10-01 (last What is new visit)',
  ...names(),
  'The first change makes FLAGS.BAK itself, so /RESTORE undoes a session.',
  "Only this browser's pretend PC changes; saved games are never written",
  '(SAVEHACK and BACKUP do those). A testing aid, not a cheat code.',
];
