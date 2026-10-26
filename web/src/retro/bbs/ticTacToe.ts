// TIC-TAC-TOE BY MODEM's rules, kept apart from the screen (ticTacToeDoor.ts): the board, the
// other caller's moves, the wait for their turn and the saved game. A door game like this
// one was played a move a call. THE -= S A N D B O X =- BBS has one phone line, so the other
// player (SCROLLMASTER, who is make-believe) can only call in while you are off it: their
// answer is picked as soon as you move (so a reload can't roll it again), along with how long
// you must stay offline for them to get through, 5 to 15 minutes. When you call back, the
// time since you last left the board decides whether they did. It is real time, measured
// with Date.now: the desk's DOS TIME moves the room's clock, not this.

type Mark = 'X' | 'O';
/** Nine cells, left to right and top to bottom: 'X', 'O' or ' '. */
export type Board = string[];
type Outcome = Mark | 'draw';

/** You must stay off the line at least this long for the other player to take a turn. */
export const MIN_WAIT_MS = 5 * 60_000;
/** ...and at most this long. */
export const MAX_WAIT_MS = 15 * 60_000;

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export const emptyBoard = (): Board => Array<string>(9).fill(' ');

const freeCells = (b: Board): number[] => b.flatMap((c, i) => (c === ' ' ? [i] : []));

/** The three cells in a row, if somebody has them. */
export function winLine(b: Board): number[] | undefined {
  return LINES.find(([a, c, d]) => b[a] !== ' ' && b[a] === b[c] && b[a] === b[d]);
}

/** Who won, 'draw' on a full board, or undefined while the game goes on. */
export function outcome(b: Board): Outcome | undefined {
  const line = winLine(b);
  if (line) return b[line[0]] as Mark;
  return freeCells(b).length ? undefined : 'draw';
}

/** A cell that gives `mark` three in a row, if any. */
function finishing(b: Board, mark: Mark): number | undefined {
  for (const line of LINES) {
    const mine = line.filter((i) => b[i] === mark).length;
    const free = line.filter((i) => b[i] === ' ');
    if (mine === 2 && free.length === 1) return free[0];
  }
  return undefined;
}

const pick = (cells: number[], rand: () => number) => cells[Math.min(cells.length - 1, Math.floor(rand() * cells.length))];

/**
 * The other caller's move, as O: decent but beatable. A win if there is one, else a block;
 * otherwise usually the middle, then a corner, then an edge, with now and then a move made
 * on a whim. It never looks ahead for forks, so a player who sets up two threats wins.
 */
export function replyMove(b: Board, rand: () => number = Math.random, me: Mark = 'O'): number {
  const free = freeCells(b);
  if (!free.length) throw new Error('The board is full.');
  const win = finishing(b, me);
  if (win !== undefined) return win;
  const block = finishing(b, me === 'O' ? 'X' : 'O');
  if (block !== undefined) return block;
  if (rand() < 0.2) return pick(free, rand); // on a whim
  if (b[4] === ' ') return 4;
  const corners = [0, 2, 6, 8].filter((i) => b[i] === ' ');
  if (corners.length) return pick(corners, rand);
  return pick(free, rand);
}

/** How long you must be offline before the other player gets through and moves: 5 to 15 minutes. */
export const replyDelay = (rand: () => number = Math.random): number => MIN_WAIT_MS + Math.floor(rand() * (MAX_WAIT_MS - MIN_WAIT_MS));

// ---- the saved game ------------------------------------------------------------------------

interface DoorRecord {
  wins: number;
  losses: number;
  draws: number;
}

interface DoorGame {
  board: Board;
  /** Who moved first this game (they take turns from game to game). */
  first: Mark;
  /** The other player's move, picked already, and how long (ms) you must be offline for it to happen. */
  pending?: { cell: number; after: number };
  /** Set once the game ends (and the record has counted it). */
  over?: Outcome;
  /** The other player's last move, to point out when you next look. */
  last?: number;
}

export interface DoorState {
  game: DoorGame;
  record: DoorRecord;
  /** The last moment (Date.now ms) you were known to be on the board: the hang-up, or the last sign of life. */
  leftAt?: number;
  /** How long (ms) you were away before this call, if known. */
  away?: number;
  /** The other player moved while you were away, and the door hasn't said so yet. */
  news?: boolean;
}

/** A new game: when the other player goes first, their opening move is on its way. */
function newGame(first: Mark, rand: () => number = Math.random): DoorGame {
  const board = emptyBoard();
  return first === 'X' ? { board, first } : { board, first, pending: { cell: replyMove(board, rand), after: replyDelay(rand) } };
}

