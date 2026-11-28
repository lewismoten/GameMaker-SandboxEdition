// Performance runs record the same resolved conditions that CDP applies.
import { afterEach, expect, it, vi } from 'vitest';
import type { CDPSession } from 'playwright-core';
import { applySlowdown, perfConditions } from './perfLib';

const original = process.argv;
afterEach(() => {
  process.argv = original;
});

it('rejects a missing network profile, including before another flag', () => {
  for (const tail of [['--network'], ['--network', '--throttle', '4']]) {
    process.argv = ['node', 'perf', ...tail];
    expect(() => perfConditions()).toThrow('--network requires 4g or slow-4g');
  }
});

it('resolves defaults and the conditions actually sent to CDP', async () => {
  process.argv = ['node', 'perf'];
  expect(perfConditions()).toEqual({ throttle: 1, network: null });
  process.argv = ['node', 'perf', '--network', '4g', '--throttle', '4'];
  const send = vi.fn().mockResolvedValue(undefined);
  await applySlowdown({ send } as unknown as CDPSession);
  expect(perfConditions()).toEqual({ throttle: 4, network: '4g' });
  expect(send).toHaveBeenCalledWith('Emulation.setCPUThrottlingRate', { rate: 4 });
  expect(send).toHaveBeenCalledWith('Network.emulateNetworkConditions', expect.objectContaining({ latency: 170 }));
});
