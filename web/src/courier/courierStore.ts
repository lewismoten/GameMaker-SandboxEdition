// The courier's mail store: localStorage `gm-courier` (the backup's Desk section), shared by
// Scoot's card on the desk and SCOOT.EXE on the PC. It keeps ids into the tables (tables.ts) and
// the desk clock's day a letter came, nothing typed and no wall-clock times. A letter arrives only
// through `deliver`, which a BBS call makes (retro/bbs/courierMail.ts); nothing here runs on a
// timer. Every change is announced (`COURIER_CHANGED`) so an open card or envelope follows at once.
import { LETTERS, WORLDS, letterById, type Letter, type StampKind } from './tables';
import { isOldSecret } from '../project/secretGames';
import { capsuleSize, type TripCard } from './capsule';
import { isCourierId, makeCourierId } from './courierId';

export const COURIER_KEY = 'gm-courier';
const KEY = COURIER_KEY;
/** Scoot's Quiet switch lives with the desk buddy (desk/buddy/buddyStore.ts); SCOOT.EXE may not load the desk. */
const BUDDY_KEY = 'gm-desk-buddy';
export const COURIER_CHANGED = 'courier-changed';

interface MailItem {
  id: string;
  /** The desk clock's day it came, YYYY-MM-DD. */
  day: string;
  read: boolean;
}

export interface Stamp {
  kind: StampKind;
  /** A catalog game's id, only for kind 'game'. */
  game?: string;
}

export interface Postcard {
  world: number;
  /** This device's own postcard (the desk and the web share one): its world was rolled once, here. It never travels. */
  here?: true;
  /** The home id of the screen a postcard Scoot brought home came from. */
  from?: string;
  stamps: Stamp[];
}

/** This screen's home: a courier id (courierId.ts: UUID v4 in shape, random, derived from nothing), made once, and its world (rolled once from the curated names). */
interface Home {
  id: string;
  world: number;
}

/** A courier from another screen staying here, collecting this screen's stamps on its postcard. */
interface Visitor {
  trip: string;
  /** The visitor's own home id and world. */
  home: string;
  world: number;
  postcards: TripCard[];
}

export interface Courier {
  /** Letters in the mail, newest first. */
  mail: MailItem[];
  /** Every letter ever delivered, kept when one is deleted, so none comes twice. */
  got: string[];
  postcards: Postcard[];
  /** Catalog game ids in the satchel (three at most). */
  packages: string[];
  home?: Home;
  /** The trip id while this screen's Scoot is away. */
  out?: string;
  /** Trips welcomed home, so a capsule loaded twice adds nothing. */
  welcomed: string[];
  visitor?: Visitor;
  /** Trips that visited here, so one capsule cannot visit twice. */
  hosted: string[];
}

export const MAX_PACKAGES = 3;

const empty = (): Courier => ({ mail: [], got: [], postcards: [], packages: [], welcomed: [], hosted: [] });
const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const isId = isCourierId;
const isWorld = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) < WORLDS.length;
const obj = (v: unknown): Record<string, unknown> | undefined => (v && typeof v === 'object' ? (v as Record<string, unknown>) : undefined);

/** Stamps read back through the guards (a secret game's turns into the mystery stamp). */
function readStamps(v: unknown, card: { stamps: Stamp[] }): void {
  for (const s of Array.isArray(v) ? v : []) {
    const r = obj(s);
    if (!r) continue;
    if (r.kind === 'game' && typeof r.game === 'string') addTo(card, { kind: 'game', game: r.game });
    else if (r.kind === 'sample-cd' || r.kind === 'graduation' || r.kind === 'mystery') addTo(card, { kind: r.kind });
  }
}

function readVisitor(v: unknown): Visitor | undefined {
  const r = obj(v);
  if (!r || !isId(r.trip) || !isId(r.home) || !isWorld(r.world)) return undefined;
  const postcards: TripCard[] = [];
  for (const p of Array.isArray(r.postcards) ? r.postcards : []) {
    const q = obj(p);
    if (!q || !isId(q.from) || !isWorld(q.world) || postcards.some((x) => x.from === q.from)) continue;
    const card: TripCard = { from: q.from, world: q.world, stamps: [] };
    readStamps(q.stamps, card);
    postcards.push(card);
  }
  return { trip: r.trip, home: r.home, world: r.world, postcards };
}

export function loadCourier(): Courier {
  try {
    const o: unknown = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    if (!o || typeof o !== 'object') return empty();
    const r = o as Record<string, unknown>;
    const mail = (Array.isArray(r.mail) ? r.mail : [])
      .filter((m): m is Record<string, unknown> => !!m && typeof m === 'object')
      .filter((m) => typeof m.id === 'string' && !!letterById(m.id))
      .map((m) => ({ id: m.id as string, day: typeof m.day === 'string' ? m.day : '', read: m.read === true }));
    const postcards = (Array.isArray(r.postcards) ? r.postcards : [])
      .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object' && Number.isInteger(p.world))
      .map((p) => {
        const card: Postcard = { world: p.world as number, stamps: [] };
        if (p.here === true) card.here = true;
        else if (isId(p.from)) card.from = p.from;
        readStamps(p.stamps, card);
        return card;
      })
      // one postcard is this device's
      .filter((p, i, all) => !p.here || all.findIndex((q) => q.here) === i);
    const h = obj(r.home);
    const home = h && isId(h.id) && isWorld(h.world) ? { id: h.id, world: h.world } : undefined;
    const c: Courier = {
      mail,
      got: strings(r.got),
      postcards,
      packages: strings(r.packages).slice(0, MAX_PACKAGES),
      welcomed: strings(r.welcomed),
      hosted: strings(r.hosted),
    };
    if (home) {
      c.home = home;
      // the home postcard always shows the home's world, and no postcard from this screen comes back to it
      for (const p of postcards) if (p.here) p.world = home.world;
      c.postcards = postcards.filter((p) => p.from !== home.id);
    }
    if (isId(r.out)) c.out = r.out;
    const visitor = readVisitor(r.visitor);
    if (visitor && visitor.home !== home?.id) c.visitor = visitor;
    return c;
  } catch {
    return empty();
  }
}

