// Mail for Scoot on a BBS call: the first connected call to a board takes its letter home as a
// transfer; a later call brings nothing; a skipped transfer leaves the letter waiting.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sent = { aborted: false, names: [] as string[] };
vi.mock('./transfer', () => ({
  expectText: () => 'no wait at all',
  progress: async (_t: unknown, _h: unknown, name: string) => {
    sent.names.push(name);
    return { bytes: 0, aborted: sent.aborted };
  },
}));

import { courierMail, packetBytes } from './courierMail';
import { loadCourier } from '../../courier/courierStore';
import { LETTERS } from '../../courier/tables';
import type { Term } from './term';
import type { RetroHost } from '../host';

const stored = new Map<string, string>();
const lines: string[] = [];
const t = { line: (s = '') => lines.push(s) } as unknown as Term;
const h = {} as RetroHost;

beforeEach(() => {
  stored.clear();
  lines.length = 0;
  sent.aborted = false;
  sent.names.length = 0;
  vi.stubGlobal('localStorage', { getItem: (k: string) => stored.get(k) ?? null, setItem: (k: string, v: string) => stored.set(k, v) });
});
afterEach(() => vi.unstubAllGlobals());

describe('BBS mail for Scoot', () => {
  it('the first connected call to a board brings its letter, as a file transfer', async () => {
    await courierMail(t, h, 'SANDBOX');
    expect(sent.names).toEqual(['SANDBOX.QWK']);
    expect(loadCourier().mail.map((m) => m.id)).toEqual(['bbs-sandbox']);
    expect(lines.join('\n')).toContain('SCOOT');
  });

  it('a second call brings nothing, and no transfer shows', async () => {
    await courierMail(t, h, 'SOFA');
    await courierMail(t, h, 'SOFA');
    expect(sent.names).toEqual(['SOFA.QWK']);
    expect(loadCourier().mail).toHaveLength(1);
  });

  it('a skipped transfer leaves the letter for the next call', async () => {
    sent.aborted = true;
    await courierMail(t, h, 'SANDBOX');
    expect(loadCourier().mail).toEqual([]);
    sent.aborted = false;
    await courierMail(t, h, 'SANDBOX');
    expect(loadCourier().mail).toHaveLength(1);
  });

  it('a board with no letter (or a TTY) transfers nothing', async () => {
    await courierMail(t, h, 'NOVAK');
    expect(sent.names).toEqual([]);
  });

  it('packets come in QWK blocks', () => {
    for (const l of LETTERS) expect((packetBytes(l) - 22) % 128).toBe(0);
  });
});
