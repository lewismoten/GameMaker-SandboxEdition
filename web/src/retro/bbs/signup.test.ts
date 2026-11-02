// Callback verification runs on a fake clock: only an answered call and correct code persist.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RetroHost } from '../host';
import { TextKeys, ProgramAborted } from '../text/textInput';
import { NoCarrier, phoneLine, type Term } from './term';
import { signup } from './signup';
import { signupAccounts, type SignupBoard } from './signupAccounts';

function fixture(board: SignupBoard = 'sandbox', prefill = 'Teddy\n555-0101\n\n') {
  const keys = new TextKeys(),
    logs: string[] = [];
  let connected = true,
    dropping = false;
  const term = {
    get connected() {
      return connected;
    },
    set connected(on: boolean) {
      connected = on;
    },
    get dropping() {
      return dropping;
    },
    print(text: string) {
      if (dropping) throw new NoCarrier();
      logs.push(text);
    },
    line(text = '') {
      logs.push(text);
    },
    local(text: string) {
      logs.push(text);
    },
    status: vi.fn(),
    drain: async () => {},
    hangUp: async () => {
      connected = false;
    },
    key: async () => (await keys.next()).key,
  } as unknown as Term;
  const screen = { cursorX: 0, cursorY: 0, cursorVisible: true, write: () => {}, print: () => {} };
  const host = { keys, screen } as unknown as RetroHost;
  keys.type(prefill);
  const task = signup(term, host, board).catch((error: unknown) => error);
  return {
    keys,
    logs,
    term,
    task,
    drop: () => {
      dropping = true;
    },
  };
}
async function answer(f: ReturnType<typeof fixture>) {
  await vi.advanceTimersByTimeAsync(1500);
  f.keys.type('ATA\n');
  await vi.advanceTimersByTimeAsync(750);
}
beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) });
  vi.spyOn(Math, 'random').mockReturnValue(0);
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  phoneLine.offHook = false;
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  phoneLine.offHook = false;
});

describe('BBS callback signup', () => {
  it('disconnects, accepts ATA, and saves only after the correct code', async () => {
    const f = fixture();
    await vi.advanceTimersByTimeAsync(1500);
    expect(f.term.connected).toBe(false);
    expect(f.logs.join('')).toContain('RING');
    expect(signupAccounts.find('sandbox', 'TEDDY')).toBeUndefined();
    f.keys.type('ATA\n');
    await vi.advanceTimersByTimeAsync(750);
    expect(f.term.connected).toBe(true);
    expect(signupAccounts.find('sandbox', 'TEDDY')).toBeUndefined();
    f.keys.type('1000\n');
    await vi.advanceTimersByTimeAsync(300);
    expect(await f.task).toBe('TEDDY');
    expect(signupAccounts.find('sandbox', 'Teddy')?.phone).toBe('555-0101');
  });
  it('uses the same flow for The Sofa and reuses an already verified handle', async () => {
    const f = fixture('sofa');
    await answer(f);
    f.keys.type('1000\n');
    await vi.advanceTimersByTimeAsync(300);
    expect(await f.task).toBe('TEDDY');
    expect(signupAccounts.find('sandbox', 'Teddy')).toBeUndefined();
    const again = fixture('sofa', 'teddy\n');
    expect(await again.task).toBe('TEDDY');
    expect(again.logs.join('')).not.toContain('RING');
  });
  it('keeps a busy home line unverified', async () => {
    const f = fixture();
    phoneLine.offHook = true;
    await vi.advanceTimersByTimeAsync(1500);
    expect(await f.task).toBeUndefined();
    expect(f.logs.join('')).toContain('LINE BUSY');
    expect(signupAccounts.find('sandbox', 'Teddy')).toBeUndefined();
  });
  it('expires an unanswered callback without saving a handle', async () => {
    const f = fixture();
    await vi.advanceTimersByTimeAsync(31_500);
    expect(await f.task).toBeUndefined();
    expect(f.logs.filter((line) => line.startsWith('|14RING'))).toHaveLength(5);
    expect(signupAccounts.find('sandbox', 'Teddy')).toBeUndefined();
  });
  it('rejects three incorrect confirmation codes', async () => {
    const f = fixture();
    await answer(f);
    f.keys.type('9999\n9999\n9999\n');
    await vi.advanceTimersByTimeAsync(1000);
    expect(await f.task).toBeUndefined();
    expect(signupAccounts.find('sandbox', 'Teddy')).toBeUndefined();
  });
  it('expires a connected confirmation prompt', async () => {
    const f = fixture();
    await answer(f);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(await f.task).toBeUndefined();
    expect(f.term.connected).toBe(false);
    expect(signupAccounts.find('sandbox', 'Teddy')).toBeUndefined();
  });
  it('cancels a ringing callback and leaves no pending keyboard waiter', async () => {
    const f = fixture();
    await vi.advanceTimersByTimeAsync(1500);
    f.keys.push({ key: 'Escape', code: '', ctrl: false, shift: false, alt: false });
    await vi.advanceTimersByTimeAsync(50);
    expect(await f.task).toBeUndefined();
    f.keys.type('Z');
    expect(f.keys.poll()?.key).toBe('Z');
    expect(signupAccounts.find('sandbox', 'Teddy')).toBeUndefined();
  });
  it('does not accept an external number, and permits cancellation before hanging up', async () => {
    const f = fixture('sandbox', 'Teddy\n555-0200\nQ\n');
    expect(await f.task).toBeUndefined();
    expect(f.term.connected).toBe(true);
    expect(f.logs.join('')).toContain('corgi switchboard');
  });
  it('does not ring after shutdown during the callback delay', async () => {
    const f = fixture();
    await vi.advanceTimersByTimeAsync(0);
    f.keys.abort();
    await vi.advanceTimersByTimeAsync(1500);
    expect(await f.task).toBeInstanceOf(ProgramAborted);
    expect(f.logs.join('')).not.toContain('RING');
    expect(signupAccounts.find('sandbox', 'Teddy')).toBeUndefined();
  });
  it('does not connect after shutdown during the answer delay', async () => {
    const f = fixture();
    await vi.advanceTimersByTimeAsync(1500);
    f.keys.type('ATA\n');
    await vi.advanceTimersByTimeAsync(250);
    expect(f.logs.join('')).toContain('Answering callback');
    f.keys.abort();
    await vi.advanceTimersByTimeAsync(500);
    expect(await f.task).toBeInstanceOf(ProgramAborted);
    expect(f.logs.join('')).not.toContain('CONNECT');
    expect(signupAccounts.find('sandbox', 'Teddy')).toBeUndefined();
  });
  it('stops on power-off without saving or accepting a later code', async () => {
    const f = fixture();
    await answer(f);
    f.keys.abort();
    await vi.advanceTimersByTimeAsync(50);
    expect(await f.task).toBeInstanceOf(ProgramAborted);
    expect(signupAccounts.find('sandbox', 'Teddy')).toBeUndefined();
  });
  it('preserves carrier-loss handling when the wall phone interrupts code entry', async () => {
    const f = fixture();
    await answer(f);
    f.drop();
    await vi.advanceTimersByTimeAsync(50);
    expect(await f.task).toBeInstanceOf(NoCarrier);
    expect(f.term.dropping).toBe(true);
    expect(signupAccounts.find('sandbox', 'Teddy')).toBeUndefined();
  });
});
