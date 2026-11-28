// Exercise the trace CLI's cold transfer sampling boundary with CDP network events.
import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const { idleWork, writeFileSync } = vi.hoisted(() => ({ idleWork: vi.fn(), writeFileSync: vi.fn() }));
const cdp = Object.assign(new EventEmitter(), { send: async () => ({ metrics: [] }) });
vi.mock('node:fs', () => ({ mkdirSync: vi.fn(), writeFileSync }));
vi.mock('./perfLib', () => ({
  arg: (name: string) => (name === 'only' ? 'home' : undefined),
  applySlowdown: vi.fn(),
  perfConditions: () => ({ throttle: 4, network: '4g' }),
  OBSERVE: '',
  target: () => ({ base: 'http://localhost', stop: vi.fn() }),
  launch: () => ({
    close: vi.fn(),
    newContext: () => ({
      close: vi.fn(),
      newCDPSession: () => cdp,
      newPage: () => ({
        addInitScript: vi.fn(),
        goto: vi.fn(),
        waitForLoadState: vi.fn().mockRejectedValue(new Error('Network idle timed out')),
        waitForTimeout: idleWork,
        evaluate: () => ({ long: [], cls: 0 }),
      }),
    }),
  }),
}));

function request(id: string, url: string) {
  cdp.emit('Network.requestWillBeSent', { requestId: id, request: { url } });
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  cdp.removeAllListeners();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('Trace exited successfully');
  });
});

afterEach(() => vi.restoreAllMocks());

it('rejects the sample with every incomplete HTTP URL before writing a report', async () => {
  idleWork.mockImplementationOnce(() => {
    request('1', 'http://localhost/game.zip');
    request('2', 'https://localhost/sound.wav');
  });
  await expect(import('./perfTrace')).rejects.toThrow(/http:\/\/localhost\/game\.zip[\s\S]*https:\/\/localhost\/sound\.wav/);
  expect(writeFileSync).not.toHaveBeenCalled();
});

it('accepts finished transfers including zero bytes and ignores pending local URLs for completeness', async () => {
  idleWork.mockImplementationOnce(() => {
    request('1', 'http://localhost/game.zip');
    request('2', 'http://localhost/empty');
    request('3', 'blob:http://localhost/preview');
    cdp.emit('Network.loadingFinished', { requestId: '1', encodedDataLength: 2048 });
    cdp.emit('Network.loadingFinished', { requestId: '2', encodedDataLength: 0 });
  });
  await expect(import('./perfTrace')).rejects.toThrow('Trace exited successfully');
  expect(JSON.parse(String(writeFileSync.mock.calls[0][1]))).toMatchObject({ throttle: 4, network: '4g', rows: [{ requests: 3, kb: 2 }] });
});
