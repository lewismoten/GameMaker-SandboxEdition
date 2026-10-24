import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Term } from './term';
import { TextKeys, key, readLine } from '../text/textInput';
import { DEFAULT_SPEED, setLineSpeed } from './lineSpeed';
import type { TextScreen } from '../text/textScreen';
import { PacedQueue } from './pacedQueue';

/** A text screen without a canvas: just the cells and the cursor. */
function fakeScreen() {
  const s = {
    chars: new Uint8Array(80 * 25).fill(32),
    attrs: new Uint8Array(80 * 25).fill(7),
    cursorX: 0,
    cursorY: 0,
    put(x: number, y: number, ch: number, a: number) {
      s.chars[y * 80 + x] = ch;
      s.attrs[y * 80 + x] = a;
    },
    fill(x: number, y: number, x1: number, y1: number, a: number, ch = 32) {
      for (let yy = y; yy <= y1; yy++) for (let xx = x; xx <= x1; xx++) s.put(xx, yy, ch, a);
    },
    write: () => undefined,
    print(text: string, a = 7) {
      for (const ch of text) s.put(s.cursorX++, s.cursorY, ch.charCodeAt(0), a);
    },
    markDirty: () => undefined,
    row: (y: number) => String.fromCharCode(...s.chars.subarray(y * 80, y * 80 + 80)).trimEnd(),
  };
  return s;
}

function setup() {
  const screen = fakeScreen();
  const keys = new TextKeys();
  const t = new Term({ screen: screen as unknown as TextScreen, keys, audio: () => undefined });
  return { screen, keys, t };
}

describe('the paced line', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] }));
  afterEach(() => {
    vi.useRealTimers();
    setLineSpeed(DEFAULT_SPEED);
  });

  it('puts text up at once before a call, and when the line is unlimited', () => {
    const { screen, t } = setup();
    setLineSpeed(300);
    t.line('ATZ');
    expect(screen.row(0)).toBe('ATZ');
    setLineSpeed('unlimited');
    t.connected = true;
    t.line('HELLO THERE');
    expect(screen.row(1)).toBe('HELLO THERE');
    t.close();
  });

  it('sends text at the line speed: 300 baud is 30 characters a second', () => {
    const { screen, t } = setup();
    setLineSpeed(300);
    t.connected = true;
    t.print('X'.repeat(60));
    expect(screen.row(0)).toBe('');
    vi.advanceTimersByTime(1000);
    const shown = screen.row(0).length;
    expect(shown).toBeGreaterThan(20);
    expect(shown).toBeLessThan(40);
    vi.advanceTimersByTime(1500);
    expect(screen.row(0)).toBe('X'.repeat(60));
    t.close();
  });

  it('keeps clears, pictures and text in the order they were sent', () => {
    const { screen, t } = setup();
    setLineSpeed(2400);
    t.connected = true;
    t.line('OLD');
    t.clear();
    t.art((s) => {
      s.put(5, 0, 65, 7);
      s.cursorY = 1;
    });
    t.line('NEW');
    vi.advanceTimersByTime(2000);
    expect(screen.row(0)).toBe('     A');
    expect(screen.row(1)).toBe('NEW');
    t.close();
  });

  it('reads a key only once the screen has caught up, and keeps keys typed meanwhile', async () => {
    const { screen, keys, t } = setup();
    setLineSpeed(300);
    t.connected = true;
    t.print('Enter your handle: ');
    keys.push(key('L')); // typed early, as callers did
    let got = '';
    const read = t.key().then((k) => (got = k));
    await vi.advanceTimersByTimeAsync(200);
    expect(got).toBe('');
    await vi.advanceTimersByTimeAsync(1500);
    await read;
    expect(got).toBe('L');
    expect(screen.row(0)).toBe('Enter your handle:');
    t.close();
  });

  it('speeds up at once when the speed changes mid-screen', () => {
    const { screen, t } = setup();
    setLineSpeed(300);
    t.connected = true;
    t.print('Y'.repeat(70));
    vi.advanceTimersByTime(100);
    expect(screen.row(0).length).toBeLessThan(10);
    setLineSpeed('unlimited');
    vi.advanceTimersByTime(20);
    expect(screen.row(0)).toBe('Y'.repeat(70));
    t.close();
  });

  it('drops what was on its way when the program stops', () => {
    const { screen, keys, t } = setup();
    setLineSpeed(300);
    t.connected = true;
    t.print('Z'.repeat(50));
    keys.abort();
    vi.advanceTimersByTime(5000);
    expect(screen.row(0)).toBe('');
    t.close();
  });
});

describe('PacedQueue', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] }));
  afterEach(() => vi.useRealTimers());

  it('runs every unit in order and settles drain()', async () => {
    const out: number[] = [];
    const q = new PacedQueue(() => 100);
    q.push(Array.from({ length: 50 }, (_, i) => ({ cost: 1, run: () => out.push(i) })));
    let done = false;
    void q.drain().then(() => (done = true));
    await vi.advanceTimersByTimeAsync(1000);
    expect(out).toEqual([...Array(50).keys()]);
    expect(done).toBe(true);
    expect(q.idle).toBe(true);
  });
});

describe('readLine on a slow line', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] }));
  afterEach(() => {
    vi.useRealTimers();
    setLineSpeed(DEFAULT_SPEED);
  });

  it('echoes after the prompt, once the prompt has arrived', async () => {
    const { screen, keys, t } = setup();
    setLineSpeed(1200);
    t.connected = true;
    t.line('A LIST OF FILES');
    t.print('Name: ');
    const read = readLine(screen as unknown as TextScreen, keys);
    keys.type('ZOE\n');
    await vi.advanceTimersByTimeAsync(2000);
    expect(await read).toBe('ZOE');
    expect(screen.row(1)).toBe('Name: ZOE');
    t.close();
  });
});
