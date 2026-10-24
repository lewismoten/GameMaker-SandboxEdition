import { afterEach, describe, expect, it } from 'vitest';
import { connectLine, cps, DEFAULT_SPEED, LINE_SPEEDS, lineSpeed, setLineSpeed, speedLabel, speedWords, statusBps } from './lineSpeed';

describe('line speed', () => {
  afterEach(() => setLineSpeed(DEFAULT_SPEED));

  it('starts at 14,400 and remembers a new one (without storage, for the visit)', () => {
    expect(lineSpeed()).toBe(14400);
    setLineSpeed(2400);
    expect(lineSpeed()).toBe(2400);
    expect(speedLabel()).toBe('2,400');
    expect(statusBps()).toBe('2400');
  });

  it('moves files at about bps / 10 without error correction, and as diskFacts says at 2400 and 14,400', () => {
    expect(cps('file', 300)).toBe(29);
    expect(cps('file', 2400)).toBe(230);
    expect(cps('file', 14400)).toBe(1650);
    for (const s of LINE_SPEEDS) if (s !== 'unlimited') expect(cps('file', s)).toBeLessThanOrEqual(s / 8);
  });

  it('gives text a modest V.42bis gain only from 9600 up', () => {
    expect(cps('text', 300)).toBe(30);
    expect(cps('text', 2400)).toBe(240);
    expect(cps('text', 14400)).toBeGreaterThan(cps('file', 14400));
    expect(cps('text', 14400)).toBeLessThan(cps('file', 14400) * 2);
  });

  it('waits for nothing when unlimited', () => {
    expect(cps('file', 'unlimited')).toBe(Infinity);
    expect(cps('text', 'unlimited')).toBe(Infinity);
    expect(speedLabel('unlimited')).toBe('UNLIMITED');
  });

  it('connects with the protocols of the time', () => {
    expect(connectLine(300)).toBe('CONNECT 300');
    expect(connectLine(2400)).toBe('CONNECT 2400');
    expect(connectLine(14400)).toBe('CONNECT 14400/ARQ/V32BIS/LAPM/V42BIS');
    expect(connectLine(28800)).toMatch(/V34/);
    expect(connectLine(56000)).toBe('CONNECT 53333/ARQ/V90/LAPM/V42BIS');
  });

  it('says kbps from 9600 up, to keep the label short', () => {
    expect(speedLabel(4800)).toBe('4,800');
    expect(speedLabel(14400)).toBe('14.4 kbps');
    expect(speedLabel(33600)).toBe('33.6 kbps');
    expect(speedLabel(56000)).toBe('56 kbps');
    expect(speedWords(2400)).toBe('2,400 baud');
    expect(speedWords(56000)).toBe('56 kbps');
  });

  it('ignores a speed that is not on the list', () => {
    setLineSpeed(19200 as never);
    expect(lineSpeed()).toBe(14400);
  });
});
