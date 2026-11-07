// How a Special reaches the 1994 desk (registry.ts Arrival). Each hook asks what is waiting for
// it now and takes it, which keeps the Special for good (state.ts) and so puts its floppy in the
// disk box. Two are wired into the room: the lone floppy on the desk (desk/props/specialFloppy.ts)
// and The Sandbox BBS's file list (retro/bbs/sandbox.ts). The wristwatch, the window and the
// wall phone's subscription are hooks waiting for their props: their tests say what they will do.
// No DOM.
import { SPECIALS, type Arrival, type Special } from './registry';
import { forced, inWindow, keepSpecial, keptHow, type KeptHow } from './state';

/** Specials waiting to arrive by `how` at `now`: in their window (a BBS keeps its file `linger` days more), not kept yet, not locked (UNLOCK makes one wait whatever the date). */
export function waiting(how: Arrival, now: Date): Special[] {
  return SPECIALS.filter((s) => {
    if (s.arrival !== how || keptHow(s.id)) return false;
    const f = forced(s.id);
    if (f) return f === 'unlock';
    return inWindow(s, now, how === 'bbs' ? (s.linger ?? 0) : 0);
  });
}

const KEPT_AS: Record<Exclude<Arrival, 'library'>, KeptHow> = { floppy: 'desk', bbs: 'bbs', watch: 'watch', window: 'window', phone: 'phone' };

/** Takes a waiting Special by `how`: kept for good. False when it was not waiting. */
export function arrive(id: string, how: Exclude<Arrival, 'library'>, now: Date): boolean {
  if (!waiting(how, now).some((s) => s.id === id)) return false;
  keepSpecial(id, KEPT_AS[how], now.getTime());
  return true;
}

/** The floppy lying in an empty spot on the desk today, if any. */
export const deskFloppy = (now: Date): Special | undefined => waiting('floppy', now)[0];

/** The Special a tap on the wristwatch would shake loose today (a hook for the watch prop). */
export const watchShake = (now: Date): Special | undefined => waiting('watch', now)[0];

/** What is going by outside the window during its window (a hook for props/outside). */
export const outsideWindow = (now: Date): Special | undefined => waiting('window', now)[0];

/** The Special the wall phone's subscription call offers today (a hook for room/phone/calls.ts); saying yes is arrive(id, 'phone'). */
export const phoneOffer = (now: Date): Special | undefined => waiting('phone', now)[0];
