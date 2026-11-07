// Scoot's trips, with two screens' storage swapped in turn: sent from A, visiting B (which stamps
// its own postcard and the visitor's), sent home, welcomed at A with a postcard from B's world; a
// capsule A wrote, a replayed capsule and a bad one are refused with nothing written; the home
// postcard never travels; a secret game reaches the visitor's postcard only as the mystery stamp.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addStamp, loadCourier, COURIER_KEY } from './courierStore';
import { decodeCapsule, encodeCapsule, gameHash } from './capsule';
import { isCourierId } from './courierId';
import { callHome, receive, sendScoot, sendVisitorHome } from './trips';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const screens = { A: new Map<string, string>(), B: new Map<string, string>(), C: new Map<string, string>() };
let on = screens.A;
const at = (s: keyof typeof screens) => (on = screens[s]);
beforeEach(() => {
  for (const m of Object.values(screens)) m.clear();
  at('A');
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => on.get(k) ?? null,
    setItem: (k: string, v: string) => on.set(k, v),
    removeItem: (k: string) => on.delete(k),
  });
});
afterEach(() => vi.unstubAllGlobals());

const byHash = new Map(['snowbound'].map((id) => [gameHash(id), id]));
const game = (h: number) => byHash.get(h);
const stored = () => on.get(COURIER_KEY);

describe('trips', () => {
  it('goes A to B and home, bringing a postcard from B’s world with what was played there', () => {
    addStamp({ kind: 'game', game: 'snowbound' });
    const out = sendScoot();
    const a = loadCourier();
    expect(isCourierId(a.out)).toBe(true);
    expect(isCourierId(a.home!.id)).toBe(true);
    expect(decodeCapsule(out, game).postcards).toEqual([]); // the home postcard never travels

    at('B');
    expect(receive(out, game)).toEqual({ kind: 'visitor', world: a.home!.world });
    addStamp({ kind: 'sample-cd' });
    const b = loadCourier();
    expect(b.postcards).toEqual([{ world: b.home!.world, here: true, stamps: [{ kind: 'sample-cd' }] }]);
    expect(b.visitor!.postcards).toEqual([{ from: b.home!.id, world: b.home!.world, stamps: [{ kind: 'sample-cd' }] }]);
    const back = sendVisitorHome()!;
    expect(loadCourier().visitor).toBeUndefined();

    at('A');
    expect(receive(back, game)).toEqual({ kind: 'home', postcards: 1 });
    const home = loadCourier();
    expect(home.out).toBeUndefined();
    expect(home.postcards).toEqual([
      { world: a.home!.world, here: true, stamps: [{ kind: 'game', game: 'snowbound' }] },
      { world: b.home!.world, from: b.home!.id, stamps: [{ kind: 'sample-cd' }] },
    ]);
  });

  it('refuses a capsule this screen wrote, politely, writing nothing', () => {
    const out = sendScoot();
    const before = stored();
    expect(receive(out, game)).toEqual({ kind: 'refused', why: 'mine' });
    expect(stored()).toBe(before);
    at('B');
    receive(out, game);
    const leaving = sendVisitorHome()!;
    expect(receive(leaving, game)).toEqual({ kind: 'refused', why: 'mine' });
  });

  it('counts a trip once: no second visit and no second homecoming', () => {
    const out = sendScoot();
    at('B');
    receive(out, game);
    expect(receive(out, game)).toEqual({ kind: 'refused', why: 'replay' });
    addStamp({ kind: 'graduation' });
    const back = sendVisitorHome()!;
    const before = stored();
    expect(receive(out, game)).toEqual({ kind: 'refused', why: 'replay' });
    expect(stored()).toBe(before);
    at('A');
    receive(back, game);
    const once = stored();
    expect(receive(back, game)).toEqual({ kind: 'refused', why: 'replay' });
    expect(stored()).toBe(once);
  });

  it('hosts one visitor at a time', () => {
    const fromA = sendScoot();
    at('C');
    const fromC = sendScoot();
    at('B');
    receive(fromA, game);
    expect(receive(fromC, game)).toEqual({ kind: 'refused', why: 'busy' });
  });

  it('refuses a damaged capsule with nothing written', () => {
    const out = sendScoot();
    at('B');
    addStamp({ kind: 'mystery' });
    const before = stored();
    const bad = out.slice();
    bad[20] ^= 0xff;
    expect(receive(bad, game)).toEqual({ kind: 'refused', why: 'tampered' });
    expect(receive(new Uint8Array(4000), game)).toEqual({ kind: 'refused', why: 'size' });
    expect(stored()).toBe(before);
  });

  it('never brings a postcard from home back home, even in a forged capsule', () => {
    const out = sendScoot();
    const me = loadCourier().home!;
    const forged = decodeCapsule(out, game);
    at('B');
    receive(out, game);
    const b = loadCourier();
    const back = encodeCapsule({ ...forged, from: b.home!.id, postcards: [{ from: me.id, world: me.world, stamps: [{ kind: 'sample-cd' }] }] });
    at('A');
    expect(receive(back, game)).toEqual({ kind: 'home', postcards: 0 });
    expect(loadCourier().postcards).toEqual([]);
  });

  it('a late capsule after Call Scoot home still brings its postcards, once', () => {
    const out = sendScoot();
    callHome();
    expect(loadCourier().out).toBeUndefined();
    at('B');
    receive(out, game);
    addStamp({ kind: 'sample-cd' });
    const back = sendVisitorHome()!;
    at('A');
    expect(receive(back, game)).toEqual({ kind: 'home', postcards: 1 });
  });

  it('puts a secret game on the visitor’s postcard only as the mystery stamp', () => {
    const games = resolve(__dirname, '../../../games');
    const secrets = readdirSync(games).filter((id) => {
      const f = resolve(games, id, 'about.json');
      return existsSync(f) && (JSON.parse(readFileSync(f, 'utf8')) as { secret?: boolean }).secret === true;
    });
    expect(secrets.length).toBeGreaterThan(0);
    const out = sendScoot();
    at('B');
    receive(out, game);
    for (const id of secrets) addStamp({ kind: 'game', game: id });
    const v = JSON.stringify(loadCourier().visitor);
    for (const id of secrets) expect(v).not.toContain(id);
    expect(loadCourier().visitor!.postcards[0].stamps).toEqual([{ kind: 'mystery' }]);
  });
});
