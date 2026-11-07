// Independent CPU/disk timing, TURBO and safe remembered hardware choices.
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { sceneLoadMs, SPEED_PRESETS, TURBO_OFF, vocStallMs, vocWontFit } from '@lewismoten/gamemaker-sandbox-engine/engine/slowPc';
import { CPU_CHOICES, DISK_CHOICES, loadMachine, machineCosts, machineMHz, saveMachine } from './machineSettings';

let stored: string | null;
beforeEach(() => {
  stored = null;
  vi.stubGlobal('localStorage', { getItem: () => stored, setItem: (_key: string, value: string) => (stored = value) });
});
afterEach(() => vi.unstubAllGlobals());

it('preserves the original fast desk and TURBO-off timing until hardware is chosen', () => {
  expect(loadMachine()).toEqual({ cpu: 'fast', disk: 'instant' });
  expect(machineCosts(loadMachine(), true)).toBeUndefined();
  expect(machineCosts(loadMachine(), false)).toMatchObject(TURBO_OFF);
  expect(machineMHz(loadMachine(), true)).toBe(66);
  expect(machineMHz(loadMachine(), false)).toBe(8);
});

it('round-trips every choice and rejects malformed values independently', () => {
  for (const cpu of CPU_CHOICES)
    for (const disk of DISK_CHOICES) {
      const value = { cpu: cpu.id, disk: disk.id };
      saveMachine(value);
      expect(loadMachine()).toEqual(value);
    }
  for (const value of ['null', '[]', '{', '42', '{"cpu":"constructor","disk":"toString"}']) {
    stored = value;
    expect(loadMachine()).toEqual({ cpu: 'fast', disk: 'instant' });
  }
  stored = '{"cpu":"ps1","disk":"bad"}';
  expect(loadMachine()).toEqual({ cpu: 'ps1', disk: 'instant' });
});

it('tolerates blocked storage', () => {
  vi.stubGlobal('localStorage', {
    getItem: () => {
      throw Error('blocked');
    },
    setItem: () => {
      throw Error('blocked');
    },
  });
  expect(loadMachine().cpu).toBe('fast');
  expect(() => saveMachine({ cpu: '286', disk: 'ps1' })).not.toThrow();
});

it('reuses every CPU preset without changing the shared preset and slows each with TURBO off', () => {
  for (const { id, mhz } of CPU_CHOICES) {
    if (id === 'fast') continue;
    const before = structuredClone(SPEED_PRESETS[id]);
    const value = { cpu: id, disk: id };
    expect(machineCosts(value, true)).toEqual(SPEED_PRESETS[id]);
    expect(machineMHz(value, true)).toBe(mhz);
    expect(machineCosts(value, false)!.tickMs).toBeGreaterThan(machineCosts(value, true)!.tickMs);
    expect(SPEED_PRESETS[id]).toEqual(before);
  }
});

it('disk choice controls voice and scene reads independently of CPU and TURBO', () => {
  for (const cpu of CPU_CHOICES)
    for (const disk of DISK_CHOICES)
      for (const turbo of [true, false]) {
        const pc = machineCosts({ cpu: cpu.id, disk: disk.id }, turbo);
        const expected = disk.id === 'instant' ? undefined : SPEED_PRESETS[disk.id];
        expect(sceneLoadMs(pc, [1000, 2000])).toBe(sceneLoadMs(expected, [1000, 2000]));
        expect(vocStallMs(pc, 1000)).toBe(vocStallMs(expected, 1000));
      }
});

it('PS/1 keeps its existing voice heap limit independently of disk choice', () => {
  expect(vocWontFit(machineCosts({ cpu: 'ps1', disk: '486' }, true), 150000)).toBe(true);
  expect(vocWontFit(machineCosts({ cpu: '486', disk: 'ps1' }, true), 150000)).toBe(false);
});
