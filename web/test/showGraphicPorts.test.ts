// Fake ports and a one-pixel frame keep scheduler cleanup tests free of real handles and UI.
import { afterEach, expect, it, vi } from 'vitest';
import { GameFiles } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';
import type { Machine } from '@lewismoten/gamemaker-sandbox-engine/engine/machine';
import { playFli } from '@lewismoten/gamemaker-sandbox-engine/engine/showGraphic';

afterEach(() => vi.unstubAllGlobals());
function machine(): Machine {
  const bytes = new Uint8Array(144);
  const v = new DataView(bytes.buffer);
  v.setUint16(4, 0xaf11, true);
  v.setUint16(6, 1, true);
  v.setUint16(8, 1, true);
  v.setUint16(10, 1, true);
  v.setUint32(128, 16, true);
  v.setUint16(132, 0xf1fa, true);
  return {
    files: new GameFiles([['test.fli', bytes]]),
    now: () => 0,
    checkAbort: vi.fn(),
    screen: { palette: new Uint8Array(768), pixels: new Uint8Array(1), drawImage: vi.fn() },
  } as unknown as Machine;
}

it('clears the handler and closes both scheduler ports after zero-speed playback', async () => {
  const port1 = { onmessage: null as (() => void) | null, close: vi.fn() };
  const port2 = {
    postMessage: () => {
      queueMicrotask(() => port1.onmessage?.());
    },
    close: vi.fn(),
  };
  vi.stubGlobal(
    'MessageChannel',
    class {
      port1 = port1;
      port2 = port2;
    },
  );
  expect(await playFli(machine(), 'test.fli')).toBe(true);
  expect(port1.onmessage).toBeNull();
  expect(port1.close).toHaveBeenCalledOnce();
  expect(port2.close).toHaveBeenCalledOnce();
});

it('closes scheduler ports if posting a message fails', async () => {
  const port1 = { onmessage: null as (() => void) | null, close: vi.fn() };
  const port2 = {
    postMessage: () => {
      throw new Error('post failed');
    },
    close: vi.fn(),
  };
  vi.stubGlobal(
    'MessageChannel',
    class {
      port1 = port1;
      port2 = port2;
    },
  );
  await expect(playFli(machine(), 'test.fli')).rejects.toThrow('post failed');
  expect(port1.onmessage).toBeNull();
  expect(port1.close).toHaveBeenCalledOnce();
  expect(port2.close).toHaveBeenCalledOnce();
});
