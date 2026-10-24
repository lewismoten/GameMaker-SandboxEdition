// THE -= S A N D B O X =- BBS's door games: TIC-TAC-TOE BY MODEM v1.2, played a move a call
// against SCROLLMASTER from Highland Park, the way callers played door games in 1994. The
// board has one phone line, so SCROLLMASTER can only call in and move while you are off it:
// you move, hang up, and stay away at least five minutes (ticTacToe.ts has the rules).
// Everything here goes down the line through Term, so it arrives at the modem's speed.
//
// The wait is real time on purpose. "Travel through time" (lineSpeed.ts timeWarp) only
// skips what is on its way down the line; it never brings SCROLLMASTER's turn sooner, and
// neither does setting the desk's clock with DOS's TIME: the time offline is measured with
// Date.now.
import { unlockAchievement } from '../../achievements';
import { boxBottom, boxRow, boxRule, boxTop, type Term } from './term';
import { callIn, loadState, MIN_WAIT_MS, play, rematch, saveState, stillOnline, turn, winLine, type DoorState } from './ticTacToe';

export const DOOR_NAME = 'TIC-TAC-TOE BY MODEM v1.2';
const RIVAL = 'SCROLLMASTER';
const RIVAL_FROM = 'Highland Park, PA';
const WAIT_MIN = MIN_WAIT_MS / 60_000;

/** How often a call up on the board notes that you are still on the line. */
const HEARTBEAT_MS = 20_000;

/**
 * A call to the Sandbox has connected: SCROLLMASTER's turn happens now if you were away long
 * enough. Returns the hang-up, which notes when you left. Till then the call notes it is
 * still up every 20 seconds and as the page closes, so a call that never hung up properly
 * (the program stopped, the tab closed) counts as ending at its last sign of life.
 */
export function sandboxCall(): () => void {
  const note = () => saveState(stillOnline(loadState(), Date.now()));
  saveState(callIn(loadState(), Date.now()));
  const beat = setInterval(note, HEARTBEAT_MS);
  if (typeof window !== 'undefined') {
    addEventListener('pagehide', note);
    addEventListener('beforeunload', note);
  }
  return () => {
    clearInterval(beat);
    if (typeof window !== 'undefined') {
      removeEventListener('pagehide', note);
      removeEventListener('beforeunload', note);
    }
    note();
  };
}

/** What the board's door menu leads to: back to the main menu, or the caller hung up. */
export type DoorExit = 'menu' | 'hangup';

/** The Door Games menu. */
export async function doorGames(t: Term, name: string): Promise<DoorExit> {
  for (;;) {
    const now = turn(loadState().game);
    const state = now === 'yours' ? '|10Your move!' : now === 'over' ? '|14Game over: rematch?' : `|08Waiting on ${RIVAL}`;
    t.line();
    t.line(boxTop('Door Games', '05', '13'));
    t.line(boxRow(`  |13[|151|13] |15${DOOR_NAME.padEnd(30)}${state}`, '05'));
    t.line(boxRow(`  |13[|15S|13] |07Door scores`, '05'));
    t.line(boxRow(`  |13[|15Q|13] |07Back to the main menu`, '05'));
    t.line(boxRow('|08  More doors once the SysOp gets around to installing them.', '05'));
    t.line(boxBottom('05'));
    t.print('|13Door: |15');
    const k = await t.key();
    t.line(k.length === 1 ? k : '');
    if (k === '1') {
      if ((await ticTacToe(t, name)) === 'hangup') return 'hangup';
    } else if (k === 'S') await scores(t, name);
    else return 'menu';
  }
}

