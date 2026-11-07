// Scoot's trips between screens, by capsule file (capsule.ts). Sending Scoot writes a capsule with
// no postcards; on another screen it becomes a visitor and that screen's games stamp its postcard
// from there (courierStore.ts addStamp); sending the visitor home writes the capsule again, and
// home merges the postcards it brought. A capsule this screen wrote is refused politely, a trip is
// welcomed home or hosted once only, and every check runs before the one write, so a refused file
// changes nothing. The home postcard never travels and no postcard from this screen comes back to it.
import { CapsuleError, capsuleSize, decodeCapsule, encodeCapsule, gameHash, newId, type CapsuleProblem } from './capsule';
import { addTo, ensureHome, loadCourier, saveCourier, type Courier } from './courierStore';
import { publicCatalog } from './stamps';

/** Why an arriving capsule was turned away: one this screen wrote, a trip that came before, a visitor already here, a full satchel, no catalog to read it with, or a bad file. */
export type Refusal = 'mine' | 'replay' | 'busy' | 'full' | 'catalog' | CapsuleProblem;

export type Arrival = { kind: 'home'; postcards: number } | { kind: 'visitor'; world: number } | { kind: 'refused'; why: Refusal };

/** Sends this screen's Scoot on a trip (or writes the same trip's capsule again while it is away). */
export function sendScoot(): Uint8Array {
  const c = loadCourier();
  const home = ensureHome(c);
  c.out ??= newId();
  const bytes = encodeCapsule({ trip: c.out, home: home.id, world: home.world, from: home.id, packages: [], postcards: [] });
  saveCourier(c);
  return bytes;
}

/** Ends a trip without its capsule; a late capsule from it is still welcomed (once). */
export function callHome(): void {
  const c = loadCourier();
  if (!c.out) return;
  delete c.out;
  saveCourier(c);
}

/** Sends the visiting courier on (home, or anywhere): its capsule, written from here; it leaves this screen. */
export function sendVisitorHome(): Uint8Array | undefined {
  const c = loadCourier();
  const v = c.visitor;
  if (!v) return undefined;
  const bytes = encodeCapsule({ trip: v.trip, home: v.home, world: v.world, from: ensureHome(c).id, packages: [], postcards: v.postcards });
  delete c.visitor;
  saveCourier(c);
  return bytes;
}

/** Takes in a capsule; `game` turns a stamp's hash into a public catalog id. */
export function receive(bytes: Uint8Array, game: (hash: number) => string | undefined): Arrival {
  let cap;
  try {
    cap = decodeCapsule(bytes, game);
  } catch (e) {
    if (e instanceof CapsuleError) return { kind: 'refused', why: e.problem };
    throw e;
  }
  const c: Courier = loadCourier();
  const me = ensureHome(c);
  const refuse = (why: Refusal): Arrival => ({ kind: 'refused', why });
  if (cap.from === me.id) return refuse('mine');
  if (cap.home === me.id) {
    if (c.welcomed.includes(cap.trip)) return refuse('replay');
    let n = 0;
    for (const p of cap.postcards) {
      if (p.from === me.id) continue;
      n++;
      let card = c.postcards.find((q) => q.from === p.from);
      if (!card) c.postcards.push((card = { world: p.world, from: p.from, stamps: [] }));
      card.world = p.world;
      for (const s of p.stamps) addTo(card, s);
    }
    c.welcomed.push(cap.trip);
    if (c.out === cap.trip) delete c.out;
    saveCourier(c);
    return { kind: 'home', postcards: n };
  }
  if (c.hosted.includes(cap.trip) || c.visitor?.trip === cap.trip) return refuse('replay');
  if (c.visitor) return refuse('busy');
  const postcards = cap.postcards.filter((p) => p.from !== cap.home);
  if (!postcards.some((p) => p.from === me.id)) postcards.push({ from: me.id, world: me.world, stamps: [] });
  if (capsuleSize({ ...cap, from: me.id, postcards }) === Infinity) return refuse('full');
  c.visitor = { trip: cap.trip, home: cap.home, world: cap.world, postcards };
  c.hosted.push(cap.trip);
  saveCourier(c);
  return { kind: 'visitor', world: cap.world };
}

/** Takes in a capsule file with the public catalog to read its game stamps (refused when the catalog cannot load). */
export async function receiveFile(bytes: Uint8Array): Promise<Arrival> {
  const catalog = await publicCatalog();
  if (!catalog.length) return { kind: 'refused', why: 'catalog' };
  const byHash = new Map(catalog.map((g) => [gameHash(g.id), g.id]));
  return receive(bytes, (h) => byHash.get(h));
}
