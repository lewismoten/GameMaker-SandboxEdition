// TIC-TAC-TOE BY MODEM's rules: the other caller wins and blocks, waits at least five minutes,
// and the saved game survives a reload.
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  arrive,
  emptyBoard,
  loadState,
  MAX_WAIT_MS,
  MIN_WAIT_MS,
  newState,
  outcome,
  parseState,
  play,
  rematch,
  replyDelay,
  replyMove,
  saveState,
  turn,
  type Board,
} from './ticTacToe';

/** "XO X  O  " style: nine characters, one a cell. */
const board = (s: string): Board => s.split('');

describe('the other caller', () => {
  it('takes a win before anything else', () => {
    // O has two on the top row; X has two on the middle row
    expect(replyMove(board('OO XX    '), () => 0.99)).toBe(2);
    expect(replyMove(board('X  XO  O '), () => 0)).toBe(1); // middle column
  });

  it('blocks three in a row', () => {
    expect(replyMove(board('XX  O    '), () => 0.99)).toBe(2);
    expect(replyMove(board('X   X    '), () => 0.99)).toBe(8);
    expect(replyMove(board('O X X    '), () => 0.99)).toBe(6);
  });

  it('takes the middle, then a corner, when nothing is at stake', () => {
    expect(replyMove(emptyBoard(), () => 0.5)).toBe(4);
    expect([0, 2, 6, 8]).toContain(replyMove(board('    X    '), () => 0.5));
  });

  it('can be beaten with a fork', () => {
    // X corner, O middle, X the far corner: O takes a corner, X blocks it and has two threats
    const b = board('X   O   X');
    const o = replyMove(b, () => 0.5);
    expect([2, 6]).toContain(o);
    b[o] = 'O';
    const block = 8 - o; // the corner that stops O's diagonal
    expect(replyMove(b, () => 0.5)).toBe(block); // what O would take there itself
    b[block] = 'X';
    b[replyMove(b, () => 0.5)] = 'O'; // O blocks one threat
    const wins = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((i) => b[i] === ' ' && outcome(Object.assign(b.slice(), { [i]: 'X' })) === 'X');
    expect(wins.length).toBeGreaterThan(0);
  });
});

describe('the turn timer', () => {
  it('waits 5 to 15 minutes', () => {
    expect(replyDelay(() => 0)).toBe(MIN_WAIT_MS);
    expect(replyDelay(() => 0.999999)).toBeLessThan(MAX_WAIT_MS);
    expect(MIN_WAIT_MS).toBe(5 * 60_000);
  });

  it('shows the reply no sooner than five minutes after the move', () => {
    const t0 = 1_000_000;
    let s = play(newState(t0), 0, t0, () => 0);
    expect(turn(s.game)).toBe('theirs');
    expect(arrive(s, t0 + MIN_WAIT_MS - 1).moved).toBe(false);
    const r = arrive(s, t0 + MIN_WAIT_MS);
    expect(r.moved).toBe(true);
    s = r.state;
    expect(turn(s.game)).toBe('yours');
    expect(s.game.board.filter((c) => c === 'O')).toHaveLength(1);
    expect(s.game.last).toBe(s.game.board.indexOf('O'));
  });

  it('refuses a move while waiting, or on a taken cell', () => {
    const s = play(newState(0), 4, 0);
    expect(play(s, 0, 1)).toBe(s);
    const after = arrive(s, MAX_WAIT_MS).state;
    expect(play(after, 4, MAX_WAIT_MS)).toBe(after);
  });

  it('counts wins, losses and draws, and takes turns at who starts', () => {
    let s = newState(0);
    s = { ...s, game: { ...s.game, board: board('XX OO    ') } };
    s = play(s, 2, 0);
    expect(s.game.over).toBe('X');
    expect(s.record).toEqual({ wins: 1, losses: 0, draws: 0 });
    s = rematch(s, 100, () => 0);
    expect(s.game.first).toBe('O');
    expect(turn(s.game)).toBe('theirs');
    expect(s.game.pending?.at).toBe(100 + MIN_WAIT_MS);
    s = rematch(s, 200);
    expect(s.game.first).toBe('X');
    expect(turn(s.game)).toBe('yours');
  });
});

describe('the saved game', () => {
  const store = new Map<string, string>();
  afterEach(() => {
    vi.unstubAllGlobals();
    store.clear();
  });

  it('survives a reload, the wait included', () => {
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    });
    const s = play(newState(0), 4, 0, () => 0.3);
    saveState(s);
    const back = loadState(10);
    expect(back).toEqual(s);
    expect(arrive(back, MIN_WAIT_MS - 1).moved).toBe(false);
  });

  it('starts fresh when storage is blocked or the save is garbage', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    expect(() => saveState(newState(0))).not.toThrow();
    expect(loadState(0).game.board).toEqual(emptyBoard());
    expect(parseState('{"game":{"board":[1,2]}}')).toBeUndefined();
    expect(parseState('not json')).toBeUndefined();
  });
});
