// FASTPLAY changes only the setup policy, retaining game-specific choices and useful DOS output.
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RetroHost } from '../host';
import { HardwarePrefs, hardwarePrefs } from '../../player/hardwarePrefs';
import { runFastPlay } from './fastPlay';

function fixture() {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) });
  const lines: string[] = [];
  const host = { screen: { print: (line: string) => lines.push(line) } } as unknown as RetroHost;
  return { host, lines };
}
afterEach(() => vi.unstubAllGlobals());

describe('FASTPLAY', () => {
  it('persists ON/OFF, reports status, and preserves a game’s saved hardware', async () => {
    const { host, lines } = fixture();
    hardwarePrefs.save('fixture', { sound: 'speaker', video: 'vga' });
    await runFastPlay(host, ['on']);
    expect(new HardwarePrefs().show()).toBe(false);
    expect(lines.join('')).toContain('ON: bypass first-run setup');
    await runFastPlay(host, []);
    expect(lines.at(-2)).toContain('ON:');
    await runFastPlay(host, ['OFF']);
    expect(new HardwarePrefs().show()).toBe(true);
    expect(hardwarePrefs.game('fixture')).toEqual({ sound: 'speaker', video: 'vga' });
    expect(lines.join('')).toContain('CONFIG.BAT');
  });
  it('shows help and rejects invalid arguments without changing the policy', async () => {
    const { host, lines } = fixture();
    hardwarePrefs.setShow(false);
    await runFastPlay(host, ['/?']);
    expect(lines.join('')).toContain('FASTPLAY OFF');
    for (const args of [['NOPE'], ['OFF', 'extra']]) await runFastPlay(host, args);
    expect(lines.filter((line) => line.startsWith('Usage:'))).toHaveLength(2);
    expect(hardwarePrefs.show()).toBe(false);
  });
});
