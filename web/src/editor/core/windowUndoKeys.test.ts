// windowUndoKeys: Undo and Redo keys from anywhere on the page except text fields and the editor itself.
// The tests run in node, so window and the element classes are small stand-ins.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { windowUndoKeys } from './windowUndoKeys';

class FakeInput {}
type Handler = (e: unknown) => void;
let handler: Handler | null = null;

beforeEach(() => {
  handler = null;
  vi.stubGlobal('HTMLInputElement', FakeInput);
  vi.stubGlobal('HTMLSelectElement', class {});
  vi.stubGlobal('HTMLTextAreaElement', class {});
  vi.stubGlobal('window', {
    addEventListener: (_: string, h: Handler) => (handler = h),
    removeEventListener: (_: string, h: Handler) => {
      if (handler === h) handler = null;
    },
  });
});
afterEach(() => vi.unstubAllGlobals());

const inside = { closest: () => null };
const host = { isConnected: true, contains: (t: unknown) => t === inside } as unknown as HTMLElement;
const other = { isContentEditable: false, closest: () => null };

function key(init: Record<string, unknown>, target: unknown = other) {
  const e = { defaultPrevented: false, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, target, preventDefault: vi.fn(), ...init };
  handler?.(e);
  return e;
}

describe('windowUndoKeys', () => {
  it('undoes on Ctrl+Z and redoes on Shift+Z and Y, with Cmd too', () => {
    const undo = vi.fn();
    const redo = vi.fn();
    windowUndoKeys(host, undo, redo);
    const a = key({ key: 'z', ctrlKey: true });
    key({ key: 'Z', ctrlKey: true, shiftKey: true });
    key({ key: 'y', metaKey: true });
    expect(undo).toHaveBeenCalledTimes(1);
    expect(redo).toHaveBeenCalledTimes(2);
    expect(a.preventDefault).toHaveBeenCalled();
  });

  it('leaves text fields, the editor itself and plain keys alone, and stops when removed', () => {
    const undo = vi.fn();
    const redo = vi.fn();
    const stop = windowUndoKeys(host, undo, redo);
    key({ key: 'z', ctrlKey: true }, new FakeInput());
    key({ key: 'z', ctrlKey: true }, inside);
    key({ key: 'z' });
    key({ key: 'z', ctrlKey: true }, { closest: () => ({}) });
    expect(undo).not.toHaveBeenCalled();
    stop();
    expect(handler).toBeNull();
    expect(redo).not.toHaveBeenCalled();
  });
});
