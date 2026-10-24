// Getting the PC back to its DOS prompt for a disk (the desk's disk box and drive, the DOS page's
// disk menu): a game playing quits, and Game-Maker closes after asking to save a designer's
// unsaved changes (saveFirst.ts), saving them where they belong. Something else running (the
// BBS terminal, a utility) is left to the page: the desk asks you to quit it; the DOS page
// offers to stop it.
import type { Computer } from './computer';

export interface LeaveOptions {
  /** The disk in drive A: is write-protected (a designer's work there goes to a copy on C:). */
  readOnlyA: boolean;
  /** A short message for the page to show (a toast, a status line). */
  say(text: string, kind?: 'info' | 'error'): void;
  /** Something other than a game or Game-Maker is running: true once it has been stopped. Left out, it is refused. */
  other?(pc: Computer): Promise<boolean>;
}

/** True once the PC is at its prompt; false if you'd rather keep going (or it couldn't stop). */
export async function leaveProgram(pc: Computer | undefined, o: LeaveOptions): Promise<boolean> {
  if (!pc?.busy) return true;
  if (await pc.stopGame()) return true;
  if (!pc.inGameMaker) {
    if (o.other) return o.other(pc);
    o.say('Quit the program that is running first (Esc usually does it).');
    return false;
  }
  const open = pc.designer;
  let saveAs = '';
  if (open && !open.saved && open.contents().length) {
    // the disk in A: is write-protected, or the work is on the CD
    const at = open.work.folder.drive;
    const readOnly = at === 'D' || (at === 'A' && o.readOnlyA);
    const { askSaveFirst } = await import('./saveFirst');
    const answer = await askSaveFirst(open, readOnly);
    if (answer === null) return false;
    saveAs = answer;
  }
  if (!(await pc.stopProgram())) {
    o.say('Game-Maker didn’t close. Quit it with Esc first.', 'error');
    return false;
  }
  if (open && saveAs) {
    const names = open.contents().map((c) => `${saveAs}.${c.ext}`);
    // nobody's at Game-Maker now: a read-only game is copied to the hard disk unasked
    pc.quiet = true;
    pc.copiedTo = undefined;
    let ok = true;
    try {
      for (const c of open.contents()) ok = (await open.work.write(`${saveAs}.${c.ext}`, c.bytes)) && ok;
    } finally {
      pc.quiet = false;
    }
    const list = names.map((n) => n.toUpperCase()).join(' and ');
    // write() sets copiedTo when it copies a read-only game to the hard disk (TypeScript
    // still thinks it is the undefined set above)
    const copiedTo = pc.copiedTo as string | undefined;
    const where = copiedTo
      ? `${copiedTo}, a copy of the game on the hard disk (the original can’t be changed)`
      : (await import('./saveFirst')).folderText(open);
    if (ok) o.say(`Saved ${list} in ${where}.`);
    else o.say(`Couldn’t save ${list}.`, 'error');
  }
  return true;
}
