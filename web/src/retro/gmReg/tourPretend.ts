// While the guided tour plays on the DOS page, the PC pretends it is not registered, so the copy
// check, the Owner's Guide and the registration card always show. Held in memory only: nothing
// saved changes (pcExtras.ts reads it for PLAYGAME.REG), and the PC is registered again as the
// tour ends.
let pretending = false;

export const pretendUnregistered = (): boolean => pretending;

export function setPretendUnregistered(on: boolean): void {
  pretending = on;
}
