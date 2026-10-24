// The link-in addresses, the gm-files message checks and the limits (protocol.ts).
import { describe, expect, it } from 'vitest';
import {
  FILES,
  LinkError,
  MAX_FILES,
  MAX_FILE_BYTES,
  checkLimits,
  cleanName,
  cleanOrigin,
  keptName,
  originLabel,
  parseLinkRequest,
  readFilesMessage,
} from './protocol';

const BASE = 'https://lewismoten.github.io/GameMaker-SandboxEdition/';
const reason = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return e instanceof LinkError ? e.reason : 'other';
  }
  return 'none';
};

describe('parseLinkRequest', () => {
  it('reads ?open with its target and mode', () => {
    expect(parseLinkRequest('?open=https%3A%2F%2Fexample.com%2Fg.zip&in=dos&mode=edit', '', BASE)).toEqual({
      kind: 'open',
      url: 'https://example.com/g.zip',
      in: 'dos',
      mode: 'edit',
    });
  });
  it('reads the hash form, and resolves a relative address against the page', () => {
    expect(parseLinkRequest('', '#/open?url=games%2Fmine.zip&in=web', BASE)).toEqual({ kind: 'open', url: `${BASE}games/mine.zip`, in: 'web', mode: 'play' });
  });
  it('defaults to play and leaves an unknown target to the visitor', () => {
    expect(parseLinkRequest('?open=https://example.com/a.gam&in=moon&mode=delete', '', BASE)).toEqual({
      kind: 'open',
      url: 'https://example.com/a.gam',
      in: undefined,
      mode: 'play',
    });
  });
  it('fetches only http and https', () => {
    for (const bad of ['javascript:alert(1)', 'data:text/html,hi', 'file:///etc/passwd', 'blob:https://x/1']) {
      expect(parseLinkRequest(`?open=${encodeURIComponent(bad)}`, '', BASE)).toBeUndefined();
    }
  });
  it('reads ?receive and #/receive, with an optional sender origin', () => {
    expect(parseLinkRequest('?receive&in=desk&mode=edit&from=https://site.example/page', '', BASE)).toEqual({
      kind: 'receive',
      in: 'desk',
      mode: 'edit',
      from: 'https://site.example',
    });
    expect(parseLinkRequest('', '#/receive?in=dos', BASE)).toEqual({ kind: 'receive', in: 'dos', mode: 'play', from: undefined });
    expect(parseLinkRequest('?receive&from=javascript:x', '', BASE)?.kind).toBe('receive');
    expect(cleanOrigin('javascript:x')).toBeUndefined();
  });
  it('is undefined for every other address', () => {
    expect(parseLinkRequest('', '#/desk?disk=cd:nebula', BASE)).toBeUndefined();
    expect(parseLinkRequest('?game=teddy', '#/p/abc', BASE)).toBeUndefined();
  });
});

describe('readFilesMessage', () => {
  const gam = new Uint8Array([1, 2, 3]);
  it('accepts ArrayBuffers and typed arrays, and its settings', () => {
    const m = readFilesMessage({
      type: FILES,
      name: '  My\u0007 Game\u202e ',
      files: { 'GAME.GAM': gam.buffer, 'a/b.pal': new Uint8Array(4) },
      in: 'web',
      mode: 'edit',
      gam: 'GAME.GAM',
    });
    expect(m.name).toBe('My Game');
    expect(m.files.map(([n, b]) => [n, b.length])).toEqual([
      ['GAME.GAM', 3],
      ['a/b.pal', 4],
    ]);
    expect([m.in, m.mode, m.gam]).toEqual(['web', 'edit', 'GAME.GAM']);
  });
  it('ignores bad settings', () => {
    const m = readFilesMessage({ type: FILES, files: { 'x.gam': gam }, in: 'kitchen', mode: 'run', name: 42 });
    expect([m.in, m.mode, m.name]).toEqual([undefined, undefined, undefined]);
  });
  it('turns away what is not a game message', () => {
    expect(reason(() => readFilesMessage(null))).toBe('invalid');
    expect(reason(() => readFilesMessage({ type: 'gm-ready' }))).toBe('invalid');
    expect(reason(() => readFilesMessage({ type: FILES }))).toBe('invalid');
    expect(reason(() => readFilesMessage({ type: FILES, files: [gam] }))).toBe('invalid');
    expect(reason(() => readFilesMessage({ type: FILES, files: gam.buffer }))).toBe('invalid');
    expect(reason(() => readFilesMessage({ type: FILES, files: { 'x.gam': 'not bytes' } }))).toBe('invalid');
    expect(reason(() => readFilesMessage({ type: FILES, files: { 'x\u0000.gam': gam } }))).toBe('invalid');
    expect(reason(() => readFilesMessage({ type: FILES, files: {} }))).toBe('invalid');
  });
  it('holds to the limits', () => {
    const many = Object.fromEntries(Array.from({ length: MAX_FILES + 1 }, (_, i) => [`f${i}.txt`, new Uint8Array(1)]));
    expect(reason(() => readFilesMessage({ type: FILES, files: many }))).toBe('too-big');
    expect(reason(() => checkLimits([['big.fli', new Uint8Array(MAX_FILE_BYTES + 1)]]))).toBe('too-big');
    const four = Array.from({ length: 4 }, (_, i) => [`f${i}`, new Uint8Array(MAX_FILE_BYTES)] as const);
    expect(reason(() => checkLimits(four))).toBe('too-big');
    expect(reason(() => checkLimits(four.slice(0, 2)))).toBe('none');
  });
});

describe('names', () => {
  it('says where a game came from', () => {
    expect(originLabel('https://games.example:8443')).toBe('games.example:8443');
    expect(originLabel('null')).toMatch(/local file/);
    expect(keptName('Snow Day', 'https://games.example')).toBe('Snow Day (from games.example)');
    expect(keptName('Snow Day', 'null')).toBe('Snow Day (from another page)');
  });
  it('cuts long names and drops empty ones', () => {
    expect(cleanName('x'.repeat(500))).toHaveLength(60);
    expect(cleanName('   ')).toBeUndefined();
    expect(cleanName(undefined)).toBeUndefined();
  });
});
