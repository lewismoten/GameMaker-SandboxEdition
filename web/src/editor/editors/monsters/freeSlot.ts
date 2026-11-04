// New monster: the first unused slot other than the picked one, or -1 when all are in use.
export function firstUnusedSlot(mons: { used: number }[], current: number): number {
  return mons.findIndex((m, i) => !m.used && i !== current);
}