/** The door's title screen. */
function title(t: Term): void {
  t.clear();
  t.line();
  t.line(boxTop(DOOR_NAME, '03', '15'));
  t.line(boxRow('', '03'));
  t.line(boxRow('     |12▀█▀ █ ▄▀▀   |14▀█▀ ▄▀▄ ▄▀▀   |11▀█▀ ▄▀▄ █▀▀', '03'));
  t.line(boxRow('     |04 █  █ ▀▄▄   |06 █  █▀█ ▀▄▄   |03 █  ▀▄▀ ██▄     |15B Y   M O D E M', '03'));
  t.line(boxRow('', '03'));
  t.line(boxRow('  |07One move a call. Make yours, hang up, and call back later to see the reply.', '03'));
  t.line(boxRow(`  |07Your opponent: |15${RIVAL}|07 of ${RIVAL_FROM}, when the line is free.`, '03'));
  t.line(boxRule('03'));
  t.line(boxRow('  |08(C) 1994 Party Line Software. Freeware door for Renegade boards. Share it!', '03'));
  t.line(boxBottom('03'));
}

/** A few words from SCROLLMASTER with each move. */
const REMARKS = [
  'Middle is mine, as always.',
  'Had to think about that one over dinner.',
  "Nice try. I see what you're doing.",
  'My little brother says hi. He wanted me to go here.',
  'Took me three calls to get through. Your board is popular!',
  'Hmm. Hmm hmm hmm.',
  'Okay, your move. Make it a good one.',
];

function board(t: Term, s: DoorState): void {
  const b = s.game.board;
  const win = winLine(b) ?? [];
  const cell = (i: number) => {
    const c = b[i];
    if (c === ' ') return `|08 ${i + 1} `;
    const color = win.includes(i) ? '10' : c === 'X' ? '14' : '11';
    return `|${color} ${c} `;
  };
  const r = s.record;
  const side = [
    `|07You are |14X|07. ${RIVAL} is |11O|07.`,
    '',
    `|07Your record against ${RIVAL}:`,
    `|14${r.wins}|07 won   |14${r.losses}|07 lost   |14${r.draws}|07 drawn`,
    '',
  ];
  t.line();
  t.line(boxTop(`${DOOR_NAME}  vs. ${RIVAL}`, '03', '15'));
  for (let row = 0; row < 3; row++) {
    const cells = [0, 1, 2].map((c) => cell(row * 3 + c)).join('|07│');
    t.line(boxRow(`        ${cells}          ${side[row * 2] ?? ''}`, '03'));
    if (row < 2) t.line(boxRow(`        |07───┼───┼───          ${side[row * 2 + 1] ?? ''}`, '03'));
  }
  t.line(boxBottom('03'));
}

/** Why SCROLLMASTER hasn't moved, in the board's words. */
function notYet(t: Term, s: DoorState, justMoved: boolean): void {
  const away = s.away;
  if (justMoved) {
    t.line(`|07Saved. This board has only one phone line, so ${RIVAL} can call in`);
    t.line(`|07and move once you hang up. Give them at least ${WAIT_MIN} minutes.`);
  } else if (away !== undefined && away >= MIN_WAIT_MS) {
    t.line(`|07${RIVAL} didn't get through while you were away (${Math.floor(away / 60_000)} min).`);
    t.line('|07Hang up and give them a little longer this time.');
  } else {
    t.line(`|07The Sandbox has only one phone line, and ${RIVAL} can't call in`);
    t.line(`|07while you're on it. Hang up and give them at least ${WAIT_MIN} minutes.`);
  }
}

