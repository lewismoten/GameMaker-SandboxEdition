// The Sofa's teleconference spam: one 80-column row a line, drawable characters, color codes kept.
import { describe, expect, it } from 'vitest';
import { toCp437 } from '../src/retro/text/cp437';
import { MIDDLE_FINGER, SPAM_CAN, spamCanBurst, visibleWidth } from '../src/retro/bbs/sofaSpam';

describe('The Sofa teleconference spam', () => {
  const rounds = [0, 1, 2].flatMap((r) => spamCanBurst('LUNCHMEAT', r));

  it('fits every line on one 80-column row', () => {
    for (const l of rounds) expect(visibleWidth(l.text)).toBeLessThan(80);
  });

  it('uses only characters the terminal font draws', () => {
    for (const l of rounds) for (const ch of toCp437(l.text)) expect(ch.charCodeAt(0)).toBeLessThan(256);
  });

  it('keeps the art in its color codes (no | followed by two digits in the drawing)', () => {
    const art = [...SPAM_CAN.map((l) => l.replace(/\|\d\d/g, '')), ...MIDDLE_FINGER];
    for (const l of art) expect(l).not.toMatch(/\|\d\d/);
  });

  it('lines up the can: its body rows are the same width', () => {
    const body = SPAM_CAN.slice(3, 14).map(visibleWidth);
    expect(new Set(body).size).toBe(1);
  });

  it('warns twice, then kicks', () => {
    expect(spamCanBurst('LUNCHMEAT', 0).some((l) => l.text.includes("you're both kicked"))).toBe(true);
    expect(spamCanBurst('LUNCHMEAT', 2).some((l) => l.text.includes('kicked off by the SysOp'))).toBe(true);
  });
});
