// The box viewer's address: open=box:<id> and the turn, including ids that must not open.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  boxIdFromOpen,
  boxInAddress,
  boxOpenValue,
  dropBoxFromAddress,
  formatBoxTurn,
  parseBoxTurn,
  restorableBox,
  showBoxInAddress,
  stepBoxInAddress,
  turnBoxInAddress,
  turnInAddress,
  viewerPushedEntry,
} from './boxAddress';

/** A tiny address bar: location.hash, pathname and search, and a history that counts entries and keeps state. */
function fakeAddress() {
  let state: unknown = null;
  const loc = { pathname: '/', search: '', hash: '#/desk' };
  const hist = {
    length: 1,
    get state() {
      return state;
    },
    replaceState: (s: unknown, _t: string, url: string) => {
      state = s;
      loc.hash = url.slice(url.indexOf('#'));
    },
    pushState: (s: unknown, _t: string, url: string) => {
      state = s;
      hist.length++;
      loc.hash = url.slice(url.indexOf('#'));
    },
  };
  vi.stubGlobal('location', loc);
  vi.stubGlobal('history', hist);
}

beforeEach(fakeAddress);
afterEach(() => vi.unstubAllGlobals());

describe('open=box:<id>', () => {
  it('reads a game id', () => {
    expect(boxIdFromOpen('box:nebula')).toBe('nebula');
    expect(boxIdFromOpen('box:cd:nebula')).toBe('cd:nebula');
    expect(boxOpenValue('zork')).toBe('box:zork');
  });
  it('ignores other open values and malformed ids', () => {
    for (const v of [undefined, '', 'gm-box', 'manual:x', 'box:', 'box:a b', 'box:<script>', `box:${'x'.repeat(60)}`, 'box:a:b:c'])
      expect(boxIdFromOpen(v)).toBeUndefined();
  });
});

describe('the turn', () => {
  it('round-trips and clamps', () => {
    expect(parseBoxTurn(formatBoxTurn({ ry: 400, rx: -12, zoom: 1.234 }))).toEqual({ ry: 40, rx: -12, zoom: 1.23 });
    expect(parseBoxTurn('10,99,9')).toEqual({ ry: 10, rx: 80, zoom: 4 });
    expect(parseBoxTurn('1,2')).toBeUndefined();
    expect(parseBoxTurn('a,b,c')).toBeUndefined();
    expect(parseBoxTurn(undefined)).toBeUndefined();
  });
});

describe('the address', () => {
  it('opening pushes, stepping and turning replace, dropping removes', () => {
    history.replaceState(null, '', '#/desk?disk=cd:nebula');
    const before = history.length;
    showBoxInAddress('nebula', true);
    expect(location.hash).toBe('#/desk?disk=cd:nebula&open=box:nebula');
    expect(history.length).toBe(before + 1);
    expect(viewerPushedEntry()).toBe(true);
    turnBoxInAddress({ ry: 90, rx: -5, zoom: 2 });
    expect(location.hash).toContain('turn=90,-5,2');
    expect(turnInAddress()).toEqual({ ry: 90, rx: -5, zoom: 2 });
    stepBoxInAddress('other');
    expect(location.hash).toBe('#/desk?disk=cd:nebula&open=box:other');
    expect(history.length).toBe(before + 1);
    expect(viewerPushedEntry()).toBe(true);
    dropBoxFromAddress();
    expect(location.hash).toBe('#/desk?disk=cd:nebula');
    expect(boxInAddress()).toBeUndefined();
  });
  it('clears a malformed box value too', () => {
    history.replaceState(null, '', '#/desk?open=box:a%20b&disk=x');
    dropBoxFromAddress();
    expect(location.hash).toBe('#/desk?disk=x');
  });
  it('leaves other desk settings alone and ignores a gm-box address', () => {
    history.replaceState(null, '', '#/desk?open=gm-box');
    dropBoxFromAddress();
    expect(location.hash).toBe('#/desk?open=gm-box');
  });
});

describe('which box a link may open', () => {
  const shelf = ['nebula', 'zork'];
  it('opens one on the shelf', () => expect(restorableBox('zork', shelf)).toBe('zork'));
  it('opens nothing for an unknown id, or a secret game the shelf does not list yet', () => {
    expect(restorableBox('not-a-game', shelf)).toBeUndefined();
    expect(restorableBox('a-secret-id', shelf)).toBeUndefined();
    expect(restorableBox(undefined, shelf)).toBeUndefined();
  });
});