/** One visit to the door; 'hangup' if the caller hung up from it. */
async function ticTacToe(t: Term, name: string): Promise<DoorExit> {
  title(t);
  t.print('|07Press a key to play… ');
  await t.key();
  t.line();
  let shown = true;
  let justMoved = false;
  for (;;) {
    let s = loadState();
    if (shown) {
      board(t, s);
      if (s.news) {
        // SCROLLMASTER called in between your calls
        const moves = s.game.board.filter((c) => c === 'O').length;
        t.line(`|15${RIVAL}|07 called in while you were away, took square |15${(s.game.last ?? 0) + 1}|07, and left a note:`);
        t.line(`|11  "${REMARKS[(moves * 3 + s.record.wins + s.record.draws) % REMARKS.length]}"`);
        s = { ...s, news: false };
        saveState(s);
      }
      shown = false;
    }
    const now = turn(s.game);
    if (now === 'over') {
      const o = s.game.over;
      unlockAchievement('bbs-door');
      if (o === 'X') unlockAchievement('bbs-door-win');
      t.line(
        o === 'X'
          ? `|10Three in a row! You beat ${RIVAL}.`
          : o === 'O'
            ? `|12${RIVAL} got three in a row. Good game!`
            : '|14A draw: nobody got three in a row. It happens a lot in this game.',
      );
      const youNext = s.game.first === 'O';
      t.print(`|07R)ematch (${youNext ? 'you go' : `${RIVAL} goes`} first), S)cores, Q)uit to the BBS, H)ang up: |15`);
      const k = await t.key();
      t.line(k.length === 1 ? k : '');
      if (k === 'R') {
        saveState(rematch(s));
        t.line(youNext ? '|07A new board. Your move!' : `|07A new board. ${RIVAL} starts this one.`);
        shown = true;
        justMoved = !youNext;
      } else if (k === 'S') await scores(t, name);
      else if (k === 'H') return hangUp(t);
      else if (k === 'Q' || k === 'Escape') return 'menu';
    } else if (now === 'yours') {
      t.print('|07Your move: |151|07-|159|07, S)cores, Q)uit to the BBS: |15');
      const k = await t.key();
      t.line(k.length === 1 ? k : '');
      if (k >= '1' && k <= '9' && k.length === 1) {
        const after = play(s, Number(k) - 1);
        if (after === s) {
          t.line('|12That square is taken.');
          continue;
        }
        saveState(after);
        board(t, after);
        justMoved = true;
      } else if (k === 'S') await scores(t, name);
      else if (k === 'Q' || k === 'Escape') return 'menu';
    } else {
      // staying on the line never moves the game on: SCROLLMASTER needs it free
      notYet(t, s, justMoved);
      justMoved = false;
      t.print('|07H)ang up, S)cores, Q)uit to the BBS: |15');
      const k = await t.key();
      t.line(k.length === 1 ? k : '');
      if (k === 'S') await scores(t, name);
      else if (k === 'H') return hangUp(t);
      else if (k === 'Q' || k === 'Escape') return 'menu';
    }
  }
}

function hangUp(t: Term): DoorExit {
  t.line(`|07Game saved. Stay off the line at least ${WAIT_MIN} minutes so ${RIVAL} can call in.`);
  return 'hangup';
}

/** Other callers' records in this door, made up, to sit beside yours. */
const REGULARS: [string, number, number, number][] = [
  ['PIXEL WIZARD', 14, 6, 9],
  ['THE BLOCKSMITH', 9, 9, 12],
  ['SAND CASTLE', 7, 3, 11],
  ['MONSTER MASH', 4, 12, 5],
];

/** The door scores bulletin. */
async function scores(t: Term, name: string): Promise<void> {
  const r = loadState().record;
  const you = name === 'GUEST' ? 'YOU (GUEST)' : name;
  // SCROLLMASTER's record counts the games against you too
  const rows: [string, number, number, number][] = [...REGULARS, [RIVAL, 31 + r.losses, 22 + r.wins, 40 + r.draws], [you, r.wins, r.losses, r.draws]];
  rows.sort((a, b) => b[1] - a[1] || a[2] - b[2]);
  t.line();
  t.line(boxTop(`Door Scores: ${DOOR_NAME}`, '05', '13'));
  t.line(boxRow(`  |11 #  ${'Handle'.padEnd(24)}  Won  Lost  Drawn`, '05'));
  t.line(boxRule('05'));
  rows.forEach(([who, w, l, d], i) => {
    const c = who === you ? '14' : '07';
    t.line(
      boxRow(
        `  |${c}${String(i + 1).padStart(2)}  ${who.slice(0, 24).padEnd(24)} ${String(w).padStart(4)}  ${String(l).padStart(4)}  ${String(d).padStart(5)}`,
        '05',
      ),
    );
  });
  t.line(boxBottom('05'));
  t.line(`|08Everyone plays ${RIVAL}. This board has one line, so it's a move a call.`);
  t.print('|07Press a key… ');
  await t.key();
  t.line();
}
