// The desk's side of the guided tour's BBS chapter (tour/chapters/bbs.ts): asked with
// 'gm-tour-act' events, the PC calls The Sandbox BBS and types what a caller would, each line
// once the screen shows what it answers. Only a PC at the DOS prompt (or off) is used: one
// running something of the visitor's is left alone, and the chapter says how to call instead.
// When the chapter is left the call is put back as found: the program stopped, the line speed,
// the board's user file and its door game as they were, and the file it downloaded taken off
// C: again (nothing counts toward an achievement while a tour plays: achievements/store.ts).
import { key } from '../retro/text/textInput';
import { SPEED_KEY, lineSpeed, setLineSpeed } from '../retro/bbs/lineSpeed';
import { restoreAccount, storedAccount } from '../retro/bbs/ratio';
import { DOOR_KEY } from '../retro/bbs/ticTacToe';
import type { deskPc } from './deskPc';

type DeskPc = ReturnType<typeof deskPc>;
interface Act {
  do: string;
  text?: string;
  wait?: string;
}

/** The speed the call is made at (the board's own), so its menus come quickly and a download takes a while. */
const CALL_SPEED = 14400;
/** How long to wait for the screen to show what is answered. */
const WAIT_MS = 30_000;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const stored = (k: string): string | null => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const putBack = (k: string, v: string | null) => {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {
    /* no storage: nothing was kept */
  }
};

/** Listens for the tour's acts while the desk is up; returns what stops listening. */
export function deskTour(desk: HTMLElement, pc: DeskPc): () => void {
  /** What the call found, to put back. */
  let found: { speed: string | null; account: string | null; door: string | null; downloads: Set<string> } | undefined;
  /** Bumped when the chapter is left: a script still waiting gives up. */
  let gen = 0;
  /** The acts in order: each waits for the one before. */
  let queue: Promise<void> = Promise.resolve();
  /** The file chosen in the list (its number). */
  let pick = 1;

  const screenText = (): string => {
    const s = pc.computer?.screen;
    if (!s) return '';
    let text = '';
    for (const c of s.chars) text += c >= 32 && c < 127 ? String.fromCharCode(c) : ' ';
    return text;
  };
  const rows = (): string[] => screenText().match(/.{80}/g) ?? [];

  /** The line the cursor is on (and the one before, for a prompt that wrapped): where a prompt waits. */
  const atCursor = (): string => {
    const y = pc.computer?.screen.cursorY ?? 0;
    return rows()
      .slice(Math.max(0, y - 1), y + 1)
      .join('');
  };

  /** Waits for a prompt with `words` at the cursor, answering a [More] on the way; false if it never came. */
  const waitFor = async (words: string, g: number): Promise<boolean> => {
    for (let t = 0; t < WAIT_MS; t += 150) {
      if (g !== gen) return false;
      const line = atCursor();
      if (line.includes(words)) {
        // the whole prompt drawn (a slow line draws it a letter at a time)
        await sleep(300);
        return g === gen;
      }
      if (line.includes('[More] Press a key')) {
        pc.computer?.keys.push(key('Enter'));
        await sleep(600);
      }
      await sleep(150);
    }
    return false;
  };

  /** Types on the PC: Enter for \n, Esc for \x1b. */
  const type = (text: string) => {
    const keys = pc.computer?.keys;
    for (const ch of text) keys?.push(key(ch === '\n' ? 'Enter' : ch === '\x1b' ? 'Escape' : ch));
  };

  const call = async () => {
    const computer = pc.computer;
    // the visitor's own program stays: no call
    if (computer?.busy) return;
    found = {
      speed: stored(SPEED_KEY),
      account: storedAccount(),
      door: stored(DOOR_KEY),
      downloads: new Set(computer?.downloads.list() ?? []),
    };
    desk.dataset.tourBbs = 'on';
    if (lineSpeed() !== CALL_SPEED) setLineSpeed(CALL_SPEED);
    await pc.command('C:\nTERMINAL SANDBOX');
    // switched on just now: what C: had before the call
    if (!computer) found.downloads = new Set((await pc.load()).downloads.list());
  };

  /** The first file in the list not on C: already (else the first), viewed. */
  const view = (g: number) => {
    const listed = rows()
      .map((r) => /^.?\s*(\d+) ([ *])\S+\.ZIP/.exec(r))
      .filter((m): m is RegExpExecArray => !!m);
    pick = Number((listed.find((m) => m[2] === ' ') ?? listed[0])?.[1] ?? 1);
    if (g === gen) type(`V${pick}\n`);
  };

  const run = async (act: Act, g: number) => {
    if (act.do === 'bbs-call') return call();
    if (!found || desk.dataset.tourBbs !== 'on') return;
    if (act.wait && !(await waitFor(act.wait, g))) {
      // the board isn't where the script thought: nothing more is typed, and the steps about it are left out
      if (g === gen) desk.dataset.tourBbs = 'lost';
      return;
    }
    if (g !== gen) return;
    if (act.do === 'bbs-type' && act.text) type(act.text);
    else if (act.do === 'bbs-view') view(g);
    else if (act.do === 'bbs-download') type(`D${pick}\n`);
    else if (act.do === 'bbs-logoff') {
      // G at the main menu, Y to leave, and Esc out of TERMINAL's dialing directory to the prompt
      type('G');
      if (!(await waitFor('Leave the sandbox', g))) return;
      type('Y');
      if (await waitFor('Dial which entry', g)) type('\x1b');
    }
  };

  /** The chapter is left: the call stopped and everything it changed put back. */
  const tidy = async () => {
    gen++;
    const was = found;
    found = undefined;
    delete desk.dataset.tourBbs;
    if (!was) return;
    const computer = pc.computer;
    if (computer?.busy) await computer.stopAnyProgram();
    // the door's "still online" note comes as the call ends: after it, the door as it was
    await sleep(200);
    putBack(DOOR_KEY, was.door);
    restoreAccount(was.account);
    const speed = was.speed === 'unlimited' ? 'unlimited' : Number(was.speed);
    if (was.speed !== null && (speed === 'unlimited' || Number.isFinite(speed))) setLineSpeed(speed as Parameters<typeof setLineSpeed>[0]);
    else {
      // none chosen before: the default again, and nothing remembered
      setLineSpeed(CALL_SPEED);
      putBack(SPEED_KEY, null);
    }
    for (const id of computer?.downloads.list() ?? []) if (!was.downloads.has(id)) computer?.downloads.remove(id);
  };

  const onAct = (e: Event) => {
    if (!desk.isConnected) return;
    const act = (e as CustomEvent<Act>).detail;
    if (!act?.do?.startsWith('bbs-')) return;
    // leaving: a script still waiting for the screen gives up at once
    if (act.do === 'bbs-end') gen++;
    const g = gen;
    queue = queue.then(() => (act.do === 'bbs-end' ? tidy() : run(act, g))).catch((err: unknown) => console.warn('Tour BBS:', err));
  };
  window.addEventListener('gm-tour-act', onAct);
  return () => {
    window.removeEventListener('gm-tour-act', onAct);
    void tidy();
  };
}
