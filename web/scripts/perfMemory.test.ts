// Exercise the memory CLI's exit status without starting Chromium or a server.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const click = vi.fn(async () => {});
  const locator = { first: () => locator, click };
  const page = {
    addInitScript: vi.fn(async () => {}),
    goto: vi.fn(async () => {}),
    waitForTimeout: vi.fn(async () => {}),
    evaluate: vi.fn(async () => ({ blobs: 0, bytes: 0, workers: 0, audio: 0 })),
    getByRole: () => locator,
    locator: () => locator,
    keyboard: { press: vi.fn(async () => {}) },
  };
  let onChunk: ((e: { chunk: string }) => void) | undefined;
  const takeSnapshot = vi.fn(async () => {
    onChunk?.({ chunk: JSON.stringify({ snapshot: { meta: { node_fields: ['type', 'name', 'self_size'] } }, nodes: [], strings: [] }) });
  });
  const cdp = {
    send: vi.fn(async (method: string) => {
      if (method === 'HeapProfiler.takeHeapSnapshot') await takeSnapshot();
      return { metrics: [] };
    }),
    on: vi.fn((_event: string, listener: typeof onChunk) => (onChunk = listener)),
    off: vi.fn(() => (onChunk = undefined)),
  };
  const close = vi.fn(async () => {});
  const stop = vi.fn(() => {});
  const browser = { close, newContext: async () => ({ newPage: async () => page, newCDPSession: async () => cdp }) };
  return {
    click,
    cdp,
    takeSnapshot,
    close,
    stop,
    launch: vi.fn(async () => browser),
    target: vi.fn(async () => ({ base: 'http://example.invalid', stop })),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
  };
});

vi.mock('./perfLib', () => ({
  arg: (name: string) => ({ only: 'walkthrough', cycles: '6', out: '/unused' })[name],
  launch: mocks.launch,
  target: mocks.target,
  OBSERVE: () => {},
}));
vi.mock('node:fs', () => ({ mkdirSync: mocks.mkdirSync, writeFileSync: mocks.writeFileSync }));

const originalExitCode = process.exitCode;
const originalArgv = process.argv;

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  process.argv = [...originalArgv, '--snapshot'];
  process.exitCode = undefined;
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  process.exitCode = originalExitCode;
  process.argv = originalArgv;
  vi.restoreAllMocks();
});

describe('memory CLI completion', () => {
  it('finishes six walkthrough cycles and both snapshots, then awaits cleanup with status 0', async () => {
    let finishClose!: () => void;
    let startedClose!: () => void;
    const closing = new Promise<void>((resolve) => (startedClose = resolve));
    mocks.close.mockImplementationOnce(() => {
      startedClose();
      return new Promise<void>((resolve) => (finishClose = resolve));
    });
    const run = import('./perfMemory');
    await closing;
    expect(process.exitCode).toBeUndefined();
    expect(mocks.stop).not.toHaveBeenCalled();
    finishClose();
    await run;
    expect(process.exitCode).toBe(0);
    expect(mocks.takeSnapshot).toHaveBeenCalledTimes(2);
    expect(mocks.click).toHaveBeenCalledTimes(36);
    expect(mocks.writeFileSync).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('"cycles": 6'));
    expect(mocks.stop).toHaveBeenCalledOnce();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('reports a final snapshot rejection even though cycle results have already printed', async () => {
    const takeSnapshot = mocks.takeSnapshot.getMockImplementation()!;
    mocks.takeSnapshot.mockImplementationOnce(takeSnapshot).mockRejectedValueOnce(new Error('snapshot rejected'));
    await import('./perfMemory');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('walkthrough player: heap MB'));
    expect(console.error).toHaveBeenCalledWith(
      'perf:memory failed while taking final snapshot of walkthrough player:',
      expect.objectContaining({ message: 'snapshot rejected' }),
    );
    expect(process.exitCode).toBe(1);
    expect(mocks.cdp.off).toHaveBeenCalledTimes(2);
    expect(mocks.stop).toHaveBeenCalledOnce();
  });

  it('reports close failure and still stops the target', async () => {
    mocks.close.mockRejectedValueOnce(new Error('close rejected'));
    await import('./perfMemory');
    expect(process.exitCode).toBe(1);
    expect(console.error).toHaveBeenCalledWith('perf:memory failed while closing browser:', expect.objectContaining({ message: 'close rejected' }));
    expect(mocks.stop).toHaveBeenCalledOnce();
  });

  it('preserves the measurement failure and reports both cleanup failures', async () => {
    mocks.click.mockRejectedValueOnce(new Error('missing walkthrough'));
    mocks.close.mockRejectedValueOnce(new Error('close rejected'));
    mocks.stop.mockImplementationOnce(() => {
      throw new Error('stop failed');
    });
    await import('./perfMemory');
    expect(process.exitCode).toBe(1);
    expect(console.error).toHaveBeenCalledTimes(3);
    expect(console.error).toHaveBeenCalledWith('perf:memory failed while running walkthrough player, cycle 1:', expect.any(Error));
    expect(console.error).toHaveBeenCalledWith('perf:memory failed while closing browser:', expect.any(Error));
    expect(console.error).toHaveBeenCalledWith('perf:memory failed while stopping target:', expect.any(Error));
  });

  it('stops the target when browser launch fails', async () => {
    mocks.launch.mockRejectedValueOnce(new Error('launch rejected'));
    await import('./perfMemory');
    expect(process.exitCode).toBe(1);
    expect(console.error).toHaveBeenCalledWith('perf:memory failed while launching browser:', expect.objectContaining({ message: 'launch rejected' }));
    expect(mocks.close).not.toHaveBeenCalled();
    expect(mocks.stop).toHaveBeenCalledOnce();
  });

  it('reports a failed task instead of presenting it as a completed measurement', async () => {
    mocks.click.mockRejectedValueOnce(new Error('missing walkthrough'));
    await import('./perfMemory');
    expect(process.exitCode).toBe(1);
    expect(console.error).toHaveBeenCalledWith(
      'perf:memory failed while running walkthrough player, cycle 1:',
      expect.objectContaining({ message: 'missing walkthrough' }),
    );
    expect(mocks.writeFileSync).not.toHaveBeenCalled();
    expect(mocks.close).toHaveBeenCalledOnce();
    expect(mocks.stop).toHaveBeenCalledOnce();
  });

  it('reports a report-write failure', async () => {
    mocks.writeFileSync.mockImplementationOnce(() => {
      throw new Error('disk full');
    });
    await import('./perfMemory');
    expect(process.exitCode).toBe(1);
    expect(console.error).toHaveBeenCalledWith('perf:memory failed while writing report:', expect.objectContaining({ message: 'disk full' }));
    expect(mocks.stop).toHaveBeenCalledOnce();
  });
});
