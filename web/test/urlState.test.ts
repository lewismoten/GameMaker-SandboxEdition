// urlState: parsing, formatting and merging the address's hash.
import { describe, expect, it } from 'vitest';
import { formatHash, parseHash, withParams } from '../src/urlState';

describe('urlState', () => {
  it('parses a path and settings', () => {
    expect(parseHash('#/p/abc/NEBULA.MON?monster=3&tab=path')).toEqual({ path: ['p', 'abc', 'NEBULA.MON'], params: { monster: '3', tab: 'path' } });
    expect(parseHash('#/')).toEqual({ path: [], params: {} });
    expect(parseHash('')).toEqual({ path: [], params: {} });
    expect(parseHash('#/game/cd%3Anebula')).toEqual({ path: ['game', 'cd:nebula'], params: {} });
    expect(parseHash('#/desk?disk=cd:nebula&run=play')).toEqual({ path: ['desk'], params: { disk: 'cd:nebula', run: 'play' } });
    expect(parseHash('#/?q=snow%20day')).toEqual({ path: [], params: { q: 'snow day' } });
  });

  it('formats readably, leaving out empty settings', () => {
    expect(formatHash(['game', 'cd:nebula'])).toBe('#/game/cd:nebula');
    expect(formatHash(['p', 'x1', 'MY SONG.CMF'], { tab: 'instruments', empty: '', no: false, none: undefined })).toBe('#/p/x1/MY%20SONG.CMF?tab=instruments');
    expect(formatHash([], { tab: 'sandbox', q: 'a&b' })).toBe('#/?tab=sandbox&q=a%26b');
    expect(formatHash(['desk'], { disk: 'cd:nebula', play: true })).toBe('#/desk?disk=cd:nebula&play');
  });

  it('round-trips', () => {
    const cases = ['#/p/abc/NEBULA.MON?monster=3', '#/game/my:k2?tab=mine&q=hero%20quest', '#/desk?disk=cd:nebula&run=gm&file=NEBULA.MAP', '#/help/maps'];
    for (const h of cases) {
      const r = parseHash(h);
      expect(parseHash(formatHash(r.path, r.params))).toEqual(r);
    }
  });

  it('merges and removes settings', () => {
    const r = parseHash('#/p/abc/S.CMF?tab=song&track=2');
    expect(withParams(r, { tab: 'instruments' })).toBe('#/p/abc/S.CMF?tab=instruments&track=2');
    expect(withParams(r, { track: undefined, tab: null })).toBe('#/p/abc/S.CMF');
    expect(withParams(r, { x: 0 })).toBe('#/p/abc/S.CMF?tab=song&track=2&x=0');
  });
});
