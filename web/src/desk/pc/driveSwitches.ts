// Which of the desk PC's drive sounds play: one switch per drive and kind, and one for them all.
// Kinds: the motor spinning (spin), the heads moving to a place (seek tests, recalibration, parking),
// and the sounds of reading the disk (read/write). The disk and tray clicks follow only the master
// switch, and the global Sound effects setting still silences everything.

export const DRIVES = [
  { id: 'hdd', name: 'Hard drive' },
  { id: 'cd', name: 'CD-ROM' },
  { id: 'floppy', name: 'Floppy' },
] as const;
export const SOUND_KINDS = [
  { id: 'spin', name: 'Spin' },
  { id: 'heads', name: 'Heads' },
  { id: 'rw', name: 'Read/write' },
] as const;
export type Drive = (typeof DRIVES)[number]['id'];
export type SoundKind = (typeof SOUND_KINDS)[number]['id'];
/** 'load': a disk seating or ejecting, the CD tray: only the master switch covers it. */
export type SoundPart = SoundKind | 'load';
export type DriveSwitches = { all: boolean } & Record<Drive, Record<SoundKind, boolean>>;

/** Everything on, as the desk always sounded. */
export function allDriveSounds(): DriveSwitches {
  const kinds = () => ({ spin: true, heads: true, rw: true });
  return { all: true, hdd: kinds(), cd: kinds(), floppy: kinds() };
}

/** Any missing or malformed switch is on: older saved settings had none. */
export function normalizeSwitches(value: unknown): DriveSwitches {
  const out = allDriveSounds();
  if (!value || typeof value !== 'object') return out;
  const v = value as Record<string, unknown>;
  if (v.all === false) out.all = false;
  for (const { id: drive } of DRIVES) {
    const d = v[drive];
    if (!d || typeof d !== 'object') continue;
    for (const { id: kind } of SOUND_KINDS) if ((d as Record<string, unknown>)[kind] === false) out[drive][kind] = false;
  }
  return out;
}

export function switchAllows(switches: DriveSwitches, drive: Drive, part: SoundPart): boolean {
  return switches.all && (part === 'load' || switches[drive][part]);
}
