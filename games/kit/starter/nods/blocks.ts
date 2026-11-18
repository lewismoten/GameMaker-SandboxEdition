// Register arrival lesson blocks once and link timed animation rings.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { Rules } from '../book';
import type { NodCtx } from './types';
import { air } from './rules';

/** Adds block `name` unless a nod before this one did. */
export function add(c: NodCtx, name: string, pic: Pixels, rules: Rules = air): void {
  if (!c.book.has(name)) c.book.add(name, pic, rules);
}
/** Timed blocks in a ring: each turns into the next after `ticks`. */
export const ring = (c: NodCtx, names: string[], ticks: number): void =>
  names.forEach((n, i) => c.timed.push({ name: n, next: names[(i + 1) % names.length], ticks }));
