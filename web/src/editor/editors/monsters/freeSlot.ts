// New monster: the first unused slot other than the picked one, or -1 when all are in use.
export function firstUnusedSlot(mons: { used: number }[], current: number): number {
  return mons.findIndex((m, i) => !m.used && i !== current);
}

/** Why New monster cannot make a copy; a selected unused source is not a full set. */
export function noFreeSlotText(mons: { used: number }[], current: number): string {
  if (firstUnusedSlot(mons, current) >= 0) return '';
  return mons.some((m) => !m.used)
    ? 'New monster needs an unused slot other than the selected type to hold the copy. DOS Game-Maker holds 64 monster types per set. Select a used type to copy into the remaining unused slot.'
    : 'DOS Game-Maker holds 64 monster types per set; this set is full. Reuse an existing type or use another monster set.';
}
