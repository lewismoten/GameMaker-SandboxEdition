// TIC-TAC-TOE BY MODEM's rules: the other caller wins and blocks, waits at least five minutes,
// and the saved game survives a reload.
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  callIn,
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
  stillOnline,
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

describe('one phone line', () => {
  const min = 60_000;

  it('waits 5 to 15 minutes', () => {
    expect(replyDelay(() => 0)).toBe(MIN_WAIT_MS);
    expect(replyDelay(() => 0.999999)).toBeLessThan(MAX_WAIT_MS);
    expect(MIN_WAIT_MS).toBe(5 * min);
  });

  it('never moves while you stay on the line, even for an hour', () => {
    let s = callIn(newState(), 0);
    s = play(s, 0, () => 0);
    for (let t = 0; t <= 60 * min; t += min) s = stillOnline(s, t);
    expect(turn(s.game)).toBe('theirs');
    // calling back the moment the hour-long call ends: no time offline
    s = callIn(s, 60 * min);
    expect(turn(s.game)).toBe('theirs');
    expect(s.away).toBe(0);
  });

  it('moves once you have been offline for 5 minutes or more', () => {
    let s = play(callIn(newState(), 0), 0, () => 0); // needs exactly 5 minutes away
    s = stillOnline(s, 10 * min); // hung up at 10 minutes
    const soon = callIn(s, 10 * min + MIN_WAIT_MS - 1);
    expect(turn(soon.game)).toBe('theirs');
    expect(soon.news).toBeFalsy();
    // the early call counts as time on the line: the 5 minutes start again from its hang-up
    const later = callIn(stillOnline(soon, 16 * min), 21 * min);
    expect(turn(later.game)).toBe('yours');
    expect(later.news).toBe(true);
    expect(later.game.last).toBe(later.game.board.indexOf('O'));
  });

  it('always moves after 15 minutes away, at a random point after 5', () => {
    for (const r of [0, 0.3, 0.7, 0.999]) {
      const s = stillOnline(
        play(newState(), 4, () => r),
        0,
      );
      expect(turn(callIn(s, MAX_WAIT_MS).game)).toBe('yours');
      expect(turn(callIn(s, MIN_WAIT_MS - 1).game)).toBe('theirs');
    }
  });

  it('refuses a move while waiting, or on a taken cell', () => {
    const s = play(newState(), 4);
    expect(play(s, 0)).toBe(s);
    const after = callIn(stillOnline(s, 0), MAX_WAIT_MS);
    expect(play(after, 4)).toBe(after);
  });

  it('counts wins, losses and draws, and takes turns at who starts', () => {
    let s = newState();
    s = { ...s, game: { ...s.game, board: board('XX OO    ') } };
    s = play(s, 2);
    expect(s.game.over).toBe('X');
    expect(s.record).toEqual({ wins: 1, losses: 0, draws: 0 });
    s = rematch(s, () => 0);
    expect(s.game.first).toBe('O');
    expect(turn(s.game)).toBe('theirs');
    expect(s.game.pending?.after).toBe(MIN_WAIT_MS);
    s = rematch(s);
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
    const s = stillOnline(
      play(newState(), 4, () => 0.3),
      1000,
    ); // moved, then hung up
    saveState(s);
    const back = loadState();
    expect(back).toEqual(s);
    expect(turn(callIn(back, 1000 + MIN_WAIT_MS - 1).game)).toBe('theirs');
    expect(turn(callIn(back, 1000 + MAX_WAIT_MS).game)).toBe('yours');
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
    expect(() => saveState(newState())).not.toThrow();
    expect(loadState().game.board).toEqual(emptyBoard());
    expect(parseState('{"game":{"board":[1,2]}}')).toBeUndefined();
    expect(parseState('not json')).toBeUndefined();
  });
});
