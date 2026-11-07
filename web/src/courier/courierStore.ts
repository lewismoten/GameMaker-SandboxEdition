// The courier's mail store: localStorage `gm-courier` (the backup's Desk section), shared by
// Scoot's card on the desk and SCOOT.EXE on the PC. It keeps ids into the tables (tables.ts) and
// the desk clock's day a letter came, nothing typed and no wall-clock times. A letter arrives only
// through `deliver`, which a BBS call makes (retro/bbs/courierMail.ts); nothing here runs on a
// timer. Every change is announced (`COURIER_CHANGED`) so an open card or envelope follows at once.
import { LETTERS, WORLDS, letterById, type Letter, type StampKind } from './tables';
import { isOldSecret } from '../project/secretGames';

export const COURIER_KEY = 'gm-courier';
const KEY = COURIER_KEY;
/** Scoot's Quiet switch lives with the desk buddy (desk/buddy/buddyStore.ts); SCOOT.EXE may not load the desk. */
const BUDDY_KEY = 'gm-desk-buddy';
export const COURIER_CHANGED = 'courier-changed';

export interface MailItem {
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
  /** This device's own postcard (the desk and the web share one): its world was rolled once, here. */
  here?: true;
  stamps: Stamp[];
}

export interface Courier {
  /** Letters in the mail, newest first. */
  mail: MailItem[];
  /** Every letter ever delivered, kept when one is deleted, so none comes twice. */
  got: string[];
  postcards: Postcard[];
  /** Catalog game ids in the satchel (three at most). */
  packages: string[];
}

export const MAX_PACKAGES = 3;

const empty = (): Courier => ({ mail: [], got: [], postcards: [], packages: [] });
const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

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
        for (const s of Array.isArray(p.stamps) ? p.stamps : []) {
          if (!s || typeof s !== 'object') continue;
          const k = (s as Record<string, unknown>).kind;
          const game = (s as Record<string, unknown>).game;
          if (k === 'game' && typeof game === 'string') addTo(card, { kind: 'game', game });
          else if (k === 'sample-cd' || k === 'graduation' || k === 'mystery') addTo(card, { kind: k });
        }
        return card;
      })
      // one postcard is this device's
      .filter((p, i, all) => !p.here || all.findIndex((q) => q.here) === i);
    return { mail, got: strings(r.got), postcards, packages: strings(r.packages).slice(0, MAX_PACKAGES) };
  } catch {
    return empty();
  }
}

function save(c: Courier): void {
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
function addTo(card: Postcard, s: Stamp): boolean {
  const stamp: Stamp = s.kind === 'game' && s.game && !isOldSecret(s.game) ? { kind: 'game', game: s.game } : { kind: s.kind === 'game' ? 'mystery' : s.kind };
  if (card.stamps.some((x) => x.kind === stamp.kind && x.game === stamp.game)) return false;
  card.stamps.push(stamp);
  return true;
}

/**
 * Stamps this device's postcard (made the first time, its world rolled once from the curated
 * names; `roll` is Math.random's kind). False when the postcard has that stamp already.
 */
export function addStamp(s: Stamp, roll: () => number = Math.random): boolean {
  const c = loadCourier();
  let card = c.postcards.find((p) => p.here);
  if (!card) {
    card = { world: Math.min(WORLDS.length - 1, Math.floor(roll() * WORLDS.length)), here: true, stamps: [] };
    c.postcards.unshift(card);
  }
  if (!addTo(card, s)) return false;
  save(c);
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
  save(c);
  return true;
}

export function markRead(id: string): void {
  const c = loadCourier();
  const m = c.mail.find((x) => x.id === id);
  if (!m || m.read) return;
  m.read = true;
  save(c);
}

/** Takes a letter out of the mail; it never comes again. */
export function deleteLetter(id: string): void {
  const c = loadCourier();
  const left = c.mail.filter((m) => m.id !== id);
  if (left.length === c.mail.length) return;
  c.mail = left;
  save(c);
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
