// Remembered desk hardware and the existing engine's CPU/disk cost model. No DOS files change.
import { SPEED_PRESETS, TURBO_OFF, type PcCosts } from '@lewismoten/gamemaker-sandbox-engine/engine/slowPc';
import { allDriveSounds, normalizeSwitches, switchAllows, type Drive, type DriveSwitches, type SoundPart } from './driveSwitches';

export const CPU_CHOICES = [
  { id: 'fast', name: 'Fast (66 MHz display)', mhz: 66 },
  { id: 'ps1', name: 'PS/1 · 286 at 10 MHz', mhz: 10 },
  { id: '286', name: '286 · 12 MHz', mhz: 12 },
  { id: '386', name: '386DX · 33 MHz', mhz: 33 },
  { id: '486', name: '486DX2 · 66 MHz', mhz: 66 },
] as const;
export const DISK_CHOICES = [
  { id: 'instant', name: 'Instant reads' },
  { id: 'ps1', name: 'PS/1 hard disk · 150 KB/s' },
  { id: '286', name: '286-era hard disk · 400 KB/s' },
  { id: '386', name: '386-era hard disk · 800 KB/s' },
  { id: '486', name: '486-era hard disk · 1.5 MB/s' },
] as const;
export interface MachineSettings {
  cpu: (typeof CPU_CHOICES)[number]['id'];
  disk: (typeof DISK_CHOICES)[number]['id'];
  /** Which drive sounds play (pc/driveSwitches.ts). */
  sounds: DriveSwitches;
}
const KEY = 'gm-desk-machine';
const defaults = (): MachineSettings => ({ cpu: 'fast', disk: 'instant', sounds: allDriveSounds() });
/** The settings in use: read once, then whatever was last saved (even where storage fails). */
let current: MachineSettings | undefined;

/** Unrecognized or older fields fall back separately; storage may be unavailable. */
export function loadMachine(): MachineSettings {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<MachineSettings> | null;
    return {
      cpu: CPU_CHOICES.find((c) => c.id === value?.cpu)?.id ?? 'fast',
      disk: DISK_CHOICES.find((c) => c.id === value?.disk)?.id ?? 'instant',
      sounds: normalizeSwitches(value?.sounds),
    };
  } catch {
    return defaults();
  }
}

export function saveMachine(value: MachineSettings): void {
  current = value;
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // The current desk still changes in a private window.
  }
}

/** Whether a drive sound's part plays now (driveSounds.ts, bootSounds.ts check before each). */
export function driveSoundOn(drive: Drive, part: SoundPart): boolean {
  return switchAllows((current ??= loadMachine()).sounds, drive, part);
}

export function machineMHz(value: Pick<MachineSettings, 'cpu'>, turbo: boolean): number {
  return turbo ? CPU_CHOICES.find((c) => c.id === value.cpu)!.mhz : 8;
}

/** Independent disk figures survive TURBO; PS/1 retains its existing conventional voice-heap limit. */
export function machineCosts(value: Pick<MachineSettings, 'cpu' | 'disk'>, turbo: boolean): PcCosts | undefined {
  if (value.cpu === 'fast' && value.disk === 'instant' && turbo) return undefined;
  const source = value.cpu === 'fast' ? undefined : SPEED_PRESETS[value.cpu];
  const pc: PcCosts = source ? { ...source } : turbo ? { tickMs: 0, monsterMs: 0, scrollPassMs: 0, stripMs: 0 } : { ...TURBO_OFF };
  if (source && !turbo) {
    const factor = machineMHz(value, true) / 8;
    for (const field of ['tickMs', 'monsterMs', 'scrollPassMs', 'stripMs', 'cellMs', 'isrMs', 'fmEventMs'] as const) {
      if (pc[field] !== undefined) pc[field] *= factor;
    }
  }
  const disk = value.disk === 'instant' ? undefined : SPEED_PRESETS[value.disk];
  pc.vocOpenMs = disk?.vocOpenMs;
  pc.vocBytesPerMs = disk?.vocBytesPerMs;
  return pc;
}