export const newState = (rand: () => number = Math.random): DoorState => ({
  game: newGame('X', rand),
  record: { wins: 0, losses: 0, draws: 0 },
});

/** Ends the game if the board says so, counting it in the record. */
function settle(s: DoorState): DoorState {
  const o = outcome(s.game.board);
  if (!o || s.game.over) return s;
  const r = { ...s.record };
  if (o === 'X') r.wins++;
  else if (o === 'O') r.losses++;
  else r.draws++;
  return { ...s, game: { ...s.game, over: o, pending: undefined }, record: r };
}

type Turn = 'yours' | 'theirs' | 'over';

export const turn = (g: DoorGame): Turn => (g.over ? 'over' : g.pending ? 'theirs' : 'yours');

/** Your X in `cell`; the other player's answer is picked, to happen once you've been offline long enough. Unchanged if the move isn't allowed. */
export function play(s: DoorState, cell: number, rand: () => number = Math.random): DoorState {
  if (turn(s.game) !== 'yours' || s.game.board[cell] !== ' ') return s;
  const board = s.game.board.slice();
  board[cell] = 'X';
  const after = settle({ ...s, game: { ...s.game, board, last: undefined } });
  if (after.game.over) return after;
  return { ...after, game: { ...after.game, pending: { cell: replyMove(board, rand), after: replyDelay(rand) } } };
}

/**
 * You called the board (Date.now ms): if you were off the line long enough since `leftAt`,
 * the other player got through and moved. Staying on the line never moves the game on.
 */
export function callIn(s: DoorState, now: number): DoorState {
  const away = s.leftAt === undefined ? undefined : now - s.leftAt;
  const next: DoorState = { ...s, leftAt: now, away };
  const p = s.game.pending;
  if (!p || away === undefined || away < p.after) return next;
  const board = s.game.board.slice();
  board[p.cell] = 'O';
  return settle({ ...next, news: true, game: { ...s.game, board, pending: undefined, last: p.cell } });
}

/** Still on the line at `now` (or just hung up): the offline time counts from here. */
export const stillOnline = (s: DoorState, now: number): DoorState => ({ ...s, leftAt: now });

/** A rematch: the other player starts this time if you started the last one. */
export function rematch(s: DoorState, rand: () => number = Math.random): DoorState {
  return { ...s, news: false, game: newGame(s.game.first === 'X' ? 'O' : 'X', rand) };
}

const KEY = 'gm-bbs-door-tictactoe';

const count = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : 0);

/** A saved state read back, or undefined if it is missing or doesn't make sense. */
export function parseState(raw: string | null): DoorState | undefined {
  if (!raw) return undefined;
  try {
    const v = JSON.parse(raw) as Partial<DoorState>;
    const g = v.game;
    if (!g || !Array.isArray(g.board) || g.board.length !== 9 || !g.board.every((c) => c === 'X' || c === 'O' || c === ' ')) return undefined;
    const first: Mark = g.first === 'O' ? 'O' : 'X';
    const p = g.pending;
    const pending =
      p && Number.isInteger(p.cell) && p.cell >= 0 && p.cell < 9 && g.board[p.cell] === ' ' && Number.isFinite(p.after)
        ? { cell: p.cell, after: Math.max(MIN_WAIT_MS, p.after) }
        : undefined;
    const last = Number.isInteger(g.last) && g.board[g.last!] === 'O' ? g.last : undefined;
    const r = v.record;
    const state: DoorState = {
      game: { board: g.board.slice(), first, pending, last },
      record: { wins: count(r?.wins), losses: count(r?.losses), draws: count(r?.draws) },
    };
    if (Number.isFinite(v.leftAt)) state.leftAt = v.leftAt;
    if (Number.isFinite(v.away)) state.away = v.away;
    if (v.news === true && state.game.last !== undefined) state.news = true;
    // a finished game counted already; one left mid-game carries on
    const o = outcome(state.game.board);
    if (o) state.game = { ...state.game, over: o, pending: undefined };
    return state;
  } catch {
    return undefined;
  }
}

/** The saved game for this visitor (storage blocked or empty: a fresh one). */
export function loadState(): DoorState {
  try {
    return parseState(localStorage.getItem(KEY)) ?? newState();
  } catch {
    return newState();
  }
}

export function saveState(s: DoorState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // storage blocked: this visit only
  }
}