export function saveCourier(c: Courier): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* storage blocked: the letter is kept for this visit only */
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(COURIER_CHANGED));
}

/**
 * Puts `s` on `card` unless it has one like it (one Sample CD, one graduation and one mystery stamp
 * at most, one stamp per game). A game stamp for a secret game is kept as the mystery stamp, which
 * stores no id, so the store never holds one. False when nothing changed.
 */
export function addTo(card: { stamps: Stamp[] }, s: Stamp): boolean {
  const stamp: Stamp = s.kind === 'game' && s.game && !isOldSecret(s.game) ? { kind: 'game', game: s.game } : { kind: s.kind === 'game' ? 'mystery' : s.kind };
  if (card.stamps.some((x) => x.kind === stamp.kind && x.game === stamp.game)) return false;
  card.stamps.push(stamp);
  return true;
}

/**
 * This screen's home, made the first time it is needed: a random UUID and a world rolled once from
 * the curated names (`roll` is Math.random's kind), or the world an older home postcard already had.
 */
export function ensureHome(c: Courier, roll: () => number = Math.random): Home {
  c.home ??= {
    id: makeCourierId(),
    world: c.postcards.find((p) => p.here)?.world ?? Math.min(WORLDS.length - 1, Math.floor(roll() * WORLDS.length)),
  };
  return c.home;
}

/**
 * Stamps this device's postcard (made the first time) and, while a courier from another screen
 * visits, its postcard from here too, as long as its capsule still fits. False when neither changed.
 */
export function addStamp(s: Stamp, roll: () => number = Math.random): boolean {
  const c = loadCourier();
  const home = ensureHome(c, roll);
  let card = c.postcards.find((p) => p.here);
  if (!card) {
    card = { world: home.world, here: true, stamps: [] };
    c.postcards.unshift(card);
  }
  let changed = addTo(card, s);
  const v = c.visitor;
  const there = v?.postcards.find((p) => p.from === home.id);
  if (v && there) {
    const before = there.stamps.length;
    if (addTo(there, s) && capsuleSize({ trip: v.trip, home: v.home, world: v.world, from: home.id, packages: [], postcards: v.postcards }) === Infinity)
      there.stamps.length = before; // the satchel is full: the stamp stays on this screen's own postcard
    changed ||= there.stamps.length > before;
  }
  if (!changed) return false;
  saveCourier(c);
  return true;
}

/** Whether a letter waits unread (the desk shows an envelope, never a number). */
export const hasNewMail = (c: Courier = loadCourier()): boolean => c.mail.some((m) => !m.read);

/** Whether `id` has come before (read, unread or deleted). */
export const delivered = (id: string, c: Courier = loadCourier()): boolean => c.got.includes(id);

/** The letter a connected call to `board` brings, if it has not come before. */
export const waitingLetter = (board: string, c: Courier = loadCourier()): Letter | undefined => LETTERS.find((l) => l.board === board && !delivered(l.id, c));

/** Puts letter `id` in the mail, once ever; false when it came before or is not in the table. */
export function deliver(id: string, day: string): boolean {
  const c = loadCourier();
  if (!letterById(id) || delivered(id, c)) return false;
  c.mail.unshift({ id, day, read: false });
  c.got.push(id);
  saveCourier(c);
  return true;
}

export function markRead(id: string): void {
  const c = loadCourier();
  const m = c.mail.find((x) => x.id === id);
  if (!m || m.read) return;
  m.read = true;
  saveCourier(c);
}

/** Takes a letter out of the mail; it never comes again. */
export function deleteLetter(id: string): void {
  const c = loadCourier();
  const left = c.mail.filter((m) => m.id !== id);
  if (left.length === c.mail.length) return;
  c.mail = left;
  saveCourier(c);
}

/** Scoot's Quiet switch (no words, just waves), read where the desk buddy keeps it. */
export function loadQuiet(): boolean {
  try {
    const o: unknown = JSON.parse(localStorage.getItem(BUDDY_KEY) ?? '{}');
    return !!o && typeof o === 'object' && (o as Record<string, unknown>).quiet === true;
  } catch {
    return false;
  }
}

/** Sets the Quiet switch, keeping the rest of what the desk buddy remembers. */
export function saveQuiet(quiet: boolean): void {
  try {
    const o: unknown = JSON.parse(localStorage.getItem(BUDDY_KEY) ?? '{}');
    const kept = o && typeof o === 'object' ? (o as Record<string, unknown>) : {};
    localStorage.setItem(BUDDY_KEY, JSON.stringify({ ...kept, quiet }));
  } catch {
    /* storage blocked */
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(COURIER_CHANGED));
}
