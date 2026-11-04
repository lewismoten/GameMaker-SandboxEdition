// When drive A:'s eject button works. A real floppy drive's eject button is mechanical: it pushes the
// disk out any time, a running program included. The only time it should wait is while the drive's
// light is really on (the heads are on the disk). A program that reads A: afterwards with no disk
// gets DOS's "Not ready reading drive A" (retro/dos/shell.ts); a game already in memory plays on.

/** Why the disk can't come out right now, or undefined if it can. */
export function ejectRefusal(driveLightOn: boolean): string | undefined {
  return driveLightOn ? 'Drive A: is still reading — wait for its light to go out, then eject.' : undefined;
}
