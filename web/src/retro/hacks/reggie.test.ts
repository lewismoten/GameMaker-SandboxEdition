// REGGIE shows the chicken, restores Sir Reginald, crowns Lady Regina again, and rejects bad arguments.
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RetroHost } from '../host';
import { chickenNow, setChicken } from '../../chicken/chickenState';
import { runReggie } from './reggie';

function fixture() {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
  vi.stubGlobal('window', new EventTarget());
  const lines: string[] = [];
  const host = { screen: { print: (line: string) => lines.push(line) } } as unknown as RetroHost;
  return { host, lines };
}
afterEach(() => vi.unstubAllGlobals());

describe('REGGIE', () => {
  it('reports the state, restores Sir Reginald and says so when nothing changes', async () => {
    const { host, lines } = fixture();
    setChicken('lady');
    await runReggie(host, []);
    expect(lines.join('')).toContain('Lady Regina Cluckington III (tiara on)');
    await runReggie(host, ['sir']);
    expect(chickenNow()).toBe('sir');
    expect(lines.join('')).toContain('Tiara off');
    await runReggie(host, ['SIR']);
    expect(lines.at(-2)).toContain('Nothing to do');
    await runReggie(host, ['status']);
    expect(lines.join('')).toContain('Sir Reginald Cluckington III (no tiara)');
  });
  it('can crown her again, shows help and rejects bad arguments', async () => {
    const { host, lines } = fixture();
    await runReggie(host, ['LADY']);
    expect(chickenNow()).toBe('lady');
    await runReggie(host, ['/?']);
    expect(lines.join('')).toContain('REGGIE SIR');
    for (const args of [['NOPE'], ['SIR', 'extra']]) await runReggie(host, args);
    expect(lines.filter((l) => l.startsWith('Usage:'))).toHaveLength(2);
    expect(chickenNow()).toBe('lady');
  });
});
